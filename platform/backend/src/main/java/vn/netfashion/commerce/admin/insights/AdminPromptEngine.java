package vn.netfashion.commerce.admin.insights;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Pure, deterministic response engine for the back-office copilot.
 *
 * <p>The engine deliberately has no network or persistence dependency. Every
 * statement in a response is derived from the immutable database snapshot
 * supplied by {@link AdminInsightsService}.</p>
 */
@Component
public class AdminPromptEngine {
    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern INVENTORY = Pattern.compile(
        "\\b(ton kho|sap het|het hang|sku|atp|nhap hang|bo sung hang|diem dat hang)\\b"
    );
    private static final Pattern PROMOTIONS = Pattern.compile(
        "\\b(khuyen mai|voucher|ma giam|uu dai|coupon)\\b"
    );
    private static final Pattern SALES = Pattern.compile(
        "\\b(doanh thu|ban chay|ban hang|san pham tot|top san pham|hieu suat ban)\\b"
    );
    private static final Pattern ORDERS = Pattern.compile(
        "\\b(don hang|don|giao hang|dong goi|xu ly|sla|van chuyen|hang doi)\\b"
    );

    public PromptTopic classify(String prompt) {
        String normalized = normalize(prompt);
        if (INVENTORY.matcher(normalized).find()) return PromptTopic.INVENTORY;
        if (PROMOTIONS.matcher(normalized).find()) return PromptTopic.PROMOTIONS;
        if (SALES.matcher(normalized).find()) return PromptTopic.SALES;
        if (ORDERS.matcher(normalized).find()) return PromptTopic.ORDERS;
        return PromptTopic.OVERVIEW;
    }

    public CopilotResult answer(String prompt, Snapshot snapshot, Instant generatedAt) {
        return switch (classify(prompt)) {
            case INVENTORY -> inventory(snapshot, generatedAt);
            case ORDERS -> orders(snapshot, generatedAt);
            case SALES -> sales(snapshot, generatedAt);
            case PROMOTIONS -> promotions(snapshot, generatedAt);
            case OVERVIEW -> overview(snapshot, generatedAt);
        };
    }

    private CopilotResult inventory(Snapshot snapshot, Instant generatedAt) {
        LowStockItem critical = snapshot.lowStock().isEmpty() ? null : snapshot.lowStock().getFirst();
        String response = critical == null
            ? "Chưa có SKU nào xuống dưới điểm đặt hàng. Tồn kho hiện đủ an toàn cho nhịp bán hiện tại."
            : "Có %d SKU đang ở hoặc dưới điểm đặt hàng. %s (%s) chỉ còn %d sản phẩm khả dụng. "
                .formatted(snapshot.lowStockCount(), critical.product(), critical.sku(), critical.available())
                + "Nên tạo đề xuất nhập cho nhóm này trước khi tăng ngân sách quảng cáo.";
        List<Insight> insights = snapshot.lowStock().stream().limit(3)
            .map(item -> new Insight(
                item.sku(),
                item.available() + " khả dụng",
                item.available() <= 2 ? "critical" : "warning"
            ))
            .toList();
        return result(
            "Ưu tiên bổ sung tồn kho",
            response,
            insights,
            List.of(
                new Action("Mở quản lý tồn kho", "/admin/ton-kho"),
                new Action("Xem báo cáo bán hàng", "/admin/bao-cao")
            ),
            0.96,
            generatedAt
        );
    }

    private CopilotResult orders(Snapshot snapshot, Instant generatedAt) {
        String response = snapshot.backlog() > 0
            ? "Hiện có %d đơn đang trong hàng đợi xác nhận, xử lý hoặc chờ giao. "
                .formatted(snapshot.backlog())
                + "Nên ưu tiên đơn lâu nhất trước, sau đó gom theo trạng thái để giảm thời gian chuyển ngữ cảnh của đội vận hành."
            : "Không có đơn nào đang tồn trong hàng đợi vận hành. Đội có thể chuyển sang kiểm kê và chuẩn bị đóng gói cho đợt bán tiếp theo.";
        long backlogRate = snapshot.orders30d() == 0
            ? 0
            : Math.round((double) snapshot.backlog() * 100 / snapshot.orders30d());
        return result(
            "Tình trạng xử lý đơn",
            response,
            List.of(
                new Insight("Đơn 30 ngày", Long.toString(snapshot.orders30d()), "neutral"),
                new Insight(
                    "Đang chờ xử lý",
                    Long.toString(snapshot.backlog()),
                    snapshot.backlog() > 10 ? "warning" : "good"
                ),
                new Insight("Tỷ lệ backlog", backlogRate + "%", "neutral")
            ),
            List.of(
                new Action("Mở hàng đợi đơn", "/admin/don-hang"),
                new Action("Kiểm tra tồn kho", "/admin/ton-kho")
            ),
            0.94,
            generatedAt
        );
    }

    private CopilotResult sales(Snapshot snapshot, Instant generatedAt) {
        TopProduct leader = snapshot.topProducts().isEmpty() ? null : snapshot.topProducts().getFirst();
        String response = leader == null
            ? "Doanh thu ghi nhận là %s. Chưa có đủ dữ liệu mặt hàng để xác định sản phẩm dẫn đầu."
                .formatted(formatMoney(snapshot.revenue30d()))
            : "Doanh thu ghi nhận là %s. %s đang dẫn đầu với %d sản phẩm và %s doanh thu. "
                .formatted(
                    formatMoney(snapshot.revenue30d()),
                    leader.product(),
                    leader.quantity(),
                    formatMoney(leader.revenue())
                )
                + "Có thể đặt sản phẩm này ở vị trí nổi bật nhưng cần kiểm tra tồn kho trước.";
        List<Insight> insights = snapshot.topProducts().stream()
            .map(item -> new Insight(
                item.product(),
                item.quantity() + " sp · " + formatMoney(item.revenue()),
                "good"
            ))
            .toList();
        return result(
            "Hiệu suất bán hàng 30 ngày",
            response,
            insights,
            List.of(
                new Action("Mở báo cáo doanh thu", "/admin/bao-cao"),
                new Action("Quản lý sản phẩm", "/admin/san-pham")
            ),
            0.92,
            generatedAt
        );
    }

