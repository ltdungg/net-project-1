package vn.netfashion.commerce.integration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.order.OrderService;
import vn.netfashion.commerce.payment.SepaySandboxClient;
import vn.netfashion.commerce.payment.SepayTransactionPolicy;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "management.health.redis.enabled=false", "app.environment=local", "app.local-auth-bypass=false", "app.gemini-api-key=",
    "app.reservation-expiry-initial-delay-ms=3600000", "sepay.sandbox.enabled=true", "sepay.sandbox.api-key=fake-test-key",
    "sepay.sandbox.bank-account-id=00000000-0000-0000-0000-000000000001"
})
@Testcontainers(disabledWithoutDocker=true)
class PostgresSepayPaymentIntegrationTest {
    private static final String ACCOUNT = "00000000-0000-0000-0000-000000000001";
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
        .withDatabaseName("sepay_it").withUsername("net_it").withPassword("net_it_password");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired OrderService orders;
    @Autowired JdbcClient jdbc;
    @Autowired JwtService jwt;
    @MockitoBean SepaySandboxClient sepay;
    @LocalServerPort int port;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach void provider() {
        when(sepay.account(ACCOUNT)).thenReturn(new SepaySandboxClient.BankAccount(ACCOUNT, "0000000001", "TEST", "Vietcombank", "VCB"));
        when(sepay.transactions(anyString(), anyString(), anyLong())).thenReturn(List.of());
    }

    @Test void guestSeesQrAndCanOnlySettleFromMatchingProviderTransactionOnce() throws Exception {
        var order = create(null);
        var session = call(order, false, null, null);
        assertThat(session.statusCode()).as(session.body()).isEqualTo(200);
        assertThat(session.body()).doesNotContain("fake-test-key");
        var data = data(session);
        assertThat(data.path("amountVnd").asLong()).isEqualTo(total(order));
        assertThat(data.path("qrUrl").asText()).contains("https://vietqr.app/img?", "amount="+total(order), "des="+content(order));
        assertThat(data.path("transferContent").asText()).isEqualTo(content(order));
        assertThat(orders.detail(id(order), null, true).get("paymentProvider")).isEqualTo("sepay_sandbox");
        var stock = jdbc.sql("select sum(on_hand) on_hand,sum(reserved) reserved from inventory_items").query().singleRow();
        // A client-supplied paid flag is not trusted by the check endpoint.
        assertThat(data(call(order, true, null, "{\"paid\":true}")).path("paymentStatus").asText()).isEqualTo("pending");
        resetCooldown(order);
        when(sepay.transactions(ACCOUNT, content(order), total(order))).thenReturn(List.of(event(order)));
        assertThat(data(call(order, true, null, null)).path("paymentStatus").asText()).isEqualTo("paid");
        assertThat(data(call(order, true, null, null)).path("paymentStatus").asText()).isEqualTo("paid");
        assertThat(jdbc.sql("select status from customer_orders where id=:id").param("id", id(order)).query(String.class).single()).isEqualTo("confirmed");
        assertThat(jdbc.sql("select count(*) from outbox_events where aggregate_id=:id and event_type='payment.succeeded'").param("id", id(order)).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("select count(*) from payment_events where payment_id=(select id from payments where order_id=:id)").param("id", id(order)).query(Long.class).single()).isOne();
        assertThat(jdbc.sql("select sum(on_hand) on_hand,sum(reserved) reserved from inventory_items").query().singleRow()).isEqualTo(stock);
    }

