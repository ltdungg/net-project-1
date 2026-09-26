import { env } from 'cloudflare:workers';

import { fail, ok } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

type ExpiredReservation = {
  id: string;
  inventoryItemId: string;
  orderId: string;
  quantity: number;
};

export async function POST() {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:operate')) {
    return fail('FORBIDDEN', 'Bạn không có quyền nhả reservation.', 403);
  }
  const now = Date.now();
  const expired = await env.DB.prepare(
    `SELECT id, inventory_item_id AS inventoryItemId, order_id AS orderId,
      quantity FROM inventory_reservations
     WHERE status = 'active' AND expires_at <= ? ORDER BY inventory_item_id`,
  )
    .bind(now)
    .all<ExpiredReservation>();
  if (!expired.results.length) return ok({ released: 0, ordersCancelled: 0 });

  const quantities = new Map<string, number>();
  const orderIds = new Set<string>();
  for (const reservation of expired.results) {
    quantities.set(
      reservation.inventoryItemId,
      (quantities.get(reservation.inventoryItemId) ?? 0) +
        Number(reservation.quantity),
    );
    orderIds.add(reservation.orderId);
  }
  const statements: D1PreparedStatement[] = [];
  for (const [inventoryItemId, quantity] of quantities) {
    statements.push(
      env.DB.prepare(
        `UPDATE inventory_items SET reserved = MAX(reserved - ?, 0),
          version = version + 1, updated_at = ? WHERE id = ?`,
      ).bind(quantity, now, inventoryItemId),
    );
  }
  for (const reservation of expired.results) {
    statements.push(
      env.DB.prepare(
        `UPDATE inventory_reservations SET status = 'expired', released_at = ?
         WHERE id = ? AND status = 'active'`,
      ).bind(now, reservation.id),
    );
  }
  for (const orderId of orderIds) {
    statements.push(
      env.DB.prepare(
        `UPDATE customer_orders SET status = 'cancelled', cancelled_at = ?,
          updated_at = ? WHERE id = ? AND status = 'pending_payment'`,
      ).bind(now, now, orderId),
      env.DB.prepare(
        `INSERT INTO order_status_history (
          id, order_id, from_status, to_status, reason, created_at
        ) SELECT ?, id, 'pending_payment', 'cancelled',
          'Reservation hết hạn trước khi thanh toán', ?
          FROM customer_orders WHERE id = ? AND status = 'cancelled'`,
      ).bind(crypto.randomUUID(), now, orderId),
    );
  }
  await env.DB.batch(statements);
  return ok({
    released: expired.results.length,
    ordersCancelled: orderIds.size,
  });
}
