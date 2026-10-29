package vn.netfashion.commerce.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(CorrelationIdFilter.class);
    public static final String ATTRIBUTE = "vn.netfashion.commerce.correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String value = request.getHeader("X-Correlation-Id");
        String correlationId = value == null || value.isBlank() ? UUID.randomUUID().toString() : value.substring(0, Math.min(100, value.length()));
        long started = System.nanoTime();
        try {
            MDC.put("correlationId", correlationId);
            request.setAttribute(ATTRIBUTE, correlationId);
            response.setHeader("X-Correlation-Id", correlationId);
            chain.doFilter(request, response);
        } finally {
            String path = request.getRequestURI();
            if (!path.equals("/api/admin/logs") && !path.equals("/api/health") && !path.startsWith("/actuator/")) {
                Object route = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                // Route templates avoid logging customer IDs, query strings, and arbitrary URL input.
                String message = "HTTP {} {} status={} durationMs={}";
                if (response.getStatus() >= 500) {
                    log.error(message, request.getMethod(), route == null ? "[unmatched]" : route,
                        response.getStatus(), (System.nanoTime() - started) / 1_000_000);
                } else if (response.getStatus() >= 400) {
                    log.warn(message, request.getMethod(), route == null ? "[unmatched]" : route,
                        response.getStatus(), (System.nanoTime() - started) / 1_000_000);
                } else {
                    log.info(message, request.getMethod(), route == null ? "[unmatched]" : route,
                        response.getStatus(), (System.nanoTime() - started) / 1_000_000);
                }
            }
            MDC.remove("correlationId");
        }
    }
}
