package vn.netfashion.commerce.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService payments;
    private final SepaySandboxProperties sepay;

    public PaymentController(PaymentService payments, SepaySandboxProperties sepay) {
        this.payments = payments;
        this.sepay = sepay;
    }

    @GetMapping("/config")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> config() {
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(ApiEnvelope.ok(Map.of("provider", "mockpay", "mockEnabled", payments.mockEnabled(), "sepaySandboxEnabled", sepay.configured())));
    }

    @PostMapping("/mock/confirm")
    ApiEnvelope<Map<String, Object>> confirmMockPayment(
        @Valid @RequestBody ConfirmMockPaymentRequest request,
        @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return ApiEnvelope.ok(payments.simulateMockPayment(request.orderId(), request.guestAccessToken(), principal, request.outcome()));
    }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    ApiEnvelope<Map<String, Object>> webhook(
        @RequestBody byte[] rawBody,
        @RequestHeader(value = "x-provider-signature", required = false) String signature
    ) {
        return ApiEnvelope.ok(payments.processWebhook(rawBody, signature));
    }

    public record ConfirmMockPaymentRequest(
        @NotBlank
        @Pattern(
            regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
            message = "orderId phải là UUID hợp lệ"
        )
        String orderId,
        @Size(max = 200) String guestAccessToken,
        @Pattern(regexp = "^(succeeded|failed)$") String outcome
    ) {
        public ConfirmMockPaymentRequest { outcome = outcome == null ? "succeeded" : outcome; }
    }
}
