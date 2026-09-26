package vn.netfashion.commerce.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.netfashion.commerce.config.AppProperties;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String INVALID_CREDENTIAL_ATTRIBUTE = "net.auth.invalid-credential";

    private final JwtService jwtService;
    private final AppProperties properties;

    public JwtAuthenticationFilter(JwtService jwtService, AppProperties properties) {
        this.jwtService = jwtService;
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String token = bearer(request);
        AuthPrincipal principal = token == null ? null : jwtService.verify(token);
        if (principal == null && properties.localAuthBypass() && "local".equalsIgnoreCase(properties.environment())) {
            String email = properties.localAuthEmail().toLowerCase(Locale.ROOT);
            Set<String> roles = new HashSet<>(Set.of("customer", "staff"));
            if (properties.managerEmails().stream().anyMatch(email::equalsIgnoreCase)) roles.add("manager");
            if (properties.adminEmails().stream().anyMatch(email::equalsIgnoreCase)) roles.addAll(Set.of("manager", "admin"));
            principal = new AuthPrincipal("local-" + email, email, "Local Owner", Set.copyOf(roles));
        }
        if (token != null && principal == null) {
            request.setAttribute(INVALID_CREDENTIAL_ATTRIBUTE, Boolean.TRUE);
        }
        if (principal != null) {
            SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
            );
        }
        chain.doFilter(request, response);
    }

    private String bearer(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) return authorization.substring(7);
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
            .filter(cookie -> "net_access_token".equals(cookie.getName()))
            .map(Cookie::getValue)
            .findFirst()
            .orElse(null);
    }
}
