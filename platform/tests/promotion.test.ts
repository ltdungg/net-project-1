import { describe, expect, it } from 'vitest';

import {
  calculateVoucherTotals,
  type VoucherEvaluation,
} from '../lib/promotion-engine';

describe('voucher totals', () => {
  it('applies a percentage discount and recalculates the final total', () => {
    const voucher: VoucherEvaluation = {
      valid: true,
      code: 'CHAONET',
      couponId: 'coupon-welcome',
      promotionId: 'promo-welcome',
      name: 'Chào NÉT',
      description: 'Giảm 10%',
      discountCents: 100_000,
      freeShipping: false,
      savingsCents: 100_000,
      message: 'Đã giảm 100.000đ.',
    };
    expect(calculateVoucherTotals(1_000_000, voucher)).toEqual({
      subtotalCents: 1_000_000,
      discountCents: 100_000,
      shippingCents: 0,
      grandTotalCents: 900_000,
    });
  });

  it('supports free-shipping vouchers for smaller qualifying carts', () => {
    const voucher: VoucherEvaluation = {
      valid: true,
      code: 'FREESHIP',
      couponId: 'coupon-freeship',
      promotionId: 'promo-freeship',
      name: 'Giao hàng 0đ',
      description: 'Miễn phí giao hàng',
      discountCents: 0,
      freeShipping: true,
      savingsCents: 35_000,
      message: 'Đã miễn phí giao hàng.',
    };
    expect(calculateVoucherTotals(450_000, voucher)).toEqual({
      subtotalCents: 450_000,
      discountCents: 0,
      shippingCents: 0,
      grandTotalCents: 450_000,
    });
  });
});
