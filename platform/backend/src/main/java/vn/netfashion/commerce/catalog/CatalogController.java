package vn.netfashion.commerce.catalog;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.common.ApiEnvelope;
import vn.netfashion.commerce.common.Maps;

@RestController
@RequestMapping("/api/products")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) { this.catalog = catalog; }

    @GetMapping
    ApiEnvelope<Map<String, Object>> products(
        @RequestParam(required = false, name = "q") String query,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "false") boolean featured
    ) {
        String normalizedQuery = query == null ? null : query.trim().toLowerCase(Locale.ROOT);
        String normalizedCategory = category == null ? null : category.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> items = catalog.products().stream().filter(product -> {
            if (featured && !Boolean.TRUE.equals(product.get("featured"))) return false;
            if (normalizedCategory != null && !String.valueOf(product.get("category")).toLowerCase(Locale.ROOT).equals(normalizedCategory)) return false;
            if (normalizedQuery == null || normalizedQuery.isBlank()) return true;
            return (product.get("name") + " " + product.get("subtitle") + " " + product.get("material")).toLowerCase(Locale.ROOT).contains(normalizedQuery);
        }).toList();
        return ApiEnvelope.ok(Maps.of("items", items, "total", items.size()));
    }

    @GetMapping("/{slug}")
    ApiEnvelope<Map<String, Object>> product(@PathVariable String slug) {
        return ApiEnvelope.ok(catalog.product(slug));
    }
}
