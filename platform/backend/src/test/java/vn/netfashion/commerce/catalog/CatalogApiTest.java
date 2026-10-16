package vn.netfashion.commerce.catalog;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.GlobalExceptionHandler;
import org.springframework.http.HttpStatus;

class CatalogApiTest {
    private CatalogService catalog;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        catalog = mock(CatalogService.class);
        mvc = MockMvcBuilders.standaloneSetup(new CatalogController(catalog))
            .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void listingCombinesCaseInsensitiveSearchCategoryAndFeaturedFilters() throws Exception {
        when(catalog.products()).thenReturn(List.of(
            product("linen-shirt", "Áo Linen", "Nữ", true),
            product("cotton-shirt", "Áo Cotton", "Nữ", false),
            product("linen-jacket", "Áo Linen", "Nam", true)
        ));

        mvc.perform(get("/api/products").param("q", "  LINEN ").param("category", "  NỮ ")
                .param("featured", "true"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error").isEmpty())
            .andExpect(jsonPath("$.data.total").value(1))
            .andExpect(jsonPath("$.data.items.length()").value(1))
            .andExpect(jsonPath("$.data.items[0].slug").value("linen-shirt"))
            .andExpect(jsonPath("$.data.items[0].featured").value(true))
            .andExpect(jsonPath("$.data.items[0].priceCents").value(450_000));
        verify(catalog).products();
    }

    @Test
    void missingProductUsesDocumentedErrorEnvelope() throws Exception {
        when(catalog.product("missing")).thenThrow(
            new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm."));

        mvc.perform(get("/api/products/missing"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.data").isEmpty())
            .andExpect(jsonPath("$.error.code").value("PRODUCT_NOT_FOUND"));
        verify(catalog).product("missing");
    }

    @Test
    void invalidFeaturedFlagReturnsRequestError() throws Exception {
        mvc.perform(get("/api/products").param("featured", "maybe"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
        verifyNoInteractions(catalog);
    }

    private Map<String, Object> product(String slug, String name, String category, boolean featured) {
        return Map.of("slug", slug, "name", name, "category", category,
            "featured", featured, "priceCents", 450_000L);
    }
}
