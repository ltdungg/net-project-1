package vn.netfashion.commerce.integration;

import static org.assertj.core.api.Assertions.*;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import vn.netfashion.commerce.ai.*;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtService;
import org.springframework.boot.test.web.server.LocalServerPort;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.common.ApiException;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties={"spring.cache.type=none", "management.health.redis.enabled=false", "app.gemini-api-key=", "app.local-auth-bypass=false"})
@Testcontainers(disabledWithoutDocker=true)
class PostgresAiIntegrationTest {
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
        .withDatabaseName("net_ai_it").withUsername("net_it").withPassword("net_it_password");
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired AiDashboardService dashboards;
    @Autowired ShopperAiService shopper;
    @Autowired AccountService accounts;
    @Autowired JdbcClient jdbc;
    @Autowired JwtService jwt;
    @LocalServerPort int port;
    private AuthPrincipal actor(String id) { return new AuthPrincipal(id, id+"@example.test", "AI test", Set.of("admin")); }

    @Test void httpBoundariesAllowGuestsValidateInputsAndProtectAdminData() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        var status = client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/ai/status"))
            .GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(status.statusCode()).isEqualTo(200);
        assertThat(status.headers().firstValue("Cache-Control")).contains("no-store");
        assertThat(new tools.jackson.databind.ObjectMapper().readTree(status.body()).path("data"))
            .isEqualTo(new tools.jackson.databind.ObjectMapper().valueToTree(Map.of("provider", "gemini", "configured", false)));
        URI recs = URI.create("http://localhost:"+port+"/api/ai/recommendations");
        var guest = client.send(HttpRequest.newBuilder(recs).header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{}" )).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(guest.statusCode()).isEqualTo(200);
        assertThat(guest.headers().firstValue("Cache-Control")).contains("no-store");
        var invalid = client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/ai/chat"))
            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"message\":\" \"}")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(invalid.statusCode()).as(invalid.body()).isEqualTo(400);
        var chat = client.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/ai/chat"))
            .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"message\":\"áo nữ dưới 800k\"}")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(chat.statusCode()).as(chat.body()).isEqualTo(200);
        URI admin = URI.create("http://localhost:"+port+"/api/admin/ai/dashboards");
        assertThat(client.send(HttpRequest.newBuilder(admin).GET().build(), HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(401);
        for (String role : List.of("customer", "staff", "manager", "admin")) {
            var principal = new AuthPrincipal("http-"+role, role+"@example.test", "HTTP test", Set.of(role));
            var response = client.send(HttpRequest.newBuilder(admin).header("Authorization", "Bearer "+jwt.accessToken(principal)).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).as(role).isEqualTo(Set.of("manager","admin").contains(role) ? 200 : 403);
        }
    }

    @Test @Transactional void savedDashboardsArePrivateAndReloadUsesFreshData() {
        var owner = actor("ai-owner"); var other = actor("ai-other");
        var plan = new DashboardPlan("Doanh thu tuần", 7, List.of("revenue", "sales_daily", "low_stock"));
        String id = (String) dashboards.save(plan, owner).get("id");
        assertThat(dashboards.list(owner)).hasSize(1);
        assertThat(dashboards.list(other)).isEmpty();
        assertThatThrownBy(() -> dashboards.load(id, other)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> dashboards.delete(id, other)).isInstanceOf(ApiException.class);
        var loaded = dashboards.load(id, owner);
        assertThat(loaded.get("plan")).isEqualTo(plan);
        assertThat(loaded.get("mode")).isEqualTo("saved");
        jdbc.sql("update inventory_items set on_hand=reserved where on_hand >= reserved").update();
        assertThat(((Number) dashboards.load(id, owner).get("lowStock")).longValue()).isGreaterThanOrEqualTo(((Number) loaded.get("lowStock")).longValue());
        dashboards.delete(id, owner);
        assertThat(dashboards.list(owner)).isEmpty();
    }

    @Test @Transactional void limitsSavedDashboardsPerOwner() {
        var owner = actor("ai-limit"); var plan = new DashboardPlan("Test", 30, List.of("orders"));
        for (int i=0; i<10; i++) dashboards.save(plan, owner);
        assertThatThrownBy(() -> dashboards.save(plan, owner)).isInstanceOf(ApiException.class).hasMessageContaining("10 dashboard");
    }

    @Test @Transactional void recommendationsUseOwnFavoritesAndLiveStockAndChatWorksWithoutKey() {
        var owner = actor("ai-shopper"); accounts.ensure(owner);
        var initial = shopper.recommend(null, List.of(), List.of(), owner, null, "", 4);
        assertThat(initial).hasSize(4);
        String productId = (String) initial.getLast().product().get("id");
        jdbc.sql("insert into wishlist_items(user_id,product_id) values(:user,:product)").params(Map.of("user", owner.id(), "product", productId)).update();
        assertThat(shopper.recommend(null, List.of(), List.of(), owner, null, "", 4).getFirst().product().get("id")).isEqualTo(productId);
        jdbc.sql("update inventory_items set on_hand=reserved where variant_id in (select id from product_variants where product_id=:product)").param("product", productId).update();
        assertThat(shopper.recommend(null, List.of(), List.of(), owner, null, "", 4)).noneMatch(item -> productId.equals(item.product().get("id")));
        var reply = shopper.chat(new ShopperAiController.ChatRequest("áo nữ dưới 800k size M", List.of(), null, List.of(), List.of()), null, null);
        assertThat(reply.mode()).isEqualTo("rules");
        assertThat(reply.answer()).isNotBlank();
        assertThat(dashboards.generate("doanh thu 7 ngày", 30).get("mode")).isEqualTo("rules");
    }
}
