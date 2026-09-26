package vn.netfashion.commerce.auth;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import vn.netfashion.commerce.config.AppProperties;

@Service
public class JwtService {
    private static final Duration GUEST_ORDER_TOKEN_TTL = Duration.ofDays(7);
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();
    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final AppProperties properties;

    public JwtService(ObjectMapper objectMapper, AppProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.secret = properties.jwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) throw new IllegalStateException("JWT_SECRET phải có ít nhất 32 ký tự");
    }

    public String accessToken(AuthPrincipal principal) {
        Instant now = Instant.now();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", principal.id());
        claims.put("email", principal.email());
        claims.put("name", principal.fullName());
        claims.put("roles", principal.roles());
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", now.plus(properties.accessTokenTtl()).getEpochSecond());
        claims.put("iss", "net-commerce-api");
        return encode(claims);
    }

    public AuthPrincipal verify(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            Map<String, Object> header = objectMapper.readValue(URL_DECODER.decode(parts[0]), new TypeReference<>() {});
            if (!"HS256".equals(header.get("alg")) || !"JWT".equals(header.get("typ"))) return null;
            byte[] expected = sign((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
            if (!MessageDigest.isEqual(expected, URL_DECODER.decode(parts[2]))) return null;
            Map<String, Object> claims = objectMapper.readValue(URL_DECODER.decode(parts[1]), new TypeReference<>() {});
            Number expiresAt = (Number) claims.get("exp");
            if (expiresAt == null || expiresAt.longValue() <= Instant.now().getEpochSecond() || !"net-commerce-api".equals(claims.get("iss"))) return null;
            if (claims.get("sub") == null || claims.get("email") == null) return null;
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) claims.getOrDefault("roles", List.of("customer"));
            return new AuthPrincipal(
                String.valueOf(claims.get("sub")),
                String.valueOf(claims.get("email")),
                String.valueOf(claims.getOrDefault("name", claims.get("email"))),
                Set.copyOf(roles)
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    public String randomRefreshToken() {
        byte[] bytes = new byte[48];
        new java.security.SecureRandom().nextBytes(bytes);
        return URL_ENCODER.encodeToString(bytes);
    }

    public String hash(String value) {
        try {
            return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public String guestOrderToken(String orderId, String email) {
        return guestOrderToken(orderId, email, Instant.now().plus(GUEST_ORDER_TOKEN_TTL).getEpochSecond());
    }

    String guestOrderToken(String orderId, String email, long expiresAtEpochSecond) {
        try {
            String expiry = Long.toString(expiresAtEpochSecond);
            String scope = guestOrderScope(orderId, email, expiry);
            return expiry + "." + URL_ENCODER.encodeToString(sign(scope.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo mã truy cập đơn khách", exception);
        }
    }

    public boolean verifyGuestOrderToken(String orderId, String email, String suppliedToken) {
        if (suppliedToken == null || suppliedToken.isBlank()) return false;
        try {
            String[] parts = suppliedToken.split("\\.");
            if (parts.length != 2) return false;
            long expiresAt = Long.parseLong(parts[0]);
            if (expiresAt <= Instant.now().getEpochSecond()) return false;
            String scope = guestOrderScope(orderId, email, parts[0]);
            return MessageDigest.isEqual(
                sign(scope.getBytes(StandardCharsets.UTF_8)),
                URL_DECODER.decode(parts[1])
            );
        } catch (Exception exception) {
            return false;
        }
    }

    private String guestOrderScope(String orderId, String email, String expiry) {
        return "guest-order|" + orderId + "|"
            + email.trim().toLowerCase(java.util.Locale.ROOT) + "|" + expiry;
    }

    private String encode(Map<String, Object> claims) {
        try {
            String header = URL_ENCODER.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            String payload = URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(claims));
            String unsigned = header + "." + payload;
            return unsigned + "." + URL_ENCODER.encodeToString(sign(unsigned.getBytes(StandardCharsets.US_ASCII)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo access token", exception);
        }
    }

    private byte[] sign(byte[] value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(value);
    }
}
