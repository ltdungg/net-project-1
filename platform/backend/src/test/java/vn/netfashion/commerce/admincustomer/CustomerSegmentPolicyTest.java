package vn.netfashion.commerce.admincustomer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class CustomerSegmentPolicyTest {
    @Test
    void exposesStableBusinessSegmentsInPriorityOrder() {
        assertThat(CustomerSegmentPolicy.definitions())
            .extracting(CustomerSegmentPolicy.Definition::code)
            .containsExactly("at_risk", "vip", "loyal", "new", "potential", "prospect");
    }

    @Test
    void normalizesKnownSegmentAndRejectsUnknownValue() {
        assertThat(CustomerSegmentPolicy.normalize(" VIP ")).isEqualTo("vip");
        assertThat(CustomerSegmentPolicy.normalize(null)).isNull();
        assertThatThrownBy(() -> CustomerSegmentPolicy.normalize("diamond"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("không hợp lệ");
    }
}
