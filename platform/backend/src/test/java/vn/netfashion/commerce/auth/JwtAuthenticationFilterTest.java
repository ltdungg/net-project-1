package vn.netfashion.commerce.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.databind.json.JsonMapper;
import vn.netfashion.commerce.config.AppProperties;

class JwtAuthenticationFilterTest {
    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesBearerAndCookieTokens() throws Exception {
        AppProperties properties = properties(false);
        JwtService jwt = new JwtService(JsonMapper.builder().build(), properties);
        String token = jwt.accessToken(new AuthPrincipal("u-1", "member@example.com", "Member", Set.of("customer")));

        MockHttpServletRequest bearer = new MockHttpServletRequest();
        bearer.addHeader("Authorization", "Bearer " + token);
        execute(new JwtAuthenticationFilter(jwt, properties), bearer);
        assertThat(((AuthPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).id()).isEqualTo("u-1");

        SecurityContextHolder.clearContext();
        MockHttpServletRequest cookie = new MockHttpServletRequest();
        cookie.setCookies(new jakarta.servlet.http.Cookie("net_access_token", token));
        execute(new JwtAuthenticationFilter(jwt, properties), cookie);
        assertThat(((AuthPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).id()).isEqualTo("u-1");
    }

    @Test
    void marksInvalidCredentialsWithoutAuthenticating() throws Exception {
        AppProperties properties = properties(false);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer broken");
        execute(new JwtAuthenticationFilter(new JwtService(JsonMapper.builder().build(), properties), properties), request);
        assertThat(request.getAttribute(JwtAuthenticationFilter.INVALID_CREDENTIAL_ATTRIBUTE)).isEqualTo(true);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void localBypassBuildsAdminPrincipalOnlyInLocalEnvironment() throws Exception {
        AppProperties properties = properties(true);
        execute(new JwtAuthenticationFilter(new JwtService(JsonMapper.builder().build(), properties), properties), new MockHttpServletRequest());
        AuthPrincipal principal = (AuthPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        assertThat(principal.roles()).contains("customer", "staff", "manager", "admin");
    }

    @Test
    void productionNeverEnablesLocalBypassEvenIfFlagIsSet() throws Exception {
        AppProperties local = properties(true);
        AppProperties production = new AppProperties("production", "https://shop.test", local.jwtSecret(),
            local.accessTokenTtl(), local.refreshTokenTtl(), true, local.localAuthEmail(), local.adminEmails(),
            local.managerEmails(), local.paymentWebhookSecret(), local.uploadDir(), "", "model");
        execute(new JwtAuthenticationFilter(new JwtService(JsonMapper.builder().build(), production), production), new MockHttpServletRequest());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private void execute(JwtAuthenticationFilter filter, MockHttpServletRequest request) throws Exception {
        filter.doFilterInternal(request, new MockHttpServletResponse(), new MockFilterChain());
    }

    private AppProperties properties(boolean bypass) {
        return new AppProperties("local", "http://localhost:8787", "test-jwt-secret-with-at-least-thirty-two-characters",
            Duration.ofMinutes(15), Duration.ofDays(30), bypass, "owner@example.com",
            Set.of("owner@example.com"), Set.of("manager@example.com"), "webhook", "./uploads", "", "model");
    }
}
