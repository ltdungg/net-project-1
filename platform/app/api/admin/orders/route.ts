import { env } from 'cloudflare:workers';

import { fail, ok } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'order:read')) {
    return fail('FORBIDDEN', 'Bạn không có quyền xem đơn hàng.', 403);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
  const query = status
    ? env.DB.prepare(
        `SELECT id, order_number AS orderNumber, email, status, payment_status AS paymentStatus,
          fulfillment_status AS fulfillmentStatus, grand_total_cents AS grandTotalCents,
          created_at AS createdAt
         FROM customer_orders WHERE status = ? ORDER BY created_at DESC LIMIT ?`,
      ).bind(status, limit)
    : env.DB.prepare(
        `SELECT id, order_number AS orderNumber, email, status, payment_status AS paymentStatus,
          fulfillment_status AS fulfillmentStatus, grand_total_cents AS grandTotalCents,
          created_at AS createdAt
         FROM customer_orders ORDER BY created_at DESC LIMIT ?`,
      ).bind(limit);

  const result = await query.all();
  return ok({ items: result.results, total: result.results.length });
}
