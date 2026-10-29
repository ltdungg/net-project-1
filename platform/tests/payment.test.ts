import { describe, expect, it } from 'vitest';
import { orderAccess } from '../lib/payment-client';

describe('payment order access', () => {
  it('keeps guest credentials out of URLs even when signed in later', () => {
    const access = orderAccess('order/one', 'private-guest-token', true);
    expect(access?.path).toBe('/orders/order%2Fone/guest');
    expect(access?.headers).toEqual({
      'x-guest-order-token': 'private-guest-token',
    });
    expect(access?.path).not.toContain('private-guest-token');
  });
  it('uses member authorization for orders without a guest token', () => {
    expect(orderAccess('order-one', '', true)).toEqual({
      path: '/orders/order-one',
      headers: undefined,
    });
  });
  it('does not attempt private order access without credentials', () => {
    expect(orderAccess('order-one', '', false)).toBeNull();
  });
});
