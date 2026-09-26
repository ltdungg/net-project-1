'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, Package } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotalCents: number;
  createdAt: number;
};

export function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await commerceRequest<{ items: Order[] }>('/orders');
        if (active) setOrders(result.items);
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-accent" /></div>;
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <Package className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 font-heading text-3xl font-semibold">Đăng nhập để xem đơn hàng</h2>
        <Button nativeButton={false} className="mt-6 rounded-full" render={<Link href="/dang-nhap?returnTo=%2Ftai-khoan%2Fdon-hang" />}>Đăng nhập</Button>
      </div>
    );
  }

  return (
    <section className="mt-9 space-y-3">
      {orders.map((order) => (
        <Link key={order.id} href={`/don-hang/${order.id}`} className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-accent"><Package /></span>
            <div>
              <p className="font-mono text-xs font-semibold">{order.orderNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt))}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-5 sm:justify-end">
            <Badge variant="secondary">{order.status}</Badge>
            <strong>{formatVnd(order.grandTotalCents)}</strong>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
      {!orders.length ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 font-heading text-2xl font-semibold">Chưa có đơn hàng</h2>
          <p className="mt-2 text-sm text-muted-foreground">Đơn đặt khi đăng nhập sẽ xuất hiện tại đây.</p>
        </div>
      ) : null}
    </section>
  );
}
