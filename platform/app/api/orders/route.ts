import { env } from 'cloudflare:workers';
import { NextRequest } from 'next/server';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import { correlationId, fail, ok, validationFail } from '@/lib/api-response';
import {
  calculateVoucherTotals,
  evaluateVoucher,
  type VoucherEvaluation,
} from '@/lib/promotion-engine';
import { createOrderSchema } from '@/lib/validation';

type ResolvedCheckoutItem = {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  productName: string;
  imageUrl: string | null;
  inventoryItemId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  version: number;
  quantity: number;
};

function orderNumber() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  return `NET-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

async function resolveCheckoutItem(variantId: string, quantity: number) {
  const row = await env.DB.prepare(
    `SELECT pv.id AS variantId, pv.sku, pv.size, pv.color,
      pv.price_cents AS priceCents, p.name AS productName,
      pm.public_url AS imageUrl, ii.id AS inventoryItemId,
      ii.warehouse_id AS warehouseId, ii.on_hand AS onHand,
      ii.reserved, ii.version
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     INNER JOIN inventory_items ii ON ii.variant_id = pv.id
     INNER JOIN warehouses w ON w.id = ii.warehouse_id
     LEFT JOIN product_media pm ON pm.id = (
       SELECT id FROM product_media WHERE product_id = p.id
       ORDER BY sort_order, created_at LIMIT 1
     )
     WHERE pv.id = ? AND pv.status = 'active' AND p.status = 'active'
       AND w.status = 'active' AND (ii.on_hand - ii.reserved) >= ?
     ORDER BY (ii.on_hand - ii.reserved) DESC, w.code
     LIMIT 1`,
  )
    .bind(variantId, quantity)
    .first<Omit<ResolvedCheckoutItem, 'quantity'>>();
  return row ? { ...row, quantity } : null;
}

async function authenticatedDatabaseUserId() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const row = await env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? LIMIT 1',
  )
    .bind(user.userId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);

  const databaseUser = await env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? LIMIT 1',
  )
    .bind(user.userId)
    .first<{ id: string }>();
  if (!databaseUser) return ok({ items: [], total: 0 });

  const orders = await env.DB.prepare(
    `SELECT id, order_number AS orderNumber, status,
      payment_status AS paymentStatus,
      fulfillment_status AS fulfillmentStatus,
      grand_total_cents AS grandTotalCents, placed_at AS placedAt,
      created_at AS createdAt
     FROM customer_orders WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 50`,
  )
    .bind(databaseUser.id)
    .all();
  return ok({ items: orders.results, total: orders.results.length });
}

export async function POST(request: NextRequest) {
  const requestId = correlationId(request);
  const parsed = createOrderSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  const existing = await env.DB.prepare(
    `SELECT id, order_number AS orderNumber, status
     FROM customer_orders WHERE id = ?`,
  )
    .bind(parsed.data.idempotencyKey)
    .first<{ id: string; orderNumber: string; status: string }>()
    .catch(() => null);
  if (existing) return ok(existing, { status: 200 });

  const resolvedItems = await Promise.all(
    parsed.data.items.map((item) =>
      resolveCheckoutItem(item.variantId, item.quantity),
    ),
  );
  if (resolvedItems.some((item) => !item)) {
    return fail(
      'VARIANT_UNAVAILABLE',
      'Một sản phẩm không còn đủ tồn khả dụng tại cùng một kho. Vui lòng cập nhật giỏ hàng.',
      409,
    );
  }
  const items = resolvedItems.filter((item): item is ResolvedCheckoutItem =>
    Boolean(item),
  );

  const subtotalCents = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
  let voucher: VoucherEvaluation | null = null;
  if (parsed.data.voucherCode) {
    voucher = await evaluateVoucher(
      env.DB,
      parsed.data.voucherCode,
      subtotalCents,
    );
    if (!voucher.valid) {
      return fail('VOUCHER_INVALID', voucher.message, 422);
    }
  }

  const totals = calculateVoucherTotals(subtotalCents, voucher);
  const id = parsed.data.idempotencyKey;
  const number = orderNumber();
  const status =
    parsed.data.paymentMethod === 'cod' ? 'confirmed' : 'pending_payment';
  const paymentStatus =
    parsed.data.paymentMethod === 'cod' ? 'cod_pending' : 'pending';
  const now = Date.now();
  const reservationExpiresAt = now + 2 * 60 * 60 * 1000;
  const userId = await authenticatedDatabaseUserId();
  const cartToken = request.cookies.get('net_cart')?.value;
  const cart = cartToken
    ? await env.DB.prepare('SELECT id FROM carts WHERE guest_token = ?')
        .bind(cartToken)
        .first<{ id: string }>()
    : null;

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO customer_orders (
        id, order_number, user_id, email, phone, status, payment_status,
        fulfillment_status, currency, subtotal_cents, discount_total_cents,
        shipping_total_cents, tax_total_cents, grand_total_cents,
        shipping_address_json, customer_note, source, placed_at, created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unfulfilled', 'VND', ?, ?, ?, 0, ?, ?, ?,
        'web', ?, ?, ?)`,
    ).bind(
      id,
      number,
      userId,
      parsed.data.email.toLowerCase(),
      parsed.data.phone,
      status,
      paymentStatus,
      subtotalCents,
      totals.discountCents,
      totals.shippingCents,
      totals.grandTotalCents,
      JSON.stringify(parsed.data.shippingAddress),
      parsed.data.customerNote ?? null,
      now,
      now,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO order_status_history (
        id, order_id, from_status, to_status, reason, metadata_json, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      status,
      'Đơn hàng được tạo từ storefront',
      JSON.stringify({ correlationId: requestId }),
      now,
    ),
    env.DB.prepare(
      `INSERT INTO payments (
        id, order_id, provider, method, status, amount_cents, currency,
        idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, 'VND', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      parsed.data.paymentMethod === 'cod' ? 'cod' : 'mockpay',
      parsed.data.paymentMethod,
      totals.grandTotalCents,
      `${id}:payment`,
      now,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO outbox_events (
        id, aggregate_type, aggregate_id, event_type, payload_json, status,
        attempts, available_at, created_at
      ) VALUES (?, 'order', ?, 'order.created', ?, 'pending', 0, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      JSON.stringify({ orderNumber: number, email: parsed.data.email }),
      now,
      now,
    ),
  ];

  if (voucher?.valid) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO order_promotions (
          id, order_id, promotion_id, coupon_id, name_snapshot,
          discount_cents, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        voucher.promotionId,
        voucher.couponId,
        `${voucher.name} (${voucher.code})`,
        voucher.savingsCents,
        now,
      ),
      env.DB.prepare(
        `UPDATE coupons SET usage_count = usage_count + 1, updated_at = ?
         WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      ).bind(now, voucher.couponId),
      env.DB.prepare(
        `UPDATE promotions SET usage_count = usage_count + 1, updated_at = ?
         WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      ).bind(now, voucher.promotionId),
    );
  }

  for (const item of items) {
    const reservationId = crypto.randomUUID();
    statements.push(
      env.DB.prepare(
        `UPDATE inventory_items
         SET reserved = reserved + ?, version = version + 1, updated_at = ?
         WHERE id = ? AND version = ? AND (on_hand - reserved) >= ?`,
      ).bind(
        item.quantity,
        now,
        item.inventoryItemId,
        item.version,
        item.quantity,
      ),
      env.DB.prepare(
        `INSERT INTO inventory_reservations (
          id, inventory_item_id, order_id, quantity, status, expires_at,
          created_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      ).bind(
        reservationId,
        item.inventoryItemId,
        id,
        item.quantity,
        reservationExpiresAt,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO order_items (
          id, order_id, variant_id, sku, product_name, variant_name,
          image_url, quantity, unit_price_cents, discount_cents, total_cents,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        item.variantId,
        item.sku,
        item.productName,
        `${item.color} / ${item.size}`,
        item.imageUrl,
        item.quantity,
        item.priceCents,
        item.priceCents * item.quantity,
        now,
      ),
    );
  }

  if (cart) {
    statements.push(
      env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cart.id),
      env.DB.prepare(
        `UPDATE carts SET coupon_code = NULL, updated_at = ? WHERE id = ?`,
      ).bind(now, cart.id),
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('INVENTORY_BALANCE_INVARIANT')) {
      return fail(
        'INVENTORY_CONFLICT',
        'Tồn kho vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.',
        409,
      );
    }
    if (message.includes('UNIQUE')) {
      return fail('DUPLICATE_ORDER', 'Yêu cầu này đã được xử lý.', 409);
    }
    return fail(
      'ORDER_PERSISTENCE_FAILED',
      'Chưa thể lưu đơn hàng. Vui lòng thử lại.',
      503,
      { correlationId: requestId },
    );
  }

  return ok(
    {
      id,
      orderNumber: number,
      status,
      paymentMethod: parsed.data.paymentMethod,
      reservationExpiresAt,
      voucher: voucher?.valid
        ? {
            code: voucher.code,
            name: voucher.name,
            savingsCents: voucher.savingsCents,
          }
        : null,
      totals: {
        subtotalCents,
        discountCents: totals.discountCents,
        shippingTotalCents: totals.shippingCents,
        grandTotalCents: totals.grandTotalCents,
      },
      nextAction:
        parsed.data.paymentMethod === 'online'
          ? { type: 'redirect', url: `/thanh-toan/${id}` }
          : { type: 'confirmation', url: `/don-hang/${id}` },
    },
    { status: 201 },
  );
}
