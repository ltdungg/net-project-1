import { env } from 'cloudflare:workers';

import { inventoryOperationNumber } from '@/lib/inventory-data';

type ItemBalance = {
  id: string;
  warehouseId: string;
  variantId: string;
  onHand: number;
  reserved: number;
  safetyStock: number;
  reorderPoint: number;
  version: number;
};

type OperationBase = {
  reason: string;
  notes?: string;
  referenceNumber?: string;
  idempotencyKey: string;
};

export class InventoryDomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

async function inventoryItem(id: string) {
  return env.DB.prepare(
    `SELECT id, warehouse_id AS warehouseId, variant_id AS variantId,
      on_hand AS onHand, reserved, safety_stock AS safetyStock,
      reorder_point AS reorderPoint, version
     FROM inventory_items WHERE id = ?`,
  )
    .bind(id)
    .first<ItemBalance>();
}

async function actorDatabaseId(externalAuthId: string) {
  const row = await env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? LIMIT 1',
  )
    .bind(externalAuthId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

async function existingOperation(idempotencyKey: string) {
  return env.DB.prepare(
    `SELECT id, operation_number AS operationNumber, type, status
     FROM inventory_operations WHERE idempotency_key = ?`,
  )
    .bind(idempotencyKey)
    .first<{
      id: string;
      operationNumber: string;
      type: string;
      status: string;
    }>();
}

function auditStatement(
  actorUserId: string | null,
  action: string,
  operationId: string,
  after: unknown,
  now: number,
) {
  return env.DB.prepare(
    `INSERT INTO audit_logs (
      id, actor_user_id, action, entity_type, entity_id, after_json,
      correlation_id, created_at
    ) VALUES (?, ?, ?, 'inventory_operation', ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    actorUserId,
    action,
    operationId,
    JSON.stringify(after),
    crypto.randomUUID(),
    now,
  );
}

function operationStatement(input: {
  id: string;
  number: string;
  type: string;
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  base: OperationBase;
  actorUserId: string | null;
  now: number;
}) {
  return env.DB.prepare(
    `INSERT INTO inventory_operations (
      id, operation_number, type, status, source_warehouse_id,
      destination_warehouse_id, reference_number, idempotency_key, reason,
      notes, created_by, posted_by, posted_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'posted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    input.id,
    input.number,
    input.type,
    input.sourceWarehouseId,
    input.destinationWarehouseId,
    input.base.referenceNumber ?? null,
    input.base.idempotencyKey,
    input.base.reason,
    input.base.notes ?? null,
    input.actorUserId,
    input.actorUserId,
    input.now,
    input.now,
    input.now,
  );
}

function normalizeDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('UNIQUE')) {
    throw new InventoryDomainError(
      'DUPLICATE_OPERATION',
      'Phiếu kho này đã được ghi nhận trước đó.',
      409,
    );
  }
  throw new InventoryDomainError(
    'INVENTORY_OPERATION_FAILED',
    'Chưa thể ghi nhận phiếu kho. Vui lòng thử lại.',
    503,
  );
}

