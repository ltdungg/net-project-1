import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

const schema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    code: z
      .string()
      .trim()
      .regex(/^[A-Z0-9_-]{3,40}$/),
    type: z.enum(['percentage', 'fixed', 'free_shipping']),
    value: z.number().int().min(0).max(1_000_000_000),
    minSubtotalCents: z.number().int().min(0).max(1_000_000_000),
    maxDiscountCents: z.number().int().min(0).max(1_000_000_000).optional(),
    usageLimit: z.number().int().min(1).max(10_000_000).optional(),
    startsAt: z.number().int().positive(),
    endsAt: z.number().int().positive(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
    path: ['endsAt'],
  });

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'promotion:write')) {
    return fail('FORBIDDEN', 'Bạn không có quyền tạo khuyến mãi.', 403);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const promotionId = crypto.randomUUID();
  const couponId = crypto.randomUUID();
  const now = Date.now();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO promotions (
          id, name, description, type, value, min_subtotal_cents,
          max_discount_cents, usage_limit, usage_count, starts_at, ends_at,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'active', ?, ?)`,
      ).bind(
        promotionId,
        parsed.data.name,
        parsed.data.description ?? null,
        parsed.data.type,
        parsed.data.value,
        parsed.data.minSubtotalCents,
        parsed.data.maxDiscountCents ?? null,
        parsed.data.usageLimit ?? null,
        parsed.data.startsAt,
        parsed.data.endsAt,
        now,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO coupons (
          id, promotion_id, code, usage_limit, usage_limit_per_customer,
          usage_count, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, 0, 'active', ?, ?)`,
      ).bind(
        couponId,
        promotionId,
        parsed.data.code,
        parsed.data.usageLimit ?? null,
        now,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO audit_logs (
          id, action, entity_type, entity_id, after_json, correlation_id,
          created_at
        ) VALUES (?, 'promotion.create', 'promotion', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        promotionId,
        JSON.stringify(parsed.data),
        crypto.randomUUID(),
        now,
      ),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE'))
      return fail('COUPON_EXISTS', 'Mã voucher đã tồn tại.', 409);
    return fail('PROMOTION_CREATE_FAILED', 'Chưa thể tạo khuyến mãi.', 503);
  }
  return ok({ promotionId, couponId, code: parsed.data.code }, { status: 201 });
}
