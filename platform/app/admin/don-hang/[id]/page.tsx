import Link from 'next/link';
import {
  ArrowLeft,
  Box,
  CreditCard,
  History,
  MapPin,
  PackageCheck,
  Truck,
} from 'lucide-react';

import { OrderStatusControl } from '@/app/admin/don-hang/[id]/order-status-control';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { commerceServerRequest } from '@/lib/commerce-api-server';

export const dynamic = 'force-dynamic';

type OrderDetail = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotalCents: number;
  discountTotalCents: number;
  shippingTotalCents: number;
  grandTotalCents: number;
  shippingAddressJson: string;
  customerNote: string | null;
  createdAt: number;
  shippingAddress: Record<string, string> | null;
  items: OrderItemRow[];
  history: HistoryRow[];
  reservations: ReservationView[];
  fulfillments: FulfillmentView[];
};

type FulfillmentView = {
  id: string;
  shipmentNumber: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  warehouseCode: string | null;
  warehouseName: string | null;
  totalQuantity: number;
  estimatedDeliveryAt: number | null;
};

type HistoryRow = {
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: number;
};

type OrderItemRow = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

type ReservationView = {
  id: string;
  sku: string;
  quantity: number;
  status: string;
  warehouseCode: string;
  expiresAt: number;
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await commerceServerRequest<OrderDetail>(
    `/admin/orders/${encodeURIComponent(id)}`,
  ).catch(() => null);

  if (!order)
    return (
      <div className="rounded-2xl bg-card p-8">Không tìm thấy đơn hàng.</div>
    );
  const address = order.shippingAddress ?? {};

  return (
    <>
      <Button
        nativeButton={false}
        variant="ghost"
        render={<Link href="/admin/don-hang" />}
      >
        <ArrowLeft /> Quay lại đơn hàng
      </Button>
      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Chi tiết đơn hàng
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('vi-VN', {
              dateStyle: 'full',
              timeStyle: 'short',
            }).format(new Date(order.createdAt))}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.status} />
        </div>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
              <Box className="size-5 text-accent" /> Sản phẩm
            </h2>
            <div className="mt-5 divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={String(item.id)}
                  className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">{String(item.productName)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(item.sku)} · {String(item.variantName)} · SL{' '}
                      {Number(item.quantity)}
                    </p>
                  </div>
                  <strong>{formatVnd(Number(item.totalCents))}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
                <Truck className="size-5 text-accent" /> Phiếu giao hàng
              </h2>
              <span className="text-xs text-muted-foreground">
                {order.fulfillments.length} kiện
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {order.fulfillments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/admin/van-chuyen/${shipment.id}`}
                  className="rounded-xl border border-border p-4 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs font-semibold">
                      {shipment.shipmentNumber}
                    </p>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {shipment.carrier || 'Chưa chỉ định đối tác'}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {shipment.trackingNumber || 'Chưa có mã vận đơn'}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {shipment.warehouseCode || 'Kho cũ'} · {shipment.totalQuantity}{' '}
                    sản phẩm
                  </p>
                </Link>
              ))}
            </div>
          </section>
          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
                <MapPin className="size-5 text-accent" /> Giao nhận
              </h2>
              <p className="mt-4 font-semibold">{address.recipientName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.phone} · {order.email}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {[
                  address.line1,
                  address.ward,
                  address.district,
                  address.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {order.customerNote ? (
                <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">
                  {order.customerNote}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
                <PackageCheck className="size-5 text-accent" /> Reservation
              </h2>
              <div className="mt-4 space-y-3">
                {order.reservations.map((item) => (
                  <div
                    key={String(item.id)}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {String(item.sku)} · {String(item.warehouseCode)}
                    </span>
                    <strong>
                      {Number(item.quantity)} · {String(item.status)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
              <History className="size-5 text-accent" /> Lịch sử trạng thái
            </h2>
            <div className="mt-5 space-y-4">
              {order.history.map((entry, index) => (
                <div
                  key={`${String(entry.createdAt)}-${index}`}
                  className="flex gap-3"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-semibold">
                      {entry.fromStatus ?? 'Khởi tạo'} → {entry.toStatus}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.reason ? `${entry.reason} · ` : ''}
                      {new Intl.DateTimeFormat('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(Number(entry.createdAt)))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold">
              Cập nhật xử lý
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Máy trạng thái kiểm soát bước hợp lệ; xuất hàng đồng thời tiêu thụ
              reservation.
            </p>
            <div className="mt-5">
              <OrderStatusControl
                orderId={order.id}
                currentStatus={order.status}
                paymentStatus={order.paymentStatus}
                fulfillmentId={order.fulfillments[0]?.id}
              />
            </div>
          </section>
          <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold">
              <CreditCard className="size-5 text-accent" /> Tổng thanh toán
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd>{formatVnd(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ưu đãi</dt>
                <dd>-{formatVnd(order.discountTotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Giao hàng</dt>
                <dd>{formatVnd(order.shippingTotalCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-4 text-base font-semibold">
                <dt>Tổng</dt>
                <dd>{formatVnd(order.grandTotalCents)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
