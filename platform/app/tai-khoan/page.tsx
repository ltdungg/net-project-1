import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { AccountDashboard } from './account-dashboard';

export const metadata: Metadata = { title: 'Tài khoản' };

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-8">
        <AccountDashboard />
      </div>
      <SiteFooter />
    </main>
  );
}
