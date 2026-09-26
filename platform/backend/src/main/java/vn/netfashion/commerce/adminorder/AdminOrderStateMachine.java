package vn.netfashion.commerce.adminorder;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import vn.netfashion.commerce.common.ApiException;

/**
 * Centralizes the order lifecycle so controllers and transactional services do
 * not each invent their own transition rules.
 */
public final class AdminOrderStateMachine {
    private static final Map<String, Set<String>> TRANSITIONS = transitions();
    private static final Set<String> REASON_REQUIRED = Set.of("cancelled", "returned");

    private AdminOrderStateMachine() {}

    public static boolean isKnown(String status) {
        return status != null && TRANSITIONS.containsKey(status);
    }

    public static boolean canTransition(String fromStatus, String toStatus) {
        return TRANSITIONS.getOrDefault(fromStatus, Set.of()).contains(toStatus);
    }

    public static Set<String> nextStatuses(String status) {
        return TRANSITIONS.getOrDefault(status, Set.of());
    }

    public static void validate(String fromStatus, String toStatus, String reason) {
        if (!isKnown(toStatus)) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "ORDER_STATUS_INVALID",
                "Trạng thái đơn hàng không hợp lệ."
            );
        }
        if (!canTransition(fromStatus, toStatus)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "INVALID_TRANSITION",
                "Không thể chuyển đơn hàng từ " + fromStatus + " sang " + toStatus + "."
            );
        }
        if (REASON_REQUIRED.contains(toStatus) && (reason == null || reason.isBlank())) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "STATUS_REASON_REQUIRED",
                "Cần nhập lý do khi hủy hoặc hoàn trả đơn hàng."
            );
        }
    }

    private static Map<String, Set<String>> transitions() {
        LinkedHashMap<String, Set<String>> values = new LinkedHashMap<>();
        values.put("pending_payment", Set.of("confirmed", "cancelled"));
        values.put("confirmed", Set.of("processing", "cancelled"));
        values.put("processing", Set.of("ready_to_ship", "cancelled"));
        values.put("ready_to_ship", Set.of("shipped", "cancelled"));
        values.put("shipped", Set.of("delivered", "returned"));
        values.put("delivered", Set.of("returned"));
        values.put("cancelled", Set.of());
        values.put("returned", Set.of());
        return Map.copyOf(values);
    }
}
