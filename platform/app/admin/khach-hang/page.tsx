import Link from 'next/link';
import {
  ArrowRight,
  Crown,
  Search,
  ShieldAlert,
  UserRoundPlus,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CUSTOMER_SEGMENTS,
  customerStatusLabels,
  getCustomerDirectory,
  getCustomerSegments,
  type CustomerSegmentCode,
} from '@/lib/admin-customer-data';
import { formatVnd } from '@/lib/catalog-data';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const segmentTone = {
  at_risk: 'border-rose-200 bg-rose-50 text-rose-800',
  vip: 'border-amber-200 bg-amber-50 text-amber-800',
  loyal: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  new: 'border-sky-200 bg-sky-50 text-sky-800',
  potential: 'border-violet-200 bg-violet-50 text-violet-800',
  prospect: 'border-slate-200 bg-slate-50 text-slate-700',
} satisfies Record<CustomerSegmentCode, string>;

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(
        new Date(value),
      )
    : 'Chưa có';
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = scalar(params.search)?.trim() ?? '';
  const status = scalar(params.status) ?? '';
  const segmentValue = scalar(params.segment) ?? '';
  const segment = CUSTOMER_SEGMENTS.includes(
    segmentValue as CustomerSegmentCode,
  )
    ? segmentValue
    : '';
  const page = Math.max(1, Number(scalar(params.page) ?? 1) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const [directory, dashboard] = await Promise.all([
    getCustomerDirectory({ search, status, segment, limit, offset }),
    getCustomerSegments(),
  ]);
  const segmentMap = new Map(dashboard.items.map((item) => [item.code, item]));
  const vip = segmentMap.get('vip')?.customers ?? 0;
  const atRisk = segmentMap.get('at_risk')?.customers ?? 0;
  const newCustomers = segmentMap.get('new')?.customers ?? 0;
  const repeat = dashboard.totalCustomers
    ? Math.round(
        (((segmentMap.get('vip')?.customers ?? 0) +
          (segmentMap.get('loyal')?.customers ?? 0)) /
          dashboard.totalCustomers) *
          1000,
      ) / 10
    : 0;
  const metricCards = [
    {
      icon: Users,
      label: 'Tổng khách hàng',
      value: dashboard.totalCustomers,
      caption: 'Hồ sơ hợp lệ',
    },
    {
      icon: Crown,
      label: 'Khách VIP',
      value: vip,
      caption: 'Doanh thu cao hoặc mua thường xuyên',
    },
    {
      icon: UserRoundPlus,
      label: 'Khách mới',
      value: newCustomers,
      caption: 'Gia nhập trong 30 ngày',
    },
    {
      icon: ShieldAlert,
      label: 'Có nguy cơ rời bỏ',
      value: atRisk,
      caption: 'Không mua lại trên 90 ngày',
    },
  ];

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    if (segment) query.set('segment', segment);
    query.set('page', String(target));
    return `/admin/khach-hang?${query}`;
  };

  return (
    <>
      <PageHeader
        title="Khách hàng & phân khúc"
        description={`Phân nhóm tự động theo hành vi mua hàng · bộ quy tắc ${dashboard.ruleVersion}.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <card.icon className="size-5 text-accent" />
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl">Bức tranh phân khúc</h2>
            <p className="text-sm text-muted-foreground">
              Tỷ lệ khách mua lại hiện tại: {repeat}%.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Tính lại lúc{' '}
            {new Intl.DateTimeFormat('vi-VN', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(dashboard.calculatedAt))}
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.items.map((item) => (
            <Link
              key={item.code}
              href={`/admin/khach-hang?segment=${item.code}`}
              className={`rounded-xl border p-4 transition-transform hover:-translate-y-0.5 ${segmentTone[item.code]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <strong>{item.label}</strong>
                <span className="font-heading text-2xl">{item.customers}</span>
              </div>
              <p className="mt-2 text-xs opacity-80">{item.description}</p>
              <p className="mt-3 text-xs font-semibold">
                {formatVnd(item.revenueCents)} · {item.paidOrders} đơn đã thu
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Tên, email hoặc số điện thoại…"
              className="h-10 pl-9"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            aria-label="Lọc trạng thái khách hàng"
          >
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="disabled">Đã khóa</option>
            <option value="pending">Chờ xác minh</option>
          </select>
          <select
            name="segment"
            defaultValue={segment}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            aria-label="Lọc phân khúc"
          >
            <option value="">Mọi phân khúc</option>
            {dashboard.items.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg">
            Áp dụng
          </Button>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Phân khúc</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Đơn đã thu</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3">Lần mua gần nhất</th>
                <th className="rounded-r-xl px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {directory.items.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {customer.fullName || 'Chưa cập nhật tên'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email}
                      {customer.phone ? ` · ${customer.phone}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant="outline"
                      className={segmentTone[customer.segmentCode]}
                    >
                      {customer.segmentLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={customer.status}
                      label={customerStatusLabels[customer.status]}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    {customer.paidOrders}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">
                    {formatVnd(customer.totalRevenueCents)}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDate(customer.lastPaidOrderAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/khach-hang/${customer.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      Mở hồ sơ <ArrowRight />
                    </Link>
                  </td>
                </tr>
              ))}
              {!directory.items.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Không có khách hàng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Hiển thị {offset + (directory.items.length ? 1 : 0)}–
            {offset + directory.items.length} / {directory.total} khách hàng
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
              href={directory.hasMore ? pageHref(page + 1) : '#'}
              aria-disabled={!directory.hasMore}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                !directory.hasMore && 'pointer-events-none opacity-50',
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
