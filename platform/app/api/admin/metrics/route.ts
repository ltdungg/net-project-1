import { env } from 'cloudflare:workers';

import { fail, ok } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

export async function GET() {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'report:read')) {
    return fail('FORBIDDEN', 'Bạn không có quyền xem báo cáo.', 403);
  }

  const [orders, revenue, lowStock, customers] = await env.DB.batch([
    env.DB.prepare(
      "SELECT COUNT(*) AS value FROM customer_orders WHERE created_at >= unixepoch('now', '-30 day') * 1000",
    ),
    env.DB.prepare(
      "SELECT COALESCE(SUM(grand_total_cents), 0) AS value FROM customer_orders WHERE payment_status IN ('paid', 'cod_pending') AND created_at >= unixepoch('now', '-30 day') * 1000",
    ),
    env.DB.prepare(
      'SELECT COUNT(*) AS value FROM inventory_items WHERE on_hand - reserved <= reorder_point',
    ),
    env.DB.prepare(
      "SELECT COUNT(*) AS value FROM users WHERE created_at >= unixepoch('now', '-30 day') * 1000",
    ),
  ]);

  const metric = (result: D1Result) =>
    Number(
      (result.results?.[0] as { value?: number | string } | undefined)?.value ??
        0,
    );

  return ok({
    orders30d: metric(orders),
    revenue30dCents: metric(revenue),
    lowStock: metric(lowStock),
    newCustomers30d: metric(customers),
  });
}
