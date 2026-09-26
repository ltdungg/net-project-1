import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { fail, ok } from '@/lib/api-response';

const eventSchema = z.object({
  id: z.string().min(3),
  type: z.enum(['payment.succeeded', 'payment.failed', 'payment.refunded']),
  paymentId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.literal('VND'),
});

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function POST(request: Request) {
  const secret = env.PAYMENT_WEBHOOK_SECRET;
  if (!secret)
    return fail('WEBHOOK_NOT_CONFIGURED', 'Webhook chưa được cấu hình.', 503);

  const rawBody = await request.text();
  const suppliedSignature = request.headers.get('x-provider-signature') ?? '';
  const expectedSignature = await hmacHex(secret, rawBody);
  const signatureValid = secureEqual(expectedSignature, suppliedSignature);

  const parsed = eventSchema.safeParse(JSON.parse(rawBody));
  if (!parsed.success)
    return fail('INVALID_EVENT', 'Payload webhook không hợp lệ.', 400);

  const now = Date.now();
  const eventInsert = await env.DB.prepare(
    `INSERT OR IGNORE INTO payment_events (
      id, payment_id, provider, provider_event_id, event_type, signature_valid,
      payload_json, processed_at, processing_error, created_at
    ) VALUES (?, ?, 'mockpay', ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      parsed.data.paymentId,
      parsed.data.id,
      parsed.data.type,
      signatureValid ? 1 : 0,
      rawBody,
      signatureValid ? now : null,
      signatureValid ? null : 'Invalid signature',
      now,
    )
    .run();

  if (!eventInsert.meta.changes) return ok({ received: true, duplicate: true });
  if (!signatureValid)
    return fail('INVALID_SIGNATURE', 'Chữ ký webhook không hợp lệ.', 401);

  const paymentStatus =
    parsed.data.type === 'payment.succeeded'
      ? 'succeeded'
      : parsed.data.type === 'payment.failed'
        ? 'failed'
        : 'refunded';
  const orderPaymentStatus =
    paymentStatus === 'succeeded' ? 'paid' : paymentStatus;

  await env.DB.batch([
    env.DB.prepare(
      'UPDATE payments SET status = ?, captured_at = CASE WHEN ? = ? THEN ? ELSE captured_at END, updated_at = ? WHERE id = ? AND amount_cents = ? AND currency = ?',
    ).bind(
      paymentStatus,
      paymentStatus,
      'succeeded',
      now,
      now,
      parsed.data.paymentId,
      parsed.data.amountCents,
      parsed.data.currency,
    ),
    env.DB.prepare(
      `UPDATE customer_orders
       SET payment_status = ?, status = CASE WHEN ? = 'succeeded' AND status = 'pending_payment' THEN 'confirmed' ELSE status END, updated_at = ?
       WHERE id = (SELECT order_id FROM payments WHERE id = ?)`,
    ).bind(orderPaymentStatus, paymentStatus, now, parsed.data.paymentId),
  ]);

  return ok({ received: true, duplicate: false });
}
