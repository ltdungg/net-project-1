package vn.netfashion.commerce.ai;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.catalog.CatalogService;
import vn.netfashion.commerce.common.Maps;

@Service
public class ShopperAiService {
    private final CatalogService catalog;
    private final JdbcClient jdbc;
    private final RecommendationEngine engine;
    private final AiModelClient model;

    public ShopperAiService(CatalogService catalog, JdbcClient jdbc, RecommendationEngine engine, AiModelClient model) {
        this.catalog = catalog;
        this.jdbc = jdbc;
        this.engine = engine;
        this.model = model;
    }

    public List<RecommendationEngine.Recommendation> recommend(String slug, List<String> recent, List<String> favorites,
            AuthPrincipal actor, String cartToken, String query, int limit) {
        List<Map<String, Object>> products = catalog.recommendationProducts();
        String current = products.stream().filter(p -> p.get("slug").equals(slug)).map(p -> (String) p.get("id")).findFirst().orElse(null);
        Set<String> liked = new HashSet<>(favorites);
        Set<String> purchased = new HashSet<>();
        if (actor != null) {
            liked.addAll(jdbc.sql("select product_id from wishlist_items where user_id=:user order by created_at desc limit 50")
                .param("user", actor.id()).query(String.class).list());
            purchased.addAll(jdbc.sql("""
                select distinct pv.product_id from order_items oi
                join product_variants pv on pv.id=oi.variant_id join customer_orders o on o.id=oi.order_id
                where o.user_id=:user and o.payment_status='paid'
                  and o.status not in ('cancelled','returned','refunded') and o.created_at >= now()-interval '180 days'
                limit 50
                """).param("user", actor.id()).query(String.class).list());
        }
        Set<String> cart = new HashSet<>();
        if (cartToken != null && !cartToken.isBlank()) cart.addAll(jdbc.sql("""
            select distinct pv.product_id from cart_items ci join carts c on c.id=ci.cart_id
            join product_variants pv on pv.id=ci.variant_id where c.guest_token=:token limit 100
            """).param("token", cartToken).query(String.class).list());
        return engine.recommend(products, new RecommendationEngine.Context(current, recent, liked, cart, purchased), query, limit);
    }

    public ChatReply chat(ShopperAiController.ChatRequest request, AuthPrincipal actor, String cartToken) {
        String query = String.join(". ", request.previousQuestions()) + ". " + request.message();
        var items = recommend(request.currentSlug(), request.recentIds(), request.favoriteIds(), actor, cartToken, query, 4);
        String normalized = RecommendationEngine.normalize(request.message());
        String answer;
        if (normalized.contains("chon size") || normalized.contains("size nao") || normalized.contains("tu van size") || normalized.contains("so do")) {
            answer = "Bạn có thể đối chiếu số đo ngực, eo và hông với bảng size của NÉT. Mình chưa đủ thông tin để chốt size cho bạn. Hãy cho biết sản phẩm và số đo, hoặc mở Hướng dẫn chọn size. Size còn hàng được ghi trên từng sản phẩm.";
        } else if (normalized.contains("giao hang") || normalized.contains("doi tra") || normalized.contains("doi size") || normalized.contains("phi ship")) {
            answer = "NÉT dự kiến giao hàng trong 2–5 ngày và hỗ trợ đổi size trong 30 ngày với sản phẩm còn nguyên tem, chưa qua sử dụng. Phí giao hàng và ưu đãi chính xác được hiển thị trong giỏ hàng trước khi thanh toán.";
        } else if (items.isEmpty()) {
            answer = "Mình chưa tìm thấy sản phẩm còn hàng phù hợp với loại, ngân sách và size bạn yêu cầu. Bạn có thể đổi loại sản phẩm, size hoặc ngân sách để mình tìm lại.";
        } else {
            answer = "Mình đã chọn các thiết kế bên dưới từ sản phẩm còn hàng tại NÉT. Bạn có thể cho biết dịp mặc, chất liệu, size và ngân sách (ví dụ: áo nữ dưới 800k, size M) để mình tư vấn sát hơn.";
        }
        var generated = model.generate("You are NÉT's shopping assistant. Use only supplied products and store policies. "
            + "Never invent products, discounts, stock, prices, size measurements, or delivery guarantees. "
            + "Ask a short follow-up if needs are unclear. Never claim access to orders or admin data. "
            + "Do not repeat personal/contact/payment information from questions. Product cards below are authoritative; do not quote numeric prices in prose. "
            + "Limit answer to 100 Vietnamese words.",
            Maps.of("question", request.message(), "previousQuestions", request.previousQuestions(), "products", items,
                "policies", "Giao dự kiến 2–5 ngày. Đổi size 30 ngày nếu còn nguyên tem, chưa sử dụng. Phí cuối cùng xem giỏ hàng. Bảng size: /huong-dan-chon-size.",
                "fallbackAnswer", answer), AiModelClient.schema(Map.of("answer", AiModelClient.text())));
        boolean valid = generated.filter(n -> n.path("answer").isString() && !n.path("answer").asText().isBlank()
            && n.path("answer").asText().length() <= 2000).isPresent();
        if (valid) answer = generated.get().path("answer").asText();
        return new ChatReply(answer, items, model.mode(valid), Instant.now().toString());
    }

    public record ChatReply(String answer, List<RecommendationEngine.Recommendation> items, String mode, String generatedAt) {}
}
