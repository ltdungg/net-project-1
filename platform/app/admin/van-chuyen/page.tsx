import Link from 'next/link';
import {
  ArrowRight,
  CircleAlert,
  Clock3,
  PackageCheck,
  Search,
  Truck,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVnd } from '@/lib/catalog-data';
import {
  FULFILLMENT_STATUSES,
  fulfillmentLabels,
  getFulfillments,
  type FulfillmentStatus,
} from '@/lib/fulfillment-data';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateTime(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Chưa hẹn';
}

export default async function FulfillmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = scalar(params.search)?.trim() ?? '';
  const statusValue = scalar(params.status) ?? '';
  const status = FULFILLMENT_STATUSES.includes(
    statusValue as FulfillmentStatus,
  )
    ? statusValue
    : '';
  const carrier = scalar(params.carrier)?.trim() ?? '';
  const page = Math.max(1, Number(scalar(params.page) ?? 1) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const data = await getFulfillments({
    search,
    status,
    carrier,
    limit,
    offset,
  });

  const cards = [
    {
      label: 'Chờ xử lý',
      value: data.summary.waiting,
      caption: 'Từ tiếp nhận đến sẵn sàng',
      icon: Clock3,
      tone: 'text-amber-700',
    },
    {
      label: 'Sẵn sàng bàn giao',
      value: data.summary.readyToShip,
      caption: 'Cần mã vận đơn trước khi xuất kho',
      icon: PackageCheck,
      tone: 'text-sky-700',
    },
    {
      label: 'Đang giao',
      value: data.summary.inTransit,
      caption: 'Đã bàn giao đối tác vận chuyển',
      icon: Truck,
      tone: 'text-emerald-700',
    },
    {
      label: 'Ngoại lệ',
      value: data.summary.exceptions,
      caption: 'Cần xử lý giao thất bại',
      icon: CircleAlert,
      tone: 'text-rose-700',
    },
  ];

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    if (carrier) query.set('carrier', carrier);
    query.set('page', String(target));
    return `/admin/van-chuyen?${query}`;
  };

  return (
    <>
      <PageHeader
        title="Quản lý vận chuyển"
        description="Mỗi đơn tự sinh phiếu giao theo kho; theo dõi bàn giao, giao hàng và ngoại lệ trên một luồng nghiệp vụ."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <card.icon className={`size-5 ${card.tone}`} />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {card.label}
            </p>
            <strong className="mt-1 block font-heading text-3xl">
              {card.value.toLocaleString('vi-VN')}
            </strong>
            <span className="text-xs text-muted-foreground">{card.caption}</span>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl">Hàng đợi giao hàng</h2>
            <p className="text-sm text-muted-foreground">
              Đã giao hôm nay: {data.summary.deliveredToday} · Tổng phiếu:{' '}
              {data.summary.total}
            </p>
          </div>
          <Badge variant="outline">Tồn kho trừ khi bàn giao</Badge>
        </div>

        <form className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Mã phiếu, mã đơn, email, tracking…"
              className="h-10 pl-9"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            aria-label="Lọc trạng thái vận chuyển"
          >
            <option value="">Mọi trạng thái</option>
            {FULFILLMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {fulfillmentLabels[value]}
              </option>
            ))}
          </select>
          <Input
            name="carrier"
            defaultValue={carrier}
            placeholder="Đơn vị vận chuyển"
            className="h-10"
          />
          <Button type="submit" size="lg">
            Áp dụng
          </Button>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3">Phiếu giao / Đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Kho</th>
                <th className="px-4 py-3">Vận chuyển</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Dự kiến</th>
                <th className="px-4 py-3 text-right">Giá trị đơn</th>
                <th className="rounded-r-xl px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-mono text-xs font-semibold">
                      {item.shipmentNumber}
                    </p>
                    <Link
                      href={`/admin/don-hang/${item.orderId}`}
                      className="mt-1 block text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {item.orderNumber} · {item.totalQuantity} sản phẩm
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{item.email}</p>
                    <p className="text-xs text-muted-foreground">{item.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline">
                      {item.warehouseCode || 'Kho cũ'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{item.carrier || 'Chưa chỉ định'}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.trackingNumber || 'Chưa có mã vận đơn'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                    {item.lastFailureReason ? (
                      <p className="mt-1 max-w-56 text-xs text-rose-700">
                        {item.lastFailureReason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {dateTime(item.estimatedDeliveryAt)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">
                    {formatVnd(item.grandTotalCents)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/van-chuyen/${item.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      Xử lý <ArrowRight />
                    </Link>
                  </td>
                </tr>
              ))}
              {!data.items.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Không có phiếu giao phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Hiển thị {offset + (data.items.length ? 1 : 0)}–
            {offset + data.items.length} / {data.total} phiếu giao
          </p>
          <div className="flex gap-2">
            <Link
              href={page > 1 ? pageHref(page - 1) : '#'}
              aria-disabled={page <= 1}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                page <= 1 && 'pointer-events-none opacity-50',
              )}
            >
              Trang trước
            </Link>
            <Link
              href={data.hasMore ? pageHref(page + 1) : '#'}
              aria-disabled={!data.hasMore}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                !data.hasMore && 'pointer-events-none opacity-50',
              )}
            >
              Trang sau
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
