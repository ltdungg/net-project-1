package vn.netfashion.commerce.fulfillment;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
public class AdminFulfillmentService {
    private static final Set<String> PAYMENT_READY = Set.of("paid", "cod_pending");
    private static final Set<String> FILTER_STATUSES = Set.of(
        "pending", "processing", "ready_to_ship", "shipped", "delivered", "failed", "returned", "cancelled"
    );

    private final JdbcClient jdbc;
    private final AccountService accounts;
    private final ObjectMapper objectMapper;

    public AdminFulfillmentService(JdbcClient jdbc, AccountService accounts, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> list(
        String searchValue,
        String statusValue,
        String carrierValue,
        int requestedLimit,
        int requestedOffset
    ) {
        String search = normalizeOptional(searchValue);
        String status = normalizeStatusFilter(statusValue);
        String carrier = normalizeOptional(carrierValue);
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        int offset = Math.max(0, requestedOffset);
        Map<String, Object> params = Maps.of(
            "hasSearch", search != null,
            "search", search == null ? "" : '%' + escapeLike(search.toLowerCase(Locale.ROOT)) + '%',
            "hasStatus", status != null,
            "status", status == null ? "" : status,
            "hasCarrier", carrier != null,
            "carrier", carrier == null ? "" : carrier.toLowerCase(Locale.ROOT),
            "limit", limit,
            "offset", offset
        );

        List<Map<String, Object>> items = jdbc.sql("""
            select f.id,f.shipment_number,f.status,f.carrier,f.service_code,f.tracking_number,
              f.delivery_attempts,f.last_failure_reason,f.version,
              extract(epoch from f.estimated_delivery_at)*1000 estimated_delivery_ms,
              extract(epoch from f.updated_at)*1000 updated_ms,
              o.id order_id,o.order_number,o.email,o.phone,o.payment_status,o.grand_total_cents,
              w.code warehouse_code,w.name warehouse_name,
              coalesce(sum(fi.quantity),0)::integer total_quantity
            from fulfillments f
            join customer_orders o on o.id=f.order_id
            left join warehouses w on w.id=f.warehouse_id
            left join fulfillment_items fi on fi.fulfillment_id=f.id
            where (:hasStatus=false or f.status=:status)
              and (:hasCarrier=false or lower(coalesce(f.carrier,''))=:carrier)
              and (:hasSearch=false
                or lower(f.shipment_number) like :search escape '\\'
                or lower(o.order_number) like :search escape '\\'
                or lower(o.email) like :search escape '\\'
                or lower(coalesce(f.tracking_number,'')) like :search escape '\\')
            group by f.id,o.id,w.id
            order by
              case f.status when 'failed' then 0 when 'ready_to_ship' then 1 when 'processing' then 2 else 3 end,
              f.updated_at desc,f.id
            limit :limit offset :offset
            """).params(params).query(this::summaryRow).list();

        long total = jdbc.sql("""
            select count(*)
            from fulfillments f join customer_orders o on o.id=f.order_id
            where (:hasStatus=false or f.status=:status)
              and (:hasCarrier=false or lower(coalesce(f.carrier,''))=:carrier)
              and (:hasSearch=false
                or lower(f.shipment_number) like :search escape '\\'
                or lower(o.order_number) like :search escape '\\'
                or lower(o.email) like :search escape '\\'
                or lower(coalesce(f.tracking_number,'')) like :search escape '\\')
            """).params(params).query(Long.class).single();

        Map<String, Object> operationalSummary = jdbc.sql("""
            select count(*) total,
              count(*) filter(where status in ('pending','processing','ready_to_ship')) waiting,
              count(*) filter(where status='ready_to_ship') ready,
              count(*) filter(where status='shipped') in_transit,
              count(*) filter(where status='failed') exceptions,
              count(*) filter(where status='delivered' and delivered_at>=current_date) delivered_today
            from fulfillments
            """).query((rs, rowNum) -> Maps.of(
                "total", rs.getLong("total"),
                "waiting", rs.getLong("waiting"),
                "readyToShip", rs.getLong("ready"),
                "inTransit", rs.getLong("in_transit"),
                "exceptions", rs.getLong("exceptions"),
                "deliveredToday", rs.getLong("delivered_today")
            )).single();

        return Maps.of(
            "items", items,
            "summary", operationalSummary,
            "total", total,
            "limit", limit,
            "offset", offset,
            "hasMore", (long) offset + items.size() < total
        );
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> detail(String fulfillmentId) {
        Map<String, Object> fulfillment = jdbc.sql("""
            select f.id,f.shipment_number,f.order_id,f.warehouse_id,f.status,f.carrier,f.service_code,
              f.tracking_number,f.provider_reference,f.shipping_cost_cents,f.address_snapshot_json::text address_json,
              f.delivery_attempts,f.last_failure_reason,f.notes,f.version,
              extract(epoch from f.estimated_delivery_at)*1000 estimated_delivery_ms,
              extract(epoch from f.shipped_at)*1000 shipped_ms,
              extract(epoch from f.delivered_at)*1000 delivered_ms,
              extract(epoch from f.created_at)*1000 created_ms,
              extract(epoch from f.updated_at)*1000 updated_ms,
              o.order_number,o.email,o.phone,o.status order_status,o.payment_status,o.fulfillment_status,
              o.grand_total_cents,w.code warehouse_code,w.name warehouse_name
            from fulfillments f
            join customer_orders o on o.id=f.order_id
            left join warehouses w on w.id=f.warehouse_id
            where f.id=:id
            """).param("id", fulfillmentId).query(this::detailRow).optional()
            .orElseThrow(this::notFound);

        fulfillment.put("items", items(fulfillmentId));
        fulfillment.put("events", events(fulfillmentId));
        fulfillment.put("nextStatuses", FulfillmentStateMachine.nextStatuses(String.valueOf(fulfillment.get("status"))));
        return fulfillment;
    }

    @Transactional
    public Map<String, Object> updateTracking(
        String fulfillmentId,
        TrackingChange command,
        AuthPrincipal actor,
        String correlationIdValue
    ) {
        accounts.ensure(actor);
        FulfillmentLock fulfillment = lock(fulfillmentId);
        assertVersion(fulfillment, command.expectedVersion());
        if (Set.of("delivered", "returned", "cancelled").contains(fulfillment.status())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "FULFILLMENT_TERMINAL",
                "Không thể sửa mã vận đơn sau khi phiếu giao đã kết thúc."
            );
        }

        String carrier = required(command.carrier(), "Đơn vị vận chuyển");
        String trackingNumber = required(command.trackingNumber(), "Mã vận đơn");
        String serviceCode = normalizeOptional(command.serviceCode());
        String providerReference = normalizeOptional(command.providerReference());
        String notes = normalizeOptional(command.notes());
        Timestamp estimated = command.estimatedDeliveryAt() == null
            ? null
            : Timestamp.from(Instant.ofEpochMilli(command.estimatedDeliveryAt()));

        int changed = jdbc.sql("""
            update fulfillments set carrier=:carrier,service_code=:serviceCode,tracking_number=:trackingNumber,
              provider_reference=:providerReference,shipping_cost_cents=:shippingCost,
              estimated_delivery_at=:estimated,notes=:notes,version=version+1,updated_at=now()
            where id=:id and version=:version
            """).params(Maps.of(
                "carrier", carrier,
                "serviceCode", serviceCode,
                "trackingNumber", trackingNumber,
                "providerReference", providerReference,
                "shippingCost", command.shippingCostCents(),
                "estimated", estimated,
                "notes", notes,
                "id", fulfillment.id(),
                "version", fulfillment.version()
            )).update();
        if (changed != 1) throw changed();

        appendEvent(
            fulfillment.id(),
            fulfillment.status(),
            fulfillment.status(),
            "Cập nhật thông tin vận đơn",
            actor.id(),
            Maps.of("carrier", carrier, "trackingNumber", trackingNumber)
        );
        appendAudit(
            fulfillment,
            "fulfillment.tracking.update",
            Maps.of("carrier", fulfillment.carrier(), "trackingNumber", fulfillment.trackingNumber(), "version", fulfillment.version()),
            Maps.of("carrier", carrier, "trackingNumber", trackingNumber, "version", fulfillment.version() + 1),
            actor.id(),
            correlationIdValue
        );
        appendOutbox(fulfillment, "fulfillment.tracking.updated", Maps.of(
            "carrier", carrier,
            "trackingNumber", trackingNumber,
            "actorUserId", actor.id()
        ));
        return detail(fulfillment.id());
    }

    @Transactional
    public Map<String, Object> changeStatus(
        String fulfillmentId,
        StatusChange command,
        AuthPrincipal actor,
        String correlationIdValue
    ) {
        accounts.ensure(actor);
        FulfillmentLock fulfillment = lock(fulfillmentId);
        assertVersion(fulfillment, command.expectedVersion());
        String targetStatus = command.status().trim().toLowerCase(Locale.ROOT);
        String reason = normalizeOptional(command.reason());
        FulfillmentStateMachine.validate(fulfillment.status(), targetStatus, reason);

        if (!"cancelled".equals(targetStatus) && !PAYMENT_READY.contains(fulfillment.paymentStatus())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PAYMENT_NOT_READY",
                "Đơn hàng chưa đủ điều kiện thanh toán để xử lý giao hàng."
            );
        }
        if ("shipped".equals(targetStatus)
            && (normalizeOptional(fulfillment.carrier()) == null || normalizeOptional(fulfillment.trackingNumber()) == null)) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "TRACKING_REQUIRED",
                "Cần nhập đơn vị vận chuyển và mã vận đơn trước khi bàn giao."
            );
        }
        if ("cancelled".equals(targetStatus) && Set.of("paid", "authorized").contains(fulfillment.paymentStatus())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "REFUND_REQUIRED",
                "Đơn đã thanh toán; cần hoàn tiền trước khi hủy phiếu giao."
            );
        }
        if ("cancelled".equals(targetStatus) && hasActiveSiblingForPartialCancellation(fulfillment)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PARTIAL_CANCEL_UNSUPPORTED",
                "Đơn có nhiều kiện; hãy hủy toàn đơn để giá trị đơn, thanh toán và tồn kho luôn nhất quán."
            );
        }
        if ("returned".equals(targetStatus) && hasSiblingInStatus(fulfillment, "delivered")) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PARTIAL_RETURN_UNSUPPORTED",
                "Đơn đã có kiện giao thành công; cần quy trình hoàn tiền và đối soát riêng trước khi hoàn kiện còn lại."
            );
        }
        if ("delivered".equals(targetStatus) && hasSiblingInStatus(fulfillment, "returned")) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PARTIAL_DELIVERY_UNSUPPORTED",
                "Đơn đã có kiện hoàn về; không thể ghi nhận giao một phần khi chưa có quy trình đối soát riêng."
            );
        }

        if ("shipped".equals(targetStatus)) {
            consumeReservations(fulfillment, actor.id());
        } else if ("cancelled".equals(targetStatus)) {
            releaseReservations(fulfillment, actor.id(), reason);
        } else if ("returned".equals(targetStatus)) {
            releasePreDispatchReturn(fulfillment, actor.id(), reason);
        }

        int changed = jdbc.sql("""
            update fulfillments set status=:target,
              shipped_at=case when :target='shipped' then coalesce(shipped_at,now()) else shipped_at end,
              delivered_at=case when :target='delivered' then coalesce(delivered_at,now()) else delivered_at end,
              delivery_attempts=delivery_attempts+case when :target='failed' then 1 else 0 end,
              last_failure_reason=case
                when :target='failed' then :reason
                when :target in ('processing','shipped','delivered') then null
                else last_failure_reason end,
              version=version+1,updated_at=now()
            where id=:id and status=:current and version=:version
            """).params(Map.of(
                "target", targetStatus,
                "reason", reason == null ? "" : reason,
                "id", fulfillment.id(),
                "current", fulfillment.status(),
                "version", fulfillment.version()
            )).update();
        if (changed != 1) throw changed();

        appendEvent(
            fulfillment.id(), fulfillment.status(), targetStatus, reason, actor.id(),
            Maps.of("orderId", fulfillment.orderId(), "shipmentNumber", fulfillment.shipmentNumber())
        );
        appendAudit(
            fulfillment,
            "fulfillment.status.change",
            Maps.of("status", fulfillment.status(), "version", fulfillment.version()),
            Maps.of("status", targetStatus, "reason", reason, "version", fulfillment.version() + 1),
            actor.id(),
            correlationIdValue
        );
        appendOutbox(fulfillment, "fulfillment.status.changed", Maps.of(
            "fromStatus", fulfillment.status(),
            "toStatus", targetStatus,
            "reason", reason,
            "actorUserId", actor.id()
        ));
        reconcileOrder(fulfillment, targetStatus, actor.id(), reason);
        return detail(fulfillment.id());
    }

    private boolean hasActiveSiblingForPartialCancellation(FulfillmentLock fulfillment) {
        return jdbc.sql("""
            select exists(
              select 1 from fulfillments
              where order_id=:orderId and id<>:id and status not in ('cancelled','returned')
            )
            """).params(Map.of("orderId", fulfillment.orderId(), "id", fulfillment.id()))
            .query(Boolean.class).single();
    }

    private boolean hasSiblingInStatus(FulfillmentLock fulfillment, String status) {
        return jdbc.sql("""
            select exists(
              select 1 from fulfillments where order_id=:orderId and id<>:id and status=:status
            )
            """).params(Map.of(
                "orderId", fulfillment.orderId(),
                "id", fulfillment.id(),
                "status", status
            )).query(Boolean.class).single();
    }

    private void releasePreDispatchReturn(FulfillmentLock fulfillment, String actorId, String reason) {
        List<ReservationRow> rows = lockReservations(fulfillment.id());
        assertCoverage(fulfillment.id(), rows);
        boolean hasActive = rows.stream().anyMatch(row -> "active".equals(row.status()));
        boolean hasConsumed = rows.stream().anyMatch(row -> "consumed".equals(row.status()));
        if (hasActive && hasConsumed) throw inventoryConflict();
        if (hasActive) releaseReservations(fulfillment, actorId, reason);
        // Hàng đã xuất kho vẫn giữ reservation ở trạng thái consumed cho đến khi
        // kho tiếp nhận và kiểm định hoàn trả; tránh tự cộng tồn hàng hư hỏng.
    }

    private FulfillmentLock lock(String fulfillmentId) {
        return jdbc.sql("""
            select f.id,f.shipment_number,f.order_id,f.status,f.carrier,f.tracking_number,f.version,
              o.order_number,o.status order_status,o.payment_status,o.fulfillment_status
            from fulfillments f join customer_orders o on o.id=f.order_id
            where f.id=:id for update of f,o
            """).param("id", fulfillmentId).query((rs, rowNum) -> new FulfillmentLock(
                rs.getString("id"),
                rs.getString("shipment_number"),
                rs.getString("order_id"),
                rs.getString("status"),
                rs.getString("carrier"),
                rs.getString("tracking_number"),
                rs.getInt("version"),
                rs.getString("order_number"),
                rs.getString("order_status"),
                rs.getString("payment_status"),
                rs.getString("fulfillment_status")
            )).optional().orElseThrow(this::notFound);
    }

    private void consumeReservations(FulfillmentLock fulfillment, String actorId) {
        List<ReservationRow> rows = lockReservations(fulfillment.id());
        assertCoverage(fulfillment.id(), rows);
        if (rows.stream().allMatch(row -> "consumed".equals(row.status()))) return;
        if (rows.stream().anyMatch(row -> !"active".equals(row.status()))) throw inventoryConflict();

        for (ReservationGroup group : reservationGroups(rows).values()) {
            if (group.onHand < group.quantity || group.reserved < group.quantity) throw inventoryConflict();
            int inventoryChanged = jdbc.sql("""
                update inventory_items set on_hand=on_hand-:quantity,reserved=reserved-:quantity,
                  version=version+1,updated_at=now()
                where id=:itemId and on_hand>=:quantity and reserved>=:quantity
                """).params(Map.of("quantity", group.quantity, "itemId", group.itemId)).update();
            if (inventoryChanged != 1) throw inventoryConflict();

            int reservationsChanged = jdbc.sql("""
                update inventory_reservations set status='consumed',released_at=now()
                where id in (
                  select fi.reservation_id from fulfillment_items fi
                  where fi.fulfillment_id=:fulfillmentId and fi.reservation_id is not null
                ) and inventory_item_id=:itemId and status='active'
                """).params(Map.of("fulfillmentId", fulfillment.id(), "itemId", group.itemId)).update();
            if (reservationsChanged != group.count) throw inventoryConflict();

            insertMovement(
                fulfillment,
                group.itemId,
                "sale",
                -group.quantity,
                group.onHand - group.quantity,
                "Xuất bán theo phiếu " + fulfillment.shipmentNumber(),
                "fulfillment:" + fulfillment.id() + ":ship:" + group.itemId,
                actorId
            );
        }
    }

    private void releaseReservations(FulfillmentLock fulfillment, String actorId, String reason) {
        List<ReservationRow> rows = lockReservations(fulfillment.id());
        assertCoverage(fulfillment.id(), rows);
        if (rows.stream().anyMatch(row -> "consumed".equals(row.status()))) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "RETURN_REQUIRED",
                "Hàng đã xuất kho; hãy chuyển sang quy trình hoàn hàng thay vì hủy phiếu giao."
            );
        }
        if (rows.stream().allMatch(row -> "released".equals(row.status()))) return;
        if (rows.stream().anyMatch(row -> !"active".equals(row.status()))) throw inventoryConflict();

        for (ReservationGroup group : reservationGroups(rows).values()) {
            if (group.reserved < group.quantity) throw inventoryConflict();
            int inventoryChanged = jdbc.sql("""
                update inventory_items set reserved=reserved-:quantity,version=version+1,updated_at=now()
                where id=:itemId and reserved>=:quantity
                """).params(Map.of("quantity", group.quantity, "itemId", group.itemId)).update();
            if (inventoryChanged != 1) throw inventoryConflict();

            int reservationsChanged = jdbc.sql("""
                update inventory_reservations set status='released',released_at=now()
                where id in (
                  select fi.reservation_id from fulfillment_items fi
                  where fi.fulfillment_id=:fulfillmentId and fi.reservation_id is not null
                ) and inventory_item_id=:itemId and status='active'
                """).params(Map.of("fulfillmentId", fulfillment.id(), "itemId", group.itemId)).update();
            if (reservationsChanged != group.count) throw inventoryConflict();

            insertMovement(
                fulfillment,
                group.itemId,
                "release",
                0,
                group.onHand,
                reason == null ? "Nhả tồn do hủy phiếu " + fulfillment.shipmentNumber() : reason,
                "fulfillment:" + fulfillment.id() + ":cancel:" + group.itemId,
                actorId
            );
        }
    }

    private List<ReservationRow> lockReservations(String fulfillmentId) {
        return jdbc.sql("""
            select ir.id,ir.inventory_item_id,ir.status,fi.quantity,ii.on_hand,ii.reserved
            from fulfillment_items fi
            join inventory_reservations ir on ir.id=fi.reservation_id
            join inventory_items ii on ii.id=ir.inventory_item_id
            where fi.fulfillment_id=:fulfillmentId
            order by ii.id,ir.id for update of ir,ii
            """).param("fulfillmentId", fulfillmentId).query((rs, rowNum) -> new ReservationRow(
                rs.getString("id"),
                rs.getString("inventory_item_id"),
                rs.getString("status"),
                rs.getInt("quantity"),
                rs.getInt("on_hand"),
                rs.getInt("reserved")
            )).list();
    }

    private void assertCoverage(String fulfillmentId, List<ReservationRow> rows) {
        int expected = jdbc.sql("select coalesce(sum(quantity),0)::integer from fulfillment_items where fulfillment_id=:id")
            .param("id", fulfillmentId).query(Integer.class).single();
        int actual = rows.stream().mapToInt(ReservationRow::quantity).sum();
        if (expected <= 0 || expected != actual) throw inventoryConflict();
    }

    private Map<String, ReservationGroup> reservationGroups(List<ReservationRow> rows) {
        Map<String, ReservationGroup> groups = new LinkedHashMap<>();
        for (ReservationRow row : rows) {
            ReservationGroup group = groups.computeIfAbsent(
                row.itemId(),
                ignored -> new ReservationGroup(row.itemId(), row.onHand(), row.reserved())
            );
            group.quantity += row.quantity();
            group.count++;
        }
        return groups;
    }

    private void reconcileOrder(FulfillmentLock fulfillment, String changedStatus, String actorId, String reason) {
        List<String> statuses = jdbc.sql("select status from fulfillments where order_id=:orderId order by id")
            .param("orderId", fulfillment.orderId()).query(String.class).list();
        if (statuses.isEmpty()) return;

        boolean allCancelled = statuses.stream().allMatch("cancelled"::equals);
        boolean allDelivered = statuses.stream().allMatch("delivered"::equals);
        boolean allReturnedOrDelivered = statuses.stream().allMatch(status -> Set.of("returned", "delivered").contains(status));
        boolean allReturnedOrCancelled = statuses.stream().allMatch(status -> Set.of("returned", "cancelled").contains(status));
        boolean allTerminal = statuses.stream().allMatch(status -> Set.of("delivered", "returned", "cancelled").contains(status));
        boolean anyReturned = statuses.contains("returned");
        boolean anyDelivered = statuses.contains("delivered");
        boolean allReady = statuses.stream().allMatch("ready_to_ship"::equals);
        boolean allShippedOrDelivered = statuses.stream().allMatch(status -> Set.of("shipped", "delivered").contains(status));
        boolean anyOutbound = statuses.stream().anyMatch(status -> Set.of("shipped", "delivered", "returned").contains(status));
        boolean anyInProgress = statuses.stream().anyMatch(status -> Set.of("processing", "ready_to_ship", "failed").contains(status));

        String orderStatus;
        String fulfillmentStatus;
        if (allCancelled) {
            orderStatus = "cancelled";
            fulfillmentStatus = "cancelled";
        } else if (allDelivered) {
            orderStatus = "delivered";
            fulfillmentStatus = "fulfilled";
        } else if ((allReturnedOrDelivered || allReturnedOrCancelled) && anyReturned) {
            orderStatus = "returned";
            fulfillmentStatus = "returned";
        } else if (allShippedOrDelivered) {
            orderStatus = "shipped";
            fulfillmentStatus = "shipped";
        } else if (anyOutbound) {
            orderStatus = "shipped";
            fulfillmentStatus = "partially_fulfilled";
        } else if (allReady) {
            orderStatus = "ready_to_ship";
            fulfillmentStatus = "reserved";
        } else if (anyInProgress) {
            orderStatus = "processing";
            fulfillmentStatus = "reserved";
        } else {
            orderStatus = fulfillment.orderStatus();
            fulfillmentStatus = "reserved";
        }

        String paymentStatus = fulfillment.paymentStatus();
        if (allDelivered && "cod_pending".equals(paymentStatus)) {
            int captured = jdbc.sql("""
                update payments set status='succeeded',captured_at=coalesce(captured_at,now()),updated_at=now()
                where order_id=:orderId and method='cod' and status='pending'
                """).param("orderId", fulfillment.orderId()).update();
            if (captured != 1) {
                throw new ApiException(
                    HttpStatus.CONFLICT,
                    "PAYMENT_STATE_CONFLICT",
                    "Không thể xác nhận thu tiền COD cho đơn hàng."
                );
            }
            paymentStatus = "paid";
        } else if (allCancelled && Set.of("pending", "failed", "cod_pending").contains(paymentStatus)) {
            jdbc.sql("""
                update payments set status='cancelled',updated_at=now()
                where order_id=:orderId and status in ('pending','failed')
                """).param("orderId", fulfillment.orderId()).update();
            paymentStatus = "cancelled";
        } else if (allTerminal && !allDelivered && "cod_pending".equals(paymentStatus)) {
            String terminalPaymentStatus = anyDelivered ? "failed" : "cancelled";
            jdbc.sql("""
                update payments set status=:status,
                  failure_code=case when :status='failed' then 'PARTIAL_DELIVERY_REVIEW' else failure_code end,
                  failure_message=case when :status='failed'
                    then 'Đơn có kết quả giao/hoàn hỗn hợp, cần đối soát thủ công.' else failure_message end,
                  updated_at=now()
                where order_id=:orderId and method='cod' and status='pending'
                """).params(Map.of(
                    "status", terminalPaymentStatus,
                    "orderId", fulfillment.orderId()
                )).update();
            paymentStatus = terminalPaymentStatus;
        }

        int changed = jdbc.sql("""
            update customer_orders set status=:status,payment_status=:paymentStatus,
              fulfillment_status=:fulfillmentStatus,
              cancelled_at=case when :status='cancelled' then coalesce(cancelled_at,now()) else cancelled_at end,
              updated_at=now()
            where id=:id
            """).params(Map.of(
                "status", orderStatus,
                "paymentStatus", paymentStatus,
                "fulfillmentStatus", fulfillmentStatus,
                "id", fulfillment.orderId()
            )).update();
        if (changed != 1) throw changed();

        if (!orderStatus.equals(fulfillment.orderStatus())) {
            jdbc.sql("""
                insert into order_status_history(id,order_id,from_status,to_status,reason,actor_user_id,metadata_json)
                values(:id,:orderId,:fromStatus,:toStatus,:reason,:actorId,cast(:metadata as jsonb))
                """).params(Maps.of(
                    "id", UUID.randomUUID().toString(),
                    "orderId", fulfillment.orderId(),
                    "fromStatus", fulfillment.orderStatus(),
                    "toStatus", orderStatus,
                    "reason", "Đồng bộ từ phiếu giao " + fulfillment.shipmentNumber()
                        + (reason == null ? "" : ": " + reason),
                    "actorId", actorId,
                    "metadata", json(Map.of(
                        "fulfillmentId", fulfillment.id(),
                        "fulfillmentStatus", changedStatus
                    ))
                )).update();
        }
    }

    private void insertMovement(
        FulfillmentLock fulfillment,
        String itemId,
        String type,
        int quantityDelta,
        int balanceAfter,
        String reason,
        String idempotencyKey,
        String actorId
    ) {
        int inserted = jdbc.sql("""
            insert into inventory_movements(id,inventory_item_id,type,quantity_delta,balance_after,
              reference_type,reference_id,reason,idempotency_key,actor_user_id)
            values(:id,:itemId,:type,:delta,:balance,'fulfillment',:fulfillmentId,:reason,:key,:actorId)
            on conflict(idempotency_key) do nothing
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "itemId", itemId,
                "type", type,
                "delta", quantityDelta,
                "balance", balanceAfter,
                "fulfillmentId", fulfillment.id(),
                "reason", reason,
                "key", idempotencyKey,
                "actorId", actorId
            )).update();
        if (inserted != 1) throw inventoryConflict();
    }

    private void appendEvent(
        String fulfillmentId,
        String fromStatus,
        String toStatus,
        String reason,
        String actorId,
        Object metadata
    ) {
        jdbc.sql("""
            insert into fulfillment_events(id,fulfillment_id,from_status,to_status,reason,actor_user_id,metadata_json)
            values(:id,:fulfillmentId,:fromStatus,:toStatus,:reason,:actorId,cast(:metadata as jsonb))
            """).params(Maps.of(
                "id", UUID.randomUUID().toString(),
                "fulfillmentId", fulfillmentId,
                "fromStatus", fromStatus,
                "toStatus", toStatus,
                "reason", reason,
                "actorId", actorId,
                "metadata", json(metadata)
            )).update();
    }

    private void appendAudit(
        FulfillmentLock fulfillment,
        String action,
        Object before,
        Object after,
        String actorId,
        String correlationIdValue
    ) {
        jdbc.sql("""
            insert into audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,correlation_id)
            values(:id,:actorId,:action,'fulfillment',:entityId,cast(:before as jsonb),cast(:after as jsonb),:correlationId)
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "actorId", actorId,
                "action", action,
                "entityId", fulfillment.id(),
                "before", json(before),
                "after", json(after),
                "correlationId", correlationId(correlationIdValue)
            )).update();
    }

    private void appendOutbox(FulfillmentLock fulfillment, String eventType, Object payload) {
        jdbc.sql("""
            insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
            values(:id,'fulfillment',:aggregateId,:eventType,cast(:payload as jsonb))
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "aggregateId", fulfillment.id(),
                "eventType", eventType,
                "payload", json(Maps.of(
                    "orderId", fulfillment.orderId(),
                    "orderNumber", fulfillment.orderNumber(),
                    "shipmentNumber", fulfillment.shipmentNumber(),
                    "data", payload
                ))
            )).update();
    }

    private List<Map<String, Object>> items(String fulfillmentId) {
        return jdbc.sql("""
            select oi.id,oi.sku,oi.product_name,oi.variant_name,oi.image_url,fi.quantity,
              oi.unit_price_cents,oi.total_cents,ir.status reservation_status
            from fulfillment_items fi
            join order_items oi on oi.id=fi.order_item_id
            left join inventory_reservations ir on ir.id=fi.reservation_id
            where fi.fulfillment_id=:id order by oi.created_at,oi.id
            """).param("id", fulfillmentId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "sku", rs.getString("sku"),
                "productName", rs.getString("product_name"),
                "variantName", rs.getString("variant_name"),
                "imageUrl", rs.getString("image_url"),
                "quantity", rs.getInt("quantity"),
                "unitPriceCents", rs.getLong("unit_price_cents"),
                "totalCents", rs.getLong("total_cents"),
                "reservationStatus", rs.getString("reservation_status")
            )).list();
    }

    private List<Map<String, Object>> events(String fulfillmentId) {
        return jdbc.sql("""
            select id,from_status,to_status,reason,actor_user_id,metadata_json::text metadata_json,
              extract(epoch from created_at)*1000 created_ms
            from fulfillment_events where fulfillment_id=:id order by created_at desc,id desc
            """).param("id", fulfillmentId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "fromStatus", rs.getString("from_status"),
                "toStatus", rs.getString("to_status"),
                "reason", rs.getString("reason"),
                "actorUserId", rs.getString("actor_user_id"),
                "metadata", parseJson(rs.getString("metadata_json")),
                "createdAt", epochMillis(rs, "created_ms")
            )).list();
    }

    private Map<String, Object> summaryRow(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "shipmentNumber", rs.getString("shipment_number"),
            "status", rs.getString("status"),
            "carrier", rs.getString("carrier"),
            "serviceCode", rs.getString("service_code"),
            "trackingNumber", rs.getString("tracking_number"),
            "deliveryAttempts", rs.getInt("delivery_attempts"),
            "lastFailureReason", rs.getString("last_failure_reason"),
            "version", rs.getInt("version"),
            "estimatedDeliveryAt", epochMillis(rs, "estimated_delivery_ms"),
            "updatedAt", epochMillis(rs, "updated_ms"),
            "orderId", rs.getString("order_id"),
            "orderNumber", rs.getString("order_number"),
            "email", rs.getString("email"),
            "phone", rs.getString("phone"),
            "paymentStatus", rs.getString("payment_status"),
            "grandTotalCents", rs.getLong("grand_total_cents"),
            "warehouseCode", rs.getString("warehouse_code"),
            "warehouseName", rs.getString("warehouse_name"),
            "totalQuantity", rs.getInt("total_quantity")
        );
    }

    private Map<String, Object> detailRow(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "shipmentNumber", rs.getString("shipment_number"),
            "orderId", rs.getString("order_id"),
            "orderNumber", rs.getString("order_number"),
            "email", rs.getString("email"),
            "phone", rs.getString("phone"),
            "orderStatus", rs.getString("order_status"),
            "paymentStatus", rs.getString("payment_status"),
            "fulfillmentStatus", rs.getString("fulfillment_status"),
            "grandTotalCents", rs.getLong("grand_total_cents"),
            "warehouseId", rs.getString("warehouse_id"),
            "warehouseCode", rs.getString("warehouse_code"),
            "warehouseName", rs.getString("warehouse_name"),
            "status", rs.getString("status"),
            "carrier", rs.getString("carrier"),
            "serviceCode", rs.getString("service_code"),
            "trackingNumber", rs.getString("tracking_number"),
            "providerReference", rs.getString("provider_reference"),
            "shippingCostCents", rs.getLong("shipping_cost_cents"),
            "address", parseJson(rs.getString("address_json")),
            "estimatedDeliveryAt", epochMillis(rs, "estimated_delivery_ms"),
            "shippedAt", epochMillis(rs, "shipped_ms"),
            "deliveredAt", epochMillis(rs, "delivered_ms"),
            "deliveryAttempts", rs.getInt("delivery_attempts"),
            "lastFailureReason", rs.getString("last_failure_reason"),
            "notes", rs.getString("notes"),
            "version", rs.getInt("version"),
            "createdAt", epochMillis(rs, "created_ms"),
            "updatedAt", epochMillis(rs, "updated_ms")
        );
    }

    private void assertVersion(FulfillmentLock fulfillment, int expectedVersion) {
        if (fulfillment.version() != expectedVersion) throw changed();
    }

    private String normalizeStatusFilter(String value) {
        String status = normalizeOptional(value);
        if (status == null) return null;
        status = status.toLowerCase(Locale.ROOT);
        if (!FILTER_STATUSES.contains(status)) {
            throw new ApiException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "FULFILLMENT_STATUS_INVALID",
                "Trạng thái lọc vận chuyển không hợp lệ."
            );
        }
        return status;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String required(String value, String label) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "TRACKING_INVALID", label + " không được để trống.");
        }
        return normalized;
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private String correlationId(String value) {
        String result = value == null || value.isBlank() ? UUID.randomUUID().toString() : value.trim();
        return result.substring(0, Math.min(100, result.length()));
    }

    private ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "FULFILLMENT_NOT_FOUND", "Không tìm thấy phiếu giao hàng.");
    }

    private ApiException changed() {
        return new ApiException(
            HttpStatus.CONFLICT,
            "FULFILLMENT_CHANGED",
            "Phiếu giao vừa được cập nhật. Vui lòng tải lại dữ liệu."
        );
    }

    private ApiException inventoryConflict() {
        return new ApiException(
            HttpStatus.CONFLICT,
            "INVENTORY_CONFLICT",
            "Tồn kho hoặc reservation vừa thay đổi. Chưa thể cập nhật phiếu giao."
        );
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Không thể ghi JSON cho vận chuyển", exception);
        }
    }

    private Object parseJson(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return objectMapper.readValue(value, Object.class);
        } catch (JacksonException exception) {
            return value;
        }
    }

    private Long epochMillis(ResultSet rs, String column) throws SQLException {
        java.math.BigDecimal value = rs.getBigDecimal(column);
        return value == null ? null : value.longValue();
    }

    public record TrackingChange(
        String carrier,
        String serviceCode,
        String trackingNumber,
        String providerReference,
        Long estimatedDeliveryAt,
        long shippingCostCents,
        String notes,
        int expectedVersion
    ) {}

    public record StatusChange(String status, String reason, int expectedVersion) {}

    private record FulfillmentLock(
        String id,
        String shipmentNumber,
        String orderId,
        String status,
        String carrier,
        String trackingNumber,
        int version,
        String orderNumber,
        String orderStatus,
        String paymentStatus,
        String fulfillmentStatus
    ) {}

    private record ReservationRow(
        String id,
        String itemId,
        String status,
        int quantity,
        int onHand,
        int reserved
    ) {}

    private static final class ReservationGroup {
        private final String itemId;
        private final int onHand;
        private final int reserved;
        private int quantity;
        private int count;

        private ReservationGroup(String itemId, int onHand, int reserved) {
            this.itemId = itemId;
            this.onHand = onHand;
            this.reserved = reserved;
        }
    }
}
