package vn.netfashion.commerce.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.config.AppProperties;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;
    private final AppProperties properties;

    public AuthController(AuthService authService, AuthRateLimiter rateLimiter, AppProperties properties) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
    }

    @PostMapping("/register")
    ResponseEntity<ApiEnvelope<AuthService.Registration>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest servletRequest
    ) {
        rateLimiter.check("register", clientKey(servletRequest, request.email()), 5, Duration.ofHours(1));
        AuthService.Registration registration = authService.register(
            request.email(),
            request.password(),
            request.fullName(),
            request.phone(),
            request.marketingConsent()
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiEnvelope.ok(registration));
    }

    @PostMapping("/verify-email")
    ApiEnvelope<Map<String, Object>> verifyEmail(
        @Valid @RequestBody TokenRequest request,
        HttpServletRequest servletRequest,
        HttpServletResponse response
    ) {
        rateLimiter.check("verify-email", clientKey(servletRequest, ""), 15, Duration.ofHours(1));
        return authenticated(authService.verifyEmail(request.token()), response);
    }

    @PostMapping("/resend-verification")
    ResponseEntity<ApiEnvelope<AuthService.Action>> resendVerification(
        @Valid @RequestBody EmailRequest request,
        HttpServletRequest servletRequest
    ) {
        rateLimiter.check("resend-verification", clientKey(servletRequest, request.email()), 5, Duration.ofHours(1));
        return ResponseEntity.accepted().body(ApiEnvelope.ok(authService.resendVerification(request.email())));
    }

    @PostMapping("/login")
    ApiEnvelope<Map<String, Object>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest servletRequest,
        HttpServletResponse response
    ) {
        rateLimiter.check("login", clientKey(servletRequest, request.email()), 10, Duration.ofMinutes(10));
        return authenticated(authService.login(request.email(), request.password()), response);
    }

    @PostMapping("/forgot-password")
    ResponseEntity<ApiEnvelope<AuthService.Action>> forgotPassword(
        @Valid @RequestBody EmailRequest request,
        HttpServletRequest servletRequest
    ) {
        rateLimiter.check("forgot-password", clientKey(servletRequest, request.email()), 5, Duration.ofHours(1));
        return ResponseEntity.accepted().body(ApiEnvelope.ok(authService.forgotPassword(request.email())));
    }

    @PostMapping("/reset-password")
    ApiEnvelope<AuthService.Action> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request,
        HttpServletRequest servletRequest
    ) {
        rateLimiter.check("reset-password", clientKey(servletRequest, ""), 10, Duration.ofHours(1));
        return ApiEnvelope.ok(authService.resetPassword(request.token(), request.newPassword()));
    }

    @PostMapping("/refresh")
    ApiEnvelope<Map<String, Object>> refresh(HttpServletRequest request, HttpServletResponse response) {
        rateLimiter.check("refresh", clientKey(request, ""), 60, Duration.ofMinutes(10));
        return authenticated(authService.refresh(cookie(request, "net_refresh_token")), response);
    }

    @PostMapping("/logout")
    ApiEnvelope<Map<String, Boolean>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(cookie(request, "net_refresh_token"));
        clear(response, "net_access_token", "/");
        clear(response, "net_refresh_token", "/api/auth");
        return ApiEnvelope.ok(Map.of("loggedOut", true));
    }

    @GetMapping("/me")
    ApiEnvelope<UserView> me(@AuthenticationPrincipal AuthPrincipal principal) {
        if (
            principal != null
                && principal.id().startsWith("local-")
                && properties.localAuthBypass()
                && "local".equalsIgnoreCase(properties.environment())
        ) {
            return ApiEnvelope.ok(userView(principal));
        }
        return ApiEnvelope.ok(
            userView(principal == null ? null : authService.loadPrincipal(principal.id()))
        );
    }

    private ApiEnvelope<Map<String, Object>> authenticated(AuthService.Tokens tokens, HttpServletResponse response) {
        boolean secure = !"local".equalsIgnoreCase(properties.environment());
        response.addHeader(
            HttpHeaders.SET_COOKIE,
            cookie("net_access_token", tokens.accessToken(), properties.accessTokenTtl(), "/", secure).toString()
        );
        response.addHeader(
            HttpHeaders.SET_COOKIE,
            cookie("net_refresh_token", tokens.refreshToken(), properties.refreshTokenTtl(), "/api/auth", secure).toString()
        );
        return ApiEnvelope.ok(Map.of(
            "user", userView(tokens.user()),
            "expiresInSeconds", properties.accessTokenTtl().toSeconds()
        ));
    }

    private ResponseCookie cookie(String name, String value, Duration ttl, String path, boolean secure) {
        return ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(secure)
            .sameSite("Strict")
            .path(path)
            .maxAge(ttl)
            .build();
    }

    private void clear(HttpServletResponse response, String name, String path) {
        boolean secure = !"local".equalsIgnoreCase(properties.environment());
        response.addHeader(
            HttpHeaders.SET_COOKIE,
            ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(path)
                .maxAge(Duration.ZERO)
                .build()
                .toString()
        );
    }

    private String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return "";
        return Arrays.stream(request.getCookies())
            .filter(value -> name.equals(value.getName()))
            .map(Cookie::getValue)
            .findFirst()
            .orElse("");
    }

    private String clientKey(HttpServletRequest request, String email) {
        String forwarded = request.getHeader("CF-Connecting-IP");
        if (forwarded == null || forwarded.isBlank()) forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) forwarded = request.getRemoteAddr();
        String ip = forwarded.split(",", 2)[0].trim();
        return ip + '|' + (email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT));
    }

    private UserView userView(AuthPrincipal principal) {
        return principal == null ? null : new UserView(
            principal.id(),
            principal.email(),
            principal.fullName(),
            principal.roles()
        );
    }

    public record UserView(String id, String email, String fullName, java.util.Set<String> roles) {}

    public record EmailRequest(@Email @NotBlank String email) {}

    public record TokenRequest(@NotBlank @Size(max = 200) String token) {}

    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record ResetPasswordRequest(
        @NotBlank @Size(max = 200) String token,
        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
            message = "Mật khẩu cần có chữ hoa, chữ thường và số"
        )
        String newPassword
    ) {}

    public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
            message = "Mật khẩu cần có chữ hoa, chữ thường và số"
        )
        String password,
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$") String phone,
        @AssertTrue(message = "Bạn cần đồng ý với điều khoản sử dụng.") boolean acceptedTerms,
        boolean marketingConsent
    ) {}
}
