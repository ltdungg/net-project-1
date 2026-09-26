import { fail, ok } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import { getInventoryDashboard } from '@/lib/inventory-data';

export async function GET() {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:read')) {
    return fail('FORBIDDEN', 'Bạn không có quyền xem tồn kho.', 403);
  }

  return ok(await getInventoryDashboard());
}
