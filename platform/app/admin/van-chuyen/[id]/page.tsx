import Link from 'next/link';
import {
  ArrowLeft,
  Box,
  CalendarClock,
  History,
  MapPin,
  Warehouse,
} from 'lucide-react';

import { FulfillmentControl } from '@/app/admin/van-chuyen/[id]/fulfillment-control';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { fulfillmentLabels, getFulfillment } from '@/lib/fulfillment-data';

export const dynamic = 'force-dynamic';

function dateTime(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Chưa có';
}

export default async function FulfillmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shipment = await getFulfillment(id).catch(() => null);
  if (!shipment) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        Không tìm thấy phiếu giao hàng.
      </div>
    );
  }

  const address = shipment.address ?? {};
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/van-chuyen"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Hàng đợi vận chuyển
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
              {shipment.shipmentNumber}
            </h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Phiếu giao cho{' '}
            <Link
              href={`/admin/don-hang/${shipment.orderId}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {shipment.orderNumber}
            </Link>{' '}
            · {shipment.email}
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-2">
          <Warehouse /> {shipment.warehouseCode || 'Kho dữ liệu cũ'}
        </Badge>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Trạng thái', fulfillmentLabels[shipment.status]],
          ['Đối tác', shipment.carrier || 'Chưa chỉ định'],
          ['Dự kiến giao', dateTime(shipment.estimatedDeliveryAt)],
          ['Số lần thất bại', shipment.deliveryAttempts.toLocaleString('vi-VN')],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <strong className="mt-2 block font-heading text-2xl">{value}</strong>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <FulfillmentControl initialData={shipment} />

        <div className="space-y-5">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-accent" />
              <h2 className="font-heading text-2xl">Điểm giao</h2>
            </div>
            <p className="mt-4 font-semibold">
              {address.recipientName || shipment.email} ·{' '}
              {address.phone || shipment.phone}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {[
                address.line1,
                address.ward,
                address.district,
                address.province,
              ]
                .filter(Boolean)
                .join(', ') || 'Chưa có ảnh chụp địa chỉ'}
            </p>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Box className="size-5 text-accent" />
              <h2 className="font-heading text-2xl">Hàng trong kiện</h2>
            </div>
            <div className="mt-4 space-y-3">
              {shipment.items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {item.sku} · {item.variantName}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      Reservation: {item.reservationStatus || 'legacy'}
                    </Badge>
                  </div>
                  <div className="shrink-0 text-right">
                    <strong>× {item.quantity}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatVnd(item.totalCents)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <History className="size-5 text-accent" />
              <h2 className="font-heading text-2xl">Nhật ký vận chuyển</h2>
            </div>
            <ol className="mt-5 space-y-4 border-l border-border pl-5">
              {shipment.events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-accent ring-4 ring-card" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={event.toStatus} />
                    <span className="text-xs text-muted-foreground">
                      {dateTime(event.createdAt)}
                    </span>
                  </div>
                  {event.reason ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.reason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-border/60 bg-secondary/50 p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-5 text-accent" />
              <strong>Đối soát vận hành</strong>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Giá trị đơn {formatVnd(shipment.grandTotalCents)} · chi phí giao nội bộ{' '}
              {formatVnd(shipment.shippingCostCents)} · cập nhật{' '}
              {dateTime(shipment.updatedAt)}.
            </p>
          </section>
        </div>
      </div>

      <div className="mt-5">
        <Link href="/admin/van-chuyen" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft /> Quay lại hàng đợi
        </Link>
      </div>
    </>
  );
}
