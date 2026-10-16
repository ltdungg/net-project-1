package vn.netfashion.commerce.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

class SecurityResponseWriterTest {
    @Test
    void writesStableJsonEnvelopeForAuthenticationAndAuthorizationFailures() throws Exception {
        SecurityResponseWriter writer = new SecurityResponseWriter(JsonMapper.builder().build());
        MockHttpServletResponse unauthorized = new MockHttpServletResponse();
        writer.write(unauthorized, 401, "AUTH_REQUIRED", "Bạn cần đăng nhập.");
        assertThat(unauthorized.getStatus()).isEqualTo(401);
        assertThat(unauthorized.getContentType()).startsWith("application/json");
        assertThat(unauthorized.getContentAsString()).contains("\"data\":null", "\"code\":\"AUTH_REQUIRED\"");

        MockHttpServletResponse forbidden = new MockHttpServletResponse();
        writer.write(forbidden, 403, "FORBIDDEN", "Bạn không có quyền.");
        assertThat(forbidden.getStatus()).isEqualTo(403);
        assertThat(forbidden.getContentAsString()).contains("\"code\":\"FORBIDDEN\"");
    }
}
