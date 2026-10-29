import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { CartClient } from './cart-client';
import { Recommendations } from '@/components/storefront/recommendations';

export const metadata: Metadata = { title: 'Giỏ hàng' };

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Trang chủ
          </Link>
          <ChevronRight className="size-3" />
          <span>Giỏ hàng</span>
        </nav>
        <h1 className="font-heading text-5xl font-semibold tracking-[-0.045em]">
          Giỏ hàng của bạn
        </h1>
        <p className="mb-10 mt-3 text-muted-foreground">
          Kiểm tra size, màu và số lượng trước khi thanh toán.
        </p>
        <div className="mb-10 grid grid-cols-3 text-center text-xs font-semibold sm:max-w-lg sm:text-sm">
          <div className="border-b-2 border-primary pb-3 text-primary">
            1. Giỏ hàng
          </div>
          <div className="border-b border-border pb-3 text-muted-foreground">
            2. Giao hàng
          </div>
          <div className="border-b border-border pb-3 text-muted-foreground">
            3. Hoàn tất
          </div>
        </div>
        <CartClient />
      </div>
      <Recommendations />
      <SiteFooter />
    </main>
  );
}
