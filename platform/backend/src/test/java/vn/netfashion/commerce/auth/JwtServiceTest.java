package vn.netfashion.commerce.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import vn.netfashion.commerce.config.AppProperties;

class JwtServiceTest {
    @Test
    void roundTripsSignedPrincipalClaims() {
        JwtService jwt = service(secret());
        AuthPrincipal source = new AuthPrincipal(
            "user-1",
            "lan@example.com",
            "Nguyễn Lan",
            Set.of("customer", "manager")
        );

        AuthPrincipal verified = jwt.verify(jwt.accessToken(source));

        assertThat(verified).isEqualTo(source);
    }

    @Test
    void rejectsTamperedPayloadAndSignature() {
        JwtService jwt = service(secret());
        String token = jwt.accessToken(new AuthPrincipal(
            "user-1", "lan@example.com", "Lan", Set.of("customer")
        ));
        String[] parts = token.split("\\.");

        assertThat(jwt.verify(parts[0] + "." + parts[1] + "x." + parts[2])).isNull();
        assertThat(jwt.verify(parts[0] + "." + parts[1] + "." + parts[2].substring(1))).isNull();
    }

    @Test
    void refusesShortSigningSecretAtStartup() {
        assertThatThrownBy(() -> service("too-short"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("32");
    }

    @Test
    void guestOrderTokenIsScopedToOrderAndEmail() {
        JwtService jwt = service(secret());
        String token = jwt.guestOrderToken("order-1", "guest@example.com");

        assertThat(jwt.verifyGuestOrderToken("order-1", "guest@example.com", token)).isTrue();
        assertThat(jwt.verifyGuestOrderToken("order-2", "guest@example.com", token)).isFalse();
        assertThat(jwt.verifyGuestOrderToken("order-1", "other@example.com", token)).isFalse();
        assertThat(jwt.verifyGuestOrderToken("order-1", "guest@example.com", "invalid")).isFalse();
        String expired = jwt.guestOrderToken("order-1", "guest@example.com", 1L);
        assertThat(jwt.verifyGuestOrderToken("order-1", "guest@example.com", expired)).isFalse();
    }

    private JwtService service(String jwtSecret) {
        AppProperties properties = new AppProperties(
            "local",
            "http://localhost:8787",
            jwtSecret,
            Duration.ofMinutes(15),
            Duration.ofDays(30),
            false,
            "owner@example.com",
            Set.of("owner@example.com"),
            Set.of("manager@example.com"),
            "test-webhook-secret",
            "./data/uploads",
            "",
            "gemini-3.8-flash"
        );
        return new JwtService(JsonMapper.builder().build(), properties);
    }

    private String secret() {
        return "test-jwt-secret-with-at-least-thirty-two-characters";
    }
}
