package vn.netfashion.commerce.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;
import vn.netfashion.commerce.common.ApiException;
import org.springframework.http.HttpStatus;

public record DashboardPlan(String title, int days, List<String> widgets) {
    public static final List<String> ALLOWED = List.of("revenue", "orders", "average_order", "items_sold", "sales_daily", "top_products", "low_stock");
    public DashboardPlan {
        if (title == null || title.isBlank() || title.length() > 100 || days < 1 || days > 90
                || widgets == null || widgets.isEmpty() || widgets.size() > 7 || !ALLOWED.containsAll(widgets)
                || widgets.stream().distinct().count() != widgets.size()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_DASHBOARD", "Dashboard cần tên, khoảng 1–90 ngày và các chỉ số được hỗ trợ, không trùng lặp.");
        }
        title = title.trim();
        widgets = List.copyOf(widgets);
    }

    public static DashboardPlan fromPrompt(String prompt, int selectedDays) {
        String normalized = RecommendationEngine.normalize(prompt);
        int days = selectedDays;
        var matcher = Pattern.compile("\\b(\\d{1,3})\\s*ngay\\b").matcher(normalized);
        if (matcher.find()) days = Integer.parseInt(matcher.group(1));
        else if (normalized.contains("hom nay")) days = 1;
        else if (normalized.contains("tuan qua")) days = 7;
        var widgets = new ArrayList<String>();
        if (normalized.contains("ton kho") || normalized.contains("het hang")) widgets.add("low_stock");
        if (normalized.contains("doanh thu")) { widgets.add("revenue"); widgets.add("sales_daily"); }
        if (normalized.contains("don hang")) widgets.add("orders");
        if (normalized.contains("trung binh")) widgets.add("average_order");
        if (normalized.contains("ban chay") || normalized.contains("san pham")) { widgets.add("top_products"); widgets.add("items_sold"); }
        if (widgets.isEmpty()) widgets.addAll(List.of("revenue", "orders", "average_order", "sales_daily", "top_products"));
        return new DashboardPlan("Tổng quan cửa hàng", days, widgets);
    }

    public static Map<String, Object> outputSchema() {
        return AiModelClient.schema(Map.of("title", AiModelClient.text(), "widgets", Map.of("type", "array", "items", Map.of("type", "string", "enum", ALLOWED))));
    }

    public static DashboardPlan fromModel(JsonNode node, int days) {
        List<String> widgets = new ArrayList<>();
        if (!node.path("widgets").isArray()) throw new IllegalArgumentException("Invalid widgets");
        for (JsonNode item : node.path("widgets")) widgets.add(item.asText());
        return new DashboardPlan(node.path("title").asText(), days, widgets);
    }
}
