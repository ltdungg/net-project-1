package vn.netfashion.commerce.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class AdminCatalogValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsValidInitialVariantAndOptionalCompareAtPrice() {
        var request = variant(499_000, 599_000L, "#ffffff");
        assertThat(validator.validate(request)).isEmpty();
        assertThat(validator.validate(variant(499_000, null, "#ffffff"))).isEmpty();
    }

    @Test
    void rejectsCompareAtBelowSalePriceMalformedColorAndOutOfRangeStock() {
        assertThat(validator.validate(variant(499_000, 400_000L, "#ffffff")))
            .extracting(v -> v.getPropertyPath().toString()).contains("compareAtPriceValid");
        assertThat(validator.validate(variant(499_000, null, "#fff"))).isNotEmpty();
        var invalidStock = new AdminCatalogController.InitialVariantRequest(
            "SKU-1", "S", "White", "#ffffff", 499_000, null, "wh", 1_000_001, 0, 0
        );
        assertThat(validator.validate(invalidStock)).isNotEmpty();
    }

    private AdminCatalogController.InitialVariantRequest variant(long price, Long compareAt, String color) {
        return new AdminCatalogController.InitialVariantRequest(
            "SKU-1", "S", "White", color, price, compareAt, "wh", 0, 0, 0
        );
    }
}
