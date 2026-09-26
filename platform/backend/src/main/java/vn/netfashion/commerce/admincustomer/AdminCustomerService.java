package vn.netfashion.commerce.admincustomer;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class AdminCustomerService {
    private static final int ORDER_HISTORY_LIMIT = 50;

    private final JdbcClient jdbc;
    private final AccountService accounts;
    private final ObjectMapper objectMapper;

    public AdminCustomerService(JdbcClient jdbc, AccountService accounts, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> list(
        String searchValue,
        String statusValue,
        String segmentValue,
        int requestedLimit,
        int requestedOffset
    ) {
        String search = AdminCustomerPolicy.normalizeSearch(searchValue);
        String apiStatus;
        String segment;
        try {
            apiStatus = AdminCustomerPolicy.normalizeStatusFilter(statusValue);
            segment = CustomerSegmentPolicy.normalize(segmentValue);
        } catch (AdminCustomerPolicy.Violation violation) {
            throw validation(violation);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "CUSTOMER_SEGMENT_INVALID", exception.getMessage());
        }

        int limit = AdminCustomerPolicy.pageSize(requestedLimit);
        int offset = AdminCustomerPolicy.offset(requestedOffset);
        Map<String, Object> params = listParams(search, apiStatus, segment, limit, offset);

        List<Map<String, Object>> items = jdbc.sql("""
            select id,email,full_name,phone,status,marketing_consent,
              extract(epoch from last_login_at)*1000 last_login_ms,
              extract(epoch from created_at)*1000 created_ms,
              total_orders,paid_orders,delivered_orders,cancelled_orders,
              total_revenue_cents,
              extract(epoch from last_order_at)*1000 last_order_ms,
              extract(epoch from last_paid_order_at)*1000 last_paid_order_ms,
              segment_code
            from admin_customer_segments
            where (:hasStatus=false
              or (:status='disabled' and status in ('blocked','disabled','locked'))
              or (:status<>'disabled' and status=:status))
              and (:hasSegment=false or segment_code=:segment)
              and (:hasSearch=false
                or lower(email) like :search escape '\\'
                or lower(coalesce(full_name,'')) like :search escape '\\'
                or lower(coalesce(phone,'')) like :search escape '\\')
            order by created_at desc,id
            limit :limit offset :offset
            """).params(params).query(this::customerSummary).list();

        long total = jdbc.sql("""
            select count(*) from admin_customer_segments
            where (:hasStatus=false
              or (:status='disabled' and status in ('blocked','disabled','locked'))
              or (:status<>'disabled' and status=:status))
              and (:hasSegment=false or segment_code=:segment)
              and (:hasSearch=false
                or lower(email) like :search escape '\\'
                or lower(coalesce(full_name,'')) like :search escape '\\'
                or lower(coalesce(phone,'')) like :search escape '\\')
            """).params(params).query(Long.class).single();

        return Maps.of(
            "items", items,
            "total", total,
            "limit", limit,
            "offset", offset,
            "hasMore", (long) offset + items.size() < total
        );
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> segments() {
        Map<String, SegmentAggregate> aggregates = jdbc.sql("""
            select segment_code,count(*) customers,coalesce(sum(total_revenue_cents),0) revenue,
              coalesce(sum(paid_orders),0) paid_orders
            from admin_customer_segments group by segment_code
            """).query((rs, rowNum) -> Map.entry(
                rs.getString("segment_code"),
                new SegmentAggregate(
                    rs.getLong("customers"),
                    rs.getLong("revenue"),
                    rs.getLong("paid_orders")
                )
            )).list().stream().collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        List<Map<String, Object>> items = CustomerSegmentPolicy.definitions().stream().map(definition -> {
            SegmentAggregate aggregate = aggregates.getOrDefault(definition.code(), new SegmentAggregate(0, 0, 0));
            return Maps.of(
                "code", definition.code(),
                "label", definition.label(),
                "description", definition.description(),
                "customers", aggregate.customers(),
                "revenueCents", aggregate.revenueCents(),
                "paidOrders", aggregate.paidOrders()
            );
        }).toList();

        return Maps.of(
            "items", items,
            "totalCustomers", items.stream().mapToLong(item -> ((Number) item.get("customers")).longValue()).sum(),
            "calculatedAt", System.currentTimeMillis(),
            "ruleVersion", "RFM-2026.1"
        );
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> detail(String customerId) {
        Map<String, Object> profile = jdbc.sql("""
            select u.id,u.email,u.full_name,u.phone,u.status,u.marketing_consent,
              extract(epoch from u.last_login_at)*1000 last_login_ms,
              extract(epoch from u.created_at)*1000 created_ms,
              extract(epoch from u.updated_at)*1000 updated_ms
            from users u
            where u.id=:id and u.status<>'deleted' and exists (
              select 1 from user_roles ur join roles r on r.id=ur.role_id
              where ur.user_id=u.id and r.code='customer'
            )
            """).param("id", customerId).query(this::customerProfile).optional()
            .orElseThrow(this::customerNotFound);

        List<String> roles = jdbc.sql("""
            select r.code from roles r join user_roles ur on ur.role_id=r.id
            where ur.user_id=:id order by r.code
            """).param("id", customerId).query(String.class).list();
        profile.put("roles", roles);

        List<Map<String, Object>> addresses = jdbc.sql("""
            select id,label,recipient_name,phone,line1,ward,district,city,postal_code,is_default,
              extract(epoch from created_at)*1000 created_ms,
              extract(epoch from updated_at)*1000 updated_ms
            from addresses where user_id=:id order by is_default desc,created_at desc,id
            """).param("id", customerId).query(this::address).list();

        CustomerStatistics statistics = jdbc.sql("""
            select total_orders,delivered_orders,cancelled_orders,paid_orders,
              total_revenue_cents,
              extract(epoch from last_order_at)*1000 last_order_ms,
              extract(epoch from last_paid_order_at)*1000 last_paid_order_ms,
              segment_code
            from admin_customer_segments where id=:id
            """).param("id", customerId).query((rs, rowNum) -> new CustomerStatistics(
                rs.getLong("total_orders"),
                rs.getLong("delivered_orders"),
                rs.getLong("cancelled_orders"),
                rs.getLong("paid_orders"),
                rs.getLong("total_revenue_cents"),
                epochMillis(rs, "last_order_ms"),
                epochMillis(rs, "last_paid_order_ms"),
                rs.getString("segment_code")
            )).single();

        List<Map<String, Object>> orderItems = jdbc.sql("""
            select id,order_number,status,payment_status,fulfillment_status,currency,
              subtotal_cents,discount_total_cents,shipping_total_cents,grand_total_cents,
              extract(epoch from placed_at)*1000 placed_ms,
              extract(epoch from created_at)*1000 created_ms
            from customer_orders where user_id=:id
            order by created_at desc,id limit :limit
            """).params(Map.of("id", customerId, "limit", ORDER_HISTORY_LIMIT))
            .query(this::orderHistory).list();

        long averageOrderValue = statistics.paidOrders() == 0
            ? 0
            : statistics.totalRevenueCents() / statistics.paidOrders();
        Map<String, Object> statisticsMap = Maps.of(
            "totalOrders", statistics.totalOrders(),
            "deliveredOrders", statistics.deliveredOrders(),
            "cancelledOrders", statistics.cancelledOrders(),
            "paidOrders", statistics.paidOrders(),
            "totalRevenueCents", statistics.totalRevenueCents(),
            "averageOrderValueCents", averageOrderValue,
            "lastOrderAt", statistics.lastOrderAt(),
            "lastPaidOrderAt", statistics.lastPaidOrderAt()
        );
        CustomerSegmentPolicy.Definition definition = CustomerSegmentPolicy.definition(statistics.segmentCode());
        Map<String, Object> segment = Maps.of(
            "code", definition.code(),
            "label", definition.label(),
            "description", definition.description(),
            "calculatedAt", System.currentTimeMillis(),
            "ruleVersion", "RFM-2026.1"
        );

        return Maps.of(
            "profile", profile,
            "segment", segment,
            "addresses", Maps.of("items", addresses, "total", addresses.size()),
            "statistics", statisticsMap,
            "orderHistory", Maps.of(
                "items", orderItems,
                "total", statistics.totalOrders(),
                "limit", ORDER_HISTORY_LIMIT
            )
        );
    }

    @Transactional
    public Map<String, Object> changeStatus(
        String customerId,
        String requestedStatus,
        String reason,
        AuthPrincipal actor,
        String correlationIdValue
    ) {
        accounts.ensure(actor);
        CustomerLock customer = lockCustomer(customerId);

        AdminCustomerPolicy.StatusChange change;
        try {
            change = AdminCustomerPolicy.validateStatusChange(
                customer.storageStatus(), requestedStatus, reason, actor.id(), customer.id()
            );
        } catch (AdminCustomerPolicy.Violation violation) {
            HttpStatus status = "CUSTOMER_DELETED".equals(violation.code())
                || "CANNOT_DISABLE_SELF".equals(violation.code())
                ? HttpStatus.CONFLICT
                : HttpStatus.UNPROCESSABLE_ENTITY;
            throw new ApiException(status, violation.code(), violation.getMessage());
        }

        if (change.unchanged()) {
            return statusResponse(customer, change, false);
        }

        int updated = jdbc.sql("""
            update users set status=:target,updated_at=now()
            where id=:id and status=:current
            """).params(Map.of(
                "target", change.targetStorageStatus(),
                "id", customer.id(),
                "current", customer.storageStatus()
            )).update();
        if (updated != 1) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "CUSTOMER_CHANGED",
                "Tài khoản khách hàng vừa được cập nhật. Vui lòng thử lại."
            );
        }

        if ("disabled".equals(change.toApiStatus())) {
            jdbc.sql("""
                update refresh_tokens set revoked_at=now()
                where user_id=:id and revoked_at is null
                """).param("id", customer.id()).update();
        }

        appendAudit(customer, change, actor.id(), correlationIdValue);
        appendOutbox(customer, change, actor.id());
        return statusResponse(customer, change, true);
    }

    private CustomerLock lockCustomer(String customerId) {
        return jdbc.sql("""
            select u.id,u.email,u.full_name,u.status
            from users u
            where u.id=:id and exists (
              select 1 from user_roles ur join roles r on r.id=ur.role_id
              where ur.user_id=u.id and r.code='customer'
            )
            for update
            """).param("id", customerId).query((rs, rowNum) -> new CustomerLock(
                rs.getString("id"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("status")
            )).optional().orElseThrow(this::customerNotFound);
    }

    private void appendAudit(
        CustomerLock customer,
        AdminCustomerPolicy.StatusChange change,
        String actorId,
        String correlationIdValue
    ) {
        jdbc.sql("""
            insert into audit_logs(
              id,actor_user_id,action,entity_type,entity_id,before_json,after_json,correlation_id
            ) values(
              :id,:actorId,'customer.status.change','customer',:customerId,
              cast(:beforeJson as jsonb),cast(:afterJson as jsonb),:correlationId
            )
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "actorId", actorId,
                "customerId", customer.id(),
                "beforeJson", json(Map.of("status", change.fromApiStatus())),
                "afterJson", json(Maps.of("status", change.toApiStatus(), "reason", change.reason())),
                "correlationId", correlationId(correlationIdValue)
            )).update();
    }

    private void appendOutbox(
        CustomerLock customer,
        AdminCustomerPolicy.StatusChange change,
        String actorId
    ) {
        jdbc.sql("""
            insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
            values(:id,'customer',:customerId,'customer.status.changed',cast(:payload as jsonb))
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "customerId", customer.id(),
                "payload", json(Maps.of(
                    "customerId", customer.id(),
                    "fromStatus", change.fromApiStatus(),
                    "toStatus", change.toApiStatus(),
                    "reason", change.reason(),
                    "actorUserId", actorId
                ))
            )).update();
    }

    private Map<String, Object> statusResponse(
        CustomerLock customer,
        AdminCustomerPolicy.StatusChange change,
        boolean changed
    ) {
        return Maps.of(
            "id", customer.id(),
            "email", customer.email(),
            "fullName", customer.fullName(),
            "fromStatus", change.fromApiStatus(),
            "status", change.toApiStatus(),
            "changed", changed
        );
    }

    private Map<String, Object> customerSummary(ResultSet rs, int rowNum) throws SQLException {
        CustomerSegmentPolicy.Definition segment = CustomerSegmentPolicy.definition(rs.getString("segment_code"));
        return Maps.of(
            "id", rs.getString("id"),
            "email", rs.getString("email"),
            "fullName", rs.getString("full_name"),
            "phone", rs.getString("phone"),
            "status", AdminCustomerPolicy.toApiStatus(rs.getString("status")),
            "marketingConsent", rs.getBoolean("marketing_consent"),
            "lastLoginAt", epochMillis(rs, "last_login_ms"),
            "createdAt", epochMillis(rs, "created_ms"),
            "totalOrders", rs.getLong("total_orders"),
            "paidOrders", rs.getLong("paid_orders"),
            "deliveredOrders", rs.getLong("delivered_orders"),
            "cancelledOrders", rs.getLong("cancelled_orders"),
            "totalRevenueCents", rs.getLong("total_revenue_cents"),
            "lastOrderAt", epochMillis(rs, "last_order_ms"),
            "lastPaidOrderAt", epochMillis(rs, "last_paid_order_ms"),
            "segmentCode", segment.code(),
            "segmentLabel", segment.label()
        );
    }

    private Map<String, Object> customerProfile(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "email", rs.getString("email"),
            "fullName", rs.getString("full_name"),
            "phone", rs.getString("phone"),
            "status", AdminCustomerPolicy.toApiStatus(rs.getString("status")),
            "marketingConsent", rs.getBoolean("marketing_consent"),
            "lastLoginAt", epochMillis(rs, "last_login_ms"),
            "createdAt", epochMillis(rs, "created_ms"),
            "updatedAt", epochMillis(rs, "updated_ms")
        );
    }

    private Map<String, Object> address(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "label", rs.getString("label"),
            "recipientName", rs.getString("recipient_name"),
            "phone", rs.getString("phone"),
            "line1", rs.getString("line1"),
            "ward", rs.getString("ward"),
            "district", rs.getString("district"),
            "province", rs.getString("city"),
            "postalCode", rs.getString("postal_code"),
            "isDefault", rs.getBoolean("is_default"),
            "createdAt", epochMillis(rs, "created_ms"),
            "updatedAt", epochMillis(rs, "updated_ms")
        );
    }

    private Map<String, Object> orderHistory(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "orderNumber", rs.getString("order_number"),
            "status", rs.getString("status"),
            "paymentStatus", rs.getString("payment_status"),
            "fulfillmentStatus", rs.getString("fulfillment_status"),
            "currency", rs.getString("currency"),
            "subtotalCents", rs.getLong("subtotal_cents"),
            "discountTotalCents", rs.getLong("discount_total_cents"),
            "shippingTotalCents", rs.getLong("shipping_total_cents"),
            "grandTotalCents", rs.getLong("grand_total_cents"),
            "placedAt", epochMillis(rs, "placed_ms"),
            "createdAt", epochMillis(rs, "created_ms")
        );
    }

    private Map<String, Object> listParams(
        String search,
        String apiStatus,
        String segment,
        int limit,
        int offset
    ) {
        return Maps.of(
            "hasSearch", search != null,
            "search", search == null ? "%" : "%" + escapeLike(search.toLowerCase(Locale.ROOT)) + "%",
            "hasStatus", apiStatus != null,
            "status", apiStatus == null ? "active" : apiStatus,
            "hasSegment", segment != null,
            "segment", segment == null ? "prospect" : segment,
            "limit", limit,
            "offset", offset
        );
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private Long epochMillis(ResultSet rs, String column) throws SQLException {
        BigDecimal value = rs.getBigDecimal(column);
        return value == null ? null : value.longValue();
    }

    private String correlationId(String value) {
        String normalized = value == null || value.isBlank() ? UUID.randomUUID().toString() : value.trim();
        return normalized.substring(0, Math.min(normalized.length(), 100));
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Không thể ghi dữ liệu audit khách hàng.", exception);
        }
    }

    private ApiException customerNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND", "Không tìm thấy khách hàng.");
    }

    private ApiException validation(AdminCustomerPolicy.Violation violation) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, violation.code(), violation.getMessage());
    }

    private record CustomerLock(String id, String email, String fullName, String storageStatus) {}

    private record CustomerStatistics(
        long totalOrders,
        long deliveredOrders,
        long cancelledOrders,
        long paidOrders,
        long totalRevenueCents,
        Long lastOrderAt,
        Long lastPaidOrderAt,
        String segmentCode
    ) {}

    private record SegmentAggregate(long customers, long revenueCents, long paidOrders) {}
}
