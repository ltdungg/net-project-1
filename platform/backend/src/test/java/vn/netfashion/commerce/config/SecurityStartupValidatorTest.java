package vn.netfashion.commerce.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SecurityStartupValidatorTest {
    @Test
    void localEnvironmentMayUseDeveloperDefaults() {
        assertThatCode(() -> new SecurityStartupValidator(properties(
            "local",
            "http://localhost:8787",
            "local-only-change-this-secret-before-production-0123456789",
            "replace-with-provider-webhook-secret",
            true
        )).afterPropertiesSet()).doesNotThrowAnyException();
    }

    @Test
    void productionRejectsAuthenticationBypass() {
        assertThatThrownBy(() -> new SecurityStartupValidator(properties(
            "production", "https://shop.example", secureJwt(), "webhook-secret-production", true
        )).afterPropertiesSet())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("LOCAL_AUTH_BYPASS");
    }

    @Test
    void productionRejectsNonHttpsOrigin() {
        assertThatThrownBy(() -> new SecurityStartupValidator(properties(
            "production", "http://shop.example", secureJwt(), "webhook-secret-production", false
        )).afterPropertiesSet())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("HTTPS");
    }

    @Test
    void productionAcceptsExplicitSafeConfiguration() {
        assertThatCode(() -> new SecurityStartupValidator(properties(
            "production", "https://shop.example", secureJwt(), "webhook-secret-production", false
        )).afterPropertiesSet()).doesNotThrowAnyException();
    }

    private AppProperties properties(
        String environment,
        String origin,
        String jwt,
        String webhookSecret,
        boolean bypass
    ) {
        return new AppProperties(
            environment,
            origin,
            jwt,
            Duration.ofMinutes(15),
            Duration.ofDays(30),
            bypass,
            "owner@example.com",
            Set.of("owner@example.com"),
            Set.of("manager@example.com"),
            webhookSecret,
            "./data/uploads",
            "",
            "gemini-3.8-flash"
        );
    }

    private String secureJwt() {
        return "production-jwt-secret-with-at-least-thirty-two-characters";
    }
}
