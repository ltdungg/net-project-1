package vn.netfashion.commerce.payment;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;
import vn.netfashion.commerce.config.AppProperties;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;

@Service
public class PaymentService {
    private static final String PROVIDER = "mockpay";
    private static final int MAX_WEBHOOK_BYTES = 64 * 1024;
    private static final Set<String> SUPPORTED_EVENTS = Set.of(
        "payment.succeeded",
        "payment.failed",
        "payment.refunded"
    );

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final AppProperties properties;
    private final JwtService jwtService;

    public PaymentService(JdbcClient jdbc, ObjectMapper objectMapper, AppProperties properties, JwtService jwtService) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.jwtService = jwtService;
    }

    @Transactional
    public Map<String, Object> confirmMockPayment(String orderId, String guestAccessToken, AuthPrincipal principal) {
        return simulateMockPayment(orderId, guestAccessToken, principal, "succeeded");
    }

    public boolean mockEnabled() { return "local".equalsIgnoreCase(properties.environment()); }

    @Transactional
    public Map<String, Object> simulateMockPayment(String orderId, String guestAccessToken, AuthPrincipal principal, String outcome) {
        if (!mockEnabled()) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                "LOCAL_ONLY",
                "Mô phỏng thanh toán chỉ khả dụng trong môi trường local."
            );
        }
        if (!Set.of("succeeded", "failed").contains(outcome == null ? "" : outcome)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MOCK_OUTCOME", "Kết quả mô phỏng không hợp lệ.");
        }

        PaymentRow payment = paymentByOrderForUpdate(orderId);
        authorizeMockConfirmation(payment, guestAccessToken, principal);
        validatePaymentSnapshot(payment, payment.amountCents(), payment.currency());

        PaymentStatePolicy.Decision decision = PaymentStatePolicy.forMockOutcome(
            payment.paymentStatus(),
            payment.orderPaymentStatus(),
            payment.orderStatus(), outcome
        );
        if (decision.rejected()) {
            throw invalidMockConfirmation(decision.reason());
        }
        if (decision.ignored()) {
            return Maps.of("orderId", orderId, "status", payment.orderPaymentStatus(), "duplicate", true);
        }

        Instant now = Instant.now();
        applyPaymentState(
            payment,
            decision.targetPaymentStatus(),
            decision.targetOrderPaymentStatus(),
            now
        );
        if ("succeeded".equals(outcome) && "pending_payment".equals(payment.orderStatus())) {
            appendConfirmationHistory(
                payment,
                "Thanh toán giả lập thành công",
                Maps.of("provider", PROVIDER, "paymentId", payment.id()),
                now
            );
        }
        appendOutbox(
            payment.orderId(),
            "payment." + outcome,
            Maps.of(
                "provider", PROVIDER,
                "paymentId", payment.id(),
                "orderId", payment.orderId(),
                "amountCents", payment.amountCents(),
                "currency", payment.currency(),
                "source", "local-simulation"
            ),
            now
        );

        return Maps.of("orderId", orderId, "status", decision.targetOrderPaymentStatus(), "duplicate", false);
    }

    private void authorizeMockConfirmation(PaymentRow payment, String guestAccessToken, AuthPrincipal principal) {
        boolean staff = principal != null && principal.roles().stream()
            .anyMatch(role -> Set.of("staff", "manager", "admin").contains(role));
        boolean owner = principal != null && payment.userId() != null && payment.userId().equals(principal.id());
        boolean guest = payment.userId() == null
            && jwtService.verifyGuestOrderToken(payment.orderId(), payment.orderEmail(), guestAccessToken);
        if (staff || owner || guest) return;
        throw new ApiException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Không tìm thấy giao dịch.");
    }

    @Transactional
    public Map<String, Object> processWebhook(byte[] rawBody, String suppliedSignature) {
        if (rawBody == null || rawBody.length == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EVENT", "Payload webhook không hợp lệ.");
        }
        if (rawBody.length > MAX_WEBHOOK_BYTES) {
            throw new ApiException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "WEBHOOK_PAYLOAD_TOO_LARGE",
                "Payload webhook không được vượt quá 64 KB."
            );
        }
        String secret = properties.paymentWebhookSecret();
        if (secret == null || secret.isBlank()) {
            throw new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "WEBHOOK_NOT_CONFIGURED",
                "Webhook chưa được cấu hình."
            );
        }

        if (!PaymentSignaturePolicy.verify(secret, rawBody, suppliedSignature)) {
            throw new ApiException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_SIGNATURE",
                "Chữ ký webhook không hợp lệ."
            );
        }
        WebhookEvent event = parseAndValidate(rawBody);

        if (eventAlreadyRecorded(event.id())) {
            return Maps.of("received", true, "duplicate", true);
        }

        PaymentRow payment = paymentByIdForUpdate(event.paymentId());
        validatePaymentSnapshot(payment, event.amountCents(), event.currency());

        PaymentStatePolicy.Decision decision = PaymentStatePolicy.forWebhook(
            payment.paymentStatus(),
            payment.orderPaymentStatus(),
            event.type()
        );
        if (decision.rejected()) {
            throw invalidWebhookTransition(payment, event, decision.reason());
        }

        Instant now = Instant.now();
        boolean inserted = insertPaymentEvent(event, rawBody, now);
        if (!inserted) {
            return Maps.of("received", true, "duplicate", true);
        }

        if (decision.ignored()) {
            return Maps.of("received", true, "duplicate", false);
        }

        applyPaymentState(
            payment,
            decision.targetPaymentStatus(),
            decision.targetOrderPaymentStatus(),
            now
        );
        if ("payment.succeeded".equals(event.type())
            && "pending_payment".equals(payment.orderStatus())) {
            appendConfirmationHistory(
                payment,
                "Thanh toán webhook thành công",
                Maps.of(
                    "provider", PROVIDER,
                    "providerEventId", event.id(),
                    "paymentId", payment.id()
                ),
                now
            );
        }
        appendOutbox(
            payment.orderId(),
            event.type(),
            Maps.of(
                "provider", PROVIDER,
                "providerEventId", event.id(),
                "paymentId", payment.id(),
                "orderId", payment.orderId(),
                "amountCents", event.amountCents(),
                "currency", event.currency()
            ),
            now
        );

        return Maps.of("received", true, "duplicate", false);
    }

    private ApiException invalidMockConfirmation(String reason) {
        return new ApiException(
            HttpStatus.CONFLICT,
            "PAYMENT_CONFIRMATION_NOT_ALLOWED",
            "Không thể xác nhận lại giao dịch đã hoàn tiền hoặc thuộc đơn đã hủy.",
            Maps.of("reason", reason)
        );
    }

    private ApiException invalidWebhookTransition(
        PaymentRow payment,
        WebhookEvent event,
        String reason
    ) {
        return new ApiException(
            HttpStatus.CONFLICT,
            "INVALID_PAYMENT_TRANSITION",
            "Trạng thái thanh toán hiện tại không cho phép xử lý sự kiện này.",
            Maps.of(
                "paymentStatus", payment.paymentStatus(),
                "orderPaymentStatus", payment.orderPaymentStatus(),
                "eventType", event.type(),
                "reason", reason
            )
        );
    }

    private WebhookEvent parseAndValidate(byte[] rawBody) {
        final WebhookEvent event;
        try {
            event = objectMapper.readValue(rawBody, WebhookEvent.class);
        } catch (JacksonException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EVENT", "Payload webhook không hợp lệ.");
        }

        boolean valid = event.id() != null
            && event.id().length() >= 3
            && event.id().length() <= 160
            && SUPPORTED_EVENTS.contains(event.type())
            && event.paymentId() != null
            && !event.paymentId().isBlank()
            && event.paymentId().length() <= 64
            && event.amountCents() > 0
            && "VND".equals(event.currency());
        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EVENT", "Payload webhook không hợp lệ.");
        }
        return event;
    }

    private boolean eventAlreadyRecorded(String providerEventId) {
        return jdbc.sql("""
            select exists(
              select 1 from payment_events
              where provider=:provider and provider_event_id=:providerEventId
            )
            """)
            .params(Map.of("provider", PROVIDER, "providerEventId", providerEventId))
            .query(Boolean.class)
            .single();
    }

    private PaymentRow paymentByOrderForUpdate(String orderId) {
        return jdbc.sql("""
            select p.id,p.order_id,p.provider,p.status payment_status,p.amount_cents,p.currency,
                   o.status order_status,o.payment_status order_payment_status,
                   o.grand_total_cents,o.currency order_currency,o.user_id,o.email order_email
            from payments p
            join customer_orders o on o.id=p.order_id
            where p.order_id=:orderId and p.provider=:provider
            order by p.created_at
            limit 1
            for update of p,o
            """)
            .params(Map.of("orderId", orderId, "provider", PROVIDER))
            .query(this::paymentRow)
            .optional()
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "PAYMENT_NOT_FOUND",
                "Không tìm thấy giao dịch."
            ));
    }

    private PaymentRow paymentByIdForUpdate(String paymentId) {
        return jdbc.sql("""
            select p.id,p.order_id,p.provider,p.status payment_status,p.amount_cents,p.currency,
                   o.status order_status,o.payment_status order_payment_status,
                   o.grand_total_cents,o.currency order_currency,o.user_id,o.email order_email
            from payments p
            join customer_orders o on o.id=p.order_id
            where p.id=:paymentId and p.provider=:provider
            for update of p,o
            """)
            .params(Map.of("paymentId", paymentId, "provider", PROVIDER))
            .query(this::paymentRow)
            .optional()
            .orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "PAYMENT_NOT_FOUND",
                "Không tìm thấy giao dịch."
            ));
    }

    private void validatePaymentSnapshot(PaymentRow payment, long amountCents, String currency) {
        if (!payment.currency().equals(currency) || !payment.orderCurrency().equals(currency)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PAYMENT_CURRENCY_MISMATCH",
                "Loại tiền của giao dịch không khớp với đơn hàng."
            );
        }
        if (payment.amountCents() != amountCents
            || payment.grandTotalCents() != amountCents) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PAYMENT_AMOUNT_MISMATCH",
                "Số tiền giao dịch không khớp với đơn hàng."
            );
        }
    }

    private boolean insertPaymentEvent(WebhookEvent event, byte[] rawBody, Instant now) {
        return jdbc.sql("""
            insert into payment_events(
              id,payment_id,provider,provider_event_id,event_type,signature_valid,
              payload_json,processed_at,processing_error
            ) values(
              :id,:paymentId,:provider,:providerEventId,:eventType,true,
              cast(:payload as jsonb),:processedAt,null
            )
            on conflict(provider,provider_event_id) do nothing
            returning id
            """)
            .params(Map.of(
                "id", UUID.randomUUID().toString(),
                "paymentId", event.paymentId(),
                "provider", PROVIDER,
                "providerEventId", event.id(),
                "eventType", event.type(),
                "payload", new String(rawBody, StandardCharsets.UTF_8),
                "processedAt", timestamp(now)
            ))
            .query(String.class)
            .optional()
            .isPresent();
    }

    private void applyPaymentState(
        PaymentRow payment,
        String paymentStatus,
        String orderPaymentStatus,
        Instant now
    ) {
        jdbc.sql("""
            update payments
            set status=:status,
                captured_at=case when :status='succeeded' then coalesce(captured_at,:now) else captured_at end,
                updated_at=:now
            where id=:id
            """)
            .params(Map.of(
                "status", paymentStatus,
                "now", timestamp(now),
                "id", payment.id()
            ))
            .update();

        jdbc.sql("""
            update customer_orders
            set payment_status=:paymentStatus,
                status=case
                  when :providerStatus='succeeded' and status='pending_payment' then 'confirmed'
                  else status
                end,
                updated_at=:now
            where id=:orderId
            """)
            .params(Map.of(
                "paymentStatus", orderPaymentStatus,
                "providerStatus", paymentStatus,
                "now", timestamp(now),
                "orderId", payment.orderId()
            ))
            .update();
    }

    private void appendConfirmationHistory(
        PaymentRow payment,
        String reason,
        Map<String, Object> metadata,
        Instant now
    ) {
        jdbc.sql("""
            insert into order_status_history(
              id,order_id,from_status,to_status,reason,metadata_json,created_at
            ) values(
              :id,:orderId,'pending_payment','confirmed',:reason,cast(:metadata as jsonb),:createdAt
            )
            """)
            .params(Map.of(
                "id", UUID.randomUUID().toString(),
                "orderId", payment.orderId(),
                "reason", reason,
                "metadata", json(metadata),
                "createdAt", timestamp(now)
            ))
            .update();
    }

    private void appendOutbox(
        String orderId,
        String eventType,
        Map<String, Object> payload,
        Instant now
    ) {
        jdbc.sql("""
            insert into outbox_events(
              id,aggregate_type,aggregate_id,event_type,payload_json,status,
              attempts,available_at,created_at
            ) values(
              :id,'order',:orderId,:eventType,cast(:payload as jsonb),'pending',0,:availableAt,:createdAt
            )
            """)
            .params(Map.of(
                "id", UUID.randomUUID().toString(),
                "orderId", orderId,
                "eventType", eventType,
                "payload", json(payload),
                "availableAt", timestamp(now),
                "createdAt", timestamp(now)
            ))
            .update();
    }

    private java.sql.Timestamp timestamp(Instant value) {
        return java.sql.Timestamp.from(value);
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize payment event", exception);
        }
    }

    private PaymentRow paymentRow(ResultSet rs, int rowNumber) throws SQLException {
        return new PaymentRow(
            rs.getString("id"),
            rs.getString("order_id"),
            rs.getString("provider"),
            rs.getString("payment_status"),
            rs.getLong("amount_cents"),
            rs.getString("currency"),
            rs.getString("order_status"),
            rs.getString("order_payment_status"),
            rs.getLong("grand_total_cents"),
            rs.getString("order_currency"),
            rs.getString("user_id"),
            rs.getString("order_email")
        );
    }

    public record WebhookEvent(
        String id,
        String type,
        String paymentId,
        long amountCents,
        String currency
    ) {}

    private record PaymentRow(
        String id,
        String orderId,
        String provider,
        String paymentStatus,
        long amountCents,
        String currency,
        String orderStatus,
        String orderPaymentStatus,
        long grandTotalCents,
        String orderCurrency,
        String userId,
        String orderEmail
    ) {}
}
