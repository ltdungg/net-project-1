import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { VerificationClient } from './verification-client';

export const metadata: Metadata = {
  title: 'Xác minh email',
  description: 'Xác minh email để kích hoạt tài khoản thành viên NÉT.',
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-8 lg:py-20">
        <section className="rounded-[2rem] border border-border bg-card p-7 sm:p-10">
          <VerificationClient />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
