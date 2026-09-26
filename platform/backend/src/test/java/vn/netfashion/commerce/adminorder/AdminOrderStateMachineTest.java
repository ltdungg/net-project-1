package vn.netfashion.commerce.adminorder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import vn.netfashion.commerce.common.ApiException;

class AdminOrderStateMachineTest {
    @Test
    void acceptsEveryDeclaredTransition() {
        Map<String, Set<String>> expected = Map.of(
            "pending_payment", Set.of("confirmed", "cancelled"),
            "confirmed", Set.of("processing", "cancelled"),
            "processing", Set.of("ready_to_ship", "cancelled"),
            "ready_to_ship", Set.of("shipped", "cancelled"),
            "shipped", Set.of("delivered", "returned"),
            "delivered", Set.of("returned"),
            "cancelled", Set.of(),
            "returned", Set.of()
        );

        expected.forEach((from, targets) -> {
            assertEquals(targets, AdminOrderStateMachine.nextStatuses(from));
            targets.forEach(to -> assertTrue(AdminOrderStateMachine.canTransition(from, to)));
        });
    }

    @Test
    void rejectsSkippedAndBackwardTransitions() {
        assertFalse(AdminOrderStateMachine.canTransition("pending_payment", "shipped"));
        assertFalse(AdminOrderStateMachine.canTransition("processing", "confirmed"));
        assertFalse(AdminOrderStateMachine.canTransition("delivered", "shipped"));

        ApiException exception = assertThrows(
            ApiException.class,
            () -> AdminOrderStateMachine.validate("confirmed", "delivered", "")
        );
        assertEquals(HttpStatus.CONFLICT, exception.status());
        assertEquals("INVALID_TRANSITION", exception.code());
    }

    @Test
    void terminalStatusesHaveNoOutgoingTransition() {
        assertTrue(AdminOrderStateMachine.nextStatuses("cancelled").isEmpty());
        assertTrue(AdminOrderStateMachine.nextStatuses("returned").isEmpty());
        assertFalse(AdminOrderStateMachine.canTransition("cancelled", "confirmed"));
        assertFalse(AdminOrderStateMachine.canTransition("returned", "processing"));
    }

    @Test
    void cancellationAndReturnRequireAReason() {
        ApiException cancelled = assertThrows(
            ApiException.class,
            () -> AdminOrderStateMachine.validate("confirmed", "cancelled", "  ")
        );
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, cancelled.status());
        assertEquals("STATUS_REASON_REQUIRED", cancelled.code());

        ApiException returned = assertThrows(
            ApiException.class,
            () -> AdminOrderStateMachine.validate("delivered", "returned", null)
        );
        assertEquals("STATUS_REASON_REQUIRED", returned.code());

        AdminOrderStateMachine.validate("confirmed", "cancelled", "Khách yêu cầu hủy");
        AdminOrderStateMachine.validate("delivered", "returned", "Sản phẩm lỗi");
    }

    @Test
    void rejectsUnknownTargetStatus() {
        ApiException exception = assertThrows(
            ApiException.class,
            () -> AdminOrderStateMachine.validate("confirmed", "deleted", "")
        );
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, exception.status());
        assertEquals("ORDER_STATUS_INVALID", exception.code());
        assertFalse(AdminOrderStateMachine.isKnown("deleted"));
    }
}
