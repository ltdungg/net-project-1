package vn.netfashion.commerce.catalog;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class CatalogService {
    private final JdbcClient jdbc;

    public CatalogService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Cacheable(cacheNames = "catalog", key = "'active'")
    public List<Map<String, Object>> products() {
        return loadProducts(false);
    }

    public List<Map<String, Object>> adminProducts() {
        return loadProducts(true);
    }

    public Map<String, Object> adminOptions() {
        List<Map<String, Object>> categories = jdbc.sql("""
            select id,slug,name,parent_id,sort_order from categories
            where status='active' order by sort_order,name
            """).query((rs, rowNumber) -> Maps.of(
                "id", rs.getString("id"),
                "slug", rs.getString("slug"),
                "name", rs.getString("name"),
                "parentId", rs.getString("parent_id"),
                "sortOrder", rs.getInt("sort_order")
            )).list();
        List<Map<String, Object>> warehouses = jdbc.sql("""
            select id,code,name,address from warehouses
            where status='active' order by code
            """).query((rs, rowNumber) -> Maps.of(
                "id", rs.getString("id"),
                "code", rs.getString("code"),
                "name", rs.getString("name"),
                "address", rs.getString("address")
            )).list();
        return Maps.of("categories", categories, "warehouses", warehouses);
    }

    private List<Map<String, Object>> loadProducts(boolean includeDrafts) {
        String statusWhere = includeDrafts ? "p.status in ('draft','active','archived')" : "p.status='active'";
        List<ProductRow> rows = jdbc.sql("""
            select p.id,p.slug,p.name,p.subtitle,p.description,p.material,p.featured,p.status,
                   coalesce(c.name,'Nữ') category,pm.public_url,pm.alt_text
            from products p
            left join product_categories pc on pc.product_id=p.id and pc.is_primary=true
            left join categories c on c.id=pc.category_id
            left join lateral (
              select public_url,alt_text from product_media where product_id=p.id order by sort_order,created_at limit 1
            ) pm on true
            where %s
            order by p.featured desc,p.published_at desc nulls last,p.created_at desc
            """.formatted(statusWhere)).query(this::productRow).list();

        Map<String, List<Map<String, Object>>> variants = new LinkedHashMap<>();
        jdbc.sql("""
            select pv.id,pv.product_id,pv.sku,pv.size,pv.color,pv.color_hex,pv.price_cents,
                   pv.compare_at_price_cents,coalesce(sum(case when w.id is not null then greatest(ii.on_hand-ii.reserved,0) else 0 end),0) available
            from product_variants pv
            left join inventory_items ii on ii.variant_id=pv.id
            left join warehouses w on w.id=ii.warehouse_id and w.status='active'
            where pv.status='active'
            group by pv.id order by pv.product_id,pv.price_cents,pv.size
            """).query((rs, rowNum) -> {
                variants.computeIfAbsent(rs.getString("product_id"), ignored -> new ArrayList<>()).add(Maps.of(
                    "id", rs.getString("id"),
                    "sku", rs.getString("sku"),
                    "size", rs.getString("size"),
                    "color", rs.getString("color"),
                    "colorHex", rs.getString("color_hex"),
                    "priceCents", rs.getLong("price_cents"),
                    "compareAtPriceCents", (Long) rs.getObject("compare_at_price_cents"),
                    "available", rs.getInt("available")
                ));
                return 1;
            }).list();

        return rows.stream().map(row -> productMap(row, variants.getOrDefault(row.id(), List.of()))).toList();
    }

    public Map<String, Object> product(String slug) {
        return products().stream().filter(item -> slug.equals(item.get("slug"))).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm."));
    }

    public VariantRow variant(String variantId) {
        return jdbc.sql("""
            select pv.id,pv.product_id,pv.sku,pv.size,pv.color,pv.color_hex,pv.price_cents,
                   p.name product_name,p.slug,pm.public_url,
                   coalesce(sum(case when w.id is not null then greatest(ii.on_hand-ii.reserved,0) else 0 end),0) available
            from product_variants pv join products p on p.id=pv.product_id
            left join inventory_items ii on ii.variant_id=pv.id
            left join warehouses w on w.id=ii.warehouse_id and w.status='active'
            left join lateral (select public_url from product_media where product_id=p.id order by sort_order limit 1) pm on true
            where pv.id=:id and pv.status='active' and p.status='active'
            group by pv.id,p.name,p.slug,pm.public_url
            """).param("id", variantId).query((rs, rowNum) -> new VariantRow(
                rs.getString("id"), rs.getString("product_id"), rs.getString("sku"), rs.getString("size"),
                rs.getString("color"), rs.getString("color_hex"), rs.getLong("price_cents"),
                rs.getString("product_name"), rs.getString("slug"), rs.getString("public_url"), rs.getInt("available")
            )).optional().orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "VARIANT_NOT_FOUND", "Biến thể sản phẩm không tồn tại."));
    }

    @Transactional
    @CacheEvict(cacheNames = "catalog", allEntries = true)
    public Map<String, Object> createProduct(CreateProduct request) {
        if (jdbc.sql("select exists(select 1 from products where slug=:slug or id=:id)")
            .params(Map.of("slug", request.slug(), "id", request.id())).query(Boolean.class).single()) {
            throw new ApiException(HttpStatus.CONFLICT, "PRODUCT_EXISTS", "Slug hoặc mã sản phẩm đã tồn tại.");
        }
        jdbc.sql("""
            insert into products(id,slug,name,subtitle,description,material,status,featured,published_at)
            values(:id,:slug,:name,:subtitle,:description,:material,:status,:featured,case when :status='active' then now() else null end)
            """).params(Maps.of(
                "id", request.id(), "slug", request.slug(), "name", request.name(), "subtitle", request.subtitle(),
                "description", request.description(), "material", request.material(), "status", request.status(), "featured", request.featured()
            )).update();
        jdbc.sql("insert into product_categories(product_id,category_id,is_primary) values(:productId,:categoryId,true)")
            .params(Map.of("productId", request.id(), "categoryId", request.categoryId())).update();
        jdbc.sql("""
            insert into product_variants(id,product_id,sku,size,color,color_hex,price_cents,compare_at_price_cents,cost_cents,status)
            values(:id,:productId,:sku,:size,:color,:colorHex,:price,:compareAt,:cost,'active')
            """).params(Maps.of(
                "id", request.variantId(), "productId", request.id(), "sku", request.sku(), "size", request.size(),
                "color", request.color(), "colorHex", request.colorHex(), "price", request.priceCents(),
                "compareAt", request.compareAtPriceCents(), "cost", request.costCents()
            )).update();
        if (request.openingStock() > 0) {
            String inventoryId = java.util.UUID.randomUUID().toString();
            jdbc.sql("""
                insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point)
                values(:id,:warehouseId,:variantId,:stock,0,:safety,:reorder)
                """).params(Maps.of(
                    "id", inventoryId, "warehouseId", request.warehouseId(), "variantId", request.variantId(),
                    "stock", request.openingStock(), "safety", request.safetyStock(), "reorder", request.reorderPoint()
                )).update();
            jdbc.sql("""
                insert into inventory_movements(id,inventory_item_id,type,quantity_delta,balance_after,reference_type,reference_id,reason,idempotency_key)
                values(:id,:item,'receipt',:stock,:stock,'product','opening','Tồn đầu kỳ',:key)
                """).params(Map.of("id", java.util.UUID.randomUUID().toString(), "item", inventoryId, "stock", request.openingStock(), "key", "opening:" + inventoryId)).update();
        }
        return Maps.of("id", request.id(), "slug", request.slug(), "variantId", request.variantId());
    }

    @Transactional
    @CacheEvict(cacheNames = "catalog", allEntries = true)
    public Map<String, Object> createAdminProduct(AdminCreateProduct request, String actorId, String correlationId) {
        String productId = java.util.UUID.randomUUID().toString();
        if (jdbc.sql("select exists(select 1 from products where lower(slug)=lower(:slug))")
            .param("slug", request.slug()).query(Boolean.class).single()) {
            throw new ApiException(HttpStatus.CONFLICT, "SLUG_EXISTS", "Slug sản phẩm đã tồn tại.");
        }
        jdbc.sql("""
            insert into products(id,slug,name,subtitle,description,material,status,featured,published_at)
            values(:id,:slug,:name,:subtitle,:description,:material,:status,:featured,case when :status='active' then now() else null end)
            """).params(Maps.of(
                "id", productId, "slug", request.slug(), "name", request.name(), "subtitle", request.subtitle(),
                "description", request.description(), "material", request.material(), "status", request.status(), "featured", request.featured()
            )).update();
        if (request.categoryId() != null && !request.categoryId().isBlank()) {
            int inserted = jdbc.sql("""
                insert into product_categories(product_id,category_id,is_primary)
                select :productId,id,true from categories where id=:categoryId and status='active'
                """).params(Map.of("productId", productId, "categoryId", request.categoryId())).update();
            if (inserted != 1) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "CATEGORY_NOT_FOUND", "Danh mục không khả dụng.");
        }
        String variantId = null;
        if (request.initialVariant() != null) {
            InitialVariant variant = request.initialVariant();
            variantId = java.util.UUID.randomUUID().toString();
            jdbc.sql("""
                insert into product_variants(id,product_id,sku,size,color,color_hex,price_cents,compare_at_price_cents,status)
                values(:id,:productId,:sku,:size,:color,:colorHex,:price,:compareAt,'active')
                """).params(Maps.of(
                    "id", variantId, "productId", productId, "sku", variant.sku().toUpperCase(Locale.ROOT), "size", variant.size(),
                    "color", variant.color(), "colorHex", variant.colorHex(), "price", variant.priceCents(), "compareAt", variant.compareAtPriceCents()
                )).update();
            String inventoryId = java.util.UUID.randomUUID().toString();
            int inventoryInserted = jdbc.sql("""
                insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point)
                select :id,id,:variantId,:stock,0,:safety,:reorder from warehouses where id=:warehouseId and status='active'
                """).params(Map.of(
                    "id", inventoryId, "variantId", variantId, "stock", variant.openingStock(), "safety", variant.safetyStock(),
                    "reorder", variant.reorderPoint(), "warehouseId", variant.warehouseId()
                )).update();
            if (inventoryInserted != 1) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "WAREHOUSE_NOT_FOUND", "Kho mở tồn không khả dụng.");
            if (variant.openingStock() > 0) {
                jdbc.sql("""
                    insert into inventory_movements(id,inventory_item_id,type,quantity_delta,balance_after,reference_type,reference_id,reason,idempotency_key)
                    values(:id,:item,'opening_balance',:stock,:stock,'product',:productId,'Tồn đầu khi tạo sản phẩm',:key)
                    """).params(Map.of(
                        "id", java.util.UUID.randomUUID().toString(), "item", inventoryId, "stock", variant.openingStock(),
                        "productId", productId, "key", "product:" + productId + ":opening"
                    )).update();
            }
        }
        String databaseActor = actorId == null ? null : jdbc.sql("select id from users where id=:id")
            .param("id", actorId).query(String.class).optional().orElse(null);
        jdbc.sql("""
            insert into audit_logs(id,actor_user_id,action,entity_type,entity_id,after_json,correlation_id)
            values(:id,:actor,'product.create','product',:productId,
              jsonb_build_object('slug',:slug,'status',:status,'variantId',:variantId),:correlation)
            """).params(Maps.of(
                "id", java.util.UUID.randomUUID().toString(), "actor", databaseActor, "productId", productId,
                "slug", request.slug(), "status", request.status(), "variantId", variantId,
                "correlation", correlationId == null || correlationId.isBlank() ? java.util.UUID.randomUUID().toString() : correlationId
            )).update();
        return Maps.of("id", productId, "slug", request.slug(), "variantId", variantId, "status", request.status());
    }

    @CacheEvict(cacheNames = "catalog", allEntries = true)
    public Map<String, Object> addMedia(String productId, String publicUrl, String storageKey, String altText) {
        if (!publicUrl.equals("/api/assets/" + storageKey)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "MEDIA_URL_INVALID", "URL ảnh không khớp với tệp đã tải lên.");
        }
        String id = java.util.UUID.randomUUID().toString();
        int updated = jdbc.sql("""
            insert into product_media(id,product_id,storage_key,public_url,media_type,alt_text,sort_order)
            select :id,id,:storageKey,:publicUrl,'image',:altText,
              coalesce((select max(sort_order)+1 from product_media where product_id=:productId),0)
            from products where id=:productId
            """).params(Map.of(
                "id", id, "productId", productId,
                "storageKey", storageKey, "publicUrl", publicUrl, "altText", altText
        )).update();
        if (updated == 0) throw new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm.");
        return Maps.of("id", id, "productId", productId, "storageKey", storageKey, "publicUrl", publicUrl, "altText", altText);
    }

    private ProductRow productRow(ResultSet rs, int rowNum) throws SQLException {
        return new ProductRow(rs.getString("id"), rs.getString("slug"), rs.getString("name"), rs.getString("subtitle"),
            rs.getString("description"), rs.getString("material"), rs.getBoolean("featured"), rs.getString("status"), rs.getString("category"),
            rs.getString("public_url"), rs.getString("alt_text"));
    }

    private Map<String, Object> productMap(ProductRow row, List<Map<String, Object>> variants) {
        Visual visual = Visual.forSlug(row.slug());
        return Maps.of(
            "id", row.id(), "slug", row.slug(), "name", row.name(), "subtitle", value(row.subtitle()),
            "description", row.description(), "material", value(row.material()), "status", row.status(), "category", row.category(),
            "featured", row.featured(), "rating", visual.rating(), "reviewCount", visual.reviews(),
            "atlasPosition", visual.position(), "atlasImage", row.publicUrl() == null ? "/product-atlas.png" : row.publicUrl(),
            "atlasSize", visual.size(), "imageAlt", row.altText() == null ? row.name() : row.altText(), "variants", variants
        );
    }

    private String value(String value) { return value == null ? "" : value; }

    private record ProductRow(String id,String slug,String name,String subtitle,String description,String material,boolean featured,String status,String category,String publicUrl,String altText) {}
    public record VariantRow(String id,String productId,String sku,String size,String color,String colorHex,long priceCents,String productName,String slug,String imageUrl,int available) {}
    private record Visual(String position,String size,double rating,int reviews) {
        static Visual forSlug(String slug) {
            String[] expandedSlugs = {
                "ao-khoac-overshirt-am", "polo-det-kim-khoi", "so-mi-lua-vang", "trench-coat-sa",
                "chan-vay-xep-ly-reu", "jeans-ong-con-lam", "cardigan-det-moc", "dam-satin-hoang-hon",
                "bomber-toi-gian", "so-mi-oxford-thanh", "blazer-linen-hien", "quan-cargo-moc",
                "tui-tote-da-doanh", "loafer-da-tram", "khan-lua-tho", "mu-luoi-trai-rung"
            };
            String[] expandedPositions = {
                "0% 0%", "33.333% 0%", "66.667% 0%", "100% 0%",
                "0% 33.333%", "33.333% 33.333%", "66.667% 33.333%", "100% 33.333%",
                "0% 66.667%", "33.333% 66.667%", "66.667% 66.667%", "100% 66.667%",
                "0% 100%", "33.333% 100%", "66.667% 100%", "100% 100%"
            };
            for (int i = 0; i < expandedSlugs.length; i++) {
                if (expandedSlugs[i].equals(slug)) {
                    return new Visual(expandedPositions[i], "400% 400%", 4.7 + (i % 3) * 0.1, 39 + i * 5);
                }
            }
            int index = switch (slug) {
                case "dam-midi-om-nhe-an" -> 1; case "quan-ong-rong-thanh" -> 2; case "so-mi-resort-tram" -> 3;
                case "quan-chinos-vung" -> 4; case "tui-deo-cheo-net" -> 5; default -> 0;
            };
            String[] positions = {"0% 0%","50% 0%","100% 0%","0% 100%","50% 100%","100% 100%"};
            return new Visual(positions[index], "300% 200%", 4.7 + (index % 3) * 0.1, 18 + index * 7);
        }
    }

    public record CreateProduct(String id,String slug,String name,String subtitle,String description,String material,String status,boolean featured,
        String categoryId,String variantId,String sku,String size,String color,String colorHex,long priceCents,Long compareAtPriceCents,Long costCents,
        String warehouseId,int openingStock,int safetyStock,int reorderPoint) {}
    public record AdminCreateProduct(String name,String slug,String subtitle,String description,String material,String status,boolean featured,
        String categoryId,InitialVariant initialVariant) {}
    public record InitialVariant(String sku,String size,String color,String colorHex,long priceCents,Long compareAtPriceCents,
        String warehouseId,int openingStock,int safetyStock,int reorderPoint) {}
}
