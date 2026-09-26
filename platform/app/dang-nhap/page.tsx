import type { Metadata } from 'next';
import {
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập an toàn để quản lý tài khoản và đơn hàng NÉT.',
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch lg:py-16">
        <section className="flex flex-col justify-center rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
            <Sparkles className="size-5 text-accent" />
          </span>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Thành viên NÉT
          </p>
          <h1 className="mt-3 font-heading text-5xl font-semibold leading-[1.02]">
            Mọi đơn hàng,
            <br />
            một nơi quản lý.
          </h1>
          <div className="mt-9 space-y-4 text-sm text-primary-foreground/70">
            {[
              [PackageCheck, 'Theo dõi trạng thái đơn theo thời gian thực'],
              [ShieldCheck, 'Lưu địa chỉ và thông tin nhận hàng an toàn'],
              [LockKeyhole, 'Mật khẩu được băm; phiên đăng nhập dùng cookie bảo mật'],
            ].map(([Icon, copy]) => (
              <div key={String(copy)} className="flex items-center gap-3">
                <Icon className="size-4 text-accent" /> {String(copy)}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-center rounded-[2rem] border border-border bg-card p-8 sm:p-12">
          <SignInForm />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
