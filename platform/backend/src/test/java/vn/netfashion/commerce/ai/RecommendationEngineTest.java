package vn.netfashion.commerce.ai;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class RecommendationEngineTest {
    private final RecommendationEngine engine = new RecommendationEngine();
    private final RecommendationEngine.Context empty = new RecommendationEngine.Context(null, List.of(), Set.of(), Set.of(), Set.of());

    @Test void excludesUnavailableProductsCurrentProductAndCartAutomatically() {
        var catalog = List.of(product("current", "Áo linen", "Nữ", variant("S", 400_000, 2)),
            product("cart", "Áo cotton", "Nữ", variant("S", 500_000, 3)),
            product("soldout", "Áo lụa", "Nữ", variant("S", 600_000, 0)),
            product("available", "Áo dài", "Nữ", variant("M", 700_000, 3)));
        var context = new RecommendationEngine.Context("current", List.of(), Set.of(), Set.of("cart"), Set.of());
        assertThat(engine.recommend(catalog, context, "", 4)).extracting(r -> r.product().get("id")).containsExactly("available");
    }

    @Test void priceAndSizeMustMatchTheSameInStockVariant() {
        var catalog = List.of(product("wrong", "Áo linen", "Nữ", variant("S", 400_000, 10), variant("M", 900_000, 5)),
            product("right", "Áo cotton", "Nữ", variant("S", 200_000, 0), variant("M", 700_000, 5)),
            product("male", "Áo cotton nam", "Nam", variant("M", 500_000, 2)));
        var results = engine.recommend(catalog, empty, "Áo nữ dưới 800k, size M", 4);
        assertThat(results).extracting(r -> r.product().get("id")).containsExactly("right");
        assertThat(RecommendationEngine.variants(results.getFirst().product())).containsExactly(variant("M", 700_000, 5));
    }

    @Test void returnsEmptyInsteadOfIgnoringExplicitConstraints() {
        assertThat(engine.recommend(List.of(product("p", "Áo linen", "Nữ", variant("S", 800_000, 2))), empty,
            "túi dưới 500k size L", 4)).isEmpty();
    }

    @Test void preferencesChangeRankingWithoutInventingProducts() {
        var catalog = List.of(product("a", "Áo", "Nam", variant("S", 500_000, 5)), product("z", "Áo", "Nữ", variant("S", 500_000, 5)));
        var context = new RecommendationEngine.Context(null, List.of(), Set.of("z"), Set.of(), Set.of());
        assertThat(engine.recommend(catalog, context, "", 4).getFirst().product().get("id")).isEqualTo("z");
    }

    @Test void latestBudgetAndSizeOverrideEarlierQuestionsAndSupportVietnameseAmounts() {
        assertThat(RecommendationEngine.budget(RecommendationEngine.normalize("dưới 500k. ngân sách 1,5 triệu"))).isEqualTo(1_500_000);
        assertThat(RecommendationEngine.budget(RecommendationEngine.normalize("dưới 800.000đ"))).isEqualTo(800_000);
        var catalog = List.of(product("p", "Áo nữ", "Nữ", variant("M", 700_000, 5)));
        assertThat(engine.recommend(catalog, empty, "áo nam dưới 500k size S. đổi sang nữ dưới 800k size M", 4)).hasSize(1);
    }

    @Test void includesCurrentProductWhenCustomerAsksAboutIt() {
        var context = new RecommendationEngine.Context("p", List.of(), Set.of(), Set.of(), Set.of());
        assertThat(engine.recommend(List.of(product("p", "Áo linen", "Nữ", variant("S", 700_000, 5))), context, "tư vấn áo này", 4)).hasSize(1);
    }

    static Map<String, Object> variant(String size, long price, int available) { return Map.of("size", size, "priceCents", price, "available", available); }
    @SafeVarargs static Map<String, Object> product(String id, String name, String category, Map<String, Object>... variants) {
        return Map.of("id", id, "slug", id, "name", name, "category", category, "featured", false, "material", "linen", "variants", List.of(variants));
    }
}
