package vn.netfashion.commerce.admin.logs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.LoggingEvent;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class BackendLogsTest {
    @Test
    void masksCredentialsAndEmailBeforeStorage() {
        String safe = BackendLogBuffer.sanitize("password=demo-secret Authorization: Bearer abc123 owner@example.com api_key=private-value");
        assertThat(safe).doesNotContain("demo-secret", "abc123", "owner@example.com", "private-value");
        assertThat(BackendLogBuffer.sanitize("{\"access_token\":\"abc secret\"}"))
            .doesNotContain("abc secret");
        assertThat(BackendLogBuffer.sanitize("-----BEGIN PRIVATE KEY----- abc"))
            .isEqualTo("[REDACTED PRIVATE KEY]");
    }

    @Test
    void boundsHistoryAndFiltersNewestFirst() {
        BackendLogBuffer buffer = new BackendLogBuffer();
        buffer.start();
        for (int i = 0; i < 1010; i++) {
            LoggingEvent event = new LoggingEvent();
            event.setLevel(i % 2 == 0 ? Level.INFO : Level.ERROR);
            event.setLoggerName("test.buffer");
            event.setMessage("entry-" + i);
            event.setTimeStamp(1000L + i);
            event.setMDCPropertyMap(Map.of("correlationId", "request-test"));
            buffer.doAppend(event);
        }
        var snapshot = BackendLogBuffer.snapshot("ERROR", "request-test", 2);
        assertThat(snapshot.retained()).isEqualTo(1000);
        assertThat(snapshot.matched()).isEqualTo(500);
        assertThat(snapshot.entries()).hasSize(2);
        assertThat(snapshot.entries().getFirst().message()).isEqualTo("entry-1009");
        assertThat(BackendLogBuffer.snapshot("ALL", "does-not-exist", 200).entries()).isEmpty();
    }

    @Test
    void onlyAdminCanReadLogsAndResponseCannotBeCached() {
        try (var context = new AnnotationConfigApplicationContext(TestConfig.class)) {
            var controller = context.getBean(AdminLogController.class);
            for (String role : List.of("STAFF", "MANAGER", "CUSTOMER")) {
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                    "tester", "unused", List.of(new SimpleGrantedAuthority("ROLE_" + role))));
                assertThatThrownBy(() -> controller.logs("ALL", "", 10)).isInstanceOf(AccessDeniedException.class);
            }
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "unused", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
            assertThat(controller.logs("ALL", "", 10).getHeaders().getCacheControl()).isEqualTo("no-store");
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Configuration
    @EnableMethodSecurity
    static class TestConfig {
        @Bean AdminLogController controller() { return new AdminLogController(); }
    }
}