    private CopilotResult promotions(Snapshot snapshot, Instant generatedAt) {
        String campaignSummary = snapshot.promotions().isEmpty()
            ? "Chưa có chương trình nào nằm trong thời gian hiệu lực."
            : "Các chương trình đang hiệu lực gồm " + snapshot.promotions().stream()
                .map(item -> item.code() + " (" + item.name() + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("") + ".";
        String response = "Hiện có %d chương trình đang hoạt động. %s "
            .formatted(snapshot.activePromotions(), campaignSummary)
            + "Nên đối chiếu biên lợi nhuận và tồn khả dụng trước khi tăng mức ưu đãi; tránh chạy ưu đãi sâu cho SKU tồn thấp.";
        List<Insight> insights = new ArrayList<>();
        for (PromotionSummary promotion : snapshot.promotions()) {
            insights.add(new Insight(promotion.code(), promotion.benefit(), "good"));
        }
        if (insights.size() < 3) {
            insights.add(new Insight(
                "SKU tồn thấp",
                Long.toString(snapshot.lowStockCount()),
                snapshot.lowStockCount() > 0 ? "warning" : "good"
            ));
        }
        return result(
            "Gợi ý vận hành khuyến mãi",
            response,
            insights.stream().limit(3).toList(),
            List.of(
                new Action("Mở trung tâm khuyến mãi", "/admin/khuyen-mai"),
                new Action("Kiểm tra tồn kho trước", "/admin/ton-kho")
            ),
            0.90,
            generatedAt
        );
    }

    private CopilotResult overview(Snapshot snapshot, Instant generatedAt) {
        return result(
            "Tóm tắt điều hành",
            "Trong 30 ngày gần nhất, cửa hàng ghi nhận %d đơn và %s doanh thu. "
                .formatted(snapshot.orders30d(), formatMoney(snapshot.revenue30d()))
                + "Hiện có %d đơn cần xử lý, %d SKU ở mức cảnh báo và %d chương trình khuyến mãi đang chạy. "
                .formatted(snapshot.backlog(), snapshot.lowStockCount(), snapshot.activePromotions())
                + "Ưu tiên hôm nay là xử lý backlog trước SLA rồi bổ sung các SKU sắp hết.",
            List.of(
                new Insight("Doanh thu 30 ngày", formatMoney(snapshot.revenue30d()), "good"),
                new Insight(
                    "Đơn cần xử lý",
                    Long.toString(snapshot.backlog()),
                    snapshot.backlog() > 10 ? "warning" : "neutral"
                ),
                new Insight(
                    "SKU cảnh báo",
                    Long.toString(snapshot.lowStockCount()),
                    snapshot.lowStockCount() > 0 ? "warning" : "good"
                )
            ),
            List.of(
                new Action("Xem dashboard", "/admin"),
                new Action("Mở hàng đợi đơn", "/admin/don-hang"),
                new Action("Mở tồn kho", "/admin/ton-kho")
            ),
            0.93,
            generatedAt
        );
    }

    private CopilotResult result(
        String headline,
        String answer,
        List<Insight> insights,
        List<Action> actions,
        double confidence,
        Instant generatedAt
    ) {
        return new CopilotResult(
            headline,
            answer,
            List.copyOf(insights),
            List.copyOf(actions),
            confidence,
            true,
            generatedAt.toString()
        );
    }

    static String normalize(String value) {
        if (value == null) return "";
        String decomposed = Normalizer.normalize(value, Normalizer.Form.NFD);
        return MARKS.matcher(decomposed)
            .replaceAll("")
            .replace('đ', 'd')
            .replace('Đ', 'D')
            .toLowerCase(Locale.ROOT)
            .trim()
            .replaceAll("\\s+", " ");
    }

    public static String formatMoney(long value) {
        String digits = Long.toString(Math.max(0, value));
        StringBuilder grouped = new StringBuilder(digits.length() + digits.length() / 3);
        for (int index = 0; index < digits.length(); index++) {
            if (index > 0 && (digits.length() - index) % 3 == 0) grouped.append('.');
            grouped.append(digits.charAt(index));
        }
        return grouped + " ₫";
    }

    public enum PromptTopic { INVENTORY, ORDERS, SALES, PROMOTIONS, OVERVIEW }

    public record Snapshot(
        long orders30d,
        long backlog,
        long revenue30d,
        long customers,
        long activePromotions,
        long lowStockCount,
        List<LowStockItem> lowStock,
        List<TopProduct> topProducts,
        List<PromotionSummary> promotions
    ) {
        public Snapshot {
            lowStock = List.copyOf(lowStock);
            topProducts = List.copyOf(topProducts);
            promotions = List.copyOf(promotions);
        }
    }

    public record LowStockItem(String sku, String product, long available) {}
    public record TopProduct(String product, long quantity, long revenue) {}
    public record PromotionSummary(String code, String name, String benefit) {}
    public record Insight(String label, String value, String tone) {}
    public record Action(String label, String href) {}
    public record CopilotResult(
        String headline,
        String answer,
        List<Insight> insights,
        List<Action> actions,
        double confidence,
        boolean grounded,
        String generatedAt
    ) {}
}
