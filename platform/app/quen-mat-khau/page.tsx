import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = { title: 'Quên mật khẩu' };

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-8 lg:py-20">
        <section className="rounded-[2rem] border border-border bg-card p-7 sm:p-10">
          <ForgotPasswordForm />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
