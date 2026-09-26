package vn.netfashion.commerce.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final AccountService accounts;

    public AccountController(AccountService accounts) { this.accounts = accounts; }

    @GetMapping("/profile")
    ApiEnvelope<Map<String, Object>> profile(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiEnvelope.ok(accounts.profile(principal));
    }

    @PostMapping("/profile")
    ApiEnvelope<Map<String, Object>> updateProfile(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody ProfileRequest request) {
        return ApiEnvelope.ok(accounts.updateProfile(principal, request.fullName(), request.phone(), request.marketingConsent()));
    }

    @GetMapping("/addresses")
    ApiEnvelope<Map<String, Object>> addresses(@AuthenticationPrincipal AuthPrincipal principal) {
        var items = accounts.addresses(principal);
        return ApiEnvelope.ok(Map.of("items", items, "total", items.size()));
    }

    @PostMapping("/addresses")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> createAddress(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiEnvelope.ok(accounts.createAddress(principal, request.command())));
    }

    @PatchMapping("/addresses/{id}")
    ApiEnvelope<Map<String, Object>> updateAddress(@PathVariable String id, @AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody AddressRequest request) {
        return ApiEnvelope.ok(accounts.updateAddress(id, principal, request.command()));
    }

    @DeleteMapping("/addresses/{id}")
    ApiEnvelope<Map<String, Object>> deleteAddress(@PathVariable String id, @AuthenticationPrincipal AuthPrincipal principal) {
        return ApiEnvelope.ok(accounts.deleteAddress(id, principal));
    }

    public record ProfileRequest(
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$") String phone,
        boolean marketingConsent
    ) {}

    public record AddressRequest(
        @NotBlank @Size(max = 50) String label,
        @NotBlank @Size(max = 100) String recipientName,
        @NotBlank @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$") String phone,
        @NotBlank @Size(max = 255) String line1,
        @Size(max = 100) String ward,
        @NotBlank @Size(max = 100) String district,
        @NotBlank @Size(max = 100) String province,
        @Size(max = 20) String postalCode,
        boolean isDefault
    ) {
        AccountService.AddressInput command() {
            return new AccountService.AddressInput(label, recipientName, phone, line1, ward, district, province, postalCode, isDefault);
        }
    }
}
