import { env } from 'cloudflare:workers';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';
import { catalogProducts } from '@/lib/catalog-data';
import {
  calculateVoucherTotals,
  evaluateVoucher,
} from '@/lib/promotion-engine';

const itemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

const cookieName = 'net_cart';

function resolveVariant(variantId: string) {
  for (const product of catalogProducts) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

async function currentVariantStock(variantId: string) {
  return env.DB.prepare(
    `SELECT pv.price_cents AS priceCents,
      COALESCE(SUM(MAX(ii.on_hand - ii.reserved, 0)), 0) AS available
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN inventory_items ii ON ii.variant_id = pv.id
     LEFT JOIN warehouses w ON w.id = ii.warehouse_id AND w.status = 'active'
     WHERE pv.id = ? AND pv.status = 'active' AND p.status = 'active'
     GROUP BY pv.id`,
  )
    .bind(variantId)
    .first<{ priceCents: number; available: number }>();
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token)
    return ok({
      id: null,
      items: [],
      itemCount: 0,
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      grandTotalCents: 0,
      voucher: null,
    });

  try {
    const cart = await env.DB.prepare(
      'SELECT id, coupon_code AS couponCode FROM carts WHERE guest_token = ?',
    )
      .bind(token)
      .first<{ id: string; couponCode: string | null }>();
    if (!cart)
      return ok({
        id: null,
        items: [],
        itemCount: 0,
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        grandTotalCents: 0,
        voucher: null,
      });

    const result = await env.DB.prepare(
      `SELECT id, variant_id AS variantId, quantity, unit_price_cents AS unitPriceCents
       FROM cart_items WHERE cart_id = ? ORDER BY created_at`,
    )
      .bind(cart.id)
      .all<{
        id: string;
        variantId: string;
        quantity: number;
        unitPriceCents: number;
      }>();

    const items = await Promise.all(
      result.results.map(async (item) => {
        const resolved = resolveVariant(item.variantId);
        const stock = await currentVariantStock(item.variantId);
        return {
          ...item,
          product: resolved?.product ?? null,
          variant:
            resolved?.variant && stock
              ? {
                  ...resolved.variant,
                  priceCents: stock.priceCents,
                  available: Number(stock.available),
                }
              : (resolved?.variant ?? null),
          unitPriceCents: stock?.priceCents ?? item.unitPriceCents,
          lineTotalCents:
            (stock?.priceCents ?? item.unitPriceCents) * item.quantity,
        };
      }),
    );

    const subtotalCents = items.reduce(
      (total, item) => total + item.lineTotalCents,
      0,
    );
    const voucher = cart.couponCode
      ? await evaluateVoucher(env.DB, cart.couponCode, subtotalCents)
      : null;
    const totals = calculateVoucherTotals(subtotalCents, voucher);

    return ok({
      id: cart.id,
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      voucher,
      ...totals,
    });
  } catch {
    return fail('CART_UNAVAILABLE', 'Giỏ hàng tạm thời chưa khả dụng.', 503);
  }
}

export async function POST(request: NextRequest) {
  const parsed = itemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const resolved = resolveVariant(parsed.data.variantId);
  if (!resolved)
    return fail('VARIANT_NOT_FOUND', 'Không tìm thấy phân loại sản phẩm.', 404);
  const stock = await currentVariantStock(parsed.data.variantId);
  if (!stock || parsed.data.quantity > Number(stock.available)) {
    return fail('INSUFFICIENT_STOCK', 'Sản phẩm không còn đủ số lượng.', 409);
  }

  let token = request.cookies.get(cookieName)?.value;
  let cartId: string | undefined;
  if (token) {
    const existing = await env.DB.prepare(
      'SELECT id FROM carts WHERE guest_token = ?',
    )
      .bind(token)
      .first<{ id: string }>();
    cartId = existing?.id;
  }

  const now = Date.now();
  if (!cartId) {
    token = crypto.randomUUID();
    cartId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO carts (id, guest_token, currency, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(cartId, token, 'VND', now + 30 * 24 * 60 * 60 * 1000, now, now)
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price_cents, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(cart_id, variant_id) DO UPDATE SET
       quantity = MIN(10, cart_items.quantity + excluded.quantity),
       unit_price_cents = excluded.unit_price_cents,
       updated_at = excluded.updated_at`,
  )
    .bind(
      crypto.randomUUID(),
      cartId,
      parsed.data.variantId,
      parsed.data.quantity,
      stock.priceCents,
      now,
      now,
    )
    .run();

  const response = ok({ cartId, added: parsed.data });
  response.cookies.set(cookieName, token!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(request.url).protocol === 'https:',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