export async function receiveInventory(
  input: OperationBase & {
    warehouseId: string;
    inventoryItemId: string;
    quantity: number;
    unitCostCents?: number;
  },
  externalAuthId: string,
) {
  const duplicate = await existingOperation(input.idempotencyKey);
  if (duplicate) return { ...duplicate, duplicate: true };

  const item = await inventoryItem(input.inventoryItemId);
  if (!item) {
    throw new InventoryDomainError(
      'INVENTORY_NOT_FOUND',
      'Không tìm thấy SKU trong kho đích.',
      404,
    );
  }
  if (item.warehouseId !== input.warehouseId) {
    throw new InventoryDomainError(
      'WAREHOUSE_MISMATCH',
      'SKU không thuộc kho được chọn.',
    );
  }

  const now = Date.now();
  const actorUserId = await actorDatabaseId(externalAuthId);
  const id = crypto.randomUUID();
  const number = inventoryOperationNumber('receipt');
  const balanceAfter = item.onHand + input.quantity;

  try {
    await env.DB.batch([
      operationStatement({
        id,
        number,
        type: 'receipt',
        sourceWarehouseId: null,
        destinationWarehouseId: input.warehouseId,
        base: input,
        actorUserId,
        now,
      }),
      env.DB.prepare(
        `INSERT INTO inventory_operation_items (
          id, operation_id, variant_id, destination_inventory_item_id,
          quantity, unit_cost_cents, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        item.variantId,
        item.id,
        input.quantity,
        input.unitCostCents ?? null,
        input.notes ?? null,
        now,
      ),
      env.DB.prepare(
        `UPDATE inventory_items SET on_hand = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND version = ?`,
      ).bind(balanceAfter, now, item.id, item.version),
      env.DB.prepare(
        `INSERT INTO inventory_movements (
          id, inventory_item_id, type, quantity_delta, balance_after,
          reference_type, reference_id, reason, idempotency_key,
          actor_user_id, created_at
        ) VALUES (?, ?, 'receipt', ?, ?, 'inventory_operation', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        item.id,
        input.quantity,
        balanceAfter,
        id,
        input.reason,
        `${input.idempotencyKey}:receipt`,
        actorUserId,
        now,
      ),
      auditStatement(
        actorUserId,
        'inventory.receipt.post',
        id,
        { inventoryItemId: item.id, quantity: input.quantity, balanceAfter },
        now,
      ),
    ]);
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return { id, operationNumber: number, type: 'receipt', status: 'posted' };
}

export async function transferInventory(
  input: OperationBase & {
    sourceInventoryItemId: string;
    destinationWarehouseId: string;
    quantity: number;
  },
  externalAuthId: string,
) {
  const duplicate = await existingOperation(input.idempotencyKey);
  if (duplicate) return { ...duplicate, duplicate: true };

  const source = await inventoryItem(input.sourceInventoryItemId);
  if (!source) {
    throw new InventoryDomainError(
      'INVENTORY_NOT_FOUND',
      'Không tìm thấy SKU tại kho nguồn.',
      404,
    );
  }
  if (source.warehouseId === input.destinationWarehouseId) {
    throw new InventoryDomainError(
      'SAME_WAREHOUSE',
      'Kho nguồn và kho đích phải khác nhau.',
    );
  }
  if (source.onHand - source.reserved < input.quantity) {
    throw new InventoryDomainError(
      'INSUFFICIENT_AVAILABLE_STOCK',
      'Tồn khả dụng tại kho nguồn không đủ để chuyển.',
    );
  }

  const destinationWarehouse = await env.DB.prepare(
    "SELECT id FROM warehouses WHERE id = ? AND status = 'active'",
  )
    .bind(input.destinationWarehouseId)
    .first<{ id: string }>();
  if (!destinationWarehouse) {
    throw new InventoryDomainError(
      'WAREHOUSE_NOT_FOUND',
      'Không tìm thấy kho đích đang hoạt động.',
      404,
    );
  }

  let destination = await env.DB.prepare(
    `SELECT id, warehouse_id AS warehouseId, variant_id AS variantId,
      on_hand AS onHand, reserved, safety_stock AS safetyStock,
      reorder_point AS reorderPoint, version
     FROM inventory_items WHERE warehouse_id = ? AND variant_id = ?`,
  )
    .bind(input.destinationWarehouseId, source.variantId)
    .first<ItemBalance>();
  const destinationIsNew = !destination;
  destination ??= {
    id: crypto.randomUUID(),
    warehouseId: input.destinationWarehouseId,
    variantId: source.variantId,
    onHand: 0,
    reserved: 0,
    safetyStock: source.safetyStock,
    reorderPoint: source.reorderPoint,
    version: 1,
  };

  const now = Date.now();
  const actorUserId = await actorDatabaseId(externalAuthId);
  const id = crypto.randomUUID();
  const number = inventoryOperationNumber('transfer');
  const sourceAfter = source.onHand - input.quantity;
  const destinationAfter = destination.onHand + input.quantity;
  const destinationWrite = destinationIsNew
    ? env.DB.prepare(
        `INSERT INTO inventory_items (
          id, warehouse_id, variant_id, on_hand, reserved, safety_stock,
          reorder_point, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?, 1, ?, ?)`,
      ).bind(
        destination.id,
        destination.warehouseId,
        destination.variantId,
        destinationAfter,
        destination.safetyStock,
        destination.reorderPoint,
        now,
        now,
      )
    : env.DB.prepare(
        `UPDATE inventory_items SET on_hand = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND version = ?`,
      ).bind(destinationAfter, now, destination.id, destination.version);

  try {
    await env.DB.batch([
      operationStatement({
        id,
        number,
        type: 'transfer',
        sourceWarehouseId: source.warehouseId,
        destinationWarehouseId: destination.warehouseId,
        base: input,
        actorUserId,
        now,
      }),
      destinationWrite,
      env.DB.prepare(
        `INSERT INTO inventory_operation_items (
          id, operation_id, variant_id, source_inventory_item_id,
          destination_inventory_item_id, quantity, note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        source.variantId,
        source.id,
        destination.id,
        input.quantity,
        input.notes ?? null,
        now,
      ),
      env.DB.prepare(
        `UPDATE inventory_items SET on_hand = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND version = ?`,
      ).bind(sourceAfter, now, source.id, source.version),
      env.DB.prepare(
        `INSERT INTO inventory_movements (
          id, inventory_item_id, type, quantity_delta, balance_after,
          reference_type, reference_id, reason, idempotency_key,
          actor_user_id, created_at
        ) VALUES (?, ?, 'transfer_out', ?, ?, 'inventory_operation', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        source.id,
        -input.quantity,
        sourceAfter,
        id,
        input.reason,
        `${input.idempotencyKey}:out`,
        actorUserId,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO inventory_movements (
          id, inventory_item_id, type, quantity_delta, balance_after,
          reference_type, reference_id, reason, idempotency_key,
          actor_user_id, created_at
        ) VALUES (?, ?, 'transfer_in', ?, ?, 'inventory_operation', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        destination.id,
        input.quantity,
        destinationAfter,
        id,
        input.reason,
        `${input.idempotencyKey}:in`,
        actorUserId,
        now,
      ),
      auditStatement(
        actorUserId,
        'inventory.transfer.post',
        id,
        {
          sourceInventoryItemId: source.id,
          destinationInventoryItemId: destination.id,
          quantity: input.quantity,
        },
        now,
      ),
    ]);
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return { id, operationNumber: number, type: 'transfer', status: 'posted' };
}

export async function countInventory(
  input: OperationBase & {
    inventoryItemId: string;
    actualQuantity: number;
  },
  externalAuthId: string,
) {
  const duplicate = await existingOperation(input.idempotencyKey);
  if (duplicate) return { ...duplicate, duplicate: true };

  const item = await inventoryItem(input.inventoryItemId);
  if (!item) {
    throw new InventoryDomainError(
      'INVENTORY_NOT_FOUND',
      'Không tìm thấy SKU cần kiểm kê.',
      404,
    );
  }
  if (input.actualQuantity < item.reserved) {
    throw new InventoryDomainError(
      'COUNT_BELOW_RESERVED',
      'Số đếm thực tế thấp hơn lượng đang giữ cho đơn hàng.',
    );
  }

  const now = Date.now();
  const actorUserId = await actorDatabaseId(externalAuthId);
  const id = crypto.randomUUID();
  const number = inventoryOperationNumber('stocktake');
  const variance = input.actualQuantity - item.onHand;

  try {
    await env.DB.batch([
      operationStatement({
        id,
        number,
        type: 'stocktake',
        sourceWarehouseId: item.warehouseId,
        destinationWarehouseId: null,
        base: input,
        actorUserId,
        now,
      }),
      env.DB.prepare(
        `INSERT INTO inventory_operation_items (
          id, operation_id, variant_id, source_inventory_item_id,
          quantity, expected_quantity, actual_quantity, variance, note,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        item.variantId,
        item.id,
        variance,
        item.onHand,
        input.actualQuantity,
        variance,
        input.notes ?? null,
        now,
      ),
      env.DB.prepare(
        `UPDATE inventory_items SET on_hand = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND version = ?`,
      ).bind(input.actualQuantity, now, item.id, item.version),
      env.DB.prepare(
        `INSERT INTO inventory_movements (
          id, inventory_item_id, type, quantity_delta, balance_after,
          reference_type, reference_id, reason, idempotency_key,
          actor_user_id, created_at
        ) VALUES (?, ?, 'stocktake', ?, ?, 'inventory_operation', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        item.id,
        variance,
        input.actualQuantity,
        id,
        input.reason,
        `${input.idempotencyKey}:stocktake`,
        actorUserId,
        now,
      ),
      auditStatement(
        actorUserId,
        'inventory.stocktake.post',
        id,
        {
          inventoryItemId: item.id,
          expectedQuantity: item.onHand,
          actualQuantity: input.actualQuantity,
          variance,
        },
        now,
      ),
    ]);
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return {
    id,
    operationNumber: number,
    type: 'stocktake',
    status: 'posted',
    variance,
  };
}

export async function adjustInventory(
  input: OperationBase & {
    inventoryItemId: string;
    quantityDelta: number;
  },
  externalAuthId: string,
) {
  const duplicate = await existingOperation(input.idempotencyKey);
  if (duplicate) return { ...duplicate, duplicate: true };

  const item = await inventoryItem(input.inventoryItemId);
  if (!item) {
    throw new InventoryDomainError(
      'INVENTORY_NOT_FOUND',
      'Không tìm thấy bản ghi tồn kho.',
      404,
    );
  }
  const balanceAfter = item.onHand + input.quantityDelta;
  if (balanceAfter < item.reserved || balanceAfter < 0) {
    throw new InventoryDomainError(
      'INVENTORY_CONFLICT',
      'Tồn sau điều chỉnh thấp hơn lượng đang giữ hoặc nhỏ hơn 0.',
    );
  }

  const now = Date.now();
  const actorUserId = await actorDatabaseId(externalAuthId);
  const id = crypto.randomUUID();
  const number = inventoryOperationNumber('adjustment');

  try {
    await env.DB.batch([
      operationStatement({
        id,
        number,
        type: 'adjustment',
        sourceWarehouseId: item.warehouseId,
        destinationWarehouseId: null,
        base: input,
        actorUserId,
        now,
      }),
      env.DB.prepare(
        `INSERT INTO inventory_operation_items (
          id, operation_id, variant_id, source_inventory_item_id,
          quantity, expected_quantity, actual_quantity, variance, note,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        item.variantId,
        item.id,
        input.quantityDelta,
        item.onHand,
        balanceAfter,
        input.quantityDelta,
        input.notes ?? null,
        now,
      ),
      env.DB.prepare(
        `UPDATE inventory_items SET on_hand = ?, version = version + 1,
          updated_at = ? WHERE id = ? AND version = ?`,
      ).bind(balanceAfter, now, item.id, item.version),
      env.DB.prepare(
        `INSERT INTO inventory_movements (
          id, inventory_item_id, type, quantity_delta, balance_after,
          reference_type, reference_id, reason, idempotency_key,
          actor_user_id, created_at
        ) VALUES (?, ?, 'manual_adjustment', ?, ?, 'inventory_operation', ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        item.id,
        input.quantityDelta,
        balanceAfter,
        id,
        input.reason,
        `${input.idempotencyKey}:adjustment`,
        actorUserId,
        now,
      ),
      auditStatement(
        actorUserId,
        'inventory.adjustment.post',
        id,
        {
          inventoryItemId: item.id,
          quantityDelta: input.quantityDelta,
          balanceAfter,
        },
        now,
      ),
    ]);
  } catch (error) {
    normalizeDatabaseError(error);
  }

  return {
    id,
    operationNumber: number,
    type: 'adjustment',
    status: 'posted',
    balanceAfter,
  };
}
