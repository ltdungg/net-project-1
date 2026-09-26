import { env } from 'cloudflare:workers';

import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import { canTransition } from '@/lib/order-state';
import { orderStatusSchema } from '@/lib/validation';

type ReservationRow = {
  id: string;
  inventoryItemId: string;
  quantity: number;
  onHand: number;
  reserved: number;
  version: number;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'order:fulfill')) {
    return fail('FORBIDDEN', 'Bạn không có quyền cập nhật đơn hàng.', 403);
  }

  const parsed = orderStatusSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);
  const { id } = await context.params;
  const current = await env.DB.prepare(
    'SELECT status FROM customer_orders WHERE id = ?',
  )
    .bind(id)
    .first<{ status: string }>();
  if (!current) return fail('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', 404);
  if (!canTransition(current.status, parsed.data.status)) {
    return fail(
      'INVALID_TRANSITION',
      `Không thể chuyển từ ${current.status} sang ${parsed.data.status}.`,
      409,
    );
  }

  const reservations = await env.DB.prepare(
    `SELECT ir.id, ir.inventory_item_id AS inventoryItemId, ir.quantity,
      ii.on_hand AS onHand, ii.reserved, ii.version
     FROM inventory_reservations ir
     INNER JOIN inventory_items ii ON ii.id = ir.inventory_item_id
     WHERE ir.order_id = ? AND ir.status = 'active'`,
  )
    .bind(id)
    .all<ReservationRow>();
  if (
    parsed.data.status === 'shipped' &&
    reservations.results.some(
      (row) => row.onHand < row.quantity || row.reserved < row.quantity,
    )
  ) {
    return fail(
      'INVENTORY_CONFLICT',
      'Tồn kho không đủ hoặc reservation đã thay đổi. Chưa thể xuất hàng.',
      409,
    );
  }

  const actorRow = await env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? LIMIT 1',
  )
    .bind(actor.user.userId)
    .first<{ id: string }>();
  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `UPDATE customer_orders SET status = ?,
        fulfillment_status = CASE
          WHEN ? = 'shipped' THEN 'shipped'
          WHEN ? = 'delivered' THEN 'fulfilled'
          WHEN ? = 'cancelled' THEN 'cancelled'
          ELSE fulfillment_status END,
        cancelled_at = CASE WHEN ? = 'cancelled' THEN ? ELSE cancelled_at END,
        updated_at = ? WHERE id = ? AND status = ?`,
    ).bind(
      parsed.data.status,
      parsed.data.status,
      parsed.data.status,
      parsed.data.status,
      parsed.data.status,
      now,
      now,
      id,
      current.status,
    ),
    env.DB.prepare(
      `INSERT INTO order_status_history (
        id, order_id, from_status, to_status, reason, actor_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      id,
      current.status,
      parsed.data.status,
      parsed.data.reason ?? null,
      actorRow?.id ?? null,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO audit_logs (
        id, actor_user_id, action, entity_type, entity_id, before_json,
        after_json, correlation_id, created_at
      ) VALUES (?, ?, 'order.status.change', 'order', ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actorRow?.id ?? null,
      id,
      JSON.stringify({ status: current.status }),
      JSON.stringify({
        status: parsed.data.status,
        reason: parsed.data.reason,
      }),
      crypto.randomUUID(),
      now,
    ),
  ];

  if (parsed.data.status === 'cancelled') {
    for (const reservation of reservations.results) {
      statements.push(
        env.DB.prepare(
          `UPDATE inventory_items SET reserved = reserved - ?,
            version = version + 1, updated_at = ?
           WHERE id = ? AND version = ? AND reserved >= ?`,
        ).bind(
          reservation.quantity,
          now,
          reservation.inventoryItemId,
          reservation.version,
          reservation.quantity,
        ),
        env.DB.prepare(
          `UPDATE inventory_reservations SET status = 'released', released_at = ?
           WHERE id = ? AND status = 'active'`,
        ).bind(now, reservation.id),
      );
    }
  }

  if (parsed.data.status === 'shipped') {
    for (const reservation of reservations.results) {
      const balanceAfter = reservation.onHand - reservation.quantity;
      statements.push(
        env.DB.prepare(
          `UPDATE inventory_items SET on_hand = on_hand - ?,
            reserved = reserved - ?, version = version + 1, updated_at = ?
           WHERE id = ? AND version = ? AND on_hand >= ? AND reserved >= ?`,
        ).bind(
          reservation.quantity,
          reservation.quantity,
          now,
          reservation.inventoryItemId,
          reservation.version,
          reservation.quantity,
          reservation.quantity,
        ),
        env.DB.prepare(
          `UPDATE inventory_reservations SET status = 'consumed', released_at = ?
           WHERE id = ? AND status = 'active'`,
        ).bind(now, reservation.id),
        env.DB.prepare(
          `INSERT INTO inventory_movements (
            id, inventory_item_id, type, quantity_delta, balance_after,
            reference_type, reference_id, reason, idempotency_key,
            actor_user_id, created_at
          ) VALUES (?, ?, 'sale', ?, ?, 'order', ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          reservation.inventoryItemId,
          -reservation.quantity,
          balanceAfter,
          id,
          `Xuất bán cho đơn ${id}`,
          `order:${id}:ship:${reservation.id}`,
          actorRow?.id ?? null,
          now,
        ),
      );
    }
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('INVENTORY_BALANCE_INVARIANT')) {
      return fail(
        'INVENTORY_CONFLICT',
        'Tồn kho vừa thay đổi. Vui lòng làm mới và thử lại.',
        409,
      );
    }
    return fail('ORDER_UPDATE_FAILED', 'Chưa thể cập nhật đơn hàng.', 503);
  }

  return ok({ id, fromStatus: current.status, toStatus: parsed.data.status });
}
