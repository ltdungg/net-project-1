package vn.netfashion.commerce.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.netfashion.commerce.auth.AuthPrincipal;
import vn.netfashion.commerce.common.ApiEnvelope;

@RestController
@RequestMapping("/api/admin/inventory")
public class InventoryController {
    private final InventoryService inventory;

    public InventoryController(InventoryService inventory) { this.inventory = inventory; }

    @GetMapping
    ApiEnvelope<Map<String, Object>> dashboard() { return ApiEnvelope.ok(inventory.dashboard()); }

    @PostMapping("/receipts")
    ApiEnvelope<Map<String, Object>> receipt(@Valid @RequestBody ReceiptRequest request, @AuthenticationPrincipal AuthPrincipal actor, @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ApiEnvelope.ok(inventory.receipt(request.command(), actor, correlationId));
    }

    @PostMapping("/transfers")
    ApiEnvelope<Map<String, Object>> transfer(@Valid @RequestBody TransferRequest request, @AuthenticationPrincipal AuthPrincipal actor, @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ApiEnvelope.ok(inventory.transfer(request.command(), actor, correlationId));
    }

    @PostMapping("/counts")
    ApiEnvelope<Map<String, Object>> stocktake(@Valid @RequestBody CountRequest request, @AuthenticationPrincipal AuthPrincipal actor, @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ApiEnvelope.ok(inventory.stocktake(request.command(), actor, correlationId));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ApiEnvelope<Map<String, Object>> adjust(@Valid @RequestBody AdjustmentRequest request, @AuthenticationPrincipal AuthPrincipal actor, @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ApiEnvelope.ok(inventory.adjust(request.command(), actor, correlationId));
    }

    @PostMapping("/reservations/release-expired")
    ApiEnvelope<Map<String, Object>> releaseExpired(@AuthenticationPrincipal AuthPrincipal actor, @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return ApiEnvelope.ok(inventory.releaseExpired(actor, correlationId));
    }

    @GetMapping(value = "/export", produces = "text/csv;charset=UTF-8")
    ResponseEntity<byte[]> export() {
        byte[] csv = ("\uFEFF" + inventory.csv()).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=net-inventory.csv")
            .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(csv);
    }

    private interface CommonRequest { String referenceNumber(); String idempotencyKey(); String reason(); String notes(); }
    public record ReceiptRequest(@NotBlank String warehouseId,@NotBlank String inventoryItemId,@Min(1) int quantity,Long unitCostCents,
        @Size(max=120) String referenceNumber,@NotBlank @Size(max=160) String idempotencyKey,@NotBlank @Size(min=3,max=500) String reason,@Size(max=2000) String notes) implements CommonRequest {
        InventoryService.Receipt command() { return new InventoryService.Receipt(warehouseId,inventoryItemId,quantity,unitCostCents,referenceNumber,idempotencyKey,reason,notes); }
    }
    public record TransferRequest(@NotBlank String sourceInventoryItemId,@NotBlank String destinationWarehouseId,@Min(1) int quantity,
        @Size(max=120) String referenceNumber,@NotBlank @Size(max=160) String idempotencyKey,@NotBlank @Size(min=3,max=500) String reason,@Size(max=2000) String notes) implements CommonRequest {
        InventoryService.Transfer command() { return new InventoryService.Transfer(sourceInventoryItemId,destinationWarehouseId,quantity,referenceNumber,idempotencyKey,reason,notes); }
    }
    public record CountRequest(@NotBlank String inventoryItemId,@Min(0) int actualQuantity,@Size(max=120) String referenceNumber,
        @NotBlank @Size(max=160) String idempotencyKey,@NotBlank @Size(min=3,max=500) String reason,@Size(max=2000) String notes) implements CommonRequest {
        InventoryService.Stocktake command() { return new InventoryService.Stocktake(inventoryItemId,actualQuantity,referenceNumber,idempotencyKey,reason,notes); }
    }
    public record AdjustmentRequest(@NotBlank String inventoryItemId,@NotNull Integer quantityDelta,@Size(max=120) String referenceNumber,
        @NotBlank @Size(max=160) String idempotencyKey,@NotBlank @Size(min=3,max=500) String reason,@Size(max=2000) String notes) implements CommonRequest {
        InventoryService.Adjustment command() { return new InventoryService.Adjustment(inventoryItemId,quantityDelta,referenceNumber,idempotencyKey,reason,notes); }
    }
}
