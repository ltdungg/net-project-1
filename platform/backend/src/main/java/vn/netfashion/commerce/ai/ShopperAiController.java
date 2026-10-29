package vn.netfashion.commerce.ai;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/ai")
public class ShopperAiController {
    private final ShopperAiService service;
    private final AiRateLimiter limits;
    private final AiModelClient model;
    public ShopperAiController(ShopperAiService service, AiRateLimiter limits, AiModelClient model) {
        this.service = service; this.limits = limits; this.model = model;
    }

    @GetMapping("/status")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> status() {
        // Configuration presence only, not a claim that the provider/key is healthy.
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(ApiEnvelope.ok(Map.of("provider", "gemini", "configured", model.configured())));
    }

    @PostMapping("/recommendations")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> recommendations(@Valid @RequestBody RecommendationRequest body,
            @AuthenticationPrincipal AuthPrincipal actor, @CookieValue(name="net_cart", required=false) String cart) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(Map.of(
            "items", service.recommend(body.currentSlug(), body.recentIds(), body.favoriteIds(), actor, cart, "", 4),
            "mode", "personalized", "generatedAt", Instant.now().toString())));
    }

    @PostMapping("/chat")
    ResponseEntity<ApiEnvelope<ShopperAiService.ChatReply>> chat(@Valid @RequestBody ChatRequest body,
            @AuthenticationPrincipal AuthPrincipal actor, @CookieValue(name="net_cart", required=false) String cart,
            HttpServletRequest request) {
        // The network address comes from the trusted reverse proxy; never use a body-supplied identity.
        if (model.configured()) limits.check("chat", actor == null ? request.getRemoteAddr() : actor.id(), 12, Duration.ofMinutes(1));
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(service.chat(body, actor, cart)));
    }

    public record RecommendationRequest(@Size(max=160) String currentSlug,
            @Size(max=20) List<@NotBlank @Size(max=64) String> recentIds,
            @Size(max=50) List<@NotBlank @Size(max=64) String> favoriteIds) {
        public RecommendationRequest { recentIds = recentIds == null ? List.of() : List.copyOf(recentIds); favoriteIds = favoriteIds == null ? List.of() : List.copyOf(favoriteIds); }
    }
    public record ChatRequest(@NotBlank @Size(min=2, max=1000) String message,
            @Size(max=6) List<@NotBlank @Size(max=1000) String> previousQuestions,
            @Size(max=160) String currentSlug,
            @Size(max=20) List<@NotBlank @Size(max=64) String> recentIds,
            @Size(max=50) List<@NotBlank @Size(max=64) String> favoriteIds) {
        public ChatRequest {
            previousQuestions = previousQuestions == null ? List.of() : List.copyOf(previousQuestions);
            recentIds = recentIds == null ? List.of() : List.copyOf(recentIds);
            favoriteIds = favoriteIds == null ? List.of() : List.copyOf(favoriteIds);
        }
    }
}
