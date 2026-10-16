import { describe, expect, it } from 'vitest';

import { calculateOrderTotals, canTransition } from '../lib/order-state';
import { createOrderSchema } from '../lib/validation';

describe('order state machine', () => {
  it('accepts valid forward transitions', () => {
    expect(canTransition('confirmed', 'processing')).toBe(true);
    expect(canTransition('ready_to_ship', 'shipped')).toBe(true);
  });

  it('rejects invalid or backward transitions', () => {
    expect(canTransition('delivered', 'processing')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
    expect(canTransition('unknown', 'confirmed')).toBe(false);
  });
});

describe('order totals', () => {
  it('waives shipping at the configured threshold', () => {
    expect(calculateOrderTotals(799_000).shippingCents).toBe(0);
    expect(calculateOrderTotals(798_000).shippingCents).toBe(35_000);
  });

  it('never returns a negative merchandise total after discount', () => {
    expect(calculateOrderTotals(100_000, 150_000)).toEqual({
      subtotalCents: 100_000,
      discountCents: 150_000,
      shippingCents: 35_000,
      grandTotalCents: 35_000,
    });
  });
});

describe('order validation', () => {
  it('rejects malformed phones and empty carts', () => {
    const result = createOrderSchema.safeParse({
      email: 'a@example.com',
      phone: '123',
      shippingAddress: {
        recipientName: 'Minh Anh',
        phone: '123',
        line1: '12 Nguyen Hue',
        district: 'Quận 1',
        province: 'TP.HCM',
      },
      paymentMethod: 'cod',
      idempotencyKey: crypto.randomUUID(),
      items: [],
    });
    expect(result.success).toBe(false);
  });
});
