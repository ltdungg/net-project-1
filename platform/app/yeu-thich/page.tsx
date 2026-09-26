import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { FavoritesClient } from './favorites-client';

export const metadata: Metadata = {
  title: 'Sản phẩm yêu thích',
  description: 'Danh sách thiết kế NÉT bạn đã lưu để xem lại sau.',
};

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border bg-[#f1e9dd]">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Tủ đồ của bạn
          </p>
          <h1 className="mt-2 font-heading text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Sản phẩm yêu thích
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Lưu lại những thiết kế bạn đang cân nhắc. Khi đăng nhập, danh sách
            được đồng bộ an toàn trên tài khoản của bạn.
          </p>
        </div>
      </section>
      <FavoritesClient />
      <SiteFooter />
    </main>
  );
}
