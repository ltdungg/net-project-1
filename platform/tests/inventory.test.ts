import { describe, expect, it } from 'vitest';

import {
  inventoryAdjustmentSchema,
  inventoryCountSchema,
  inventoryReceiptSchema,
  inventoryTransferSchema,
} from '../lib/validation';

const idempotencyKey = '123e4567-e89b-42d3-a456-426614174000';

describe('inventory validation', () => {
  it('accepts a valid warehouse receipt', () => {
    const result = inventoryReceiptSchema.safeParse({
      warehouseId: 'wh-hcm',
      inventoryItemId: 'inv-alm-m',
      quantity: 12,
      reason: 'Nhập theo PO-2026-01',
      idempotencyKey,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a transfer without a positive quantity', () => {
    const result = inventoryTransferSchema.safeParse({
      sourceInventoryItemId: 'inv-alm-m',
      destinationWarehouseId: 'wh-hn',
      quantity: 0,
      reason: 'Bổ sung kho miền Bắc',
      idempotencyKey,
    });
    expect(result.success).toBe(false);
  });

  it('allows zero as a physical count but not a zero adjustment', () => {
    expect(
      inventoryCountSchema.safeParse({
        inventoryItemId: 'inv-alm-m',
        actualQuantity: 0,
        reason: 'Kiểm kê cuối kỳ',
        idempotencyKey,
      }).success,
    ).toBe(true);
    expect(
      inventoryAdjustmentSchema.safeParse({
        inventoryItemId: 'inv-alm-m',
        quantityDelta: 0,
        reason: 'Không có chênh lệch',
        idempotencyKey,
      }).success,
    ).toBe(false);
  });
});
