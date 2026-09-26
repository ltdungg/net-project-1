import Link from 'next/link';
import { Download, Search } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBackofficeOrders } from '@/lib/backoffice-data';
import { formatVnd } from '@/lib/catalog-data';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const adminOrders = await getBackofficeOrders();
  const processing = adminOrders.filter((order) =>
    ['confirmed', 'processing', 'ready_to_ship'].includes(order.status),
  ).length;
  const shipping = adminOrders.filter(
    (order) => order.status === 'shipped',
  ).length;
  const attention = adminOrders.filter((order) =>
    ['pending_payment', 'returned', 'cancelled'].includes(order.status),
  ).length;
  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description="Xử lý đơn theo máy trạng thái, kiểm soát thanh toán, fulfillment và SLA."
        action={
          <Button variant="outline">
            <Download /> Xuất đơn
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ['Tất cả', String(adminOrders.length)],
          ['Cần xử lý', String(processing)],
          ['Đang giao', String(shipping)],
          ['Cần chú ý', String(attention)],
        ].map(([label, value]) => (
          <button
            key={label}
            className="rounded-xl bg-card p-4 text-left shadow-sm"
          >
            <span className="text-xs text-muted-foreground">{label}</span>
            <strong className="mt-1 block font-heading text-3xl">
              {value}
            </strong>
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="relative mb-5 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Mã đơn, email, số điện thoại…" className="pl-9" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3 font-medium">Mã đơn</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Thanh toán</th>
                <th className="px-4 py-3 font-medium">Đơn hàng</th>
                <th className="rounded-r-xl px-4 py-3 text-right font-medium">
                  Tổng
                </th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-4 font-mono text-xs font-semibold">
                    <Link
                      href={`/admin/don-hang/${order.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.email}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {order.createdAt}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.payment} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">
                    {formatVnd(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
