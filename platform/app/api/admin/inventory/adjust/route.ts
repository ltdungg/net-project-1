import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import {
  adjustInventory,
  InventoryDomainError,
} from '@/lib/inventory-operations';
import { inventoryAdjustmentSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:write')) {
    return fail('FORBIDDEN', 'Bạn không có quyền điều chỉnh tồn kho.', 403);
  }

  const parsed = inventoryAdjustmentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  try {
    const operation = await adjustInventory(parsed.data, actor.user.userId);
    return ok(operation, {
      status: 'duplicate' in operation && operation.duplicate ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof InventoryDomainError) {
      return fail(error.code, error.message, error.status);
    }
    return fail('INVENTORY_UPDATE_FAILED', 'Chưa thể cập nhật tồn kho.', 503);
  }
}
