package vn.netfashion.commerce.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import vn.netfashion.commerce.common.ApiException;

class AuthRateLimiterTest {
    @Test
    void setsExpiryOnFirstAttemptAndRejectsAttemptsAboveLimit() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked") ValueOperations<String, String> values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        when(values.increment(anyString())).thenReturn(1L, 3L);
        AuthRateLimiter limiter = new AuthRateLimiter(redis);

        limiter.check("login", "member@example.com", 2, Duration.ofMinutes(5));
        verify(redis).expire(anyString(), org.mockito.ArgumentMatchers.eq(Duration.ofMinutes(5)));
        assertThatThrownBy(() -> limiter.check("login", "member@example.com", 2, Duration.ofMinutes(5)))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                org.assertj.core.api.Assertions.assertThat(error.code()).isEqualTo("AUTH_RATE_LIMITED");
                org.assertj.core.api.Assertions.assertThat(error.details()).isEqualTo(java.util.Map.of("retryAfterSeconds", 300L));
            });
    }

    @Test
    void failsOpenWhenRedisIsUnavailable() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.opsForValue()).thenThrow(new DataAccessResourceFailureException("offline"));
        assertThatCode(() -> new AuthRateLimiter(redis).check("login", null, 1, Duration.ofMinutes(1)))
            .doesNotThrowAnyException();
    }
}
