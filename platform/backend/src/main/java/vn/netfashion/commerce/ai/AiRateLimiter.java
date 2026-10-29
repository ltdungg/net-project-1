package vn.netfashion.commerce.ai;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import vn.netfashion.commerce.common.ApiException;

@Component
public class AiRateLimiter {
    private static final DefaultRedisScript<Long> COUNTER = new DefaultRedisScript<>("""
        local n = redis.call('INCR', KEYS[1])
        if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return n
        """, Long.class);
    private final StringRedisTemplate redis;
    public AiRateLimiter(StringRedisTemplate redis) { this.redis = redis; }

    public void check(String scope, String subject, int maximum, Duration window) {
        Long count;
        try {
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(subject.getBytes(StandardCharsets.UTF_8)));
            count = redis.execute(COUNTER, List.of("ai-rate:" + scope + ":" + hash), Long.toString(window.toSeconds()));
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_LIMIT_UNAVAILABLE", "Trợ lý đang tạm bận. Vui lòng thử lại sau.");
        }
        if (count == null || count > maximum) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMITED", "Bạn đã gửi nhiều yêu cầu. Vui lòng đợi một phút rồi thử lại.");
        }
    }
}
