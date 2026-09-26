import type { Metadata } from 'next';

import { SiteHeader } from '@/components/storefront/site-header';
import { CheckoutClient } from './checkout-client';

export const metadata: Metadata = { title: 'Thanh toán' };

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-8">
        <div className="mx-auto grid max-w-lg grid-cols-3 text-center text-xs font-semibold sm:text-sm">
          <div className="border-b border-primary pb-3 text-primary">
            ✓ Giỏ hàng
          </div>
          <div className="border-b-2 border-primary pb-3 text-primary">
            2. Giao hàng
          </div>
          <div className="border-b border-border pb-3 text-muted-foreground">
            3. Hoàn tất
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-8">
        <CheckoutClient />
      </div>
    </main>
  );
}
