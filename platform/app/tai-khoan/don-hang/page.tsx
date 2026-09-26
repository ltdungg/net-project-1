import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { Button } from '@/components/ui/button';
import { OrdersClient } from './orders-client';

export const metadata: Metadata = { title: 'Đơn hàng của tôi' };

export default function MyOrdersPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Tài khoản</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-heading text-5xl font-semibold">Đơn hàng của tôi</h1>
            <p className="mt-2 text-muted-foreground">Theo dõi thanh toán, đóng gói và giao nhận ở một nơi.</p>
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href="/san-pham" />}>Tiếp tục mua sắm</Button>
        </div>
        <OrdersClient />
      </div>
      <SiteFooter />
    </main>
  );
}
