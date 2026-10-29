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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;
import vn.netfashion.commerce.order.OrderService;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={
    "management.health.redis.enabled=false", "app.environment=local", "app.local-auth-bypass=false", "app.gemini-api-key="
})
@Testcontainers(disabledWithoutDocker=true)
class PostgresMockPaymentIntegrationTest {
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
        .withDatabaseName("mock_payment_it").withUsername("net_it").withPassword("net_it_password");
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

    @Test void guestCheckoutFailureRetryAndDuplicateConfirmationKeepDataConsistent() throws Exception {
        var config = http.send(request("/api/payments/config").GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(config.statusCode()).isEqualTo(200);
        assertThat(data(config).path("mockEnabled").asBoolean()).isTrue();
        var created = post("/api/orders", Map.of(
            "email", "guest@example.test", "phone", "0901234567", "paymentMethod", "online", "idempotencyKey", UUID.randomUUID().toString(),
            "shippingAddress", Map.of("recipientName", "Guest Test", "phone", "0901234567", "line1", "1 Test", "district", "Quan 1", "province", "TP HCM"),
            "items", List.of(Map.of("variantId", "DMA-s", "quantity", 1))), null);
        assertThat(created.statusCode()).as(created.body()).isEqualTo(201);
        String id = data(created).path("id").asText();
        String token = data(created).path("guestAccessToken").asText();
        assertThat(token).isNotBlank();
        var detail = http.send(request("/api/orders/"+id+"/guest").header("X-Guest-Order-Token", token).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(detail.statusCode()).as(detail.body()).isEqualTo(200);
        assertThat(post("/api/payments/mock/confirm", Map.of("orderId", id), null).statusCode()).isEqualTo(404);
        assertThat(post("/api/payments/mock/confirm", Map.of("orderId", id, "guestAccessToken", "wrong"), null).statusCode()).isEqualTo(404);
        assertThat(post("/api/payments/mock/confirm", Map.of("orderId", id, "guestAccessToken", token, "outcome", "refunded"), null).statusCode()).isEqualTo(400);
        var stock = jdbc.sql("select sum(on_hand) on_hand, sum(reserved) reserved from inventory_items").query().singleRow();
        var failure = simulate(id, token, "failed", null);
        assertThat(failure.statusCode()).as(failure.body()).isEqualTo(200);
        assertThat(data(failure).path("status").asText()).isEqualTo("failed");
        assertThat(orderState(id)).containsEntry("status", "pending_payment").containsEntry("payment_status", "failed");
        var retry = simulate(id, token, "succeeded", null);
        assertThat(retry.statusCode()).as(retry.body()).isEqualTo(200);
        assertThat(data(retry).path("status").asText()).isEqualTo("paid");
        assertThat(orderState(id)).containsEntry("status", "confirmed").containsEntry("payment_status", "paid");
        assertThat(data(simulate(id, token, "succeeded", null)).path("duplicate").asBoolean()).isTrue();
        assertThat(data(simulate(id, token, "failed", null)).path("status").asText()).isEqualTo("paid");
        assertThat(jdbc.sql("select sum(on_hand) on_hand, sum(reserved) reserved from inventory_items").query().singleRow()).isEqualTo(stock);
        assertThat(jdbc.sql("select count(*) from outbox_events where aggregate_id=:id and event_type='payment.succeeded'").param("id", id).query(Long.class).single()).isOne();
    }

    @Test void signedInOwnerCanPayButAnotherCustomerCannot() throws Exception {
        var owner = new AuthPrincipal("payment-owner", "owner@example.test", "Owner", Set.of("customer"));
        var other = new AuthPrincipal("payment-other", "other@example.test", "Other", Set.of("customer"));
        var created = create(owner);
        String id = (String) created.get("id");
        assertThat(simulate(id, "", "succeeded", jwt.accessToken(other)).statusCode()).isEqualTo(404);
        var success = simulate(id, "", "succeeded", jwt.accessToken(owner));
        assertThat(success.statusCode()).as(success.body()).isEqualTo(200);
        assertThat(orderState(id)).containsEntry("payment_status", "paid");
    }

    @Test void cancelledOrderCannotBeRevivedByEitherMockOutcome() throws Exception {
        var created = create(null);
        String id = (String) created.get("id");
        jdbc.sql("update customer_orders set status='cancelled' where id=:id").param("id", id).update();
        for (String outcome : List.of("failed", "succeeded")) {
            var result = simulate(id, (String) created.get("guestAccessToken"), outcome, null);
            assertThat(result.statusCode()).isEqualTo(409);
        }
        assertThat(orderState(id)).containsEntry("status", "cancelled").containsEntry("payment_status", "pending");
    }

    private Map<String, Object> create(AuthPrincipal actor) {
        return orders.create(new OrderService.CreateOrder(actor == null ? "guest@example.test" : actor.email(), "0901234567", "Mock payment test", "online", null, UUID.randomUUID().toString(),
            new OrderService.ShippingAddress("Test", "0901234567", "1 Test", "Ward", "District", "Province"), List.of(new OrderService.OrderItemInput("DMA-s", 1))), actor, null, "mock-test");
    }
    private Map<String, Object> orderState(String id) {
        return jdbc.sql("select status,payment_status from customer_orders where id=:id").param("id", id).query().singleRow();
    }
    private HttpResponse<String> simulate(String id, String guest, String outcome, String access) throws Exception {
        return post("/api/payments/mock/confirm", Map.of("orderId", id, "guestAccessToken", guest, "outcome", outcome), access);
    }
    private HttpRequest.Builder request(String path) { return HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)); }
    private HttpResponse<String> post(String path, Object body, String access) throws Exception {
        var request = request(path).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)));
        if (access != null) request.header("Authorization", "Bearer "+access);
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
    private JsonNode data(HttpResponse<String> response) { return mapper.readTree(response.body()).path("data"); }
}
