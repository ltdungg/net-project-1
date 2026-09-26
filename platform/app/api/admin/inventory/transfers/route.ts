import { fail, ok, validationFail } from '@/lib/api-response';
import { getActor, hasPermission } from '@/lib/authz';
import {
  InventoryDomainError,
  transferInventory,
} from '@/lib/inventory-operations';
import { inventoryTransferSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor.user || !hasPermission(actor.role, 'inventory:operate')) {
    return fail('FORBIDDEN', 'Bạn không có quyền chuyển kho.', 403);
  }

  const parsed = inventoryTransferSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return validationFail(parsed.error);

  try {
    const operation = await transferInventory(parsed.data, actor.user.userId);
    return ok(operation, {
      status: 'duplicate' in operation && operation.duplicate ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof InventoryDomainError) {
      return fail(error.code, error.message, error.status);
    }
    return fail('INVENTORY_OPERATION_FAILED', 'Chưa thể chuyển kho.', 503);
  }
}
