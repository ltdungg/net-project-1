import Link from 'next/link';
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';

import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  customerStatusLabels,
  getAdminCustomer,
} from '@/lib/admin-customer-data';
import { formatVnd } from '@/lib/catalog-data';

export const dynamic = 'force-dynamic';

function dateTime(value: number | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : 'Chưa có';
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id).catch(() => null);
  if (!customer) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        Không tìm thấy hồ sơ khách hàng.
      </div>
    );
  }

  const { profile, statistics, segment } = customer;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/khach-hang"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Danh sách khách hàng
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
              {profile.fullName || 'Khách hàng chưa cập nhật tên'}
            </h1>
            <StatusBadge
              status={profile.status}
              label={customerStatusLabels[profile.status]}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Hồ sơ 360° · dữ liệu mua hàng, liên hệ và địa chỉ giao nhận.
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-2 text-sm">
          {segment.label} · {segment.ruleVersion}
        </Badge>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Doanh thu đã thu', formatVnd(statistics.totalRevenueCents)],
          ['Đơn đã thanh toán', statistics.paidOrders.toLocaleString('vi-VN')],
          ['Giá trị đơn TB', formatVnd(statistics.averageOrderValueCents)],
          ['Đơn hoàn tất', statistics.deliveredOrders.toLocaleString('vi-VN')],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <strong className="mt-2 block font-heading text-3xl">{value}</strong>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-accent" />
              <h2 className="font-heading text-2xl">Thông tin liên hệ</h2>
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-medium">{profile.email}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Điện thoại</dt>
                  <dd className="font-medium">{profile.phone || 'Chưa cập nhật'}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Gia nhập / đăng nhập gần nhất</dt>
                  <dd className="font-medium">
                    {dateTime(profile.createdAt)} · {dateTime(profile.lastLoginAt)}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-5 rounded-xl bg-secondary/60 p-4">
              <p className="text-sm font-semibold">{segment.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {segment.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Mua gần nhất: {dateTime(statistics.lastPaidOrderAt)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-accent" />
              <h2 className="font-heading text-2xl">Địa chỉ giao hàng</h2>
            </div>
            <div className="mt-4 space-y-3">
              {customer.addresses.items.map((address) => (
                <article key={address.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm">{address.label}</strong>
                    {address.isDefault ? (
                      <Badge variant="secondary">Mặc định</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm">
                    {address.recipientName} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {[address.line1, address.ward, address.district, address.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </article>
              ))}
              {!customer.addresses.items.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Khách hàng chưa lưu địa chỉ.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-accent" />
            <h2 className="font-heading text-2xl">Lịch sử đơn hàng</h2>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Mã đơn</th>
                  <th className="px-3 py-3">Ngày đặt</th>
                  <th className="px-3 py-3">Đơn hàng</th>
                  <th className="px-3 py-3">Thanh toán</th>
                  <th className="px-3 py-3 text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {customer.orderHistory.items.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-4 font-mono text-xs font-semibold">
                      <Link
                        href={`/admin/don-hang/${order.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {dateTime(order.placedAt ?? order.createdAt)}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-3 py-4 text-right font-semibold">
                      {formatVnd(order.grandTotalCents)}
                    </td>
                  </tr>
                ))}
                {!customer.orderHistory.items.length ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Khách hàng chưa phát sinh đơn hàng.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {statistics.cancelledOrders} đơn đã hủy · {statistics.totalOrders}{' '}
            đơn được ghi nhận trong toàn bộ lịch sử.
          </p>
        </section>
      </div>

      <div className="mt-5">
        <Link href="/admin/khach-hang" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft /> Quay lại danh sách
        </Link>
      </div>
    </>
  );
}
