package vn.netfashion.commerce.adminorder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
    private final AdminOrderService orders;

    public AdminOrderController(AdminOrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    ApiEnvelope<Map<String, Object>> list(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return ApiEnvelope.ok(orders.list(status, limit, offset));
    }

    @GetMapping("/{id}")
    ApiEnvelope<Map<String, Object>> detail(@PathVariable String id) {
        return ApiEnvelope.ok(orders.detail(id));
    }

    @PatchMapping("/{id}/status")
    ApiEnvelope<Map<String, Object>> changeStatus(
        @PathVariable String id,
        @Valid @RequestBody StatusRequest request,
        @AuthenticationPrincipal AuthPrincipal actor,
        @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        return ApiEnvelope.ok(orders.changeStatus(id, request.command(), actor, correlationId));
    }

    public record StatusRequest(
        @NotBlank
        @Pattern(regexp = "^(confirmed|processing|ready_to_ship|shipped|delivered|cancelled|returned)$")
        String status,
        @Size(max = 500) String reason
    ) {
        AdminOrderService.StatusChange command() {
            return new AdminOrderService.StatusChange(status, reason);
        }
    }
}
