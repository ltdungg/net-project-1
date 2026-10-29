package vn.netfashion.commerce.admin.insights;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.common.CorrelationIdFilter;
import vn.netfashion.commerce.ai.AdminAiService;
import vn.netfashion.commerce.ai.AiModelClient;
import vn.netfashion.commerce.ai.AiRateLimiter;

@RestController
@RequestMapping("/api/admin")
public class AdminInsightsController {
    private final AdminInsightsService insights;
    private final AdminAiService ai;
    private final AiRateLimiter limits;
    private final AiModelClient model;

    public AdminInsightsController(AdminInsightsService insights, AdminAiService ai, AiRateLimiter limits, AiModelClient model) {
        this.insights = insights;
        this.ai = ai;
        this.limits = limits;
        this.model = model;
    }

    @GetMapping("/promotions")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> promotions() {
        return ApiEnvelope.ok(insights.promotions());
    }

    @PostMapping("/promotions")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> createPromotion(
        @Valid @RequestBody PromotionRequest request,
        @AuthenticationPrincipal AuthPrincipal actor,
        @RequestAttribute(name = CorrelationIdFilter.ATTRIBUTE, required = false) String correlationId
    ) {
        Map<String, Object> created = insights.createPromotion(request.command(), actor, correlationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.ok(created));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<AdminInsightsService.Metrics> metrics() {
        return ApiEnvelope.ok(insights.metrics());
    }

    @PostMapping("/ai")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> ask(@Valid @RequestBody AiRequest request, @AuthenticationPrincipal AuthPrincipal actor) {
        if (model.configured()) limits.check("admin", actor.id(), 12, java.time.Duration.ofMinutes(1));
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(ai.ask(request.prompt())));
    }

    public record PromotionRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Size(max = 500) String description,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_-]{3,40}$") String code,
        @NotBlank @Pattern(regexp = "^(percentage|fixed|free_shipping)$") String type,
        @NotNull @Min(0) @Max(1_000_000_000L) Long value,
        @NotNull @Min(0) @Max(1_000_000_000L) Long minSubtotalCents,
        @Min(0) @Max(1_000_000_000L) Long maxDiscountCents,
        @Min(1) @Max(10_000_000) Integer usageLimit,
        @NotNull @Positive Long startsAt,
        @NotNull @Positive Long endsAt
    ) {
        @AssertTrue(message = "Thời gian kết thúc phải sau thời gian bắt đầu.")
        public boolean isTimeWindowValid() {
            return startsAt == null || endsAt == null || endsAt > startsAt;
        }

        @AssertTrue(message = "Khuyến mãi phần trăm phải nằm trong khoảng 0 đến 100.")
        public boolean isPercentageValueValid() {
            return type == null || value == null || !"percentage".equals(type) || value <= 100;
        }

        AdminInsightsService.PromotionCommand command() {
            return new AdminInsightsService.PromotionCommand(
                name,
                description,
                code,
                type,
                value,
                minSubtotalCents,
                maxDiscountCents,
                usageLimit,
                startsAt,
                endsAt
            );
        }
    }

    public record AiRequest(
        @NotBlank @Size(min = 2, max = 500) String prompt
    ) {}
}
