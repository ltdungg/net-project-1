package vn.netfashion.commerce.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import vn.netfashion.commerce.common.ApiException;

@Component
public class AuthRateLimiter {
    private static final Logger LOG = LoggerFactory.getLogger(AuthRateLimiter.class);
    private final StringRedisTemplate redis;

    public AuthRateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void check(String action, String subject, int maximumAttempts, Duration window) {
        String key = "auth-rate:" + action + ':' + sha256(subject == null ? "unknown" : subject);
        Long attempts;
        try {
            attempts = redis.opsForValue().increment(key);
            if (attempts != null && attempts == 1L) redis.expire(key, window);
        } catch (DataAccessException exception) {
            LOG.warn("Auth rate limiter unavailable for action {}", action);
            return;
        }
        if (attempts != null && attempts > maximumAttempts) {
            throw new ApiException(
                HttpStatus.TOO_MANY_REQUESTS,
                "AUTH_RATE_LIMITED",
                "Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.",
                Map.of("retryAfterSeconds", window.toSeconds())
            );
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }
}
