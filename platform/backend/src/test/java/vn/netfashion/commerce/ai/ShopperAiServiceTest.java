package vn.netfashion.commerce.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.netfashion.commerce.catalog.CatalogService;

class ShopperAiServiceTest {
    private final CatalogService catalog = mock(CatalogService.class);
    private final AiModelClient model = mock(AiModelClient.class);
    private final ShopperAiService service = new ShopperAiService(catalog, mock(JdbcClient.class), new RecommendationEngine(), model);

    @Test void explicitSizeFilterGetsProductAdviceInsteadOfAskingForSizeAgain() {
        when(catalog.recommendationProducts()).thenReturn(List.of(RecommendationEngineTest.product("p", "Áo linen", "Nữ",
            RecommendationEngineTest.variant("M", 700_000, 5))));
        var reply = service.chat(request("áo nữ dưới 800k size M"), null, null);
        assertThat(reply.answer()).contains("đã chọn").doesNotContain("chưa đủ thông tin");
        assertThat(reply.items()).hasSize(1);
    }

    @Test void exchangePolicyAndSizingAreSeparateIntents() {
        when(catalog.recommendationProducts()).thenReturn(List.of());
        assertThat(service.chat(request("chính sách đổi size"), null, null).answer()).contains("30 ngày");
        assertThat(service.chat(request("tư vấn chọn size"), null, null).answer()).contains("số đo");
        assertThat(service.chat(request("túi dưới 100k"), null, null).answer()).contains("chưa tìm thấy");
    }

    private ShopperAiController.ChatRequest request(String text) {
        return new ShopperAiController.ChatRequest(text, List.of(), null, List.of(), List.of());
    }
}
