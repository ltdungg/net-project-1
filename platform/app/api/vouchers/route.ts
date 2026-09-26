import { env } from 'cloudflare:workers';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';
import {
  calculateVoucherTotals,
  evaluateVoucher,
} from '@/lib/promotion-engine';

const schema = z.object({ code: z.string().trim().min(2).max(40) });
const cookieName = 'net_cart';

async function getCart(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  return env.DB.prepare(
    `SELECT c.id,
      COALESCE(SUM(ci.quantity * ci.unit_price_cents), 0) AS subtotalCents
     FROM carts c
     LEFT JOIN cart_items ci ON ci.cart_id = c.id
     WHERE c.guest_token = ? GROUP BY c.id`,
  )
    .bind(token)
    .first<{ id: string; subtotalCents: number }>();
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const cart = await getCart(request);
  if (!cart || cart.subtotalCents <= 0) {
    return fail('CART_EMPTY', 'Giỏ hàng chưa có sản phẩm.', 409);
  }

  const voucher = await evaluateVoucher(
    env.DB,
    parsed.data.code,
    cart.subtotalCents,
  );
  if (!voucher.valid) {
    return fail('VOUCHER_INVALID', voucher.message, 422, { voucher });
  }

  await env.DB.prepare(
    'UPDATE carts SET coupon_code = ?, updated_at = ? WHERE id = ?',
  )
    .bind(voucher.code, Date.now(), cart.id)
    .run();

  return ok({
    voucher,
    totals: calculateVoucherTotals(cart.subtotalCents, voucher),
  });
}

export async function DELETE(request: NextRequest) {
  const cart = await getCart(request);
  if (cart) {
    await env.DB.prepare(
      'UPDATE carts SET coupon_code = NULL, updated_at = ? WHERE id = ?',
    )
      .bind(Date.now(), cart.id)
      .run();
  }
  return ok({ removed: true });
}
