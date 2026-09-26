import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import { fail, ok, validationFail } from '@/lib/api-response';
import { addressSchema } from '@/lib/validation';

const mutationSchema = addressSchema.extend({
  label: z.string().trim().min(1).max(40),
  isDefault: z.boolean(),
});

async function ownedAddress(externalAuthId: string, addressId: string) {
  return env.DB.prepare(
    `SELECT a.id, a.user_id AS userId FROM addresses a
     INNER JOIN users u ON u.id = a.user_id
     WHERE a.id = ? AND u.external_auth_id = ?`,
  )
    .bind(addressId, externalAuthId)
    .first<{ id: string; userId: string }>();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  const { id } = await context.params;
  const owned = await ownedAddress(user.userId, id);
  if (!owned) return fail('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.', 404);
  const parsed = mutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  if (parsed.data.isDefault) {
    statements.push(
      env.DB.prepare(
        'UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?',
      ).bind(now, owned.userId),
    );
  }
  statements.push(
    env.DB.prepare(
      `UPDATE addresses SET label = ?, recipient_name = ?, phone = ?,
        line1 = ?, ward = ?, district = ?, province = ?, is_default = ?,
        updated_at = ? WHERE id = ? AND user_id = ?`,
    ).bind(
      parsed.data.label,
      parsed.data.recipientName,
      parsed.data.phone,
      parsed.data.line1,
      parsed.data.ward,
      parsed.data.district,
      parsed.data.province,
      parsed.data.isDefault ? 1 : 0,
      now,
      id,
      owned.userId,
    ),
  );
  await env.DB.batch(statements);
  return ok({ id, ...parsed.data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  const { id } = await context.params;
  const owned = await ownedAddress(user.userId, id);
  if (!owned) return fail('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.', 404);
  await env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?')
    .bind(id, owned.userId)
    .run();
  return ok({ id, removed: true });
}
