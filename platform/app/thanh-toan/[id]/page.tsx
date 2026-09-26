import { OnlinePaymentClient } from './online-payment-client';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';

export default async function OnlinePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-8">
        <OnlinePaymentClient orderId={id} />
      </section>
      <SiteFooter />
    </main>
  );
}
