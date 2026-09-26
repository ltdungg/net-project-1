import { env } from 'cloudflare:workers';

import { fail, ok } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const maxBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'catalog:write')) {
    return fail('FORBIDDEN', 'Bạn không có quyền tải ảnh sản phẩm.', 403);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File))
    return fail('FILE_REQUIRED', 'Vui lòng chọn một tệp ảnh.', 400);
  if (!allowedTypes.has(file.type))
    return fail('UNSUPPORTED_MEDIA', 'Định dạng ảnh không được hỗ trợ.', 415);
  if (file.size > maxBytes)
    return fail('FILE_TOO_LARGE', 'Ảnh phải nhỏ hơn 8 MB.', 413);

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.FILES.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: { uploadedBy: actor.user.email },
  });

  const origin = env.PUBLIC_ASSET_ORIGIN?.replace(/\/$/, '');
  return ok(
    { key, url: origin ? `${origin}/api/assets/${key}` : `/api/assets/${key}` },
    { status: 201 },
  );
}
