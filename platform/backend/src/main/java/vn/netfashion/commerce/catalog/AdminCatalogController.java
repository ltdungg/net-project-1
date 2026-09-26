package vn.netfashion.commerce.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.common.CorrelationIdFilter;

@RestController
@RequestMapping("/api/admin/products")
public class AdminCatalogController {
    private final CatalogService catalog;
    private final AccountService accounts;

    public AdminCatalogController(CatalogService catalog, AccountService accounts) {
        this.catalog = catalog;
        this.accounts = accounts;
    }

    @GetMapping
    ApiEnvelope<Map<String, Object>> products() {
        var items = catalog.adminProducts();
        return ApiEnvelope.ok(Map.of("items", items, "total", items.size()));
    }

    @GetMapping("/options")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> options() {
        return ApiEnvelope.ok(catalog.adminOptions());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> create(
        @Valid @RequestBody ProductRequest request,
        @AuthenticationPrincipal AuthPrincipal actor,
        @RequestAttribute(name = CorrelationIdFilter.ATTRIBUTE, required = false) String correlationId
    ) {
        accounts.ensure(actor);
        CatalogService.InitialVariant variant = request.initialVariant() == null ? null : request.initialVariant().command();
        var result = catalog.createAdminProduct(new CatalogService.AdminCreateProduct(
            request.name(), request.slug(), request.subtitle(), request.description(), request.material(), request.status(),
            request.featured(), request.categoryId(), variant
        ), actor == null ? null : actor.id(), correlationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.ok(result));
    }

    @PostMapping("/{id}/media")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ResponseEntity<ApiEnvelope<Map<String, Object>>> media(@PathVariable String id, @Valid @RequestBody MediaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiEnvelope.ok(catalog.addMedia(id, request.publicUrl(), request.storageKey(), request.altText())));
    }

    public record ProductRequest(
        @NotBlank @Size(min = 2, max = 160) String name,
        @NotBlank @Pattern(regexp = "^[a-z0-9-]+$") @Size(max = 180) String slug,
        @Size(max = 180) String subtitle,
        @NotBlank @Size(min = 20, max = 5000) String description,
        @Size(max = 300) String material,
        @NotBlank @Pattern(regexp = "^(draft|active|archived)$") String status,
        boolean featured,
        @Size(max = 64) String categoryId,
        @Valid InitialVariantRequest initialVariant
    ) {}

    public record InitialVariantRequest(
        @NotBlank @Size(min = 3, max = 80) String sku,
        @NotBlank @Size(max = 40) String size,
        @NotBlank @Size(max = 80) String color,
        @NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String colorHex,
        @Min(1000) @Max(1_000_000_000L) long priceCents,
        @Min(1000) @Max(1_000_000_000L) Long compareAtPriceCents,
        @NotBlank @Size(max = 64) String warehouseId,
        @Min(0) @Max(1_000_000) int openingStock,
        @Min(0) @Max(100_000) int safetyStock,
        @Min(0) @Max(100_000) int reorderPoint
    ) {
        @AssertTrue(message = "Giá so sánh phải lớn hơn hoặc bằng giá bán.")
        public boolean isCompareAtPriceValid() {
            return compareAtPriceCents == null || compareAtPriceCents >= priceCents;
        }

        CatalogService.InitialVariant command() {
            return new CatalogService.InitialVariant(sku, size, color, colorHex, priceCents, compareAtPriceCents,
                warehouseId, openingStock, safetyStock, reorderPoint);
        }
    }

    public record MediaRequest(
        @NotBlank @Size(min = 3, max = 500) String storageKey,
        @NotBlank @Size(max = 1000) String publicUrl,
        @NotBlank @Size(min = 2, max = 200) String altText
    ) {}
}
