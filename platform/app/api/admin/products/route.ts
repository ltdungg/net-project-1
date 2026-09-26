import { env } from 'cloudflare:workers';

import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import { listCatalogProductsFromDb } from '@/lib/catalog-repository';
import { productMutationSchema } from '@/lib/validation';

export async function GET() {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'catalog:read')) {
    return fail(
      'UNAUTHORIZED',
      'Bạn không có quyền xem danh mục quản trị.',
      401,
    );
  }
  const items = await listCatalogProductsFromDb({ includeDrafts: true });
  return ok({ items, total: items.length });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'catalog:write')) {
    return fail('FORBIDDEN', 'Bạn không có quyền tạo sản phẩm.', 403);
  }

  const parsed = productMutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO products (
          id, slug, name, subtitle, description, material, status, featured,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        parsed.data.slug,
        parsed.data.name,
        parsed.data.subtitle ?? null,
        parsed.data.description,
        parsed.data.material ?? null,
        parsed.data.status,
        parsed.data.featured ? 1 : 0,
        now,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO audit_logs (
          id, actor_user_id, action, entity_type, entity_id, after_json,
          correlation_id, created_at
        ) VALUES (?, NULL, 'product.create', 'product', ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        JSON.stringify(parsed.data),
        crypto.randomUUID(),
        now,
      ),
    ];
    if (parsed.data.categoryId) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO product_categories (
            product_id, category_id, is_primary, sort_order
          ) VALUES (?, ?, 1, 0)`,
        ).bind(id, parsed.data.categoryId),
      );
    }
    if (parsed.data.initialVariant) {
      const variantId = crypto.randomUUID();
      const inventoryItemId = crypto.randomUUID();
      statements.push(
        env.DB.prepare(
          `INSERT INTO product_variants (
            id, product_id, sku, size, color, color_hex, price_cents,
            compare_at_price_cents, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        ).bind(
          variantId,
          id,
          parsed.data.initialVariant.sku.toUpperCase(),
          parsed.data.initialVariant.size,
          parsed.data.initialVariant.color,
          parsed.data.initialVariant.colorHex,
          parsed.data.initialVariant.priceCents,
          parsed.data.initialVariant.compareAtPriceCents ?? null,
          now,
          now,
        ),
        env.DB.prepare(
          `INSERT INTO inventory_items (
            id, warehouse_id, variant_id, on_hand, reserved, safety_stock,
            reorder_point, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 0, ?, ?, 1, ?, ?)`,
        ).bind(
          inventoryItemId,
          parsed.data.initialVariant.warehouseId,
          variantId,
          parsed.data.initialVariant.openingStock,
          parsed.data.initialVariant.safetyStock,
          parsed.data.initialVariant.reorderPoint,
          now,
          now,
        ),
        env.DB.prepare(
          `INSERT INTO inventory_movements (
            id, inventory_item_id, type, quantity_delta, balance_after,
            reference_type, reference_id, reason, idempotency_key, created_at
          ) VALUES (?, ?, 'opening_balance', ?, ?, 'product', ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          inventoryItemId,
          parsed.data.initialVariant.openingStock,
          parsed.data.initialVariant.openingStock,
          id,
          'Tồn đầu khi tạo sản phẩm',
          `product:${id}:opening`,
          now,
        ),
      );
    }
    await env.DB.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE'))
      return fail('SLUG_EXISTS', 'Slug sản phẩm đã tồn tại.', 409);
    return fail('PRODUCT_CREATE_FAILED', 'Chưa thể tạo sản phẩm.', 503);
  }

  return ok({ id, ...parsed.data }, { status: 201 });
}
