import { describe, expect, it } from 'vitest';

import {
  calculateVoucherTotals,
  evaluateVoucher,
  type VoucherEvaluation,
} from '../lib/promotion-engine';

function databaseReturning(row: unknown) {
  const first = async () => row;
  const bind = () => ({ first });
  return { prepare: () => ({ bind }) } as unknown as D1Database;
}

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

  it('ignores invalid voucher evaluations and clamps excessive discounts', () => {
    expect(calculateVoucherTotals(100_000, { valid: false, code: 'NO', message: 'No' })).toEqual({
      subtotalCents: 100_000, discountCents: 0, shippingCents: 35_000, grandTotalCents: 135_000,
    });
    expect(calculateVoucherTotals(100_000, {
      valid: true, code: 'ALL', couponId: 'c', promotionId: 'p', name: 'All', description: 'All',
      discountCents: 150_000, freeShipping: false, savingsCents: 100_000, message: 'ok',
    }).grandTotalCents).toBe(35_000);
  });
});

describe('voucher evaluation', () => {
  it('normalizes codes and rejects blank or unknown vouchers', async () => {
    await expect(evaluateVoucher(databaseReturning(null), ' ', 500_000)).resolves.toEqual({
      valid: false, code: '', message: 'Vui lòng nhập mã ưu đãi.',
    });
    await expect(evaluateVoucher(databaseReturning(null), ' missing ', 500_000)).resolves.toEqual(
      expect.objectContaining({ valid: false, code: 'MISSING' }),
    );
  });

  it('rejects exhausted and under-minimum vouchers', async () => {
    const base = {
      couponId: 'c', promotionId: 'p', code: 'SAVE', name: 'Save', description: null,
      type: 'percentage', value: 10, minSubtotalCents: 500_000, maxDiscountCents: 100_000,
      usageLimit: 1, usageCount: 1, couponUsageLimit: null, couponUsageCount: 0,
    };
    await expect(evaluateVoucher(databaseReturning(base), 'save', 600_000)).resolves.toEqual(
      expect.objectContaining({ valid: false, message: 'Mã ưu đãi đã hết lượt sử dụng.' }),
    );
    await expect(evaluateVoucher(databaseReturning({ ...base, usageCount: 0 }), 'save', 400_000)).resolves.toEqual(
      expect.objectContaining({ valid: false, message: expect.stringContaining('100.000') }),
    );
  });

  it.each([
    ['percentage', 20, 300_000, 200_000, false],
    ['fixed', 125_000, null, 125_000, false],
    ['free_shipping', 0, null, 0, true],
  ])('calculates %s vouchers', async (type, value, cap, discount, freeShipping) => {
    const result = await evaluateVoucher(databaseReturning({
      couponId: 'c', promotionId: 'p', code: 'SAVE', name: 'Save', description: null,
      type, value, minSubtotalCents: 0, maxDiscountCents: cap,
      usageLimit: null, usageCount: 0, couponUsageLimit: null, couponUsageCount: 0,
    }), 'save', 1_000_000);
    expect(result).toEqual(expect.objectContaining({ valid: true, discountCents: discount, freeShipping }));
  });
});
