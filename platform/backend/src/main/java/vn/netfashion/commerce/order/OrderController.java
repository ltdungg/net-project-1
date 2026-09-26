package vn.netfashion.commerce.order;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.auth.JwtAuthenticationFilter;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.common.CorrelationIdFilter;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) { this.orders = orders; }

    @GetMapping
    ApiEnvelope<Map<String, Object>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiEnvelope.ok(orders.list(principal));
    }

    @GetMapping("/{id}")
    ApiEnvelope<Map<String, Object>> detail(@PathVariable String id, @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiEnvelope.ok(orders.detail(id, principal, false));
    }

    @GetMapping("/{id}/guest")
    ApiEnvelope<Map<String, Object>> guestDetail(
        @PathVariable String id,
        @RequestHeader(name = "X-Guest-Order-Token") @Size(max = 200) String token
    ) {
        return ApiEnvelope.ok(orders.guestDetail(id, token));
    }

    @PostMapping
    ResponseEntity<ApiEnvelope<Map<String, Object>>> create(
        @Valid @RequestBody CreateOrderRequest request,
        @AuthenticationPrincipal AuthPrincipal principal,
        HttpServletRequest servletRequest,
        @RequestAttribute(name = JwtAuthenticationFilter.INVALID_CREDENTIAL_ATTRIBUTE, required = false)
        Boolean invalidCredential,
        @RequestAttribute(name = CorrelationIdFilter.ATTRIBUTE, required = false) String correlationId
    ) {
        if (principal == null && Boolean.TRUE.equals(invalidCredential)) {
            throw new ApiException(
                HttpStatus.UNAUTHORIZED,
                "ACCESS_EXPIRED",
                "Phiên đăng nhập đã hết hạn."
            );
        }
        OrderService.CreateOrder command = new OrderService.CreateOrder(
            request.email(), request.phone(), request.customerNote(), request.paymentMethod(), request.voucherCode(), request.idempotencyKey(),
            new OrderService.ShippingAddress(request.shippingAddress().recipientName(), request.shippingAddress().phone(), request.shippingAddress().line1(), request.shippingAddress().ward(), request.shippingAddress().district(), request.shippingAddress().province()),
            request.items().stream().map(item -> new OrderService.OrderItemInput(item.variantId(), item.quantity())).toList()
        );
        Map<String, Object> result = orders.create(command, principal, cartToken(servletRequest), correlationId);
        return ResponseEntity.created(URI.create("/api/orders/" + result.get("id"))).body(ApiEnvelope.ok(result));
    }

    private String cartToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies()).filter(cookie -> "net_cart".equals(cookie.getName())).map(Cookie::getValue).findFirst().orElse(null);
    }

    public record CreateOrderRequest(
        @Email @NotBlank String email,
        @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$") String phone,
        @Size(max = 1000) String customerNote,
        @NotBlank @Pattern(regexp = "^(cod|online)$") String paymentMethod,
        @Size(max = 60) String voucherCode,
        @NotBlank @Size(max = 160) String idempotencyKey,
        @NotNull @Valid ShippingAddressRequest shippingAddress,
        @NotEmpty @Size(max = 50) List<@Valid OrderItemRequest> items
    ) {}
    public record ShippingAddressRequest(
        @NotBlank @Size(max = 100) String recipientName,
        @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$") String phone,
        @NotBlank @Size(max = 255) String line1,
        @Size(max = 100) String ward,
        @NotBlank @Size(max = 100) String district,
        @NotBlank @Size(max = 100) String province
    ) {}
    public record OrderItemRequest(@NotBlank String variantId,@Min(1) @Max(10) int quantity) {}
}
