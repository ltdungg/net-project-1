package vn.netfashion.commerce.health;

import java.time.Instant;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final JdbcClient jdbc;

    public HealthController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    ApiEnvelope<Map<String, Object>> health() {
        Integer database = jdbc.sql("select 1").query(Integer.class).single();
        return ApiEnvelope.ok(Map.of(
            "status", database == 1 ? "ok" : "degraded",
            "service", "net-commerce-api",
            "runtime", "java-spring-boot",
            "timestamp", Instant.now().toString()
        ));
    }
}