    @Test void wrongOrMissingGuestTokenAndOtherMemberCannotReadOrCheck() throws Exception {
        var guest = create(null);
        for (boolean check : List.of(false, true)) {
            var path = "/api/payments/sepay-sandbox/"+id(guest)+(check?"/check":"");
            var request = request(path).header("X-Guest-Order-Token", "wrong");
            request.method(check?"POST":"GET", HttpRequest.BodyPublishers.noBody());
            assertThat(http.send(request.build(), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(404);
        }
        var owner = new AuthPrincipal("sepay-owner", "owner@example.test", "Owner", Set.of("customer"));
        var other = new AuthPrincipal("sepay-other", "other@example.test", "Other", Set.of("customer"));
        var member = create(owner);
        assertThat(call(member, false, jwt.accessToken(other), null).statusCode()).isEqualTo(404);
        assertThat(call(member, true, jwt.accessToken(other), null).statusCode()).isEqualTo(404);
        assertThat(call(member, false, jwt.accessToken(owner), null).statusCode()).isEqualTo(200);
        verify(sepay, never()).transactions(anyString(), anyString(), anyLong());
    }

    @Test void mismatchedAndMissingTransfersKeepOrderPendingAndPollIsThrottled() throws Exception {
        var order = create(null);
        when(sepay.transactions(ACCOUNT, content(order), total(order))).thenReturn(List.of(
            event(order).put("amount_in", total(order)+1), event(order).put("transaction_content", "wrong"),
            event(order).put("bank_account_id", UUID.randomUUID().toString()), event(order).put("transfer_type", "out")));
        assertThat(data(call(order, true, null, null)).path("paymentStatus").asText()).isEqualTo("pending");
        call(order, true, null, null);
        verify(sepay, times(1)).transactions(ACCOUNT, content(order), total(order));
    }

    @Test void cancelledExpiredAndReleasedOrdersAreNeverRevived() throws Exception {
        for (String condition : List.of("cancelled", "expired", "released")) {
            var order = create(null);
            when(sepay.transactions(ACCOUNT, content(order), total(order))).thenReturn(List.of(event(order)));
            String sql = switch (condition) {
                case "cancelled" -> "update customer_orders set status='cancelled' where id=:id";
                case "expired" -> "update inventory_reservations set created_at=now()-interval '3 hours',expires_at=now()-interval '1 second' where order_id=:id";
                default -> "update inventory_reservations set status='released' where order_id=:id";
            };
            jdbc.sql(sql).param("id", id(order)).update();
            assertThat(data(call(order, true, null, null)).path("paymentStatus").asText()).isEqualTo("pending");
        }
        verify(sepay, never()).transactions(anyString(), anyString(), anyLong());
    }

    @Test void transactionAlreadyUsedForAnotherOrderCannotSettleAgain() throws Exception {
        var first = create(null);
        var firstEvent = event(first);
        when(sepay.transactions(ACCOUNT, content(first), total(first))).thenReturn(List.of(firstEvent));
        assertThat(data(call(first, true, null, null)).path("paymentStatus").asText()).isEqualTo("paid");
        var second = create(null);
        when(sepay.transactions(ACCOUNT, content(second), total(second))).thenReturn(List.of(event(second).put("id", firstEvent.path("id").asText())));
        assertThat(data(call(second, true, null, null)).path("paymentStatus").asText()).isEqualTo("pending");
    }

    @Test void providerFailureLeavesOrderPendingAndCancellationDuringLookupWins() throws Exception {
        var order = create(null);
        when(sepay.transactions(ACCOUNT, content(order), total(order))).thenThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "SEPAY_UNAVAILABLE", "Try later"));
        assertThat(call(order, true, null, null).statusCode()).isEqualTo(503);
        assertThat(jdbc.sql("select payment_status from customer_orders where id=:id").param("id", id(order)).query(String.class).single()).isEqualTo("pending");
        resetCooldown(order);
        doAnswer(invocation -> {
            jdbc.sql("update customer_orders set status='cancelled' where id=:id").param("id", id(order)).update();
            return List.of(event(order));
        }).when(sepay).transactions(ACCOUNT, content(order), total(order));
        assertThat(data(call(order, true, null, null)).path("orderStatus").asText()).isEqualTo("cancelled");
    }

    private Map<String, Object> create(AuthPrincipal actor) {
        return orders.create(new OrderService.CreateOrder(actor==null?"guest@example.test":actor.email(), "0901234567", "SePay test", "sepay", null, UUID.randomUUID().toString(),
            new OrderService.ShippingAddress("Test", "0901234567", "1 Test", "Ward", "District", "Province"), List.of(new OrderService.OrderItemInput("DMA-s", 1))), actor, null, "sepay-test");
    }
    private String id(Map<String, Object> order) { return (String) order.get("id"); }
    private String content(Map<String, Object> order) { return SepayTransactionPolicy.transferContent(id(order)); }
    private long total(Map<String, Object> order) { return jdbc.sql("select grand_total_cents from customer_orders where id=:id").param("id", id(order)).query(Long.class).single(); }
    private ObjectNode event(Map<String, Object> order) {
        return mapper.valueToTree(Map.of("id", UUID.randomUUID().toString(), "bank_account_id", ACCOUNT,
            "account_number", "0000000001", "transfer_type", "in", "amount_in", total(order), "amount_out", 0,
            "transaction_content", content(order), "transaction_date", Instant.now().toString()));
    }
    private void resetCooldown(Map<String, Object> order) { jdbc.sql("update payments set last_checked_at=null where order_id=:id").param("id", id(order)).update(); }
    private HttpRequest.Builder request(String path) { return HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)); }
    private HttpResponse<String> call(Map<String, Object> order, boolean check, String access, String body) throws Exception {
        var request = request("/api/payments/sepay-sandbox/"+id(order)+(check?"/check":""));
        if (order.get("guestAccessToken") instanceof String guest && !guest.isBlank()) request.header("X-Guest-Order-Token", guest);
        if (access != null) request.header("Authorization", "Bearer "+access);
        request.header("Content-Type", "application/json").method(check?"POST":"GET", body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body));
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
    private JsonNode data(HttpResponse<String> response) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        return mapper.readTree(response.body()).path("data");
    }
}
