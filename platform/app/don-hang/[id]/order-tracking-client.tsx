'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CircleDollarSign, Clock3, LoaderCircle, PackageCheck, Truck } from 'lucide-react';

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
  fulfillmentStatus: string;
  subtotalCents: number;
  discountTotalCents: number;
  shippingTotalCents: number;
  grandTotalCents: number;
  items: {
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    totalCents: number;
  }[];
  fulfillments: {
    id: string;
    shipmentNumber: string;
    status: string;
    carrier: string | null;
    serviceCode: string | null;
    trackingNumber: string | null;
    estimatedDeliveryAt: number | null;
    shippedAt: number | null;
    deliveredAt: number | null;
  }[];
};

const statusRank: Record<string, number> = { pending_payment: 0, confirmed: 1, processing: 2, ready_to_ship: 2, shipped: 3, delivered: 4 };
const statusLabels: Record<string, string> = { pending_payment: 'Chờ thanh toán', pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', processing: 'Đang chuẩn bị', ready_to_ship: 'Chờ bàn giao', shipped: 'Đang giao hàng', delivered: 'Đã giao', failed: 'Giao chưa thành công', cancelled: 'Đã hủy', returned: 'Đã hoàn trả' };

export function OrderTrackingClient({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      const token = window.sessionStorage.getItem(`net:guest-order:${orderId}`);
      const path = token
        ? `/orders/${encodeURIComponent(orderId)}/guest`
        : user
          ? `/orders/${encodeURIComponent(orderId)}`
          : null;
      if (!path) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await commerceRequest<Order>(path, {
          headers: token ? { 'x-guest-order-token': token } : undefined,
        });
        if (active) setOrder(result);
      } catch {
        if (active) setOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [authLoading, orderId, user]);

  if (authLoading || loading) return <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-accent" /></div>;
  if (!order) {
    return (
      <section className="mx-auto max-w-xl py-12 text-center">
        <Clock3 className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">Không thể mở đơn hàng</h1>
        <p className="mt-3 text-muted-foreground">Đăng nhập bằng tài khoản đã đặt đơn, hoặc mở lại đơn trong đúng phiên checkout.</p>
        <Button nativeButton={false} className="mt-7 rounded-full" render={<Link href={`/dang-nhap?returnTo=${encodeURIComponent(`/don-hang/${orderId}`)}`} />}>Đăng nhập để kiểm tra</Button>
      </section>
    );
  }

  const rank = statusRank[order.status] ?? 0;
  const stopped = ['cancelled', 'returned'].includes(order.status);
  const steps = [
    ['Đặt hàng', 'Đơn đã được ghi nhận', Check],
    ['Xác nhận', 'Kho đã tiếp nhận yêu cầu', CircleDollarSign],
    ['Chuẩn bị', 'Sản phẩm được kiểm tra và đóng gói', PackageCheck],
    ['Giao hàng', 'Đơn đang trên đường đến bạn', Truck],
    ['Hoàn tất', 'Đơn đã được giao thành công', Check],
  ] as const;

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Theo dõi đơn</p>
          <h1 className="mt-2 font-heading text-5xl font-semibold">{statusLabels[order.status] ?? order.status}</h1>
          <p className="mt-3 text-muted-foreground">Mã đơn: <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span></p>
        </div>
        <Badge variant={stopped ? 'destructive' : 'secondary'}>Thanh toán: {order.paymentStatus}</Badge>
      </div>

      <section className="mt-10 rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        {stopped ? (
          <div className="rounded-xl bg-destructive/8 p-5 text-sm text-destructive">Đơn hàng đã {order.status === 'cancelled' ? 'được hủy' : 'hoàn trả'}.</div>
        ) : (
          <div className="grid gap-0 md:grid-cols-5">
            {steps.map(([title, copy, Icon], index) => {
              const complete = index <= rank;
              return (
                <div key={title} className="relative flex gap-4 md:block">
                  {index < steps.length - 1 ? <span className={`absolute left-5 top-10 h-[calc(100%-1rem)] w-px md:left-1/2 md:top-5 md:h-px md:w-full ${index < rank ? 'bg-primary' : 'bg-border'}`} /> : null}
                  <span className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full md:mx-auto ${complete ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}><Icon className="size-4" /></span>
                  <div className="pb-8 pt-1 md:px-2 md:pb-0 md:pt-4 md:text-center"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Hành trình giao hàng
            </p>
            <h2 className="mt-1 font-heading text-3xl font-semibold">
              {order.fulfillments.length > 1
                ? `${order.fulfillments.length} kiện hàng`
                : 'Thông tin vận chuyển'}
            </h2>
          </div>
          <Truck className="size-6 text-accent" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {order.fulfillments.map((shipment) => (
            <article key={shipment.id} className="rounded-xl bg-secondary/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold">
                  {shipment.shipmentNumber}
                </p>
                <Badge variant="outline">
                  {statusLabels[shipment.status] ?? shipment.status}
                </Badge>
              </div>
              <p className="mt-3 font-semibold">
                {shipment.carrier || 'Đang chọn đơn vị vận chuyển'}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {shipment.trackingNumber || 'Mã vận đơn sẽ được cập nhật sau'}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {shipment.estimatedDeliveryAt
                  ? `Dự kiến ${new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(shipment.estimatedDeliveryAt))}`
                  : 'Chưa có ngày giao dự kiến'}
              </p>
            </article>
          ))}
          {!order.fulfillments.length ? (
            <p className="text-sm text-muted-foreground">
              Phiếu giao đang được hệ thống khởi tạo.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-3xl font-semibold">Sản phẩm</h2>
          <div className="mt-5 divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-5 py-4 first:pt-0 last:pb-0">
                <div><p className="font-semibold">{item.productName}</p><p className="mt-1 text-xs text-muted-foreground">{item.sku} · {item.variantName} · SL {item.quantity}</p></div>
                <strong>{formatVnd(item.totalCents)}</strong>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl bg-secondary/70 p-6">
          <h2 className="font-heading text-2xl font-semibold">Tổng thanh toán</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Tạm tính</dt><dd>{formatVnd(order.subtotalCents)}</dd></div>
            <div className="flex justify-between text-emerald-700"><dt>Ưu đãi</dt><dd>-{formatVnd(order.discountTotalCents)}</dd></div>
            <div className="flex justify-between"><dt>Giao hàng</dt><dd>{order.shippingTotalCents ? formatVnd(order.shippingTotalCents) : 'Miễn phí'}</dd></div>
            <div className="flex justify-between border-t border-border pt-4 text-base font-semibold"><dt>Tổng cộng</dt><dd>{formatVnd(order.grandTotalCents)}</dd></div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
