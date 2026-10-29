import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { requireManagementRole } from '@/lib/admin-auth';
import { BackendLogs } from './backend-logs';

export const dynamic = 'force-dynamic';

export default async function BackendLogsPage() {
  const user = await requireManagementRole();
  if (!user.roles.includes('admin')) redirect('/admin');
  return (
    <>
      <PageHeader eyebrow="Vận hành" title="Nhật ký backend"
        description="Theo dõi yêu cầu, cảnh báo và lỗi của hệ thống. Nhật ký mới nhất hiển thị trước." />
      <BackendLogs />
    </>
  );
}
