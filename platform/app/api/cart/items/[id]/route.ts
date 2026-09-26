import { env } from 'cloudflare:workers';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';

const quantitySchema = z.object({ quantity: z.number().int().min(1).max(10) });

async function cartOwnsItem(request: NextRequest, itemId: string) {
  const token = request.cookies.get('net_cart')?.value;
  if (!token) return false;
  const result = await env.DB.prepare(
    `SELECT ci.id FROM cart_items ci
     INNER JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = ? AND c.guest_token = ?`,
  )
    .bind(itemId, token)
    .first();
  return Boolean(result);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!(await cartOwnsItem(request, id)))
    return fail(
      'CART_ITEM_NOT_FOUND',
      'Không tìm thấy sản phẩm trong giỏ.',
      404,
    );
  const parsed = quantitySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);
  const stock = await env.DB.prepare(
    `SELECT COALESCE(SUM(MAX(ii.on_hand - ii.reserved, 0)), 0) AS available
     FROM cart_items ci
     LEFT JOIN inventory_items ii ON ii.variant_id = ci.variant_id
     LEFT JOIN warehouses w ON w.id = ii.warehouse_id AND w.status = 'active'
     WHERE ci.id = ? GROUP BY ci.id`,
  )
    .bind(id)
    .first<{ available: number }>();
  if (!stock || parsed.data.quantity > Number(stock.available)) {
    return fail('INSUFFICIENT_STOCK', 'Sản phẩm không còn đủ số lượng.', 409);
  }
  await env.DB.prepare(
    'UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?',
  )
    .bind(parsed.data.quantity, Date.now(), id)
    .run();
  return ok({ id, quantity: parsed.data.quantity });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!(await cartOwnsItem(request, id)))
    return fail(
      'CART_ITEM_NOT_FOUND',
      'Không tìm thấy sản phẩm trong giỏ.',
      404,
    );
  await env.DB.prepare('DELETE FROM cart_items WHERE id = ?').bind(id).run();
  return ok({ id, removed: true });
}
