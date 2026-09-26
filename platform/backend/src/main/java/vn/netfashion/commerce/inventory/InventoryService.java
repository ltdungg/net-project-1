package vn.netfashion.commerce.inventory;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.netfashion.commerce.account.AccountService;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiException;
import vn.netfashion.commerce.common.IdempotencyKeys;
import vn.netfashion.commerce.common.Maps;

@Service
public class InventoryService {
    private final JdbcClient jdbc;
    private final AccountService accounts;
    private final ObjectMapper objectMapper;

    public InventoryService(JdbcClient jdbc, AccountService accounts, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> dashboard() {
        Map<String, Object> summary = jdbc.sql("""
            select coalesce(sum(on_hand),0) total_on_hand,coalesce(sum(reserved),0) total_reserved,
              coalesce(sum(on_hand-reserved),0) total_available,
              coalesce(sum(greatest(on_hand-reserved-safety_stock,0)),0) total_atp,
              count(*) filter(where on_hand-reserved<=reorder_point) low_stock,
              count(*) filter(where on_hand-reserved<=0) out_of_stock,count(*) sku_count
            from inventory_items
            """).query((rs, rowNum) -> Maps.of(
                "totalOnHand", rs.getLong("total_on_hand"), "totalReserved", rs.getLong("total_reserved"),
                "totalAvailable", rs.getLong("total_available"), "totalAtp", rs.getLong("total_atp"),
                "lowStock", rs.getLong("low_stock"), "outOfStock", rs.getLong("out_of_stock"), "skuCount", rs.getLong("sku_count")
            )).single();
        List<Map<String, Object>> warehouses = jdbc.sql("select id,code,name,address from warehouses where status='active' order by code")
            .query((rs, rowNum) -> Maps.of("id", rs.getString("id"), "code", rs.getString("code"), "name", rs.getString("name"), "address", rs.getString("address"))).list();
        summary.put("warehouseCount", warehouses.size());
        List<Map<String, Object>> items = jdbc.sql("""
            select ii.id,ii.warehouse_id,w.code warehouse_code,w.name warehouse_name,ii.variant_id,pv.sku,
              p.name product,pv.size,pv.color,ii.on_hand,ii.reserved,ii.safety_stock,ii.reorder_point,
              ii.on_hand-ii.reserved available,greatest(ii.on_hand-ii.reserved-ii.safety_stock,0) atp,
              ii.version,extract(epoch from ii.updated_at)*1000 updated_ms
            from inventory_items ii join warehouses w on w.id=ii.warehouse_id
            join product_variants pv on pv.id=ii.variant_id join products p on p.id=pv.product_id
            where w.status='active' and pv.status='active'
            order by case when ii.on_hand-ii.reserved<=ii.reorder_point then 0 else 1 end,p.name,pv.sku,w.code
            """).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"), "warehouseId", rs.getString("warehouse_id"), "warehouseCode", rs.getString("warehouse_code"),
                "warehouseName", rs.getString("warehouse_name"), "variantId", rs.getString("variant_id"), "sku", rs.getString("sku"),
                "product", rs.getString("product"), "size", rs.getString("size"), "color", rs.getString("color"),
                "onHand", rs.getInt("on_hand"), "reserved", rs.getInt("reserved"), "safetyStock", rs.getInt("safety_stock"),
                "reorderPoint", rs.getInt("reorder_point"), "available", rs.getInt("available"), "atp", rs.getInt("atp"),
                "version", rs.getInt("version"), "updatedAt", rs.getBigDecimal("updated_ms").longValue()
            )).list();
        List<Map<String, Object>> operations = jdbc.sql("""
            select io.id,io.operation_number,io.type,io.status,sw.name source_warehouse,dw.name destination_warehouse,
              io.reference_number,io.reason,count(ioi.id) item_count,coalesce(sum(abs(ioi.quantity)),0) total_quantity,
              extract(epoch from io.posted_at)*1000 posted_ms,extract(epoch from io.created_at)*1000 created_ms
            from inventory_operations io left join warehouses sw on sw.id=io.source_warehouse_id
            left join warehouses dw on dw.id=io.destination_warehouse_id
            left join inventory_operation_items ioi on ioi.operation_id=io.id
            group by io.id,sw.name,dw.name order by io.created_at desc limit 12
            """).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"), "operationNumber", rs.getString("operation_number"), "type", rs.getString("type"),
                "status", rs.getString("status"), "sourceWarehouse", rs.getString("source_warehouse"),
                "destinationWarehouse", rs.getString("destination_warehouse"), "referenceNumber", rs.getString("reference_number"),
                "reason", rs.getString("reason"), "itemCount", rs.getLong("item_count"), "totalQuantity", rs.getLong("total_quantity"),
                "postedAt", number(rs, "posted_ms"), "createdAt", number(rs, "created_ms")
            )).list();
        List<Map<String, Object>> movements = jdbc.sql("""
            select im.id,pv.sku,p.name product,w.code warehouse_code,im.type,im.quantity_delta,im.balance_after,
              im.reason,im.reference_id,extract(epoch from im.created_at)*1000 created_ms
            from inventory_movements im join inventory_items ii on ii.id=im.inventory_item_id
            join warehouses w on w.id=ii.warehouse_id join product_variants pv on pv.id=ii.variant_id
            join products p on p.id=pv.product_id order by im.created_at desc limit 20
            """).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"), "sku", rs.getString("sku"), "product", rs.getString("product"),
                "warehouseCode", rs.getString("warehouse_code"), "type", rs.getString("type"),
                "quantityDelta", rs.getInt("quantity_delta"), "balanceAfter", rs.getInt("balance_after"),
                "reason", rs.getString("reason"), "referenceId", rs.getString("reference_id"), "createdAt", number(rs, "created_ms")
            )).list();
        return Maps.of("summary", summary, "warehouses", warehouses, "items", items, "operations", operations, "movements", movements);
    }

    @Transactional
    public Map<String, Object> receipt(Receipt command, AuthPrincipal actor, String correlationId) {
        accounts.ensure(actor);
        String operationKey = operationKey("receipt", actor, command.idempotencyKey());
        advisoryLock(operationKey);
        Map<String, Object> duplicate = duplicate(operationKey);
        if (duplicate != null) return duplicate;
        Item source = lock(command.inventoryItemId());
        if (!source.warehouseId().equals(command.warehouseId())) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "WAREHOUSE_MISMATCH", "Kho nhận không khớp với dòng tồn.");
        String operationId = UUID.randomUUID().toString();
        String number = createOperation(operationId, "receipt", null, source.warehouseId(), command.referenceNumber(), operationKey, command.reason(), command.notes(), actor.id());
        int balance = source.onHand() + command.quantity();
        updateBalance(source.id(), balance, source.reserved());
        operationItem(operationId, source.variantId(), null, source.id(), command.quantity(), null, null, null, command.unitCostCents(), command.notes());
        movement(source.id(), "receipt", command.quantity(), balance, operationId, command.reason(), operationKey + ":movement", actor.id());
        audit(actor.id(), "inventory.receipt", operationId, null, Maps.of("quantity", command.quantity(), "balanceAfter", balance), correlationId);
        return operationResult(operationId, number, "receipt");
    }

    @Transactional
    public Map<String, Object> transfer(Transfer command, AuthPrincipal actor, String correlationId) {
        accounts.ensure(actor);
        String operationKey = operationKey("transfer", actor, command.idempotencyKey());
        advisoryLock(operationKey);
        Map<String, Object> duplicate = duplicate(operationKey);
        if (duplicate != null) return duplicate;
        Item snapshot = find(command.sourceInventoryItemId());
        advisoryLock("inventory-transfer-variant:" + snapshot.variantId());
        Item source = lock(command.sourceInventoryItemId());
        if (source.warehouseId().equals(command.destinationWarehouseId())) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "SAME_WAREHOUSE", "Kho nguồn và kho đích phải khác nhau.");
        if (source.onHand() - source.reserved() < command.quantity()) throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK", "Kho nguồn không đủ tồn khả dụng.");
        boolean destinationWarehouseExists = jdbc.sql("select exists(select 1 from warehouses where id=:id and status='active')")
            .param("id", command.destinationWarehouseId()).query(Boolean.class).single();
        if (!destinationWarehouseExists) throw new ApiException(HttpStatus.NOT_FOUND, "WAREHOUSE_NOT_FOUND", "Không tìm thấy kho đích đang hoạt động.");
        jdbc.sql("""
            insert into inventory_items(id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point)
            values(:id,:warehouse,:variant,0,0,:safety,:reorder) on conflict(warehouse_id,variant_id) do nothing
            """).params(Map.of(
                "id", UUID.randomUUID().toString(), "warehouse", command.destinationWarehouseId(),
                "variant", source.variantId(), "safety", source.safetyStock(), "reorder", source.reorderPoint()
            )).update();
        Item destination = jdbc.sql("select id from inventory_items where warehouse_id=:warehouse and variant_id=:variant")
            .params(Map.of("warehouse", command.destinationWarehouseId(), "variant", source.variantId())).query(String.class).optional()
            .map(this::lock).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WAREHOUSE_NOT_FOUND", "Không tìm thấy kho đích."));
        String operationId = UUID.randomUUID().toString();
        String number = createOperation(operationId, "transfer", source.warehouseId(), destination.warehouseId(), command.referenceNumber(), operationKey, command.reason(), command.notes(), actor.id());
        int sourceBalance = source.onHand() - command.quantity();
        int destinationBalance = destination.onHand() + command.quantity();
        updateBalance(source.id(), sourceBalance, source.reserved());
        updateBalance(destination.id(), destinationBalance, destination.reserved());
        operationItem(operationId, source.variantId(), source.id(), destination.id(), command.quantity(), null, null, null, null, command.notes());
        movement(source.id(), "transfer_out", -command.quantity(), sourceBalance, operationId, command.reason(), operationKey + ":out", actor.id());
        movement(destination.id(), "transfer_in", command.quantity(), destinationBalance, operationId, command.reason(), operationKey + ":in", actor.id());
        audit(actor.id(), "inventory.transfer", operationId, null, Maps.of("quantity", command.quantity()), correlationId);
        return operationResult(operationId, number, "transfer");
    }

    @Transactional
    public Map<String, Object> stocktake(Stocktake command, AuthPrincipal actor, String correlationId) {
        accounts.ensure(actor);
        String operationKey = operationKey("stocktake", actor, command.idempotencyKey());
        advisoryLock(operationKey);
        Map<String, Object> duplicate = duplicate(operationKey);
        if (duplicate != null) return duplicate;
        Item item = lock(command.inventoryItemId());
        if (command.actualQuantity() < item.reserved()) throw new ApiException(HttpStatus.CONFLICT, "BELOW_RESERVED", "Số đếm thực tế không thể thấp hơn lượng đã giữ.");
        int variance = command.actualQuantity() - item.onHand();
        String operationId = UUID.randomUUID().toString();
        String number = createOperation(operationId, "stocktake", item.warehouseId(), item.warehouseId(), command.referenceNumber(), operationKey, command.reason(), command.notes(), actor.id());
        updateBalance(item.id(), command.actualQuantity(), item.reserved());
        operationItem(operationId, item.variantId(), item.id(), item.id(), variance, item.onHand(), command.actualQuantity(), variance, null, command.notes());
        movement(item.id(), "stocktake", variance, command.actualQuantity(), operationId, command.reason(), operationKey + ":movement", actor.id());
        audit(actor.id(), "inventory.stocktake", operationId, Maps.of("onHand", item.onHand()), Maps.of("onHand", command.actualQuantity()), correlationId);
        return operationResult(operationId, number, "stocktake");
    }

    @Transactional
    public Map<String, Object> adjust(Adjustment command, AuthPrincipal actor, String correlationId) {
        accounts.ensure(actor);
        String operationKey = operationKey("adjustment", actor, command.idempotencyKey());
        advisoryLock(operationKey);
        Map<String, Object> duplicate = duplicate(operationKey);
        if (duplicate != null) return duplicate;
        Item item = lock(command.inventoryItemId());
        int balance = item.onHand() + command.quantityDelta();
        if (balance < item.reserved() || balance < 0) throw new ApiException(HttpStatus.CONFLICT, "INVALID_BALANCE", "Điều chỉnh làm tồn kho thấp hơn lượng đã giữ.");
        String operationId = UUID.randomUUID().toString();
        String number = createOperation(operationId, "adjustment", item.warehouseId(), item.warehouseId(), command.referenceNumber(), operationKey, command.reason(), command.notes(), actor.id());
        updateBalance(item.id(), balance, item.reserved());
        operationItem(operationId, item.variantId(), item.id(), item.id(), command.quantityDelta(), item.onHand(), balance, command.quantityDelta(), null, command.notes());
        movement(item.id(), "manual_adjustment", command.quantityDelta(), balance, operationId, command.reason(), operationKey + ":movement", actor.id());
        audit(actor.id(), "inventory.adjust", operationId, Maps.of("onHand", item.onHand()), Maps.of("onHand", balance), correlationId);
        return operationResult(operationId, number, "adjustment");
    }

    @Transactional
    public Map<String, Object> releaseExpired(AuthPrincipal actor, String correlationId) {
        accounts.ensure(actor);
        return releaseExpiredBatch(actor.id(), correlationId, true);
    }

    @Transactional
    public Map<String, Object> releaseExpiredSystem() {
        return releaseExpiredBatch(null, "scheduler:reservation-expiry", false);
    }

    private Map<String, Object> releaseExpiredBatch(String actorId, String correlationId, boolean auditEmptyBatch) {
        List<Reservation> reservations = jdbc.sql("""
            select r.id,r.inventory_item_id,r.order_id,r.quantity from inventory_reservations r
            join customer_orders o on o.id=r.order_id
            where r.status='active' and r.expires_at<now()
              and o.status='pending_payment' and o.payment_status in ('pending','failed')
            order by r.expires_at limit 200 for update of r,o skip locked
            """).query((rs, rowNum) -> new Reservation(rs.getString("id"),rs.getString("inventory_item_id"),rs.getString("order_id"),rs.getInt("quantity"))).list();
        for (Reservation reservation : reservations) {
            Item item = lock(reservation.itemId());
            int reserved = Math.max(0, item.reserved() - reservation.quantity());
            updateBalance(item.id(), item.onHand(), reserved);
            jdbc.sql("update inventory_reservations set status='expired',released_at=now() where id=:id").param("id", reservation.id()).update();
            movement(item.id(), "release", 0, item.onHand(), reservation.orderId(), "Nhả tồn do hết hạn thanh toán", reservation.id() + ":release", actorId);
        }
        List<String> orders = reservations.stream().map(Reservation::orderId).distinct().toList();
        int cancelled = 0;
        for (String orderId : orders) {
            int updated = jdbc.sql("""
                update customer_orders set status='cancelled',payment_status='cancelled',
                  fulfillment_status='cancelled',cancelled_at=now(),updated_at=now()
                where id=:id and status='pending_payment' and payment_status in ('pending','failed')
                """).param("id", orderId).update();
            cancelled += updated;
            if (updated == 1) {
                jdbc.sql("""
                    insert into order_status_history(id,order_id,from_status,to_status,reason,actor_user_id)
                    values(:id,:orderId,'pending_payment','cancelled','Hết thời hạn thanh toán',:actor)
                    """).params(Maps.of("id", UUID.randomUUID().toString(), "orderId", orderId, "actor", actorId)).update();
                List<FulfillmentExpiry> expiredFulfillments = jdbc.sql("""
                    select id,status from fulfillments
                    where order_id=:orderId and status in ('pending','processing','ready_to_ship','failed')
                    order by id for update
                    """).param("orderId", orderId).query((rs, rowNum) -> new FulfillmentExpiry(
                        rs.getString("id"),
                        rs.getString("status")
                    )).list();
                for (FulfillmentExpiry fulfillment : expiredFulfillments) {
                    jdbc.sql("""
                        update fulfillments set status='cancelled',version=version+1,updated_at=now()
                        where id=:id and status=:status
                        """).params(Map.of("id", fulfillment.id(), "status", fulfillment.status())).update();
                    jdbc.sql("""
                        insert into fulfillment_events(id,fulfillment_id,from_status,to_status,reason,actor_user_id,metadata_json)
                        values(:id,:fulfillmentId,:fromStatus,'cancelled','Hết thời hạn thanh toán',:actor,cast(:metadata as jsonb))
                        """).params(Maps.of(
                            "id", UUID.randomUUID().toString(),
                            "fulfillmentId", fulfillment.id(),
                            "fromStatus", fulfillment.status(),
                            "actor", actorId,
                            "metadata", json(Map.of("source", "reservation-expiry"))
                        )).update();
                }
                jdbc.sql("""
                    insert into outbox_events(id,aggregate_type,aggregate_id,event_type,payload_json)
                    values(:id,'order',:orderId,'order.payment_expired',cast(:payload as jsonb))
                    """).params(Map.of("id", UUID.randomUUID().toString(), "orderId", orderId, "payload", json(Map.of("orderId", orderId)))).update();
            }
        }
        if (auditEmptyBatch || !reservations.isEmpty()) {
            audit(actorId, "inventory.release_expired", null, null, Maps.of("released", reservations.size(), "ordersCancelled", cancelled), correlationId);
        }
        return Maps.of("released", reservations.size(), "ordersCancelled", cancelled);
    }

    public String csv() {
        StringBuilder output = new StringBuilder("SKU,Sản phẩm,Kho,On hand,Reserved,Available,Safety stock,Reorder point\n");
        jdbc.sql("""
            select pv.sku,p.name,w.code,ii.on_hand,ii.reserved,ii.on_hand-ii.reserved available,ii.safety_stock,ii.reorder_point
            from inventory_items ii join product_variants pv on pv.id=ii.variant_id join products p on p.id=pv.product_id
            join warehouses w on w.id=ii.warehouse_id order by pv.sku,w.code
            """).query((rs, rowNum) -> {
                output.append(csvValue(rs.getString("sku"))).append(',').append(csvValue(rs.getString("name"))).append(',')
                    .append(csvValue(rs.getString("code"))).append(',').append(rs.getInt("on_hand")).append(',')
                    .append(rs.getInt("reserved")).append(',').append(rs.getInt("available")).append(',')
                    .append(rs.getInt("safety_stock")).append(',').append(rs.getInt("reorder_point")).append('\n');
                return 1;
            }).list();
        return output.toString();
    }

    private Item lock(String id) {
        return jdbc.sql("""
            select id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version
            from inventory_items where id=:id for update
            """).param("id", id).query((rs, rowNum) -> new Item(
                rs.getString("id"),rs.getString("warehouse_id"),rs.getString("variant_id"),rs.getInt("on_hand"),
                rs.getInt("reserved"),rs.getInt("safety_stock"),rs.getInt("reorder_point"),rs.getInt("version")
            )).optional().orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVENTORY_ITEM_NOT_FOUND", "Không tìm thấy dòng tồn kho."));
    }

    private Item find(String id) {
        return jdbc.sql("""
            select id,warehouse_id,variant_id,on_hand,reserved,safety_stock,reorder_point,version
            from inventory_items where id=:id
            """).param("id", id).query((rs, rowNum) -> new Item(
                rs.getString("id"),rs.getString("warehouse_id"),rs.getString("variant_id"),rs.getInt("on_hand"),
                rs.getInt("reserved"),rs.getInt("safety_stock"),rs.getInt("reorder_point"),rs.getInt("version")
            )).optional().orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVENTORY_ITEM_NOT_FOUND", "Không tìm thấy dòng tồn kho."));
    }

    private String operationKey(String operation, AuthPrincipal actor, String suppliedKey) {
        return IdempotencyKeys.scoped("inventory:" + operation, "user:" + actor.id(), suppliedKey);
    }

    private void advisoryLock(String key) {
        jdbc.sql("select pg_advisory_xact_lock(hashtextextended(cast(:key as text), 0))")
            .param("key", key)
            .query((rs, rowNumber) -> Boolean.TRUE)
            .single();
    }

    private void updateBalance(String id, int onHand, int reserved) {
        jdbc.sql("update inventory_items set on_hand=:onHand,reserved=:reserved,version=version+1,updated_at=now() where id=:id")
            .params(Map.of("onHand", onHand, "reserved", reserved, "id", id)).update();
    }

    private String createOperation(String id,String type,String source,String destination,String reference,String key,String reason,String notes,String actor) {
        String number = operationNumber(type);
        jdbc.sql("""
            insert into inventory_operations(id,operation_number,type,status,source_warehouse_id,destination_warehouse_id,
              reference_number,idempotency_key,reason,notes,created_by,posted_by,posted_at)
            values(:id,:number,:type,'posted',:source,:destination,:reference,:key,:reason,:notes,:actor,:actor,now())
            """).params(Maps.of(
                "id", id, "number", number, "type", type, "source", source, "destination", destination,
                "reference", reference, "key", key, "reason", reason, "notes", notes, "actor", actor
            )).update();
        return number;
    }

    private void operationItem(String operationId,String variantId,String sourceId,String destinationId,int quantity,Integer expected,Integer actual,Integer variance,Long cost,String note) {
        jdbc.sql("""
            insert into inventory_operation_items(id,operation_id,variant_id,source_inventory_item_id,destination_inventory_item_id,
              quantity,expected_quantity,actual_quantity,variance,unit_cost_cents,note)
            values(:id,:operation,:variant,:source,:destination,:quantity,:expected,:actual,:variance,:cost,:note)
            """).params(Maps.of(
                "id", UUID.randomUUID().toString(), "operation", operationId, "variant", variantId, "source", sourceId,
                "destination", destinationId, "quantity", quantity, "expected", expected, "actual", actual, "variance", variance, "cost", cost, "note", note
            )).update();
    }

    private void movement(String itemId,String type,int delta,int balance,String reference,String reason,String key,String actor) {
        jdbc.sql("""
            insert into inventory_movements(id,inventory_item_id,type,quantity_delta,balance_after,reference_type,reference_id,reason,idempotency_key,actor_user_id)
            values(:id,:item,:type,:delta,:balance,'inventory_operation',:reference,:reason,:key,:actor)
            """).params(Maps.of(
                "id", UUID.randomUUID().toString(), "item", itemId, "type", type, "delta", delta, "balance", balance,
                "reference", reference, "reason", reason, "key", key, "actor", actor
            )).update();
    }

    private void audit(String actor,String action,String entityId,Object before,Object after,String correlationId) {
        jdbc.sql("""
            insert into audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,correlation_id)
            values(:id,:actor,:action,'inventory_operation',:entityId,cast(:before as jsonb),cast(:after as jsonb),:correlation)
            """).params(Maps.of(
                "id", UUID.randomUUID().toString(), "actor", actor, "action", action, "entityId", entityId,
                "before", json(before), "after", json(after), "correlation", correlationId == null ? UUID.randomUUID().toString() : correlationId
            )).update();
    }

    private Map<String, Object> duplicate(String key) {
        return jdbc.sql("select id,operation_number,type,status from inventory_operations where idempotency_key=:key")
            .param("key", key).query((rs, rowNum) -> Maps.of(
                "id", rs.getString("id"), "operationNumber", rs.getString("operation_number"), "type", rs.getString("type"), "status", rs.getString("status"), "idempotentReplay", true
            )).optional().orElse(null);
    }

    private Map<String, Object> operationResult(String id,String number,String type) {
        return Maps.of("id", id, "operationNumber", number, "type", type, "status", "posted");
    }

    private String operationNumber(String type) {
        String prefix = switch (type) { case "receipt" -> "RCV"; case "transfer" -> "TRF"; case "stocktake" -> "CNT"; default -> "ADJ"; };
        String date = DateTimeFormatter.BASIC_ISO_DATE.withZone(ZoneOffset.UTC).format(Instant.now());
        return prefix + "-" + date + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String json(Object value) {
        if (value == null) return null;
        try { return objectMapper.writeValueAsString(value); }
        catch (JacksonException exception) { throw new IllegalStateException(exception); }
    }

    private Long number(ResultSet rs, String column) throws SQLException {
        java.math.BigDecimal value = rs.getBigDecimal(column);
        return value == null ? null : value.longValue();
    }

    private String csvValue(String value) { return '"' + value.replace("\"", "\"\"") + '"'; }

    private record Item(String id,String warehouseId,String variantId,int onHand,int reserved,int safetyStock,int reorderPoint,int version) {}
    private record Reservation(String id,String itemId,String orderId,int quantity) {}
    private record FulfillmentExpiry(String id, String status) {}
    public record Receipt(String warehouseId,String inventoryItemId,int quantity,Long unitCostCents,String referenceNumber,String idempotencyKey,String reason,String notes) {}
    public record Transfer(String sourceInventoryItemId,String destinationWarehouseId,int quantity,String referenceNumber,String idempotencyKey,String reason,String notes) {}
    public record Stocktake(String inventoryItemId,int actualQuantity,String referenceNumber,String idempotencyKey,String reason,String notes) {}
    public record Adjustment(String inventoryItemId,int quantityDelta,String referenceNumber,String idempotencyKey,String reason,String notes) {}
}
