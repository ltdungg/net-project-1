import { AdminShell } from '@/components/admin/admin-shell';
import { commerceServerRequest } from '@/lib/commerce-api-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await commerceServerRequest<{
    email: string;
    roles: string[];
  }>('/auth/me').catch(() => null);
  if (!user) redirect('/dang-nhap?returnTo=%2Fadmin');
  const role = ['admin', 'manager', 'staff'].find((item) =>
    user.roles.includes(item),
  );
  if (!role) redirect('/tai-khoan');
  return (
    <AdminShell email={user.email} role={role}>
      {children}
    </AdminShell>
  );
}
