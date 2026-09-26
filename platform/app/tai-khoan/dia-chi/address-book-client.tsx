'use client';

import Link from 'next/link';
import { LoaderCircle, MapPin } from 'lucide-react';

import { AddressManager } from './address-manager';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';

export function AddressBookClient() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-accent" /></div>;
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <MapPin className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-3xl font-semibold">Đăng nhập để quản lý địa chỉ</h1>
        <Button nativeButton={false} className="mt-6 rounded-full" render={<Link href="/dang-nhap?returnTo=%2Ftai-khoan%2Fdia-chi" />}>Đăng nhập</Button>
      </div>
    );
  }
  return <AddressManager initialAddresses={[]} />;
}
