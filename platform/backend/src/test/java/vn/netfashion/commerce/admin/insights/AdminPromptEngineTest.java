package vn.netfashion.commerce.admin.insights;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class AdminPromptEngineTest {
    private final AdminPromptEngine engine = new AdminPromptEngine();

    @ParameterizedTest
    @CsvSource({
        "'SKU nào sắp hết hàng?',INVENTORY",
        "'sku nao sap het hang?',INVENTORY",
        "'Đơn nào đang cần ưu tiên?',ORDERS",
        "'Sản phẩm nào bán chạy nhất?',SALES",
        "'Đánh giá hiệu quả khuyến mãi',PROMOTIONS",
        "'Tóm tắt cửa hàng hôm nay',OVERVIEW"
    })
    void classifiesVietnamesePrompts(String prompt, AdminPromptEngine.PromptTopic expected) {
        assertThat(engine.classify(prompt)).isEqualTo(expected);
    }

    @Test
    void overviewIsGroundedAndKeepsNextCompatibleShape() {
        Instant generatedAt = Instant.parse("2026-09-01T10:15:30Z");
        AdminPromptEngine.CopilotResult result = engine.answer(
            "Tóm tắt cửa hàng hôm nay",
            snapshot(),
            generatedAt
        );

        assertThat(result.headline()).isEqualTo("Tóm tắt điều hành");
        assertThat(result.answer()).contains("24 đơn", "12.500.000 ₫", "3 SKU");
        assertThat(result.insights()).hasSize(3);
        assertThat(result.actions()).extracting(AdminPromptEngine.Action::href)
            .containsExactly("/admin", "/admin/don-hang", "/admin/ton-kho");
        assertThat(result.confidence()).isBetween(0.0, 1.0);
        assertThat(result.grounded()).isTrue();
        assertThat(result.generatedAt()).isEqualTo(generatedAt.toString());
    }

    @Test
    void salesAnswerUsesOnlySnapshotLeaderAndDeterministicVndFormatting() {
        AdminPromptEngine.CopilotResult result = engine.answer(
            "Sản phẩm nào bán chạy nhất?",
            snapshot(),
            Instant.EPOCH
        );

        assertThat(result.answer()).contains("Đầm midi An", "8 sản phẩm", "4.800.000 ₫");
        assertThat(AdminPromptEngine.formatMoney(1_250_000)).isEqualTo("1.250.000 ₫");
    }

    private AdminPromptEngine.Snapshot snapshot() {
        return new AdminPromptEngine.Snapshot(
            24,
            4,
            12_500_000,
            17,
            2,
            3,
            List.of(new AdminPromptEngine.LowStockItem("NET-DAM-M-DEN", "Đầm midi An", 1)),
            List.of(new AdminPromptEngine.TopProduct("Đầm midi An", 8, 4_800_000)),
            List.of(new AdminPromptEngine.PromotionSummary("CHAONET", "Chào NÉT", "Giảm 10%"))
        );
    }
}
