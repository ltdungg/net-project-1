import type { Metadata } from 'next';

import { OrderTrackingClient } from './order-tracking-client';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';

export const metadata: Metadata = { title: 'Theo dõi đơn hàng' };

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
        <OrderTrackingClient orderId={id} />
      </div>
      <SiteFooter />
    </main>
  );
}
