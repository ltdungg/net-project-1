import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

const schema = z.object({
  storageKey: z.string().min(3).max(500),
  publicUrl: z.string().min(1).max(1_000),
  altText: z.string().trim().min(2).max(200),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'catalog:write')) {
    return fail('FORBIDDEN', 'Bạn không có quyền cập nhật ảnh sản phẩm.', 403);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationFail(parsed.error);
  const { id: productId } = await context.params;
  const product = await env.DB.prepare('SELECT id FROM products WHERE id = ?')
    .bind(productId)
    .first();
  if (!product)
    return fail('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', 404);
  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO product_media (
      id, product_id, storage_key, public_url, media_type, alt_text,
      sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'image', ?, 0, ?, ?)`,
  )
    .bind(
      id,
      productId,
      parsed.data.storageKey,
      parsed.data.publicUrl,
      parsed.data.altText,
      now,
      now,
    )
    .run();
  return ok({ id, productId, ...parsed.data }, { status: 201 });
}
