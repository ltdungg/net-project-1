package vn.netfashion.commerce.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class IdempotencyKeysTest {
    @Test
    void isDeterministicAndFixedLength() {
        String first = IdempotencyKeys.scoped("checkout", "user:user-1", "request-123");
        String replay = IdempotencyKeys.scoped("checkout", "user:user-1", "request-123");

        assertThat(first).isEqualTo(replay).hasSize(64).matches("[0-9a-f]{64}");
    }

    @Test
    void separatesOperationsOwnersAndClientKeys() {
        String base = IdempotencyKeys.scoped("checkout", "user:user-1", "request-123");

        assertThat(IdempotencyKeys.scoped("payment", "user:user-1", "request-123")).isNotEqualTo(base);
        assertThat(IdempotencyKeys.scoped("checkout", "user:user-2", "request-123")).isNotEqualTo(base);
        assertThat(IdempotencyKeys.scoped("checkout", "user:user-1", "request-456")).isNotEqualTo(base);
    }

    @Test
    void rejectsBlankComponents() {
        assertThatThrownBy(() -> IdempotencyKeys.scoped("checkout", "", "request-123"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
