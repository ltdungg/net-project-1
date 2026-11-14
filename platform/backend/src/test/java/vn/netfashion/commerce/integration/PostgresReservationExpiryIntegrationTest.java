package vn.netfashion.commerce.integration;

import static org.assertj.core.api.Assertions.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;
import vn.netfashion.commerce.order.OrderService;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "management.health.redis.enabled=false", "app.environment=local", "app.local-auth-bypass=false", "app.gemini-api-key=", "app.payment-webhook-secret=review-only-secret"
})
@Testcontainers(disabledWithoutDocker=true)
class PostgresReservationExpiryIntegrationTest {
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
        .withDatabaseName("reservation_expiry_it").withUsername("net_it").withPassword("net_it_password");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired OrderService orders;
    @Autowired JdbcClient jdbc;
    @Autowired JwtService jwt;
    @LocalServerPort int port;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired vn.netfashion.commerce.inventory.InventoryService inventory;
    @Autowired vn.netfashion.commerce.payment.PaymentService payments;

    @Test void expiryMustCancelPaymentAsWellAsOrder() {
        String id = (String) create(null).get("id");
        expire(id);
        inventory.releaseExpiredSystem();
        assertThat(orderState(id)).containsEntry("status", "cancelled");
        assertThat(jdbc.sql("select status from payments where order_id=:id").param("id",id).query(String.class).single())
            .as("Payment for expired order must be cancelled").isEqualTo("cancelled");
    }

