package vn.netfashion.commerce.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.netfashion.commerce.catalog.CatalogService;
import vn.netfashion.commerce.common.ApiException;

class CartServiceTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final CatalogService catalog = mock(CatalogService.class);
    private final CartService carts = new CartService(jdbc, catalog);

    @Test
    void blankGuestTokenReturnsEmptyCartWithoutDatabaseLookup() {
        var cart = carts.cart("  ");

        assertThat(cart).containsEntry("itemCount", 0).containsEntry("grandTotalCents", 0L);
        assertThat((java.util.List<?>) cart.get("items")).isEmpty();
        verifyNoInteractions(jdbc, catalog);
    }

    @Test
    void addRejectsUnavailableVariantBeforeCreatingCart() {
        when(catalog.variant("variant-1")).thenReturn(new CatalogService.VariantRow(
            "variant-1", "product-1", "NET-1", "M", "Black", "#000000", 450_000,
            "Áo Linen", "linen-shirt", null, 1));

        assertThatThrownBy(() -> carts.add(null, "variant-1", 2))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.status()).isEqualTo(HttpStatus.CONFLICT);
                assertThat(error.code()).isEqualTo("INSUFFICIENT_STOCK");
            });
        verifyNoInteractions(jdbc);
    }

}
