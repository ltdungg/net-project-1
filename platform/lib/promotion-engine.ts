export type VoucherEvaluation =
  | {
      valid: true;
      code: string;
      couponId: string;
      promotionId: string;
      name: string;
      description: string;
      discountCents: number;
      freeShipping: boolean;
      savingsCents: number;
      message: string;
    }
  | {
      valid: false;
      code: string;
      message: string;
    };

type VoucherRow = {
  couponId: string;
  promotionId: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number | null;
  usageLimit: number | null;
  usageCount: number;
  couponUsageLimit: number | null;
  couponUsageCount: number;
};

export async function evaluateVoucher(
  database: D1Database,
  rawCode: string,
  subtotalCents: number,
): Promise<VoucherEvaluation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { valid: false, code, message: 'Vui lòng nhập mã ưu đãi.' };
  }

  const row = await database
    .prepare(
      `SELECT c.id AS couponId, c.code, c.usage_limit AS couponUsageLimit,
              c.usage_count AS couponUsageCount, p.id AS promotionId,
              p.name, p.description, p.type, p.value,
              p.min_subtotal_cents AS minSubtotalCents,
              p.max_discount_cents AS maxDiscountCents,
              p.usage_limit AS usageLimit, p.usage_count AS usageCount
       FROM coupons c
       INNER JOIN promotions p ON p.id = c.promotion_id
       WHERE upper(c.code) = ? AND c.status = 'active' AND p.status = 'active'
         AND p.starts_at <= ? AND p.ends_at >= ?
       LIMIT 1`,
    )
    .bind(code, Date.now(), Date.now())
    .first<VoucherRow>();

  if (!row) {
    return {
      valid: false,
      code,
      message: 'Mã không tồn tại, đã hết hạn hoặc chưa bắt đầu.',
    };
  }
  if (
    (row.usageLimit !== null && row.usageCount >= row.usageLimit) ||
    (row.couponUsageLimit !== null &&
      row.couponUsageCount >= row.couponUsageLimit)
  ) {
    return { valid: false, code, message: 'Mã ưu đãi đã hết lượt sử dụng.' };
  }
  if (subtotalCents < row.minSubtotalCents) {
    const remaining = row.minSubtotalCents - subtotalCents;
    return {
      valid: false,
      code,
      message: `Cần mua thêm ${new Intl.NumberFormat('vi-VN').format(remaining)}đ để dùng mã này.`,
    };
  }

  const percentageDiscount = Math.floor((subtotalCents * row.value) / 100);
  const rawDiscount =
    row.type === 'percentage'
      ? percentageDiscount
      : row.type === 'fixed'
        ? row.value
        : 0;
  const discountCents = Math.max(
    0,
    Math.min(
      subtotalCents,
      row.maxDiscountCents === null
        ? rawDiscount
        : Math.min(rawDiscount, row.maxDiscountCents),
    ),
  );
  const freeShipping = row.type === 'free_shipping';
  const regularShipping = subtotalCents - discountCents >= 799_000 ? 0 : 35_000;
  const shippingSavings = freeShipping ? regularShipping : 0;
  const savingsCents = discountCents + shippingSavings;

  return {
    valid: true,
    code: row.code,
    couponId: row.couponId,
    promotionId: row.promotionId,
    name: row.name,
    description: row.description ?? row.name,
    discountCents,
    freeShipping,
    savingsCents,
    message: freeShipping
      ? shippingSavings
        ? 'Đã miễn phí giao hàng cho đơn này.'
        : 'Đơn hàng đã đủ điều kiện miễn phí giao hàng.'
      : `Đã giảm ${new Intl.NumberFormat('vi-VN').format(discountCents)}đ.`,
  };
}

export function calculateVoucherTotals(
  subtotalCents: number,
  voucher?: VoucherEvaluation | null,
) {
  const discountCents = voucher?.valid ? voucher.discountCents : 0;
  const regularShipping = subtotalCents - discountCents >= 799_000 ? 0 : 35_000;
  const shippingCents =
    voucher?.valid && voucher.freeShipping ? 0 : regularShipping;
  const grandTotalCents =
    Math.max(0, subtotalCents - discountCents) + shippingCents;
  return { subtotalCents, discountCents, shippingCents, grandTotalCents };
}
