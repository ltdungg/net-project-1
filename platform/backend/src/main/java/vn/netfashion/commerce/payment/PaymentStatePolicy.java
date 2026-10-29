package vn.netfashion.commerce.payment;

final class PaymentStatePolicy {
    private PaymentStatePolicy() {}

    static Decision forWebhook(
        String currentPaymentStatus,
        String currentOrderPaymentStatus,
        String eventType
    ) {
        if ("refunded".equals(currentPaymentStatus)
            || "refunded".equals(currentOrderPaymentStatus)) {
            return Decision.ignore("PAYMENT_ALREADY_REFUNDED");
        }

        return switch (eventType) {
            case "payment.succeeded" -> successfulPayment(
                currentPaymentStatus,
                currentOrderPaymentStatus
            );
            case "payment.failed" -> failedPayment(
                currentPaymentStatus,
                currentOrderPaymentStatus
            );
            case "payment.refunded" -> refundedPayment(
                currentPaymentStatus,
                currentOrderPaymentStatus
            );
            default -> Decision.reject("UNSUPPORTED_PAYMENT_EVENT");
        };
    }

    static Decision forMockConfirmation(
        String currentPaymentStatus,
        String currentOrderPaymentStatus,
        String currentOrderStatus
    ) {
        return forMockOutcome(currentPaymentStatus, currentOrderPaymentStatus, currentOrderStatus, "succeeded");
    }

    static Decision forMockOutcome(String currentPaymentStatus, String currentOrderPaymentStatus, String currentOrderStatus, String outcome) {
        if ("cancelled".equals(currentOrderStatus)) {
            return Decision.reject("ORDER_ALREADY_CANCELLED");
        }
        if ("refunded".equals(currentPaymentStatus)
            || "refunded".equals(currentOrderPaymentStatus)) {
            return Decision.reject("PAYMENT_ALREADY_REFUNDED");
        }
        return switch (outcome) {
            case "succeeded" -> successfulPayment(currentPaymentStatus, currentOrderPaymentStatus);
            case "failed" -> failedPayment(currentPaymentStatus, currentOrderPaymentStatus);
            default -> Decision.reject("INVALID_MOCK_OUTCOME");
        };
    }

    private static Decision successfulPayment(
        String currentPaymentStatus,
        String currentOrderPaymentStatus
    ) {
        if ("succeeded".equals(currentPaymentStatus)
            && "paid".equals(currentOrderPaymentStatus)) {
            return Decision.ignore("PAYMENT_ALREADY_SUCCEEDED");
        }
        return Decision.apply("succeeded", "paid");
    }

    private static Decision failedPayment(
        String currentPaymentStatus,
        String currentOrderPaymentStatus
    ) {
        if ("succeeded".equals(currentPaymentStatus)
            || "paid".equals(currentOrderPaymentStatus)) {
            return Decision.ignore("STALE_FAILURE_AFTER_SUCCESS");
        }
        if ("failed".equals(currentPaymentStatus)
            && "failed".equals(currentOrderPaymentStatus)) {
            return Decision.ignore("PAYMENT_ALREADY_FAILED");
        }
        return Decision.apply("failed", "failed");
    }

    private static Decision refundedPayment(
        String currentPaymentStatus,
        String currentOrderPaymentStatus
    ) {
        if (!"succeeded".equals(currentPaymentStatus)
            || !"paid".equals(currentOrderPaymentStatus)) {
            return Decision.reject("REFUND_REQUIRES_SUCCEEDED_PAYMENT");
        }
        return Decision.apply("refunded", "refunded");
    }

    enum Action {
        APPLY,
        IGNORE,
        REJECT
    }

    record Decision(
        Action action,
        String targetPaymentStatus,
        String targetOrderPaymentStatus,
        String reason
    ) {
        static Decision apply(String paymentStatus, String orderPaymentStatus) {
            return new Decision(Action.APPLY, paymentStatus, orderPaymentStatus, null);
        }

        static Decision ignore(String reason) {
            return new Decision(Action.IGNORE, null, null, reason);
        }

        static Decision reject(String reason) {
            return new Decision(Action.REJECT, null, null, reason);
        }

        boolean applies() {
            return action == Action.APPLY;
        }

        boolean ignored() {
            return action == Action.IGNORE;
        }

        boolean rejected() {
            return action == Action.REJECT;
        }
    }
}
