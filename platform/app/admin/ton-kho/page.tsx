import { InventoryWorkbench } from '@/app/admin/ton-kho/inventory-workbench';
import { commerceServerRequest } from '@/lib/commerce-api-server';
import { getInventoryDashboard } from '@/lib/inventory-data';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [data, actor] = await Promise.all([
    getInventoryDashboard(),
    commerceServerRequest<{ roles: string[] }>('/auth/me').catch(
      (): { roles: string[] } => ({ roles: [] }),
    ),
  ]);
  return (
    <InventoryWorkbench
      initialData={data}
      canAdjust={actor.roles.includes('manager') || actor.roles.includes('admin')}
    />
  );
}
