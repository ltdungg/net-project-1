package vn.netfashion.commerce.cart;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.catalog.CatalogService;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class CartService {
    private final JdbcClient jdbc;
    private final CatalogService catalog;

    public CartService(JdbcClient jdbc, CatalogService catalog) {
        this.jdbc = jdbc;
        this.catalog = catalog;
    }

    public Map<String, Object> cart(String token) {
        if (token == null || token.isBlank()) return empty();
        CartRow cart = jdbc.sql("select id,coupon_code from carts where guest_token=:token")
            .param("token", token).query((rs, rowNum) -> new CartRow(rs.getString("id"), rs.getString("coupon_code")))
            .optional().orElse(null);
        if (cart == null) return empty();
        List<CartItem> rows = jdbc.sql("""
            select ci.id,ci.variant_id,ci.quantity,pv.price_cents,p.slug
            from cart_items ci join product_variants pv on pv.id=ci.variant_id
            join products p on p.id=pv.product_id
            where ci.cart_id=:cartId order by ci.created_at
            """).param("cartId", cart.id()).query(this::cartItem).list();
        List<Map<String, Object>> items = new ArrayList<>();
        long subtotal = 0;
        int itemCount = 0;
        for (CartItem item : rows) {
            CatalogService.VariantRow variant = catalog.variant(item.variantId());
            long lineTotal = variant.priceCents() * item.quantity();
            subtotal += lineTotal;
            itemCount += item.quantity();
            Map<String, Object> product = catalog.product(item.slug());
            Map<String, Object> variantMap = Maps.of(
                "id", variant.id(), "sku", variant.sku(), "size", variant.size(), "color", variant.color(),
                "colorHex", variant.colorHex(), "priceCents", variant.priceCents(), "available", variant.available()
            );
            items.add(Maps.of(
                "id", item.id(), "variantId", item.variantId(), "quantity", item.quantity(),
                "unitPriceCents", variant.priceCents(), "lineTotalCents", lineTotal,
                "product", product, "variant", variantMap
            ));
        }
        VoucherPolicy.Evaluation voucher = cart.couponCode() == null ? null : evaluate(cart.couponCode(), subtotal);
        VoucherPolicy.Totals totals = VoucherPolicy.totals(subtotal, voucher);
        return Maps.of(
            "id", cart.id(), "items", items, "itemCount", itemCount,
            "subtotalCents", totals.subtotalCents(), "discountCents", totals.discountCents(),
            "shippingCents", totals.shippingCents(), "grandTotalCents", totals.grandTotalCents(),
            "voucher", voucher == null ? null : voucherMap(voucher)
        );
    }

    @Transactional
    public CartMutation add(String tokenValue, String variantId, int quantity) {
        CatalogService.VariantRow variant = catalog.variant(variantId);
        if (variant.available() < quantity) throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", "Sản phẩm không còn đủ tồn kho.");
        String token = tokenValue == null || tokenValue.isBlank() ? UUID.randomUUID().toString() : tokenValue;
        String cartId = jdbc.sql("select id from carts where guest_token=:token").param("token", token).query(String.class).optional().orElse(null);
        boolean created = cartId == null;
        if (created) {
            cartId = UUID.randomUUID().toString();
            jdbc.sql("insert into carts(id,guest_token,expires_at) values(:id,:token,now()+interval '30 days')")
                .params(Map.of("id", cartId, "token", token)).update();
        }
        Integer current = jdbc.sql("select quantity from cart_items where cart_id=:cartId and variant_id=:variantId")
            .params(Map.of("cartId", cartId, "variantId", variantId)).query(Integer.class).optional().orElse(0);
        int desired = Math.min(10, current + quantity);
        if (variant.available() < desired) throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", "Sản phẩm không còn đủ tồn kho.");
        jdbc.sql("""
            insert into cart_items(id,cart_id,variant_id,quantity,unit_price_cents)
            values(:id,:cartId,:variantId,:quantity,:price)
            on conflict(cart_id,variant_id) do update set quantity=excluded.quantity,unit_price_cents=excluded.unit_price_cents,updated_at=now()
            """).params(Map.of("id", UUID.randomUUID().toString(), "cartId", cartId, "variantId", variantId, "quantity", desired, "price", variant.priceCents())).update();
        return new CartMutation(token, created, cart(token));
    }

    @Transactional
    public Map<String, Object> update(String token, String itemId, int quantity) {
        CartItem item = ownedItem(token, itemId);
        CatalogService.VariantRow variant = catalog.variant(item.variantId());
        if (variant.available() < quantity) throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", "Sản phẩm không còn đủ tồn kho.");
        jdbc.sql("update cart_items set quantity=:quantity,unit_price_cents=:price,updated_at=now() where id=:id")
            .params(Map.of("quantity", quantity, "price", variant.priceCents(), "id", itemId)).update();
        return cart(token);
    }

    @Transactional
    public Map<String, Object> remove(String token, String itemId) {
        ownedItem(token, itemId);
        jdbc.sql("delete from cart_items where id=:id").param("id", itemId).update();
        return cart(token);
    }

    @Transactional
    public Map<String, Object> applyVoucher(String token, String codeValue) {
        CartRow cart = requireCart(token);
        long subtotal = subtotal(cart.id());
        VoucherPolicy.Evaluation evaluation = evaluate(codeValue, subtotal);
        if (!evaluation.valid()) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VOUCHER_INVALID", evaluation.message());
        jdbc.sql("update carts set coupon_code=:code,updated_at=now() where id=:id")
            .params(Map.of("code", evaluation.code(), "id", cart.id())).update();
        return cart(token);
    }

    @Transactional
    public Map<String, Object> removeVoucher(String token) {
        CartRow cart = requireCart(token);
        jdbc.sql("update carts set coupon_code=null,updated_at=now() where id=:id").param("id", cart.id()).update();
        return cart(token);
    }

    public VoucherPolicy.Evaluation evaluate(String codeValue, long subtotal) {
        String code = codeValue.trim().toUpperCase(Locale.ROOT);
        VoucherRow row = jdbc.sql("""
            select p.id promotion_id,c.id coupon_id,c.code,p.name,p.type,p.value,p.min_subtotal_cents,
                   p.max_discount_cents,p.usage_limit promotion_limit,p.usage_count promotion_count,
                   c.usage_limit coupon_limit,c.usage_count coupon_count
            from coupons c join promotions p on p.id=c.promotion_id
            where upper(c.code)=:code and c.status='active' and p.status='active'
              and now() between p.starts_at and p.ends_at
            """).param("code", code).query(this::voucherRow).optional().orElse(null);
        if (row == null) return new VoucherPolicy.Evaluation(false, null, null, code, null, "Mã ưu đãi không hợp lệ hoặc đã hết hạn.", 0, false);
        if (subtotal < row.minSubtotal()) return new VoucherPolicy.Evaluation(false, row.promotionId(), row.couponId(), code, row.name(), "Đơn hàng chưa đạt giá trị tối thiểu.", 0, false);
        if ((row.promotionLimit() != null && row.promotionCount() >= row.promotionLimit()) || (row.couponLimit() != null && row.couponCount() >= row.couponLimit())) {
            return new VoucherPolicy.Evaluation(false, row.promotionId(), row.couponId(), code, row.name(), "Mã ưu đãi đã hết lượt sử dụng.", 0, false);
        }
        long savings = VoucherPolicy.discount(row.type(), row.value(), row.maxDiscount(), subtotal);
        boolean freeShipping = "free_shipping".equals(row.type());
        String message = freeShipping ? "Đã miễn phí giao hàng cho đơn này." : "Bạn tiết kiệm " + savings + "đ.";
        return new VoucherPolicy.Evaluation(true, row.promotionId(), row.couponId(), code, row.name(), message, savings, freeShipping);
    }

    public void lockVoucher(String codeValue) {
        String code = codeValue.trim().toUpperCase(Locale.ROOT);
        jdbc.sql("""
            select c.id from coupons c join promotions p on p.id=c.promotion_id
            where upper(c.code)=:code for update of c,p
            """).param("code", code).query(String.class).optional();
    }

    public void validateCustomerUsage(String couponId, String userId, String email) {
        Map<String, Object> usage = jdbc.sql("""
            select c.usage_limit_per_customer,
              count(op.id) filter (
                where (:userId <> '' and o.user_id=:userId) or lower(o.email)=:email
              ) customer_usage
            from coupons c
            left join order_promotions op on op.coupon_id=c.id
            left join customer_orders o on o.id=op.order_id
            where c.id=:couponId
            group by c.id,c.usage_limit_per_customer
            """).params(Map.of(
                "couponId", couponId,
                "userId", userId == null ? "" : userId,
                "email", email.trim().toLowerCase(Locale.ROOT)
            )).query((rs, rowNumber) -> Maps.of(
                "limit", rs.getInt("usage_limit_per_customer"),
                "used", rs.getLong("customer_usage")
            )).optional().orElseThrow(() -> new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VOUCHER_INVALID",
                "Mã ưu đãi không tồn tại."
            ));

        if ((long) usage.get("used") >= (int) usage.get("limit")) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VOUCHER_CUSTOMER_LIMIT",
                "Bạn đã sử dụng hết số lượt cho mã ưu đãi này."
            );
        }
    }

    public String cartId(String token) {
        return token == null ? null : jdbc.sql("select id from carts where guest_token=:token").param("token", token).query(String.class).optional().orElse(null);
    }

    private long subtotal(String cartId) {
        return jdbc.sql("select coalesce(sum(ci.quantity*pv.price_cents),0) from cart_items ci join product_variants pv on pv.id=ci.variant_id where ci.cart_id=:id")
            .param("id", cartId).query(Long.class).single();
    }

    private CartRow requireCart(String token) {
        if (token == null || token.isBlank()) throw new ApiException(HttpStatus.NOT_FOUND, "CART_NOT_FOUND", "Không tìm thấy giỏ hàng.");
        return jdbc.sql("select id,coupon_code from carts where guest_token=:token").param("token", token)
            .query((rs, rowNum) -> new CartRow(rs.getString("id"), rs.getString("coupon_code"))).optional()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CART_NOT_FOUND", "Không tìm thấy giỏ hàng."));
    }

    private CartItem ownedItem(String token, String itemId) {
        return jdbc.sql("""
            select ci.id,ci.variant_id,ci.quantity,pv.price_cents,p.slug
            from cart_items ci join carts c on c.id=ci.cart_id
            join product_variants pv on pv.id=ci.variant_id join products p on p.id=pv.product_id
            where ci.id=:itemId and c.guest_token=:token
            """).params(Map.of("itemId", itemId, "token", token == null ? "" : token)).query(this::cartItem).optional()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CART_ITEM_NOT_FOUND", "Không tìm thấy sản phẩm trong giỏ."));
    }

    private CartItem cartItem(ResultSet rs, int rowNum) throws SQLException {
        return new CartItem(rs.getString("id"), rs.getString("variant_id"), rs.getInt("quantity"), rs.getLong("price_cents"), rs.getString("slug"));
    }

    private VoucherRow voucherRow(ResultSet rs, int rowNum) throws SQLException {
        return new VoucherRow(rs.getString("promotion_id"), rs.getString("coupon_id"), rs.getString("code"), rs.getString("name"), rs.getString("type"),
            rs.getLong("value"), rs.getLong("min_subtotal_cents"), (Long) rs.getObject("max_discount_cents"),
            (Integer) rs.getObject("promotion_limit"), rs.getInt("promotion_count"), (Integer) rs.getObject("coupon_limit"), rs.getInt("coupon_count"));
    }

    private Map<String, Object> voucherMap(VoucherPolicy.Evaluation value) {
        return Maps.of("valid", value.valid(), "code", value.code(), "name", value.name(), "message", value.message(), "savingsCents", value.savingsCents(), "freeShipping", value.freeShipping());
    }

    private Map<String, Object> empty() {
        return Maps.of("id", null, "items", List.of(), "itemCount", 0, "subtotalCents", 0L, "discountCents", 0L, "shippingCents", 0L, "grandTotalCents", 0L, "voucher", null);
    }

    public record CartMutation(String token, boolean newToken, Map<String, Object> data) {}
    private record CartRow(String id,String couponCode) {}
    private record CartItem(String id,String variantId,int quantity,long unitPriceCents,String slug) {}
    private record VoucherRow(String promotionId,String couponId,String code,String name,String type,long value,long minSubtotal,Long maxDiscount,Integer promotionLimit,int promotionCount,Integer couponLimit,int couponCount) {}
}
