package vn.netfashion.commerce.adminorder;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.Maps;

@Service
public class AdminOrderService {
    private static final Set<String> SHIPPABLE_PAYMENT_STATUSES = Set.of("paid", "cod_pending");

    private final JdbcClient jdbc;
    private final AccountService accounts;
    private final ObjectMapper objectMapper;

    public AdminOrderService(JdbcClient jdbc, AccountService accounts, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> list(String statusValue, int requestedLimit, int requestedOffset) {
        String status = normalizeStatusFilter(statusValue);
        int limit = Math.max(1, Math.min(requestedLimit, 100));
        int offset = Math.max(0, requestedOffset);
        List<Map<String, Object>> items;
        long total;

        if (status == null) {
            items = jdbc.sql("""
                select id,order_number,email,phone,status,payment_status,fulfillment_status,
                  grand_total_cents,placed_at,created_at
                from customer_orders order by created_at desc limit :limit offset :offset
                """).params(Map.of("limit", limit, "offset", offset)).query(this::orderSummary).list();
            total = jdbc.sql("select count(*) from customer_orders").query(Long.class).single();
        } else {
            items = jdbc.sql("""
                select id,order_number,email,phone,status,payment_status,fulfillment_status,
                  grand_total_cents,placed_at,created_at
                from customer_orders where status=:status
                order by created_at desc limit :limit offset :offset
                """).params(Map.of("status", status, "limit", limit, "offset", offset)).query(this::orderSummary).list();
            total = jdbc.sql("select count(*) from customer_orders where status=:status")
                .param("status", status).query(Long.class).single();
        }

        return Maps.of("items", items, "total", total, "limit", limit, "offset", offset);
    }

    public Map<String, Object> detail(String orderId) {
        Map<String, Object> order = jdbc.sql("""
            select id,order_number,user_id,email,phone,status,payment_status,fulfillment_status,currency,
              subtotal_cents,discount_total_cents,shipping_total_cents,tax_total_cents,grand_total_cents,
              shipping_address_json::text shipping_address_json,billing_address_json::text billing_address_json,
              customer_note,source,placed_at,cancelled_at,created_at,updated_at
            from customer_orders where id=:id
            """).param("id", orderId).query(this::orderDetail).optional()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng."));

        String shippingJson = (String) order.get("shippingAddressJson");
        String billingJson = (String) order.get("billingAddressJson");
        order.put("shippingAddress", parseJson(shippingJson));
        order.put("billingAddress", parseJson(billingJson));
        order.put("items", orderItems(orderId));
        order.put("history", orderHistory(orderId));
        order.put("reservations", reservations(orderId));
        order.put("payments", payments(orderId));
        order.put("fulfillments", fulfillments(orderId));
        order.put("nextStatuses", AdminOrderStateMachine.nextStatuses(String.valueOf(order.get("status"))));
        return order;
    }

    @Transactional
    public Map<String, Object> changeStatus(
        String orderId,
        StatusChange command,
        AuthPrincipal actor,
        String correlationIdValue
    ) {
        accounts.ensure(actor);
        String targetStatus = command.status().trim().toLowerCase(java.util.Locale.ROOT);
        String reason = normalizeReason(command.reason());
        OrderLock order = lockOrder(orderId);
        AdminOrderStateMachine.validate(order.status(), targetStatus, reason);

        if (Set.of("shipped", "delivered", "returned").contains(targetStatus)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "USE_FULFILLMENT_WORKFLOW",
                "Hãy cập nhật từng phiếu giao tại mục Vận chuyển để bảo đảm mã vận đơn và tồn kho chính xác."
            );
        }
        if (Set.of("confirmed", "processing", "ready_to_ship").contains(targetStatus)
            && !SHIPPABLE_PAYMENT_STATUSES.contains(order.paymentStatus())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PAYMENT_NOT_READY",
                "Đơn hàng chưa đủ điều kiện thanh toán để bắt đầu xử lý giao hàng."
            );
        }
        if ("cancelled".equals(targetStatus) && Set.of("paid", "authorized").contains(order.paymentStatus())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "REFUND_REQUIRED",
                "Đơn đã thanh toán; cần hoàn tiền trước khi hủy đơn."
            );
        }

        List<ShipmentState> shipments = lockShipments(orderId);
        validateShipmentProjection(targetStatus, shipments);

        List<ReservationRow> activeReservations = lockActiveReservations(orderId);
        if ("cancelled".equals(targetStatus)) {
            releaseReservations(order, activeReservations, actor.id(), reason);
        }

        synchronizeShipments(shipments, targetStatus, reason, actor.id());

        String fulfillmentStatus = fulfillmentStatus(order.fulfillmentStatus(), targetStatus);
        String paymentStatus = reconcilePaymentStatus(order, targetStatus);
        int changed = jdbc.sql("""
            update customer_orders set status=:target,payment_status=:paymentStatus,fulfillment_status=:fulfillment,
              cancelled_at=case when :target='cancelled' then now() else cancelled_at end,
              updated_at=now()
            where id=:id and status=:current
            """).params(Map.of(
                "target", targetStatus,
                "paymentStatus", paymentStatus,
                "fulfillment", fulfillmentStatus,
                "id", order.id(),
                "current", order.status()
            )).update();
        if (changed != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "ORDER_CHANGED", "Đơn hàng vừa được cập nhật. Vui lòng thử lại.");
        }

        appendHistory(order, targetStatus, reason, actor.id());
        appendAudit(order, targetStatus, fulfillmentStatus, reason, actor.id(), correlationIdValue);
        appendOutbox(order, targetStatus, fulfillmentStatus, reason, actor.id());

        return Maps.of(
            "id", order.id(),
            "orderNumber", order.orderNumber(),
            "fromStatus", order.status(),
            "toStatus", targetStatus,
            "paymentStatus", paymentStatus,
            "fulfillmentStatus", fulfillmentStatus
        );
    }

    private List<ShipmentState> lockShipments(String orderId) {
        return jdbc.sql("""
            select id,status,version,(shipped_at is not null) dispatched
            from fulfillments where order_id=:orderId order by id for update
            """).param("orderId", orderId).query((rs, rowNum) -> new ShipmentState(
                rs.getString("id"),
                rs.getString("status"),
                rs.getInt("version"),
                rs.getBoolean("dispatched")
            )).list();
    }

    private void validateShipmentProjection(String targetStatus, List<ShipmentState> shipments) {
        if (shipments.isEmpty()) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "FULFILLMENT_MISSING",
                "Đơn hàng chưa có phiếu giao để xử lý."
            );
        }
        if ("processing".equals(targetStatus)
            && shipments.stream().anyMatch(shipment -> !"pending".equals(shipment.status()))) {
            throw shipmentConflict();
        }
        if ("ready_to_ship".equals(targetStatus)
            && shipments.stream().anyMatch(shipment -> !"processing".equals(shipment.status()))) {
            throw shipmentConflict();
        }
        if ("cancelled".equals(targetStatus)
            && shipments.stream().anyMatch(shipment -> shipment.dispatched()
                || Set.of("shipped", "delivered", "returned").contains(shipment.status()))) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "ORDER_ALREADY_DISPATCHED",
                "Đơn đã có kiện xuất kho; hãy dùng quy trình giao thất bại hoặc hoàn hàng."
            );
        }
    }

    private void synchronizeShipments(
        List<ShipmentState> shipments,
        String orderTargetStatus,
        String reason,
        String actorId
    ) {
        String target = switch (orderTargetStatus) {
            case "processing" -> "processing";
            case "ready_to_ship" -> "ready_to_ship";
            case "cancelled" -> "cancelled";
            default -> null;
        };
        if (target == null) return;

        for (ShipmentState shipment : shipments) {
            if (shipment.status().equals(target)) continue;
            int changed = jdbc.sql("""
                update fulfillments set status=:target,version=version+1,updated_at=now()
                where id=:id and status=:current and version=:version
                """).params(Map.of(
                    "target", target,
                    "id", shipment.id(),
                    "current", shipment.status(),
                    "version", shipment.version()
                )).update();
            if (changed != 1) throw shipmentConflict();
            jdbc.sql("""
                insert into fulfillment_events(id,fulfillment_id,from_status,to_status,reason,actor_user_id,metadata_json)
                values(:id,:fulfillmentId,:fromStatus,:toStatus,:reason,:actorId,cast(:metadata as jsonb))
                """).params(Maps.of(
                    "id", UUID.randomUUID().toString(),
                    "fulfillmentId", shipment.id(),
                    "fromStatus", shipment.status(),
                    "toStatus", target,
                    "reason", reason == null ? "Đồng bộ từ trạng thái đơn hàng" : reason,
                    "actorId", actorId,
                    "metadata", json(Map.of("source", "order-workflow"))
                )).update();
            jdbc.sql("""
                insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
                values(:id,'fulfillment',:fulfillmentId,'fulfillment.status.changed',cast(:payload as jsonb))
                """).params(Map.of(
                    "id", UUID.randomUUID().toString(),
                    "fulfillmentId", shipment.id(),
                    "payload", json(Maps.of(
                        "fromStatus", shipment.status(),
                        "toStatus", target,
                        "actorUserId", actorId,
                        "source", "order-workflow"
                    ))
                )).update();
        }
    }

    private ApiException shipmentConflict() {
        return new ApiException(
            HttpStatus.CONFLICT,
            "FULFILLMENT_STATE_CONFLICT",
            "Trạng thái các phiếu giao không còn đồng bộ với đơn hàng. Hãy xử lý tại mục Vận chuyển."
        );
    }

    private String reconcilePaymentStatus(OrderLock order, String targetStatus) {
        if ("cancelled".equals(targetStatus)
            && Set.of("pending", "failed", "cod_pending").contains(order.paymentStatus())) {
            jdbc.sql("""
                update payments set status='cancelled',updated_at=now()
                where order_id=:orderId and status in ('pending','failed')
                """).param("orderId", order.id()).update();
            return "cancelled";
        }

        if ("delivered".equals(targetStatus) && "cod_pending".equals(order.paymentStatus())) {
            int captured = jdbc.sql("""
                update payments set status='succeeded',captured_at=coalesce(captured_at,now()),updated_at=now()
                where order_id=:orderId and method='cod' and status='pending'
                """).param("orderId", order.id()).update();
            if (captured != 1) {
                throw new ApiException(
                    HttpStatus.CONFLICT,
                    "PAYMENT_STATE_CONFLICT",
                    "Không thể xác nhận thu tiền COD cho đơn hàng."
                );
            }
            return "paid";
        }
        return order.paymentStatus();
    }

    private OrderLock lockOrder(String orderId) {
        return jdbc.sql("""
            select id,order_number,status,payment_status,fulfillment_status
            from customer_orders where id=:id for update
            """).param("id", orderId).query((rs, rowNum) -> new OrderLock(
                rs.getString("id"),
                rs.getString("order_number"),
                rs.getString("status"),
                rs.getString("payment_status"),
                rs.getString("fulfillment_status")
            )).optional().orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND,
                "ORDER_NOT_FOUND",
                "Không tìm thấy đơn hàng."
            ));
    }

    private List<ReservationRow> lockActiveReservations(String orderId) {
        return lockReservations(orderId, "active");
    }

    private List<ReservationRow> lockConsumedReservations(String orderId) {
        return lockReservations(orderId, "consumed");
    }

    private List<ReservationRow> lockReservations(String orderId, String status) {
        return jdbc.sql("""
            select ir.id,ir.inventory_item_id,ir.quantity,ii.variant_id,ii.on_hand,ii.reserved
            from inventory_reservations ir
            join inventory_items ii on ii.id=ir.inventory_item_id
            where ir.order_id=:orderId and ir.status=:status
            order by ii.id,ir.id for update of ir,ii
            """).params(Map.of("orderId", orderId, "status", status)).query((rs, rowNum) -> new ReservationRow(
                rs.getString("id"),
                rs.getString("inventory_item_id"),
                rs.getString("variant_id"),
                rs.getInt("quantity"),
                rs.getInt("on_hand"),
                rs.getInt("reserved")
            )).list();
    }

    private void restoreReturnedInventory(
        OrderLock order,
        List<ReservationRow> rows,
        String actorId,
        String reason
    ) {
        assertFullyReserved(order.id(), rows);
        for (ReservationGroup group : reservationGroups(rows).values()) {
            int inventoryChanged = jdbc.sql("""
                update inventory_items set on_hand=on_hand+:quantity,version=version+1,updated_at=now()
                where id=:itemId
                """).params(Map.of("quantity", group.quantity, "itemId", group.itemId)).update();
            if (inventoryChanged != 1) throw inventoryConflict();

            int reservationsChanged = jdbc.sql("""
                update inventory_reservations set status='returned',released_at=coalesce(released_at,now())
                where order_id=:orderId and inventory_item_id=:itemId and status='consumed'
                """).params(Map.of("orderId", order.id(), "itemId", group.itemId)).update();
            if (reservationsChanged != group.reservationCount) throw inventoryConflict();

            insertMovement(
                group.itemId,
                "return",
                group.quantity,
                group.onHand + group.quantity,
                order.id(),
                reason == null ? "Nhập lại hàng trả của đơn " + order.orderNumber() : reason,
                movementKey(order.id(), "return", group.itemId),
                actorId
            );
        }
    }

    private void releaseReservations(
        OrderLock order,
        List<ReservationRow> rows,
        String actorId,
        String reason
    ) {
        for (ReservationGroup group : reservationGroups(rows).values()) {
            int inventoryChanged = jdbc.sql("""
                update inventory_items set reserved=reserved-:quantity,version=version+1,updated_at=now()
                where id=:itemId and reserved>=:quantity
                """).params(Map.of("quantity", group.quantity, "itemId", group.itemId)).update();
            if (inventoryChanged != 1) throw inventoryConflict();

            int reservationsChanged = jdbc.sql("""
                update inventory_reservations set status='released',released_at=now()
                where order_id=:orderId and inventory_item_id=:itemId and status='active'
                """).params(Map.of("orderId", order.id(), "itemId", group.itemId)).update();
            if (reservationsChanged != group.reservationCount) throw inventoryConflict();

            insertMovement(
                group.itemId,
                "release",
                0,
                group.onHand,
                order.id(),
                reason == null ? "Nhả tồn do hủy đơn " + order.orderNumber() : reason,
                movementKey(order.id(), "cancel", group.itemId),
                actorId
            );
        }
    }

    private void consumeReservations(OrderLock order, List<ReservationRow> rows, String actorId) {
        if (!SHIPPABLE_PAYMENT_STATUSES.contains(order.paymentStatus())) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "PAYMENT_NOT_READY",
                "Đơn hàng chưa đủ điều kiện thanh toán để xuất kho."
            );
        }
        assertFullyReserved(order.id(), rows);

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
                where order_id=:orderId and inventory_item_id=:itemId and status='active'
                """).params(Map.of("orderId", order.id(), "itemId", group.itemId)).update();
            if (reservationsChanged != group.reservationCount) throw inventoryConflict();

            insertMovement(
                group.itemId,
                "sale",
                -group.quantity,
                group.onHand - group.quantity,
                order.id(),
                "Xuất bán cho đơn " + order.orderNumber(),
                movementKey(order.id(), "ship", group.itemId),
                actorId
            );
        }
    }

    private void assertFullyReserved(String orderId, List<ReservationRow> rows) {
        if (rows.isEmpty()) throw inventoryConflict();
        Map<String, Integer> expected = new LinkedHashMap<>();
        jdbc.sql("""
            select variant_id,sum(quantity)::integer quantity
            from order_items where order_id=:orderId group by variant_id
            """).param("orderId", orderId).query((rs, rowNum) -> {
                expected.put(rs.getString("variant_id"), rs.getInt("quantity"));
                return 1;
            }).list();

        Map<String, Integer> reserved = new LinkedHashMap<>();
        for (ReservationRow row : rows) reserved.merge(row.variantId(), row.quantity(), Integer::sum);
        if (!expected.equals(reserved)) throw inventoryConflict();
    }

    private Map<String, ReservationGroup> reservationGroups(List<ReservationRow> rows) {
        Map<String, ReservationGroup> groups = new LinkedHashMap<>();
        for (ReservationRow row : rows) {
            ReservationGroup group = groups.computeIfAbsent(
                row.itemId(),
                ignored -> new ReservationGroup(row.itemId(), row.onHand(), row.reserved())
            );
            group.quantity += row.quantity();
            group.reservationCount++;
        }
        return groups;
    }

    private void insertMovement(
        String itemId,
        String type,
        int quantityDelta,
        int balanceAfter,
        String orderId,
        String reason,
        String idempotencyKey,
        String actorId
    ) {
        int inserted = jdbc.sql("""
            insert into inventory_movements(id,inventory_item_id,type,quantity_delta,balance_after,
              reference_type,reference_id,reason,idempotency_key,actor_user_id)
            values(:id,:itemId,:type,:delta,:balance,'order',:orderId,:reason,:key,:actorId)
            on conflict(idempotency_key) do nothing
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "itemId", itemId,
                "type", type,
                "delta", quantityDelta,
                "balance", balanceAfter,
                "orderId", orderId,
                "reason", reason,
                "key", idempotencyKey,
                "actorId", actorId
            )).update();
        if (inserted != 1) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                "INVENTORY_MOVEMENT_REPLAY",
                "Biến động tồn kho của thao tác này đã được ghi nhận."
            );
        }
    }

    private void appendHistory(OrderLock order, String targetStatus, String reason, String actorId) {
        jdbc.sql("""
            insert into order_status_history(id,order_id,from_status,to_status,reason,actor_user_id)
            values(:id,:orderId,:fromStatus,:toStatus,:reason,:actorId)
            """).params(Maps.of(
                "id", UUID.randomUUID().toString(),
                "orderId", order.id(),
                "fromStatus", order.status(),
                "toStatus", targetStatus,
                "reason", reason,
                "actorId", actorId
            )).update();
    }

    private void appendAudit(
        OrderLock order,
        String targetStatus,
        String fulfillmentStatus,
        String reason,
        String actorId,
        String correlationIdValue
    ) {
        jdbc.sql("""
            insert into audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,correlation_id)
            values(:id,:actorId,'order.status.change','order',:orderId,cast(:before as jsonb),cast(:after as jsonb),:correlationId)
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "actorId", actorId,
                "orderId", order.id(),
                "before", json(Maps.of("status", order.status(), "fulfillmentStatus", order.fulfillmentStatus())),
                "after", json(Maps.of("status", targetStatus, "fulfillmentStatus", fulfillmentStatus, "reason", reason)),
                "correlationId", correlationId(correlationIdValue)
            )).update();
    }

    private void appendOutbox(
        OrderLock order,
        String targetStatus,
        String fulfillmentStatus,
        String reason,
        String actorId
    ) {
        jdbc.sql("""
            insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
            values(:id,'order',:orderId,'order.status.changed',cast(:payload as jsonb))
            """).params(Map.of(
                "id", UUID.randomUUID().toString(),
                "orderId", order.id(),
                "payload", json(Maps.of(
                    "orderNumber", order.orderNumber(),
                    "fromStatus", order.status(),
                    "toStatus", targetStatus,
                    "fulfillmentStatus", fulfillmentStatus,
                    "reason", reason,
                    "actorUserId", actorId
                ))
            )).update();
    }

    private List<Map<String, Object>> orderItems(String orderId) {
        return jdbc.sql("""
            select id,variant_id,sku,product_name,variant_name,image_url,quantity,
              unit_price_cents,discount_cents,total_cents,created_at
            from order_items where order_id=:orderId order by created_at
            """).param("orderId", orderId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "variantId", rs.getString("variant_id"),
                "sku", rs.getString("sku"),
                "productName", rs.getString("product_name"),
                "variantName", rs.getString("variant_name"),
                "imageUrl", rs.getString("image_url"),
                "quantity", rs.getInt("quantity"),
                "unitPriceCents", rs.getLong("unit_price_cents"),
                "discountCents", rs.getLong("discount_cents"),
                "totalCents", rs.getLong("total_cents"),
                "createdAt", epoch(rs, "created_at")
            )).list();
    }

    private List<Map<String, Object>> orderHistory(String orderId) {
        return jdbc.sql("""
            select id,from_status,to_status,reason,actor_user_id,metadata_json::text metadata_json,created_at
            from order_status_history where order_id=:orderId order by created_at desc
            """).param("orderId", orderId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "fromStatus", rs.getString("from_status"),
                "toStatus", rs.getString("to_status"),
                "reason", rs.getString("reason"),
                "actorUserId", rs.getString("actor_user_id"),
                "metadata", parseJson(rs.getString("metadata_json")),
                "createdAt", epoch(rs, "created_at")
            )).list();
    }

    private List<Map<String, Object>> reservations(String orderId) {
        return jdbc.sql("""
            select ir.id,ir.inventory_item_id,ir.quantity,ir.status,ir.expires_at,ir.released_at,
              ii.variant_id,pv.sku,w.id warehouse_id,w.code warehouse_code,w.name warehouse_name
            from inventory_reservations ir
            join inventory_items ii on ii.id=ir.inventory_item_id
            join product_variants pv on pv.id=ii.variant_id
            join warehouses w on w.id=ii.warehouse_id
            where ir.order_id=:orderId order by ir.created_at
            """).param("orderId", orderId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "inventoryItemId", rs.getString("inventory_item_id"),
                "variantId", rs.getString("variant_id"),
                "sku", rs.getString("sku"),
                "warehouseId", rs.getString("warehouse_id"),
                "warehouseCode", rs.getString("warehouse_code"),
                "warehouseName", rs.getString("warehouse_name"),
                "quantity", rs.getInt("quantity"),
                "status", rs.getString("status"),
                "expiresAt", epoch(rs, "expires_at"),
                "releasedAt", epoch(rs, "released_at")
            )).list();
    }

    private List<Map<String, Object>> payments(String orderId) {
        return jdbc.sql("""
            select id,provider,provider_payment_id,method,status,amount_cents,currency,
              failure_code,failure_message,captured_at,created_at,updated_at
            from payments where order_id=:orderId order by created_at
            """).param("orderId", orderId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "provider", rs.getString("provider"),
                "providerPaymentId", rs.getString("provider_payment_id"),
                "method", rs.getString("method"),
                "status", rs.getString("status"),
                "amountCents", rs.getLong("amount_cents"),
                "currency", rs.getString("currency"),
                "failureCode", rs.getString("failure_code"),
                "failureMessage", rs.getString("failure_message"),
                "capturedAt", epoch(rs, "captured_at"),
                "createdAt", epoch(rs, "created_at"),
                "updatedAt", epoch(rs, "updated_at")
            )).list();
    }

    private List<Map<String, Object>> fulfillments(String orderId) {
        return jdbc.sql("""
            select f.id,f.shipment_number,f.status,f.carrier,f.service_code,f.tracking_number,
              f.provider_reference,f.shipping_cost_cents,f.delivery_attempts,f.last_failure_reason,
              f.notes,f.version,w.code warehouse_code,w.name warehouse_name,
              extract(epoch from f.estimated_delivery_at)*1000 estimated_delivery_ms,
              extract(epoch from f.shipped_at)*1000 shipped_ms,
              extract(epoch from f.delivered_at)*1000 delivered_ms,
              extract(epoch from f.created_at)*1000 created_ms,
              extract(epoch from f.updated_at)*1000 updated_ms,
              coalesce(sum(fi.quantity),0)::integer total_quantity
            from fulfillments f
            left join warehouses w on w.id=f.warehouse_id
            left join fulfillment_items fi on fi.fulfillment_id=f.id
            where f.order_id=:orderId
            group by f.id,w.id
            order by f.created_at,f.id
            """).param("orderId", orderId).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"),
                "shipmentNumber", rs.getString("shipment_number"),
                "status", rs.getString("status"),
                "carrier", rs.getString("carrier"),
                "serviceCode", rs.getString("service_code"),
                "trackingNumber", rs.getString("tracking_number"),
                "providerReference", rs.getString("provider_reference"),
                "shippingCostCents", rs.getLong("shipping_cost_cents"),
                "warehouseCode", rs.getString("warehouse_code"),
                "warehouseName", rs.getString("warehouse_name"),
                "totalQuantity", rs.getInt("total_quantity"),
                "estimatedDeliveryAt", epochNumber(rs, "estimated_delivery_ms"),
                "shippedAt", epochNumber(rs, "shipped_ms"),
                "deliveredAt", epochNumber(rs, "delivered_ms"),
                "deliveryAttempts", rs.getInt("delivery_attempts"),
                "lastFailureReason", rs.getString("last_failure_reason"),
                "notes", rs.getString("notes"),
                "version", rs.getInt("version"),
                "createdAt", epochNumber(rs, "created_ms"),
                "updatedAt", epochNumber(rs, "updated_ms")
            )).list();
    }

    private Long epochNumber(ResultSet rs, String column) throws SQLException {
        java.math.BigDecimal value = rs.getBigDecimal(column);
        return value == null ? null : value.longValue();
    }

    private Map<String, Object> orderSummary(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "orderNumber", rs.getString("order_number"),
            "email", rs.getString("email"),
            "phone", rs.getString("phone"),
            "status", rs.getString("status"),
            "paymentStatus", rs.getString("payment_status"),
            "fulfillmentStatus", rs.getString("fulfillment_status"),
            "grandTotalCents", rs.getLong("grand_total_cents"),
            "placedAt", epoch(rs, "placed_at"),
            "createdAt", epoch(rs, "created_at")
        );
    }

    private Map<String, Object> orderDetail(ResultSet rs, int rowNum) throws SQLException {
        return Maps.of(
            "id", rs.getString("id"),
            "orderNumber", rs.getString("order_number"),
            "userId", rs.getString("user_id"),
            "email", rs.getString("email"),
            "phone", rs.getString("phone"),
            "status", rs.getString("status"),
            "paymentStatus", rs.getString("payment_status"),
            "fulfillmentStatus", rs.getString("fulfillment_status"),
            "currency", rs.getString("currency"),
            "subtotalCents", rs.getLong("subtotal_cents"),
            "discountTotalCents", rs.getLong("discount_total_cents"),
            "shippingTotalCents", rs.getLong("shipping_total_cents"),
            "taxTotalCents", rs.getLong("tax_total_cents"),
            "grandTotalCents", rs.getLong("grand_total_cents"),
            "shippingAddressJson", rs.getString("shipping_address_json"),
            "billingAddressJson", rs.getString("billing_address_json"),
            "customerNote", rs.getString("customer_note"),
            "source", rs.getString("source"),
            "placedAt", epoch(rs, "placed_at"),
            "cancelledAt", epoch(rs, "cancelled_at"),
            "createdAt", epoch(rs, "created_at"),
            "updatedAt", epoch(rs, "updated_at")
        );
    }

    private String normalizeStatusFilter(String value) {
        if (value == null || value.isBlank()) return null;
        String status = value.trim().toLowerCase(java.util.Locale.ROOT);
        if (!AdminOrderStateMachine.isKnown(status)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "ORDER_STATUS_INVALID", "Trạng thái lọc không hợp lệ.");
        }
        return status;
    }

    private String normalizeReason(String value) {
        if (value == null) return null;
        String reason = value.trim();
        return reason.isEmpty() ? null : reason;
    }

    private String fulfillmentStatus(String current, String targetStatus) {
        return switch (targetStatus) {
            case "shipped" -> "shipped";
            case "delivered" -> "fulfilled";
            case "cancelled" -> "cancelled";
            case "returned" -> "returned";
            default -> current;
        };
    }

    private ApiException inventoryConflict() {
        return new ApiException(
            HttpStatus.CONFLICT,
            "INVENTORY_CONFLICT",
            "Tồn kho hoặc reservation vừa thay đổi. Chưa thể cập nhật đơn hàng."
        );
    }

    private String movementKey(String orderId, String action, String itemId) {
        return "order:" + orderId + ":" + action + ":" + itemId;
    }

    private String correlationId(String value) {
        String result = value == null || value.isBlank() ? UUID.randomUUID().toString() : value;
        return result.substring(0, Math.min(result.length(), 100));
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Không thể ghi JSON cho audit/outbox", exception);
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

    private Long epoch(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant().toEpochMilli();
    }

    public record StatusChange(String status, String reason) {}

    private record OrderLock(
        String id,
        String orderNumber,
        String status,
        String paymentStatus,
        String fulfillmentStatus
    ) {}

    private record ShipmentState(String id, String status, int version, boolean dispatched) {}

    private record ReservationRow(
        String id,
        String itemId,
        String variantId,
        int quantity,
        int onHand,
        int reserved
    ) {}

    private static final class ReservationGroup {
        private final String itemId;
        private final int onHand;
        private final int reserved;
        private int quantity;
        private int reservationCount;

        private ReservationGroup(String itemId, int onHand, int reserved) {
            this.itemId = itemId;
            this.onHand = onHand;
            this.reserved = reserved;
        }
    }
}
