import { fail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import { getInventoryDashboard } from '@/lib/inventory-data';

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET() {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:read')) {
    return fail('FORBIDDEN', 'Bạn không có quyền xuất tồn kho.', 403);
  }

  const dashboard = await getInventoryDashboard();
  const header = [
    'Kho',
    'SKU',
    'Sản phẩm',
    'Màu',
    'Kích cỡ',
    'On hand',
    'Reserved',
    'Safety stock',
    'ATP',
    'Điểm đặt hàng',
    'Cập nhật lúc',
  ];
  const rows = dashboard.items.map((item) => [
    item.warehouseCode,
    item.sku,
    item.product,
    item.color,
    item.size,
    item.onHand,
    item.reserved,
    item.safetyStock,
    item.atp,
    item.reorderPoint,
    new Date(item.updatedAt).toISOString(),
  ]);
  const csv = `\uFEFF${[header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')}`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="inventory-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
