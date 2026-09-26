import { redirect } from 'next/navigation';

import { commerceServerRequest } from '@/lib/commerce-api-server';

export async function requireManagementRole() {
  const user = await commerceServerRequest<{
    id: string;
    email: string;
    roles: string[];
  }>('/auth/me').catch(() => null);
  if (!user) redirect('/dang-nhap?returnTo=%2Fadmin');
  if (!user.roles.some((role) => role === 'manager' || role === 'admin')) {
    redirect('/admin/don-hang');
  }
  return user;
}
