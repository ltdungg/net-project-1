import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';

const schema = z.object({ orderId: z.uuid() });

export async function POST(request: Request) {
  if (env.APP_ENV !== 'local') {
    return fail(
      'LOCAL_ONLY',
      'Mô phỏng thanh toán chỉ khả dụng trong môi trường local.',
      403,
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);

  const payment = await env.DB.prepare(
    `SELECT id, status FROM payments
     WHERE order_id = ? AND provider = 'mockpay' LIMIT 1`,
  )
    .bind(parsed.data.orderId)
    .first<{ id: string; status: string }>();
  if (!payment)
    return fail('PAYMENT_NOT_FOUND', 'Không tìm thấy giao dịch.', 404);
  if (payment.status === 'succeeded') {
    return ok({
      orderId: parsed.data.orderId,
      status: 'paid',
      duplicate: true,
    });
  }

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE payments SET status = 'succeeded', captured_at = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(now, now, payment.id),
    env.DB.prepare(
      `UPDATE customer_orders SET payment_status = 'paid',
        status = CASE WHEN status = 'pending_payment' THEN 'confirmed' ELSE status END,
        updated_at = ? WHERE id = ?`,
    ).bind(now, parsed.data.orderId),
    env.DB.prepare(
      `INSERT INTO order_status_history (
        id, order_id, from_status, to_status, reason, metadata_json, created_at
      ) SELECT ?, id, 'pending_payment', 'confirmed', 'Thanh toán local thành công', ?, ?
        FROM customer_orders WHERE id = ?`,
    ).bind(
      crypto.randomUUID(),
      JSON.stringify({ provider: 'mockpay', paymentId: payment.id }),
      now,
      parsed.data.orderId,
    ),
  ]);

  return ok({ orderId: parsed.data.orderId, status: 'paid', duplicate: false });
}
