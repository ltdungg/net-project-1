import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { ProfileEditor } from './profile-editor';

export const metadata: Metadata = { title: 'Hồ sơ thành viên' };

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
        <ProfileEditor />
      </div>
      <SiteFooter />
    </main>
  );
}
