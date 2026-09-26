package vn.netfashion.commerce.cart;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class VoucherPolicyTest {
    @Test
    void percentageDiscountHonorsMaximumAndSubtotal() {
        assertThat(VoucherPolicy.discount("percentage", 20, 150_000L, 1_000_000L))
            .isEqualTo(150_000L);
        assertThat(VoucherPolicy.discount("percentage", 100, null, 420_000L))
            .isEqualTo(420_000L);
    }

    @Test
    void fixedDiscountCannotMakeOrderNegative() {
        assertThat(VoucherPolicy.discount("fixed", 500_000L, null, 300_000L))
            .isEqualTo(300_000L);
    }

    @Test
    void freeShippingAndThresholdAreAppliedAtBoundary() {
        VoucherPolicy.Totals below = VoucherPolicy.totals(
            VoucherPolicy.FREE_SHIPPING_THRESHOLD - 1,
            null
        );
        VoucherPolicy.Totals threshold = VoucherPolicy.totals(
            VoucherPolicy.FREE_SHIPPING_THRESHOLD,
            null
        );
        VoucherPolicy.Evaluation voucher = new VoucherPolicy.Evaluation(
            true, "promotion", "coupon", "SHIP", "Miễn phí", "", 0, true
        );

        assertThat(below.shippingCents()).isEqualTo(VoucherPolicy.STANDARD_SHIPPING);
        assertThat(threshold.shippingCents()).isZero();
        assertThat(VoucherPolicy.totals(200_000L, voucher).shippingCents()).isZero();
    }

    @Test
    void invalidEvaluationNeverChangesTotals() {
        VoucherPolicy.Evaluation invalid = new VoucherPolicy.Evaluation(
            false, null, null, "BAD", null, "Không hợp lệ", 99_000L, true
        );
        VoucherPolicy.Totals totals = VoucherPolicy.totals(300_000L, invalid);

        assertThat(totals.discountCents()).isZero();
        assertThat(totals.shippingCents()).isEqualTo(VoucherPolicy.STANDARD_SHIPPING);
        assertThat(totals.grandTotalCents()).isEqualTo(335_000L);
    }
}
