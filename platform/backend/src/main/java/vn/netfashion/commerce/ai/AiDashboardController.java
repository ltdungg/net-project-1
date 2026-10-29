package vn.netfashion.commerce.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/admin/ai")
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
public class AiDashboardController {
    private final AiDashboardService dashboards;
    private final AiRateLimiter limits;
    private final AiModelClient model;
    public AiDashboardController(AiDashboardService dashboards, AiRateLimiter limits, AiModelClient model) {
        this.dashboards = dashboards; this.limits = limits; this.model = model;
    }
    @PostMapping("/dashboard")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> generate(@Valid @RequestBody GenerateRequest request, @AuthenticationPrincipal AuthPrincipal actor) {
        if (model.configured()) limits.check("admin", actor.id(), 12, Duration.ofMinutes(1));
        return response(dashboards.generate(request.prompt(), request.days()));
    }
    @GetMapping("/dashboards")
    ResponseEntity<ApiEnvelope<List<Map<String, Object>>>> list(@AuthenticationPrincipal AuthPrincipal actor) { return response(dashboards.list(actor)); }
    @GetMapping("/dashboards/{id}")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> load(@PathVariable String id, @AuthenticationPrincipal AuthPrincipal actor) { return response(dashboards.load(id, actor)); }
    @PostMapping("/dashboards")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> save(@Valid @RequestBody SaveRequest request, @AuthenticationPrincipal AuthPrincipal actor) {
        return response(dashboards.save(new DashboardPlan(request.title(), request.days(), request.widgets()), actor));
    }
    @DeleteMapping("/dashboards/{id}")
    ResponseEntity<ApiEnvelope<Map<String, Boolean>>> delete(@PathVariable String id, @AuthenticationPrincipal AuthPrincipal actor) {
        dashboards.delete(id, actor); return response(Map.of("deleted", true));
    }
    private static <T> ResponseEntity<ApiEnvelope<T>> response(T value) { return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(value)); }
    public record GenerateRequest(@NotBlank @Size(min=2,max=1000) String prompt, @NotNull @Min(1) @Max(90) Integer days) {}
    public record SaveRequest(@NotBlank @Size(max=100) String title, @NotNull @Min(1) @Max(90) Integer days,
            @NotEmpty @Size(max=7) List<@NotBlank @Size(max=30) String> widgets) {}
}
