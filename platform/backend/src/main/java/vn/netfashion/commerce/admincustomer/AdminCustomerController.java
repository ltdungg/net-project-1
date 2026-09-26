package vn.netfashion.commerce.admincustomer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.common.CorrelationIdFilter;

@Validated
@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {
    private final AdminCustomerService customers;

    public AdminCustomerController(AdminCustomerService customers) {
        this.customers = customers;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> list(
        @RequestParam(required = false) @Size(max = 120) String search,
        @RequestParam(required = false) @Size(max = 16) String status,
        @RequestParam(required = false) @Size(max = 24) String segment,
        @RequestParam(defaultValue = "25") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return ApiEnvelope.ok(customers.list(search, status, segment, limit, offset));
    }

    @GetMapping("/segments")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> segments() {
        return ApiEnvelope.ok(customers.segments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> detail(@PathVariable @Size(min = 1, max = 64) String id) {
        return ApiEnvelope.ok(customers.detail(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    ApiEnvelope<Map<String, Object>> changeStatus(
        @PathVariable @Size(min = 1, max = 64) String id,
        @Valid @RequestBody StatusRequest request,
        @AuthenticationPrincipal AuthPrincipal actor,
        @RequestAttribute(name = CorrelationIdFilter.ATTRIBUTE, required = false) String correlationId
    ) {
        return ApiEnvelope.ok(customers.changeStatus(id, request.status(), request.reason(), actor, correlationId));
    }

    public record StatusRequest(
        @NotBlank @Pattern(regexp = "^(?i:active|disabled)$") String status,
        @Size(max = AdminCustomerPolicy.MAX_REASON_LENGTH) String reason
    ) {}
}
