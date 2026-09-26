package vn.netfashion.commerce.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.Set;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.netfashion.commerce.config.AppProperties;

@Component
public class OriginValidationFilter extends OncePerRequestFilter {
    private static final Set<String> SAFE = Set.of(HttpMethod.GET.name(), HttpMethod.HEAD.name(), HttpMethod.OPTIONS.name());
    private final AppProperties properties;
    private final SecurityResponseWriter errors;

    public OriginValidationFilter(AppProperties properties, SecurityResponseWriter errors) {
        this.properties = properties;
        this.errors = errors;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        if (SAFE.contains(request.getMethod()) || "/api/payments/webhook".equals(request.getRequestURI())) {
            chain.doFilter(request, response);
            return;
        }
        String origin = request.getHeader("Origin");
        String fetchSite = request.getHeader("Sec-Fetch-Site");
        if ("cross-site".equalsIgnoreCase(fetchSite)) {
            reject(response, "Nguồn yêu cầu không hợp lệ.");
            return;
        }
        if (origin != null && !origin.isBlank()) {
            try {
                URI expected = URI.create(properties.publicOrigin());
                URI actual = URI.create(origin);
                if (!equalsIgnoreCase(expected.getScheme(), actual.getScheme()) || !equalsIgnoreCase(expected.getHost(), actual.getHost()) || effectivePort(expected) != effectivePort(actual)) {
                    reject(response, "Nguồn yêu cầu không hợp lệ.");
                    return;
                }
            } catch (IllegalArgumentException exception) {
                reject(response, "Nguồn yêu cầu không hợp lệ.");
                return;
            }
        } else if (request.getCookies() != null && request.getHeader("Authorization") == null) {
            reject(response, "Thiếu thông tin nguồn yêu cầu.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        errors.write(response, HttpServletResponse.SC_FORBIDDEN, "ORIGIN_FORBIDDEN", message);
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private int effectivePort(URI uri) {
        if (uri.getPort() >= 0) return uri.getPort();
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }
}
