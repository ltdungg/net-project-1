package vn.netfashion.commerce.wishlist;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class WishlistService {
    static final int MAX_ITEMS = 100;

    private final JdbcClient jdbc;
    private final AccountService accounts;

    public WishlistService(JdbcClient jdbc, AccountService accounts) {
        this.jdbc = jdbc;
        this.accounts = accounts;
    }

    @Transactional
    public Map<String, Object> list(AuthPrincipal principal) {
        accounts.ensure(principal);
        List<Map<String, Object>> items = jdbc.sql("""
            select wi.product_id,p.slug,p.name,p.subtitle,p.material,p.featured,
              coalesce(c.name,'Chưa phân loại') category,media.public_url,media.alt_text,
              price.price_cents,price.compare_at_price_cents,coalesce(stock.available,0) available,
              extract(epoch from wi.created_at)*1000 added_ms
            from wishlist_items wi
            join products p on p.id=wi.product_id and p.status='active'
            left join product_categories pc on pc.product_id=p.id and pc.is_primary=true
            left join categories c on c.id=pc.category_id
            left join lateral (
              select public_url,alt_text from product_media
              where product_id=p.id order by sort_order,created_at limit 1
            ) media on true
            left join lateral (
              select min(price_cents) price_cents,min(compare_at_price_cents) compare_at_price_cents
              from product_variants where product_id=p.id and status='active'
            ) price on true
            left join lateral (
              select coalesce(sum(greatest(ii.on_hand-ii.reserved,0)),0) available
              from product_variants pv
              join inventory_items ii on ii.variant_id=pv.id
              join warehouses w on w.id=ii.warehouse_id and w.status='active'
              where pv.product_id=p.id and pv.status='active'
            ) stock on true
            where wi.user_id=:userId
            order by wi.created_at desc,p.name
            """).param("userId", principal.id()).query(this::wishlistItem).list();
        return Maps.of("items", items, "total", items.size(), "limit", MAX_ITEMS);
    }

    @Transactional
    public Map<String, Object> add(String productId, AuthPrincipal principal) {
        accounts.ensure(principal);
        lockUserWishlist(principal.id());

        boolean exists = jdbc.sql("""
            select exists(select 1 from wishlist_items where user_id=:userId and product_id=:productId)
            """).params(Map.of("userId", principal.id(), "productId", productId))
            .query(Boolean.class).single();
        if (exists) return Maps.of("productId", productId, "added", false, "idempotentReplay", true);

        long count = jdbc.sql("select count(*) from wishlist_items where user_id=:userId")
            .param("userId", principal.id()).query(Long.class).single();
        if (count >= MAX_ITEMS) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "WISHLIST_LIMIT",
                "Danh sách yêu thích chỉ lưu tối đa " + MAX_ITEMS + " sản phẩm."
            );
        }

        int inserted = jdbc.sql("""
            insert into wishlist_items(user_id,product_id)
            select :userId,id from products where id=:productId and status='active'
            on conflict(user_id,product_id) do nothing
            """).params(Map.of("userId", principal.id(), "productId", productId)).update();
        if (inserted != 1) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm đang bán.");
        }
        return Maps.of("productId", productId, "added", true, "idempotentReplay", false);
    }

    @Transactional
    public Map<String, Object> remove(String productId, AuthPrincipal principal) {
        accounts.ensure(principal);
        int deleted = jdbc.sql("delete from wishlist_items where user_id=:userId and product_id=:productId")
            .params(Map.of("userId", principal.id(), "productId", productId)).update();
        if (deleted != 1) {
            throw new ApiException(HttpStatus.NOT_FOUND, "WISHLIST_ITEM_NOT_FOUND", "Sản phẩm không có trong danh sách yêu thích.");
        }
        return Maps.of("productId", productId, "deleted", true);
    }

    private void lockUserWishlist(String userId) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(cast(:key as text),0))")
            .param("key", "wishlist:" + userId)
            .query((rs, rowNumber) -> Boolean.TRUE)
            .single();
    }

    private Map<String, Object> wishlistItem(ResultSet rs, int rowNumber) throws SQLException {
        return Maps.of(
            "productId", rs.getString("product_id"),
            "slug", rs.getString("slug"),
            "name", rs.getString("name"),
            "subtitle", rs.getString("subtitle"),
            "material", rs.getString("material"),
            "featured", rs.getBoolean("featured"),
            "category", rs.getString("category"),
            "imageUrl", rs.getString("public_url"),
            "imageAlt", rs.getString("alt_text"),
            "priceCents", (Long) rs.getObject("price_cents"),
            "compareAtPriceCents", (Long) rs.getObject("compare_at_price_cents"),
            "available", rs.getLong("available"),
            "addedAt", rs.getBigDecimal("added_ms").longValue()
        );
    }
}
