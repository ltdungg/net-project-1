package vn.netfashion.commerce.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorrelationIdFilterTest {
    @Test
    void preservesProvidedIdTruncatesItAndCleansMdc() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Correlation-Id", "x".repeat(120));
        MockHttpServletResponse response = new MockHttpServletResponse();

        new CorrelationIdFilter().doFilterInternal(request, response, new MockFilterChain());

        assertThat(response.getHeader("X-Correlation-Id")).hasSize(100);
        assertThat(request.getAttribute(CorrelationIdFilter.ATTRIBUTE)).isEqualTo("x".repeat(100));
        assertThat(MDC.get("correlationId")).isNull();
    }

    @Test
    void createsUuidWhenHeaderIsMissingOrBlank() throws Exception {
        for (String supplied : new String[] { null, "" }) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            if (supplied != null) request.addHeader("X-Correlation-Id", supplied);
            MockHttpServletResponse response = new MockHttpServletResponse();
            new CorrelationIdFilter().doFilterInternal(request, response, new MockFilterChain());
            assertThat(response.getHeader("X-Correlation-Id")).matches("[0-9a-f-]{36}");
        }
    }
}
