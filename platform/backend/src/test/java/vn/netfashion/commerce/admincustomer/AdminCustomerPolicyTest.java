package vn.netfashion.commerce.admincustomer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AdminCustomerPolicyTest {
    @Test
    void mapsPublicAndStorageStatusesBothWays() {
        assertEquals("active", AdminCustomerPolicy.toStorageStatus(" ACTIVE "));
        assertEquals("blocked", AdminCustomerPolicy.toStorageStatus("disabled"));
        assertEquals("active", AdminCustomerPolicy.toApiStatus("active"));
        assertEquals("disabled", AdminCustomerPolicy.toApiStatus("blocked"));
        assertEquals("disabled", AdminCustomerPolicy.toApiStatus("disabled"));
        assertEquals("disabled", AdminCustomerPolicy.toApiStatus("locked"));
        assertEquals("pending", AdminCustomerPolicy.toApiStatus("pending"));
    }

    @Test
    void rejectsUnknownStatus() {
        AdminCustomerPolicy.Violation violation = assertThrows(
            AdminCustomerPolicy.Violation.class,
            () -> AdminCustomerPolicy.toStorageStatus("deleted")
        );
        assertEquals("CUSTOMER_STATUS_INVALID", violation.code());
    }

    @Test
    void disablingRequiresReasonAndNormalizesIt() {
        AdminCustomerPolicy.Violation violation = assertThrows(
            AdminCustomerPolicy.Violation.class,
            () -> AdminCustomerPolicy.validateStatusChange("active", "disabled", "  ", "admin", "customer")
        );
        assertEquals("STATUS_REASON_REQUIRED", violation.code());

        AdminCustomerPolicy.StatusChange change = AdminCustomerPolicy.validateStatusChange(
            "active", "disabled", "  Gian lận   thanh toán  ", "admin", "customer"
        );
        assertEquals("Gian lận thanh toán", change.reason());
        assertEquals("blocked", change.targetStorageStatus());
        assertFalse(change.unchanged());
    }

    @Test
    void preventsAdminFromDisablingOwnAccount() {
        AdminCustomerPolicy.Violation violation = assertThrows(
            AdminCustomerPolicy.Violation.class,
            () -> AdminCustomerPolicy.validateStatusChange("active", "disabled", "Kiểm thử", "same", "same")
        );
        assertEquals("CANNOT_DISABLE_SELF", violation.code());
    }

    @Test
    void identicalStatusIsAnIdempotentNoOp() {
        AdminCustomerPolicy.StatusChange change = AdminCustomerPolicy.validateStatusChange(
            "blocked", "disabled", null, "admin", "customer"
        );
        assertTrue(change.unchanged());
        assertEquals("disabled", change.fromApiStatus());
        assertEquals("disabled", change.toApiStatus());
    }

    @Test
    void normalizesSearchAndPaginationBounds() {
        assertNull(AdminCustomerPolicy.normalizeSearch("   "));
        assertEquals("Nguyen Van A", AdminCustomerPolicy.normalizeSearch(" Nguyen   Van A "));
        assertEquals(25, AdminCustomerPolicy.pageSize(0));
        assertEquals(100, AdminCustomerPolicy.pageSize(1_000));
        assertEquals(0, AdminCustomerPolicy.offset(-10));
        assertEquals(30, AdminCustomerPolicy.offset(30));
    }
}
