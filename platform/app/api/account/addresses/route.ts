import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import { fail, ok, validationFail } from '@/lib/api-response';
import { addressSchema } from '@/lib/validation';

const mutationSchema = addressSchema.extend({
  label: z.string().trim().min(1).max(40).default('Nhà'),
  isDefault: z.boolean().default(false),
});

async function databaseUserId(externalAuthId: string) {
  return env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? LIMIT 1',
  )
    .bind(externalAuthId)
    .first<{ id: string }>();
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  const databaseUser = await databaseUserId(user.userId);
  if (!databaseUser) return ok({ items: [], total: 0 });

  const addresses = await env.DB.prepare(
    `SELECT id, label, recipient_name AS recipientName, phone, line1, ward,
      district, province, postal_code AS postalCode, is_default AS isDefault,
      created_at AS createdAt, updated_at AS updatedAt
     FROM addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC`,
  )
    .bind(databaseUser.id)
    .all();
  return ok({ items: addresses.results, total: addresses.results.length });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);
  const parsed = mutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);
  const databaseUser = await databaseUserId(user.userId);
  if (!databaseUser) {
    return fail(
      'PROFILE_REQUIRED',
      'Vui lòng hoàn tất hồ sơ thành viên trước.',
      409,
    );
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  if (parsed.data.isDefault) {
    statements.push(
      env.DB.prepare(
        'UPDATE addresses SET is_default = 0, updated_at = ? WHERE user_id = ?',
      ).bind(now, databaseUser.id),
    );
  }
  statements.push(
    env.DB.prepare(
      `INSERT INTO addresses (
        id, user_id, label, recipient_name, phone, line1, ward, district,
        province, postal_code, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    ).bind(
      id,
      databaseUser.id,
      parsed.data.label,
      parsed.data.recipientName,
      parsed.data.phone,
      parsed.data.line1,
      parsed.data.ward,
      parsed.data.district,
      parsed.data.province,
      parsed.data.isDefault ? 1 : 0,
      now,
      now,
    ),
  );
  await env.DB.batch(statements);
  return ok({ id, ...parsed.data }, { status: 201 });
}
