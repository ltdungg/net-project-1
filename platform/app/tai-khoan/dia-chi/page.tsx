import type { Metadata } from 'next';

import { AddressBookClient } from './address-book-client';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';

export const metadata: Metadata = { title: 'Sổ địa chỉ' };

export default function AddressBookPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
        <AddressBookClient />
      </div>
      <SiteFooter />
    </main>
  );
}
