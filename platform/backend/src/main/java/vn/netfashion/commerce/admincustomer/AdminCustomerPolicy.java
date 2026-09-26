package vn.netfashion.commerce.admincustomer;

import java.util.Locale;
import java.util.Set;

final class AdminCustomerPolicy {
    static final int MAX_PAGE_SIZE = 100;
    static final int DEFAULT_PAGE_SIZE = 25;
    static final int MAX_REASON_LENGTH = 300;
    private static final Set<String> API_STATUSES = Set.of("active", "disabled", "pending");

    private AdminCustomerPolicy() {}

    static String normalizeSearch(String value) {
        if (value == null) return null;
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    static String normalizeStatusFilter(String value) {
        if (value == null || value.isBlank()) return null;
        return requireApiStatus(value);
    }

    static int pageSize(int requested) {
        if (requested <= 0) return DEFAULT_PAGE_SIZE;
        return Math.min(requested, MAX_PAGE_SIZE);
    }

    static int offset(int requested) {
        return Math.max(0, requested);
    }

    static StatusChange validateStatusChange(
        String currentStorageStatus,
        String requestedApiStatus,
        String reasonValue,
        String actorId,
        String customerId
    ) {
        String targetApiStatus = requireApiStatus(requestedApiStatus);
        if ("deleted".equals(currentStorageStatus)) {
            throw new Violation("CUSTOMER_DELETED", "Không thể thay đổi tài khoản đã bị xóa.");
        }

        String targetStorageStatus = toStorageStatus(targetApiStatus);
        boolean unchanged = currentStorageStatus.equals(targetStorageStatus);
        if (!unchanged && "blocked".equals(targetStorageStatus) && actorId.equals(customerId)) {
            throw new Violation("CANNOT_DISABLE_SELF", "Quản trị viên không thể tự vô hiệu hóa tài khoản của mình.");
        }

        String reason = normalizeReason(reasonValue);
        if (reason != null && reason.length() > MAX_REASON_LENGTH) {
            throw new Violation("STATUS_REASON_TOO_LONG", "Lý do không được vượt quá 300 ký tự.");
        }
        if (!unchanged && "blocked".equals(targetStorageStatus) && reason == null) {
            throw new Violation("STATUS_REASON_REQUIRED", "Cần nhập lý do khi vô hiệu hóa khách hàng.");
        }
        return new StatusChange(
            toApiStatus(currentStorageStatus),
            targetApiStatus,
            targetStorageStatus,
            reason,
            unchanged
        );
    }

    static String toStorageStatus(String apiStatus) {
        return switch (requireApiStatus(apiStatus)) {
            case "active" -> "active";
            case "disabled" -> "blocked";
            case "pending" -> "pending";
            default -> throw new IllegalStateException("Trạng thái API chưa được ánh xạ.");
        };
    }

    static String toApiStatus(String storageStatus) {
        return switch (storageStatus) {
            case "active" -> "active";
            case "blocked", "disabled", "locked" -> "disabled";
            case "pending" -> "pending";
            default -> throw new Violation("CUSTOMER_STATUS_INVALID", "Trạng thái khách hàng không hợp lệ.");
        };
    }

    private static String requireApiStatus(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!API_STATUSES.contains(normalized)) {
            throw new Violation("CUSTOMER_STATUS_INVALID", "Trạng thái phải là active, disabled hoặc pending.");
        }
        return normalized;
    }

    private static String normalizeReason(String value) {
        if (value == null) return null;
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    record StatusChange(
        String fromApiStatus,
        String toApiStatus,
        String targetStorageStatus,
        String reason,
        boolean unchanged
    ) {}

    static final class Violation extends IllegalArgumentException {
        private final String code;

        Violation(String code, String message) {
            super(message);
            this.code = code;
        }

        String code() {
            return code;
        }
    }
}
