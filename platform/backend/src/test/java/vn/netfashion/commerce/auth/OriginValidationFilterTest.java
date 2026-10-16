package vn.netfashion.commerce.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;
import vn.netfashion.commerce.config.AppProperties;

class OriginValidationFilterTest {
    private final OriginValidationFilter filter = new OriginValidationFilter(
        properties(false), new SecurityResponseWriter(JsonMapper.builder().build())
    );

    @Test
    void permitsSafeMethodsAndProviderWebhookWithoutOrigin() throws Exception {
        MockHttpServletResponse getResponse = execute("GET", "/api/products", null, null, false);
        MockHttpServletResponse webhookResponse = execute("POST", "/api/payments/webhook", null, null, false);

        assertThat(getResponse.getStatus()).isEqualTo(200);
        assertThat(webhookResponse.getStatus()).isEqualTo(200);
    }

    @Test
    void permitsTrustedOriginAndBearerRequestsWithoutCookies() throws Exception {
        assertThat(execute("POST", "/api/orders", "http://localhost:8787", "same-origin", true).getStatus())
            .isEqualTo(200);

        MockHttpServletRequest bearer = new MockHttpServletRequest("POST", "/api/orders");
        bearer.addHeader("Authorization", "Bearer machine-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilterInternal(bearer, response, new MockFilterChain());
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void rejectsCrossSiteWrongMalformedAndMissingOriginsForCookieRequests() throws Exception {
        assertForbidden(execute("POST", "/api/orders", "http://localhost:8787", "cross-site", true));
        assertForbidden(execute("POST", "/api/orders", "https://evil.test", "same-origin", true));
        assertForbidden(execute("POST", "/api/orders", "://bad", "same-origin", true));
        assertForbidden(execute("POST", "/api/orders", null, null, true));
    }

    private MockHttpServletResponse execute(String method, String uri, String origin, String fetchSite, boolean cookie)
        throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        if (origin != null) request.addHeader("Origin", origin);
        if (fetchSite != null) request.addHeader("Sec-Fetch-Site", fetchSite);
        if (cookie) request.setCookies(new jakarta.servlet.http.Cookie("net_access_token", "token"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilterInternal(request, response, new MockFilterChain());
        return response;
    }

    private void assertForbidden(MockHttpServletResponse response) throws Exception {
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("ORIGIN_FORBIDDEN");
    }

    private AppProperties properties(boolean bypass) {
        return new AppProperties("local", "http://localhost:8787", "test-jwt-secret-with-at-least-thirty-two-characters",
            Duration.ofMinutes(15), Duration.ofDays(30), bypass, "owner@example.com",
            Set.of("owner@example.com"), Set.of("manager@example.com"), "webhook", "./uploads", "", "model");
    }
}
