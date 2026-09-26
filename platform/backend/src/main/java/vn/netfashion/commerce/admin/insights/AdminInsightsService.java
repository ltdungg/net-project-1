package vn.netfashion.commerce.admin.insights;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class AdminInsightsService {
    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final AdminPromptEngine promptEngine;
    private final AccountService accounts;

    public AdminInsightsService(
        JdbcClient jdbc,
        ObjectMapper objectMapper,
        AdminPromptEngine promptEngine,
        AccountService accounts
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.promptEngine = promptEngine;
        this.accounts = accounts;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> promotions() {
        List<Map<String, Object>> items = jdbc.sql("""
            select p.id,p.name,p.description,p.type,p.value,p.min_subtotal_cents,p.max_discount_cents,
              p.usage_count,p.usage_limit,p.status,p.starts_at,p.ends_at,
              coalesce(c.code,'TỰ ĐỘNG') code
            from promotions p
            left join lateral (
              select code from coupons where promotion_id=p.id order by created_at,id limit 1
            ) c on true
            order by p.starts_at desc,p.id
            """).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "name", rs.getString("name"),
                "description", rs.getString("description"),
                "type", rs.getString("type"),
                "value", rs.getLong("value"),
                "minSubtotalCents", rs.getLong("min_subtotal_cents"),
                "maxDiscountCents", (Long) rs.getObject("max_discount_cents"),
                "usageCount", rs.getInt("usage_count"),
                "usageLimit", (Integer) rs.getObject("usage_limit"),
                "status", rs.getString("status"),
                "startsAt", rs.getTimestamp("starts_at").toInstant().toEpochMilli(),
                "endsAt", rs.getTimestamp("ends_at").toInstant().toEpochMilli(),
                "code", rs.getString("code")
            )).list();
        return Maps.of("items", items, "total", items.size());
    }

    @Transactional
    public Map<String, Object> createPromotion(
        PromotionCommand request,
        AuthPrincipal actor,
        String correlationIdValue
    ) {
        accounts.ensure(actor);
        String name = request.name().trim();
        if (name.length() < 2) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                "Tên chương trình cần có ít nhất 2 ký tự."
            );
        }
        if (request.endsAt() <= request.startsAt()) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                "Thời gian kết thúc phải sau thời gian bắt đầu."
            );
        }
        if ("percentage".equals(request.type()) && request.value() > 100) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                "Khuyến mãi phần trăm phải nằm trong khoảng 0 đến 100."
            );
        }
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        boolean exists = jdbc.sql("select exists(select 1 from coupons where lower(code)=lower(:code))")
            .param("code", code)
            .query(Boolean.class)
            .single();
        if (exists) throw couponExists();

        String promotionId = UUID.randomUUID().toString();
        String couponId = UUID.randomUUID().toString();
        long value = "free_shipping".equals(request.type()) ? 0 : request.value();
        Instant startsAt = Instant.ofEpochMilli(request.startsAt());
        Instant endsAt = Instant.ofEpochMilli(request.endsAt());
        String description = blankToNull(request.description());
        String actorId = actor.id();
        String correlationId = correlationId(correlationIdValue);

        try {
            jdbc.sql("""
                insert into promotions(
                  id,name,description,type,value,min_subtotal_cents,max_discount_cents,
                  usage_limit,usage_count,starts_at,ends_at,status,rules_json
                ) values(
                  :id,:name,:description,:type,:value,:minimum,:maximum,
                  :usageLimit,0,:startsAt,:endsAt,'active',cast(:rules as jsonb)
                )
                """).params(Maps.of(
                    "id", promotionId,
                    "name", name,
                    "description", description,
                    "type", request.type(),
                    "value", value,
                    "minimum", request.minSubtotalCents(),
                    "maximum", request.maxDiscountCents(),
                    "usageLimit", request.usageLimit(),
                    "startsAt", java.sql.Timestamp.from(startsAt),
                    "endsAt", java.sql.Timestamp.from(endsAt),
                    "rules", json(Map.of("couponCode", code, "usageLimitPerCustomer", 1))
                )).update();

            jdbc.sql("""
                insert into coupons(
                  id,promotion_id,code,usage_limit,usage_limit_per_customer,
                  usage_count,status
                ) values(:id,:promotionId,:code,:usageLimit,1,0,'active')
                """).params(Maps.of(
                    "id", couponId,
                    "promotionId", promotionId,
                    "code", code,
                    "usageLimit", request.usageLimit()
                )).update();

            Map<String, Object> after = new LinkedHashMap<>();
            after.put("promotionId", promotionId);
            after.put("couponId", couponId);
            after.put("name", name);
            after.put("description", description);
            after.put("code", code);
            after.put("type", request.type());
            after.put("value", value);
            after.put("minSubtotalCents", request.minSubtotalCents());
            after.put("maxDiscountCents", request.maxDiscountCents());
            after.put("usageLimit", request.usageLimit());
            after.put("startsAt", request.startsAt());
            after.put("endsAt", request.endsAt());
            after.put("status", "active");

            jdbc.sql("""
                insert into audit_logs(
                  id,actor_user_id,action,entity_type,entity_id,after_json,correlation_id
                ) values(:id,:actorId,'promotion.create','promotion',:promotionId,
                  cast(:afterJson as jsonb),:correlationId)
                """).params(Maps.of(
                    "id", UUID.randomUUID().toString(),
                    "actorId", actorId,
                    "promotionId", promotionId,
                    "afterJson", json(after),
                    "correlationId", correlationId
                )).update();
        } catch (DuplicateKeyException exception) {
            throw couponExists();
        }

        return Maps.of("promotionId", promotionId, "couponId", couponId, "code", code);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Metrics metrics() {
        return jdbc.sql("""
            select
              (select count(*) from customer_orders
                where created_at >= now() - interval '30 days') orders_30d,
              (select coalesce(sum(grand_total_cents),0) from customer_orders
                where payment_status='paid'
                  and status not in ('cancelled','returned','refunded')
                  and created_at >= now() - interval '30 days') revenue_30d,
              (select count(*) from inventory_items ii
                join warehouses w on w.id=ii.warehouse_id
                join product_variants pv on pv.id=ii.variant_id
                join products p on p.id=pv.product_id
                where ii.on_hand-ii.reserved <= ii.reorder_point
                  and w.status='active' and pv.status='active' and p.status='active') low_stock,
              (select count(*) from users
                where created_at >= now() - interval '30 days') new_customers_30d
            """).query((rs, rowNum) -> new Metrics(
                rs.getLong("orders_30d"),
                rs.getLong("revenue_30d"),
                rs.getLong("low_stock"),
                rs.getLong("new_customers_30d")
            )).single();
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public AdminPromptEngine.CopilotResult ask(String rawPrompt) {
        String prompt = rawPrompt == null ? "" : rawPrompt.trim();
        if (prompt.length() < 2) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                "Câu hỏi cần có ít nhất 2 ký tự."
            );
        }

        SnapshotCounts counts = jdbc.sql("""
            select
              (select count(*) from customer_orders
                where created_at >= now() - interval '30 days') orders_30d,
              (select count(*) from customer_orders
                where status in ('confirmed','processing','packed','ready_to_ship')) backlog,
              (select coalesce(sum(grand_total_cents),0) from customer_orders
                where payment_status='paid'
                  and status not in ('cancelled','returned','refunded')
                  and created_at >= now() - interval '30 days') revenue_30d,
              (select count(*) from users where status='active') customers,
              (select count(*) from promotions
                where status='active' and starts_at <= now() and ends_at >= now()) active_promotions,
              (select count(*) from inventory_items ii
                join warehouses w on w.id=ii.warehouse_id
                join product_variants pv on pv.id=ii.variant_id
                join products p on p.id=pv.product_id
                where ii.on_hand-ii.reserved <= ii.reorder_point
                  and w.status='active' and pv.status='active' and p.status='active') low_stock
            """).query((rs, rowNum) -> new SnapshotCounts(
                rs.getLong("orders_30d"),
                rs.getLong("backlog"),
                rs.getLong("revenue_30d"),
                rs.getLong("customers"),
                rs.getLong("active_promotions"),
                rs.getLong("low_stock")
            )).single();

        List<AdminPromptEngine.LowStockItem> lowStock = jdbc.sql("""
            select pv.sku,p.name product,(ii.on_hand-ii.reserved) available
            from inventory_items ii
            join product_variants pv on pv.id=ii.variant_id
            join products p on p.id=pv.product_id
            join warehouses w on w.id=ii.warehouse_id
            where ii.on_hand-ii.reserved <= ii.reorder_point
              and w.status='active' and pv.status='active' and p.status='active'
            order by available, pv.sku
            limit 5
            """).query((rs, rowNum) -> new AdminPromptEngine.LowStockItem(
                rs.getString("sku"),
                rs.getString("product"),
                rs.getLong("available")
            )).list();

        List<AdminPromptEngine.TopProduct> topProducts = jdbc.sql("""
            select oi.product_name product,sum(oi.quantity) quantity,sum(oi.total_cents) revenue
            from order_items oi
            join customer_orders o on o.id=oi.order_id
            where o.created_at >= now() - interval '30 days'
              and o.status not in ('cancelled','returned','refunded')
            group by oi.product_name
            order by quantity desc,revenue desc,oi.product_name
            limit 3
            """).query((rs, rowNum) -> new AdminPromptEngine.TopProduct(
                rs.getString("product"),
                rs.getLong("quantity"),
                rs.getLong("revenue")
            )).list();

        List<AdminPromptEngine.PromotionSummary> promotions = jdbc.sql("""
            select coalesce(c.code,'TỰ ĐỘNG') code,p.name,p.type,p.value
            from promotions p
            left join lateral(
              select code from coupons
              where promotion_id=p.id and status='active'
              order by created_at,id limit 1
            ) c on true
            where p.status='active' and p.starts_at <= now() and p.ends_at >= now()
            order by p.starts_at desc,p.id
            limit 3
            """).query((rs, rowNum) -> new AdminPromptEngine.PromotionSummary(
                rs.getString("code"),
                rs.getString("name"),
                promotionBenefit(rs.getString("type"), rs.getLong("value"))
            )).list();

        AdminPromptEngine.Snapshot snapshot = new AdminPromptEngine.Snapshot(
            counts.orders30d(),
            counts.backlog(),
            counts.revenue30d(),
            counts.customers(),
            counts.activePromotions(),
            counts.lowStock(),
            lowStock,
            topProducts,
            promotions
        );
        return promptEngine.answer(prompt, snapshot, Instant.now());
    }

    private String promotionBenefit(String type, long value) {
        return switch (type) {
            case "percentage" -> "Giảm " + value + "%";
            case "free_shipping" -> "Miễn phí giao hàng";
            case "fixed" -> "Giảm " + AdminPromptEngine.formatMoney(value);
            default -> "Ưu đãi đang hoạt động";
        };
    }

    private String correlationId(String value) {
        String result = value == null || value.isBlank() ? UUID.randomUUID().toString() : value.trim();
        return result.substring(0, Math.min(100, result.length()));
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Không thể ghi dữ liệu audit", exception);
        }
    }

    private ApiException couponExists() {
        return new ApiException(HttpStatus.CONFLICT, "COUPON_EXISTS", "Mã voucher đã tồn tại.");
    }

    public record PromotionCommand(
        String name,
        String description,
        String code,
        String type,
        long value,
        long minSubtotalCents,
        Long maxDiscountCents,
        Integer usageLimit,
        long startsAt,
        long endsAt
    ) {}

    public record Metrics(long orders30d, long revenue30dCents, long lowStock, long newCustomers30d) {}

    private record SnapshotCounts(
        long orders30d,
        long backlog,
        long revenue30d,
        long customers,
        long activePromotions,
        long lowStock
    ) {}
}
