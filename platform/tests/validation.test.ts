import { describe, expect, it } from 'vitest';

import {
  addressSchema,
  createOrderSchema,
  inventoryAdjustmentSchema,
  inventoryCountSchema,
  inventoryReceiptSchema,
  inventoryTransferSchema,
  orderStatusSchema,
  productMutationSchema,
} from '../lib/validation';

const uuid = '123e4567-e89b-42d3-a456-426614174000';
const address = {
  recipientName: 'Nguyen Minh Anh',
  phone: '0901234567',
  line1: '12 Nguyen Hue',
  district: 'Quan 1',
  province: 'TP HCM',
};

describe('checkout validation boundaries', () => {
  it('accepts a complete order and applies the optional ward default', () => {
    const parsed = createOrderSchema.parse({
      email: 'member@example.com',
      phone: '+84901234567',
      shippingAddress: address,
      paymentMethod: 'online',
      idempotencyKey: uuid,
      items: [{ variantId: 'ALM-s', quantity: 10 }],
    });
    expect(parsed.shippingAddress.ward).toBe('');
  });

  it.each([
    ['invalid email', { email: 'member' }],
    ['invalid phone', { phone: '123' }],
    ['invalid UUID', { idempotencyKey: 'retry-me' }],
    ['empty cart', { items: [] }],
    ['excess item quantity', { items: [{ variantId: 'ALM-s', quantity: 11 }] }],
  ])('rejects %s', (_name, change) => {
    expect(
      createOrderSchema.safeParse({
        email: 'member@example.com',
        phone: '0901234567',
        shippingAddress: address,
        paymentMethod: 'cod',
        idempotencyKey: uuid,
        items: [{ variantId: 'ALM-s', quantity: 1 }],
        ...change,
      }).success,
    ).toBe(false);
  });

  it('accepts both supported phone prefixes and rejects missing address fields', () => {
    expect(addressSchema.safeParse(address).success).toBe(true);
    expect(addressSchema.safeParse({ ...address, phone: '+84901234567' }).success).toBe(true);
    expect(addressSchema.safeParse({ ...address, province: '' }).success).toBe(false);
  });
});

describe('admin validation boundaries', () => {
  it('accepts supported states and bounds an optional reason', () => {
    expect(orderStatusSchema.safeParse({ status: 'cancelled' }).success).toBe(true);
    expect(orderStatusSchema.safeParse({ status: 'returned', reason: 'Khach tra hang' }).success).toBe(true);
    expect(orderStatusSchema.safeParse({ status: 'processing' }).success).toBe(true);
    expect(orderStatusSchema.safeParse({ status: 'unknown' }).success).toBe(false);
    expect(orderStatusSchema.safeParse({ status: 'cancelled', reason: 'x'.repeat(301) }).success).toBe(false);
  });

  it('accepts the inclusive inventory limits and rejects invalid operations', () => {
    expect(inventoryReceiptSchema.safeParse({ warehouseId: 'wh', inventoryItemId: 'inv', quantity: 100_000, reason: 'Nhap kho', idempotencyKey: uuid }).success).toBe(true);
    expect(inventoryTransferSchema.safeParse({ sourceInventoryItemId: 'inv', destinationWarehouseId: 'wh-2', quantity: 1, reason: 'Chuyen kho', idempotencyKey: uuid }).success).toBe(true);
    expect(inventoryCountSchema.safeParse({ inventoryItemId: 'inv', actualQuantity: 0, reason: 'Kiem ke', idempotencyKey: uuid }).success).toBe(true);
    expect(inventoryAdjustmentSchema.safeParse({ inventoryItemId: 'inv', quantityDelta: -10_000, reason: 'Dieu chinh', idempotencyKey: uuid }).success).toBe(true);
    expect(inventoryAdjustmentSchema.safeParse({ inventoryItemId: 'inv', quantityDelta: 0, reason: 'Dieu chinh', idempotencyKey: uuid }).success).toBe(false);
  });

  it('validates product slugs, prices and compare-at prices', () => {
    const product = {
      name: 'Ao linen',
      slug: 'ao-linen',
      description: 'San pham linen co mo ta day du.',
      status: 'active',
      initialVariant: {
        sku: 'LIN-S', size: 'S', color: 'Trang', colorHex: '#ffffff',
        priceCents: 499_000, compareAtPriceCents: 599_000,
        warehouseId: 'wh-hcm', openingStock: 0,
      },
    };
    expect(productMutationSchema.safeParse(product).success).toBe(true);
    expect(productMutationSchema.safeParse({ ...product, slug: 'Áo Linen' }).success).toBe(false);
    expect(productMutationSchema.safeParse({ ...product, initialVariant: { ...product.initialVariant, colorHex: '#fff' } }).success).toBe(false);
  });
});
