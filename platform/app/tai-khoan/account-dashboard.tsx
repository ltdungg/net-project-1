'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, LoaderCircle, LogIn, LogOut, MapPin, Package, UserRound } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotalCents: number;
  createdAt: number;
};

export function AccountDashboard() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      if (!user) {
        setOrders([]);
        return;
      }
      try {
        const result = await commerceRequest<{ items: Order[] }>('/orders');
        if (active) setOrders(result.items.slice(0, 3));
      } catch {
        if (active) setOrders([]);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-accent" /></div>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] bg-secondary/70 p-10 text-center">
        <UserRound className="mx-auto size-12 text-accent" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">Đăng nhập để quản lý đơn</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Lưu địa chỉ, xem lịch sử mua hàng và đồng bộ yêu thích trên mọi thiết bị.
        </p>
        <Button nativeButton={false} className="mt-7 h-11 rounded-full px-6" render={<Link href="/dang-nhap?returnTo=%2Ftai-khoan" />}>
          <LogIn /> Đăng nhập
        </Button>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Tài khoản</p>
          <h1 className="mt-2 font-heading text-5xl font-semibold">Xin chào, {user.fullName}</h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <Button type="button" variant="ghost" className="rounded-full" onClick={() => void logout()}>
          <LogOut /> Đăng xuất
        </Button>
      </div>
      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [UserRound, 'Hồ sơ', 'Cập nhật tên, số điện thoại và nhận tin', '/tai-khoan/ho-so'],
          [Package, 'Đơn hàng', 'Xem và theo dõi đơn đã mua', '/tai-khoan/don-hang'],
          [MapPin, 'Sổ địa chỉ', 'Quản lý địa chỉ giao hàng', '/tai-khoan/dia-chi'],
          [Heart, 'Yêu thích', 'Những sản phẩm bạn đã lưu', '/yeu-thich'],
        ].map(([Icon, title, copy, href]) => (
          <Link key={String(title)} href={String(href)} className="rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1">
            <Icon className="size-5 text-accent" />
            <h2 className="mt-5 font-heading text-2xl font-semibold">{String(title)}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{String(copy)}</p>
          </Link>
        ))}
      </section>
      <section className="mt-8 rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-3xl font-semibold">Đơn gần đây</h2>
          <Button nativeButton={false} variant="ghost" render={<Link href="/tai-khoan/don-hang" />}>Xem tất cả</Button>
        </div>
        <div className="mt-5 divide-y divide-border">
          {orders.map((order) => (
            <Link key={order.id} href={`/don-hang/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-mono text-xs font-semibold">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</p>
              </div>
              <span className="text-sm text-muted-foreground">{order.status}</span>
              <strong>{formatVnd(order.grandTotalCents)}</strong>
            </Link>
          ))}
          {!orders.length ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng gắn với tài khoản này.</div> : null}
        </div>
      </section>
    </>
  );
}
