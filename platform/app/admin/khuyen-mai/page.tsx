import { PromotionCenter } from '@/app/admin/khuyen-mai/promotion-center';
import { getBackofficePromotions } from '@/lib/backoffice-data';
import { requireManagementRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  await requireManagementRole();
  const promotions = await getBackofficePromotions();
  return <PromotionCenter promotions={promotions} />;
}
