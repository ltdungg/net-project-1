import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import {
  countInventory,
  InventoryDomainError,
} from '@/lib/inventory-operations';
import { inventoryCountSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:operate')) {
    return fail('FORBIDDEN', 'Bạn không có quyền kiểm kê.', 403);
  }

  const parsed = inventoryCountSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  try {
    const operation = await countInventory(parsed.data, actor.user.userId);
    return ok(operation, {
      status: 'duplicate' in operation && operation.duplicate ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof InventoryDomainError) {
      return fail(error.code, error.message, error.status);
    }
    return fail('INVENTORY_OPERATION_FAILED', 'Chưa thể chốt kiểm kê.', 503);
  }
}
