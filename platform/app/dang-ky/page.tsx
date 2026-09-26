import type { Metadata } from 'next';
import { Gift, ShieldCheck, Sparkles } from 'lucide-react';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { RegistrationForm } from './registration-form';

export const metadata: Metadata = {
  title: 'Đăng ký thành viên',
  description: 'Tạo tài khoản NÉT và xác minh email để mua sắm thuận tiện hơn.',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:py-16">
        <aside className="rounded-[2rem] bg-[#d8c5ae] p-8 text-primary sm:p-10 lg:sticky lg:top-28">
          <Sparkles className="size-7 text-accent" />
          <h1 className="mt-6 font-heading text-5xl font-semibold leading-[1.02]">
            Trở thành một phần của NÉT.
          </h1>
          <p className="mt-5 text-sm leading-7 text-primary/70">
            Một tài khoản dùng cho lịch sử mua sắm, địa chỉ giao nhận, yêu thích
            và quyền lợi thành viên.
          </p>
          <div className="mt-8 space-y-4 border-t border-primary/12 pt-7 text-sm">
            <div className="flex gap-3">
              <Gift className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Mã CHAONET giảm 10% cho đơn đầu tiên đủ điều kiện</span>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Xác minh email và mật khẩu được mã hóa một chiều</span>
            </div>
          </div>
        </aside>
        <section className="rounded-[2rem] border border-border bg-card p-7 sm:p-10">
          <RegistrationForm />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
