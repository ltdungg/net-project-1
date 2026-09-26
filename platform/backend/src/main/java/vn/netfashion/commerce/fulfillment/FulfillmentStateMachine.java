package vn.netfashion.commerce.fulfillment;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import vn.netfashion.commerce.common.ApiException;

/** Quy tắc vòng đời của từng phiếu giao hàng. */
public final class FulfillmentStateMachine {
    private static final Map<String, Set<String>> TRANSITIONS = transitions();
    private static final Set<String> REASON_REQUIRED = Set.of("failed", "returned", "cancelled");

    private FulfillmentStateMachine() {}

    public static boolean isKnown(String status) {
        return status != null && TRANSITIONS.containsKey(status);
    }

    public static Set<String> nextStatuses(String status) {
        return TRANSITIONS.getOrDefault(status, Set.of());
    }

    public static boolean canTransition(String fromStatus, String toStatus) {
        return TRANSITIONS.getOrDefault(fromStatus, Set.of()).contains(toStatus);
    }

    public static void validate(String fromStatus, String toStatus, String reason) {
        if (!isKnown(toStatus)) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "FULFILLMENT_STATUS_INVALID",
                "Trạng thái vận chuyển không hợp lệ."
            );
        }
        if (!canTransition(fromStatus, toStatus)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "FULFILLMENT_TRANSITION_INVALID",
                "Không thể chuyển phiếu giao từ " + fromStatus + " sang " + toStatus + "."
            );
        }
        if (REASON_REQUIRED.contains(toStatus) && (reason == null || reason.isBlank())) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "FULFILLMENT_REASON_REQUIRED",
                "Cần nhập lý do khi giao thất bại, hủy hoặc hoàn hàng."
            );
        }
    }

    private static Map<String, Set<String>> transitions() {
        LinkedHashMap<String, Set<String>> values = new LinkedHashMap<>();
        values.put("pending", Set.of("processing", "cancelled"));
        values.put("processing", Set.of("ready_to_ship", "failed", "cancelled"));
        values.put("ready_to_ship", Set.of("shipped", "failed", "cancelled"));
        values.put("shipped", Set.of("delivered", "failed", "returned"));
        values.put("failed", Set.of("processing", "shipped", "returned", "cancelled"));
        values.put("delivered", Set.of("returned"));
        values.put("returned", Set.of());
        values.put("cancelled", Set.of());
        return Map.copyOf(values);
    }
}
