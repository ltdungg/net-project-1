package vn.netfashion.commerce.cart;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
public class CartController {
    private final CartService carts;

    public CartController(CartService carts) { this.carts = carts; }

    @GetMapping("/api/cart")
    ApiEnvelope<Map<String, Object>> cart(HttpServletRequest request) {
        return ApiEnvelope.ok(carts.cart(token(request)));
    }

    @PostMapping("/api/cart")
    ApiEnvelope<Map<String, Object>> add(@Valid @RequestBody ItemRequest body, HttpServletRequest request, HttpServletResponse response) {
        CartService.CartMutation result = carts.add(token(request), body.variantId(), body.quantity());
        if (result.newToken()) {
            response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("net_cart", result.token()).httpOnly(true).sameSite("Lax").path("/").maxAge(Duration.ofDays(30)).build().toString());
        }
        return ApiEnvelope.ok(result.data());
    }

    @PatchMapping("/api/cart/items/{id}")
    ApiEnvelope<Map<String, Object>> update(@PathVariable String id, @Valid @RequestBody QuantityRequest body, HttpServletRequest request) {
        return ApiEnvelope.ok(carts.update(token(request), id, body.quantity()));
    }

    @DeleteMapping("/api/cart/items/{id}")
    ApiEnvelope<Map<String, Object>> remove(@PathVariable String id, HttpServletRequest request) {
        return ApiEnvelope.ok(carts.remove(token(request), id));
    }

    @PostMapping("/api/vouchers")
    ApiEnvelope<Map<String, Object>> voucher(@Valid @RequestBody VoucherRequest body, HttpServletRequest request) {
        return ApiEnvelope.ok(carts.applyVoucher(token(request), body.code()));
    }

    @DeleteMapping("/api/vouchers")
    ApiEnvelope<Map<String, Object>> removeVoucher(HttpServletRequest request) {
        return ApiEnvelope.ok(carts.removeVoucher(token(request)));
    }

    private String token(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies()).filter(cookie -> "net_cart".equals(cookie.getName())).map(Cookie::getValue).findFirst().orElse(null);
    }

    public record ItemRequest(@NotBlank String variantId,@Min(1) @Max(10) int quantity) {}
    public record QuantityRequest(@Min(1) @Max(10) int quantity) {}
    public record VoucherRequest(@NotBlank String code) {}
}
