package vn.netfashion.commerce.payment;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/payments/sepay-sandbox")
public class SepayPaymentController {
    private final SepayPaymentService service;
    public SepayPaymentController(SepayPaymentService service) { this.service = service; }
    @GetMapping("/{orderId}")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> session(@PathVariable String orderId,
            @RequestHeader(name="X-Guest-Order-Token", required=false) String token, @AuthenticationPrincipal AuthPrincipal actor) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(service.session(orderId, token, actor)));
    }
    @PostMapping("/{orderId}/check")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> check(@PathVariable String orderId,
            @RequestHeader(name="X-Guest-Order-Token", required=false) String token, @AuthenticationPrincipal AuthPrincipal actor) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(ApiEnvelope.ok(service.check(orderId, token, actor)));
    }
}
