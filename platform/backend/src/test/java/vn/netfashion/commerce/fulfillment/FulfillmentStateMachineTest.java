package vn.netfashion.commerce.fulfillment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import vn.netfashion.commerce.common.ApiException;

class FulfillmentStateMachineTest {
    @Test
    void exposesOperationalHappyPath() {
        assertTrue(FulfillmentStateMachine.canTransition("pending", "processing"));
        assertTrue(FulfillmentStateMachine.canTransition("processing", "ready_to_ship"));
        assertTrue(FulfillmentStateMachine.canTransition("ready_to_ship", "shipped"));
        assertTrue(FulfillmentStateMachine.canTransition("shipped", "delivered"));
    }

    @Test
    void rejectsSkippingRequiredSteps() {
        ApiException error = assertThrows(
            ApiException.class,
            () -> FulfillmentStateMachine.validate("pending", "shipped", null)
        );
        assertEquals("FULFILLMENT_TRANSITION_INVALID", error.code());
    }

    @Test
    void requiresReasonForExceptions() {
        ApiException error = assertThrows(
            ApiException.class,
            () -> FulfillmentStateMachine.validate("shipped", "failed", " ")
        );
        assertEquals("FULFILLMENT_REASON_REQUIRED", error.code());
        FulfillmentStateMachine.validate("shipped", "failed", "Khách hẹn lại ngày giao");
    }
}
