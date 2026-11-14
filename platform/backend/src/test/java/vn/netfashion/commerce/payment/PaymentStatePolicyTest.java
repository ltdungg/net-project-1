package vn.netfashion.commerce.payment;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentStatePolicyTest {
    @Test
    void webhookCannotReviveCancelledOrderEvenIfLegacyPaymentIsPending() {
        for (String event : new String[] {"payment.succeeded", "payment.failed"}) {
            var decision = PaymentStatePolicy.forWebhook("pending", "pending", event, "cancelled");
            assertThat(decision.rejected()).isTrue();
            assertThat(decision.reason()).isEqualTo("ORDER_ALREADY_CANCELLED");
            assertThat(PaymentStatePolicy.forWebhook("cancelled", "cancelled", event, "cancelled").rejected()).isTrue();
        }
    }

    @Test
    void cancelledPaidOrderCanStillBeRefunded() {
        assertThat(PaymentStatePolicy.forWebhook("succeeded", "paid", "payment.refunded", "cancelled").applies()).isTrue();
    }

    @Test
    void lateFailureCannotDowngradeSucceededPayment() {
        PaymentStatePolicy.Decision decision = PaymentStatePolicy.forWebhook(
            "succeeded",
            "paid",
            "payment.failed", "confirmed"
        );

        assertThat(decision.ignored()).isTrue();
        assertThat(decision.reason()).isEqualTo("STALE_FAILURE_AFTER_SUCCESS");
    }

    @Test
    void refundRequiresBothSucceededPaymentAndPaidOrder() {
        assertThat(PaymentStatePolicy.forWebhook(
            "pending",
            "pending",
            "payment.refunded", "confirmed"
        ).rejected()).isTrue();
        assertThat(PaymentStatePolicy.forWebhook(
            "succeeded",
            "failed",
            "payment.refunded", "confirmed"
        ).rejected()).isTrue();

        PaymentStatePolicy.Decision valid = PaymentStatePolicy.forWebhook(
            "succeeded",
            "paid",
            "payment.refunded", "confirmed"
        );
        assertThat(valid.applies()).isTrue();
        assertThat(valid.targetPaymentStatus()).isEqualTo("refunded");
        assertThat(valid.targetOrderPaymentStatus()).isEqualTo("refunded");
    }

    @Test
    void refundedPaymentIsTerminalForEveryLaterEvent() {
        for (String event : new String[] {
            "payment.succeeded",
            "payment.failed",
            "payment.refunded"
        }) {
            PaymentStatePolicy.Decision decision = PaymentStatePolicy.forWebhook(
                "refunded",
                "refunded",
                event, "confirmed"
            );
            assertThat(decision.ignored()).as(event).isTrue();
            assertThat(decision.reason()).as(event).isEqualTo("PAYMENT_ALREADY_REFUNDED");
        }
    }

    @Test
    void successfulEventCanRecoverAPreviouslyFailedAttempt() {
        PaymentStatePolicy.Decision decision = PaymentStatePolicy.forWebhook(
            "failed",
            "failed",
            "payment.succeeded", "confirmed"
        );

        assertThat(decision.applies()).isTrue();
        assertThat(decision.targetPaymentStatus()).isEqualTo("succeeded");
        assertThat(decision.targetOrderPaymentStatus()).isEqualTo("paid");
    }

    @Test
    void mockConfirmationCannotReviveCancelledOrRefundedPayment() {
        assertThat(PaymentStatePolicy.forMockConfirmation(
            "pending",
            "pending",
            "cancelled"
        ).rejected()).isTrue();
        assertThat(PaymentStatePolicy.forMockConfirmation(
            "refunded",
            "refunded",
            "confirmed"
        ).rejected()).isTrue();
    }

    @Test
    void repeatedMockConfirmationIsAnIgnoredDuplicate() {
        PaymentStatePolicy.Decision decision = PaymentStatePolicy.forMockConfirmation(
            "succeeded",
            "paid",
            "confirmed"
        );

        assertThat(decision.ignored()).isTrue();
        assertThat(decision.reason()).isEqualTo("PAYMENT_ALREADY_SUCCEEDED");
    }
}
