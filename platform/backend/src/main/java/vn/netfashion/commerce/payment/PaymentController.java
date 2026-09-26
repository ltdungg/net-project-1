package vn.netfashion.commerce.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
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

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/mock/confirm")
    ApiEnvelope<Map<String, Object>> confirmMockPayment(
        @Valid @RequestBody ConfirmMockPaymentRequest request,
        @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return ApiEnvelope.ok(payments.confirmMockPayment(request.orderId(), request.guestAccessToken(), principal));
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
        @Size(max = 200) String guestAccessToken
    ) {}
}