    @Test void lateWebhookMustNotMarkExpiredOrderPaid() throws Exception {
        String id = (String) create(null).get("id");
        expire(id);
        inventory.releaseExpiredSystem();
        var payment = jdbc.sql("select id,amount_cents from payments where order_id=:id").param("id",id).query().singleRow();
        byte[] body = mapper.writeValueAsBytes(Map.of("id",UUID.randomUUID().toString(),"type","payment.succeeded",
            "paymentId",payment.get("id"),"amountCents",payment.get("amount_cents"),"currency","VND"));
        var mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("review-only-secret".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));
        String signature = java.util.HexFormat.of().formatHex(mac.doFinal(body));
        assertThatThrownBy(() -> payments.processWebhook(body, signature))
            .isInstanceOfSatisfying(vn.netfashion.commerce.common.ApiException.class,
                e -> assertThat(e.status().value()).isEqualTo(409));
        assertThat(jdbc.sql("select count(*) from payment_events where payment_id=:id")
            .param("id",payment.get("id")).query(Long.class).single()).isZero();
        assertThat(orderState(id)).as("Expired order must stay unpaid after late webhook")
            .containsEntry("status","cancelled").containsEntry("payment_status","cancelled");
    }

    @Test void expiredCodReservationShouldNotRemainActiveForever() {
        for (String status : List.of("confirmed", "processing", "ready_to_ship")) {
            var created = orders.create(new OrderService.CreateOrder("review@example.test", "0901234567", "Review", "cod", null, UUID.randomUUID().toString(),
                new OrderService.ShippingAddress("Test", "0901234567", "1 Test", "Ward", "District", "Province"),
                List.of(new OrderService.OrderItemInput("DMA-s", 1))), null, null, "review");
            String id = (String)created.get("id");
            jdbc.sql("update customer_orders set status=:status where id=:id").param("status",status).param("id",id).update();
            expire(id);
            inventory.releaseExpiredSystem();
            assertThat(jdbc.sql("select count(*) from inventory_reservations where order_id=:id and status='active' and expires_at<now()")
                .param("id",id).query(Long.class).single()).as("Expired COD stock holds should be handled").isZero();
            assertThat(orderState(id)).containsEntry("status","cancelled").containsEntry("payment_status","cancelled");
            assertThat(jdbc.sql("select status from payments where order_id=:id").param("id",id).query(String.class).single()).isEqualTo("cancelled");
            assertThat(jdbc.sql("select from_status from order_status_history where order_id=:id and to_status='cancelled'")
                .param("id",id).query(String.class).single()).isEqualTo(status);
        }
    }
    @Test void staffMetricsAccessReturnsForbiddenWhileManagerCanRead() throws Exception {
        for (String role : List.of("staff", "manager")) {
            var actor = new AuthPrincipal("expiry-"+role, role+"@example.test", "Review", Set.of(role));
            var response = http.send(request("/api/admin/metrics")
                .header("Authorization", "Bearer "+jwt.accessToken(actor)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).as(response.body()).isEqualTo(role.equals("staff") ? 403 : 200);
            if (role.equals("staff")) assertThat(mapper.readTree(response.body()).path("error").path("code").asText()).isEqualTo("FORBIDDEN");
        }
    }

    @Test void expiryReleasesWholeOrderAndSecondRunDoesNotChangeStock() {
        var created = orders.create(new OrderService.CreateOrder("expiry@example.test", "0901234567", "Expiry", "online", null, UUID.randomUUID().toString(),
            new OrderService.ShippingAddress("Test", "0901234567", "1 Test", "Ward", "District", "Province"),
            List.of(new OrderService.OrderItemInput("DMA-s", 1), new OrderService.OrderItemInput("DMA-m", 1))), null, null, "expiry");
        String id = (String)created.get("id");
        // Only one hold has expired; cancelling the order must release both.
        jdbc.sql("update inventory_reservations set created_at=now()-interval '1 day', expires_at=now()-interval '1 minute' where order_id=:id and inventory_item_id='inv-hcm-DMA-s'")
            .param("id",id).update();
        inventory.releaseExpiredSystem();
        assertThat(jdbc.sql("select count(*) from inventory_reservations where order_id=:id and status='active'").param("id",id).query(Long.class).single()).isZero();
        assertThat(jdbc.sql("select status from fulfillments where order_id=:id").param("id",id).query(String.class).single()).isEqualTo("cancelled");
        var stock = jdbc.sql("select sum(reserved) from inventory_items").query(Long.class).single();
        assertThat(inventory.releaseExpiredSystem()).containsEntry("released",0).containsEntry("ordersCancelled",0);
        assertThat(jdbc.sql("select sum(reserved) from inventory_items").query(Long.class).single()).isEqualTo(stock);
        assertThat(jdbc.sql("select count(*) from order_status_history where order_id=:id and to_status='cancelled'").param("id",id).query(Long.class).single()).isOne();
    }

    @Test void expiryDoesNotCancelPaidOrDispatchedOrders() {
        for (String state : List.of("paid", "shipped")) {
            String id = (String)create(null).get("id");
            if (state.equals("paid")) {
                jdbc.sql("update customer_orders set status='confirmed',payment_status='paid' where id=:id").param("id",id).update();
                jdbc.sql("update payments set status='succeeded',captured_at=now() where order_id=:id").param("id",id).update();
            } else {
                jdbc.sql("update customer_orders set status='processing',payment_status='cod_pending' where id=:id").param("id",id).update();
                jdbc.sql("update fulfillments set status='shipped' where order_id=:id").param("id",id).update();
            }
            expire(id);
            inventory.releaseExpiredSystem();
            assertThat(orderState(id).get("status")).isNotEqualTo("cancelled");
            assertThat(jdbc.sql("select count(*) from inventory_reservations where order_id=:id and status='active'").param("id",id).query(Long.class).single()).isOne();
        }
    }

    private void expire(String id) {
        jdbc.sql("update inventory_reservations set created_at=now()-interval '31 days', expires_at=now()-interval '1 minute' where order_id=:id").param("id",id).update();
    }

    private Map<String, Object> create(AuthPrincipal actor) {
        return orders.create(new OrderService.CreateOrder(actor == null ? "guest@example.test" : actor.email(), "0901234567", "Mock payment test", "online", null, UUID.randomUUID().toString(),
            new OrderService.ShippingAddress("Test", "0901234567", "1 Test", "Ward", "District", "Province"), List.of(new OrderService.OrderItemInput("DMA-s", 1))), actor, null, "mock-test");
    }
    private Map<String, Object> orderState(String id) {
        return jdbc.sql("select status,payment_status from customer_orders where id=:id").param("id", id).query().singleRow();
    }
    private HttpRequest.Builder request(String path) { return HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)); }
}
