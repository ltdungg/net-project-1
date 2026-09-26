import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { getChatGPTUser } from '@/app/chatgpt-auth';
import { fail, ok, validationFail } from '@/lib/api-response';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9,10}$/),
  marketingConsent: z.boolean().default(false),
});

type ProfileRow = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  marketingConsent: number;
  createdAt: number;
};

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);

  const profile = await env.DB.prepare(
    `SELECT id, email, full_name AS fullName, phone,
            marketing_consent AS marketingConsent, created_at AS createdAt
     FROM users WHERE external_auth_id = ?`,
  )
    .bind(user.userId)
    .first<ProfileRow>();

  return ok(
    profile
      ? { ...profile, marketingConsent: Boolean(profile.marketingConsent) }
      : null,
  );
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập.', 401);

  const parsed = profileSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  const now = Date.now();
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE external_auth_id = ? OR lower(email) = lower(?) LIMIT 1',
  )
    .bind(user.userId, user.email)
    .first<{ id: string }>();
  const userId = existing?.id ?? crypto.randomUUID();

  const statements: D1PreparedStatement[] = [];
  if (existing) {
    statements.push(
      env.DB.prepare(
        `UPDATE users SET external_auth_id = ?, email = ?, full_name = ?, phone = ?,
          marketing_consent = ?, last_login_at = ?, updated_at = ? WHERE id = ?`,
      ).bind(
        user.userId,
        user.email.toLowerCase(),
        parsed.data.fullName,
        parsed.data.phone,
        parsed.data.marketingConsent ? 1 : 0,
        now,
        now,
        userId,
      ),
    );
  } else {
    statements.push(
      env.DB.prepare(
        `INSERT INTO users (
          id, external_auth_id, email, full_name, phone, status,
          marketing_consent, last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      ).bind(
        userId,
        user.userId,
        user.email.toLowerCase(),
        parsed.data.fullName,
        parsed.data.phone,
        parsed.data.marketingConsent ? 1 : 0,
        now,
        now,
        now,
      ),
    );
  }
  statements.push(
    env.DB.prepare(
      `INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at)
       SELECT ?, id, ? FROM roles WHERE code = 'customer'`,
    ).bind(userId, now),
  );

  try {
    await env.DB.batch(statements);
  } catch {
    return fail(
      'PROFILE_SAVE_FAILED',
      'Chưa thể lưu hồ sơ. Vui lòng thử lại.',
      503,
    );
  }

  return ok({
    id: userId,
    email: user.email,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    marketingConsent: parsed.data.marketingConsent,
    status: 'active',
  });
}
