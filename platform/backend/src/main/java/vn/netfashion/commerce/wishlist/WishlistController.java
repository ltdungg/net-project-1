package vn.netfashion.commerce.wishlist;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/account/wishlist")
public class WishlistController {
    private final WishlistService wishlist;

    public WishlistController(WishlistService wishlist) {
        this.wishlist = wishlist;
    }

    @GetMapping
    ApiEnvelope<Map<String, Object>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiEnvelope.ok(wishlist.list(principal));
    }

    @PostMapping
    ResponseEntity<ApiEnvelope<Map<String, Object>>> add(
        @Valid @RequestBody WishlistRequest request,
        @AuthenticationPrincipal AuthPrincipal principal
    ) {
        Map<String, Object> result = wishlist.add(request.productId(), principal);
        HttpStatus status = Boolean.TRUE.equals(result.get("added")) ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(ApiEnvelope.ok(result));
    }

    @DeleteMapping("/{productId}")
    ApiEnvelope<Map<String, Object>> remove(
        @PathVariable @NotBlank @Size(max = 64) String productId,
        @AuthenticationPrincipal AuthPrincipal principal
    ) {
        return ApiEnvelope.ok(wishlist.remove(productId, principal));
    }

    public record WishlistRequest(@NotBlank @Size(max = 64) String productId) {}
}
