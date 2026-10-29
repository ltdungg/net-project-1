package vn.netfashion.commerce.payment;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class SepayPaymentService {
    private final JdbcClient jdbc;
    private final SepaySandboxClient client;
    private final JwtService jwt;
    private final ObjectMapper mapper;
    private final TransactionTemplate transactions;
    public SepayPaymentService(JdbcClient jdbc, SepaySandboxClient client, JwtService jwt, ObjectMapper mapper, PlatformTransactionManager manager) {
        this.jdbc = jdbc; this.client = client; this.jwt = jwt; this.mapper = mapper;
        this.transactions = new TransactionTemplate(manager);
    }

    public Map<String, Object> session(String orderId, String guestToken, AuthPrincipal actor) {
        var payment = read(orderId, false);
        authorize(payment, guestToken, actor);
        var bank = client.account(payment.accountId());
        var result = state(payment);
        result.put("provider", "sepay_sandbox");
        result.put("amountVnd", payment.amount()); // Existing *_cents fields store whole VND; do not divide by 100.
        result.put("transferContent", payment.content());
        result.put("bank", Maps.of("name", bank.bankName(), "accountNumber", bank.number(), "accountHolder", bank.holder()));
        result.put("qrUrl", "https://vietqr.app/img?acc=" + SepaySandboxClient.encode(bank.number())
            + "&bank=" + SepaySandboxClient.encode(bank.bankCode()) + "&amount=" + payment.amount()
            + "&des=" + SepaySandboxClient.encode(payment.content()) + "&template=compact");
        return result;
    }

    public Map<String, Object> check(String orderId, String guestToken, AuthPrincipal actor) {
        var payment = read(orderId, false);
        authorize(payment, guestToken, actor);
        if (!payment.payable()) return state(payment);
        int claimed = jdbc.sql("""
            update payments set last_checked_at=now() where id=:id
              and (last_checked_at is null or last_checked_at < now() - interval '10 seconds')
            """).param("id", payment.id()).update();
        if (claimed == 0) return state(read(orderId, false));
        // No database transaction or inventory lock is held while calling the provider.
        var bank = client.account(payment.accountId());
        for (JsonNode event : client.transactions(payment.accountId(), payment.content(), payment.amount())) {
            if (!matches(payment, bank.number(), event)) continue;
            return transactions.execute(status -> settle(orderId, bank.number(), event));
        }
        return state(read(orderId, false));
    }

    private Map<String, Object> settle(String orderId, String accountNumber, JsonNode event) {
        var payment = read(orderId, true);
        if (!payment.payable() || !matches(payment, accountNumber, event)) return state(payment);
        String transactionId = event.path("id").asText();
        String audit = mapper.writeValueAsString(Maps.of("source", "sepay-sandbox-api-v2", "transactionId", transactionId,
            "bankAccountId", payment.accountId(), "amountVnd", payment.amount(), "content", payment.content(),
            "transactionDate", event.path("transaction_date").asText()));
        var inserted = jdbc.sql("""
            insert into payment_events(id,payment_id,provider,provider_event_id,event_type,signature_valid,payload_json,processed_at)
            values(:id,:payment,'sepay_sandbox',:event,'payment.succeeded',false,cast(:payload as jsonb),now())
            on conflict(provider,provider_event_id) do nothing returning id
            """).params(Map.of("id", UUID.randomUUID().toString(), "payment", payment.id(), "event", transactionId, "payload", audit))
            .query(String.class).optional();
        if (inserted.isEmpty()) return state(payment);
        jdbc.sql("update payments set status='succeeded',provider_payment_id=:event,captured_at=now(),updated_at=now() where id=:id")
            .params(Map.of("event", transactionId, "id", payment.id())).update();
        jdbc.sql("update customer_orders set status='confirmed',payment_status='paid',updated_at=now() where id=:id")
            .param("id", orderId).update();
        jdbc.sql("""
            insert into order_status_history(id,order_id,from_status,to_status,reason,metadata_json)
            values(:id,:order,'pending_payment','confirmed','Đã đối soát giao dịch SePay Sandbox',cast(:payload as jsonb))
            """).params(Map.of("id", UUID.randomUUID().toString(), "order", orderId, "payload", audit)).update();
        jdbc.sql("""
            insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
            values(:id,'order',:order,'payment.succeeded',cast(:payload as jsonb))
            """).params(Map.of("id", UUID.randomUUID().toString(), "order", orderId, "payload", audit)).update();
        return state(read(orderId, false));
    }
    private boolean matches(Payment payment, String number, JsonNode event) {
        return SepayTransactionPolicy.matches(event, payment.accountId(), number, payment.content(), payment.amount(), payment.created(), payment.expires());
    }
    private Payment read(String orderId, boolean lock) {
        return jdbc.sql("""
            select p.id,p.order_id,p.status,p.amount_cents,p.currency,p.provider_metadata_json,p.created_at,
              o.user_id,o.email,o.status order_status,o.payment_status,o.grand_total_cents,o.currency order_currency,
              (select min(expires_at) from inventory_reservations r where r.order_id=o.id) expires_at,
              not exists(select 1 from inventory_reservations r where r.order_id=o.id and r.status<>'active') holds_active
            from payments p join customer_orders o on o.id=p.order_id
            where p.order_id=:order and p.provider='sepay_sandbox'
            """ + (lock ? " for update of p,o" : "")).param("order", orderId).query(this::payment).optional()
            .orElseThrow(this::notFound);
    }
    private Payment payment(ResultSet rs, int row) throws SQLException {
        var metadata = mapper.readTree(rs.getString("provider_metadata_json"));
        var expires = rs.getTimestamp("expires_at");
        return new Payment(rs.getString("id"), rs.getString("order_id"), rs.getString("user_id"), rs.getString("email"),
            rs.getString("status"), rs.getString("order_status"), rs.getString("payment_status"), rs.getLong("amount_cents"),
            rs.getLong("grand_total_cents"), rs.getString("currency"), rs.getString("order_currency"),
            metadata.path("bankAccountId").asText(), metadata.path("transferContent").asText(), rs.getTimestamp("created_at").toInstant(),
            expires == null ? Instant.EPOCH : expires.toInstant(), rs.getBoolean("holds_active"));
    }
    private void authorize(Payment payment, String token, AuthPrincipal actor) {
        boolean staff = actor != null && actor.roles().stream().anyMatch(Set.of("staff", "manager", "admin")::contains);
        boolean owner = actor != null && actor.id().equals(payment.userId());
        boolean guest = payment.userId() == null && jwt.verifyGuestOrderToken(payment.orderId(), payment.email(), token);
        if (!staff && !owner && !guest) throw notFound();
    }
    private ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Không tìm thấy giao dịch."); }
    private Map<String, Object> state(Payment payment) {
        return Maps.of("orderId", payment.orderId(), "paymentStatus", payment.orderPaymentStatus(), "orderStatus", payment.orderStatus(),
            "expired", !payment.expires().isAfter(Instant.now()), "expiresAt", payment.expires().toString(), "checkedAt", Instant.now().toString());
    }
    private record Payment(String id, String orderId, String userId, String email, String status, String orderStatus,
            String orderPaymentStatus, long amount, long total, String currency, String orderCurrency,
            String accountId, String content, Instant created, Instant expires, boolean holdsActive) {
        boolean payable() {
            return "pending_payment".equals(orderStatus) && Set.of("pending", "failed").contains(status)
                && Set.of("pending", "failed").contains(orderPaymentStatus) && amount == total && amount > 0
                && "VND".equals(currency) && "VND".equals(orderCurrency) && expires.isAfter(Instant.now()) && holdsActive
                && content.equals(SepayTransactionPolicy.transferContent(orderId));
        }
    }
}
