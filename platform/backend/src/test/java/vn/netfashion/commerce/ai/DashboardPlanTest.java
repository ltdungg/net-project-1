package vn.netfashion.commerce.ai;

import static org.assertj.core.api.Assertions.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.common.ApiException;

class DashboardPlanTest {
    private final ObjectMapper mapper = new ObjectMapper();
    @Test void derivesWidgetsAndVietnameseDateWindow() {
        var plan = DashboardPlan.fromPrompt("Tạo dashboard doanh thu và sản phẩm bán chạy 7 ngày", 30);
        assertThat(plan.days()).isEqualTo(7);
        assertThat(plan.widgets()).containsExactly("revenue", "sales_daily", "top_products", "items_sold");
        assertThat(DashboardPlan.fromPrompt("đơn hàng hôm nay", 30).days()).isEqualTo(1);
    }
    @Test void rejectsGeneratedCodeUrlsUnknownAndDuplicateWidgets() {
        for (String widget : List.of("SELECT * FROM users", "https://evil.test", "unknown")) {
            assertThatThrownBy(() -> new DashboardPlan("Test", 30, List.of(widget))).isInstanceOf(ApiException.class);
        }
        assertThatThrownBy(() -> new DashboardPlan("Test", 30, List.of("orders", "orders"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> DashboardPlan.fromModel(mapper.readTree("{\"title\":\"x\",\"widgets\":\"orders\"}"), 7)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void rejectsEmptyDashboardAndUnsupportedPeriodRatherThanSilentlyChangingIt() {
        assertThatThrownBy(() -> DashboardPlan.fromPrompt("doanh thu 365 ngày", 30)).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> new DashboardPlan(" ", 30, List.of("orders"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> new DashboardPlan("Test", 0, List.of("orders"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> new DashboardPlan("Test", 30, List.of())).isInstanceOf(ApiException.class);
    }
}
