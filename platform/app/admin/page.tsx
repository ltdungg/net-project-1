import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  Download,
  MoreHorizontal,
  PackageOpen,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardData } from '@/lib/backoffice-data';
import { formatVnd } from '@/lib/catalog-data';
import { requireManagementRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireManagementRole();
  const {
    orders: adminOrders,
    metrics: dashboardMetrics,
    lowStock: inventoryRows,
    revenueSeries,
  } = await getDashboardData();
  const max = Math.max(1, ...revenueSeries);
  return (
    <>
      <PageHeader
        eyebrow="Chủ nhật · 31/08/2026"
        title="Chào buổi sáng"
        description="Tổng quan vận hành theo dữ liệu 30 ngày gần nhất. Có 3 việc cần ưu tiên trước 12:00."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full bg-card">
              <CalendarDays /> 01–31/08/2026
            </Button>
            <Button
              nativeButton={false}
              className="rounded-full"
              render={<Link href="/admin/san-pham/moi" />}
            >
              <Plus /> Thêm sản phẩm
            </Button>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <strong>Hệ thống hoạt động ổn định</strong>
          <span className="hidden text-emerald-700 sm:inline">
            · Backend, PostgreSQL và Redis đang phản hồi
          </span>
        </div>
        <span className="text-xs text-emerald-700">Theo healthcheck hiện tại</span>
      </div>
      <Link
        href="/admin/ai"
        className="group mb-5 flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm sm:flex-row sm:items-center sm:p-6"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Mới · NÉT AI Copilot
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold">
              Hỏi dữ liệu cửa hàng bằng tiếng Việt
            </h2>
            <p className="mt-1 text-xs text-primary-foreground/55 sm:text-sm">
              Tóm tắt đơn, cảnh báo tồn kho, doanh thu và voucher trong vài
              giây.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm font-semibold">
          Mở Copilot{' '}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, metricIndex) => {
          const MetricIcon = [TrendingUp, ShoppingBag, Users, CircleCheck][
            metricIndex
          ];
          const series = [42, 48, 45, 58, 55, 68, 72];
          return (
            <Card key={metric.label} className="border-0 bg-card shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">
                  <MetricIcon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <strong className="font-heading text-4xl font-semibold tracking-tight">
                    {metric.value}
                  </strong>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {metric.delta}
                  </span>
                </div>
                <div className="mt-5 flex h-8 items-end gap-1">
                  {series.map((value, index) => (
                    <span
                      key={`${metric.label}-${index}`}
                      className="flex-1 rounded-sm bg-primary/12 last:bg-accent"
                      style={{ height: `${value + metricIndex * 2}%` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  So với 30 ngày trước
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Doanh thu theo ngày</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Triệu VND · 12 ngày gần nhất
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Xem báo cáo <ArrowRight />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mục tiêu tháng</span>
              <strong>486,2 / 520 triệu</strong>
            </div>
            <div className="mb-7 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[93.5%] rounded-full bg-accent" />
            </div>
            <div className="flex h-64 items-end gap-3 border-b border-border pt-7">
              {revenueSeries.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="group relative flex-1 rounded-t-md bg-primary/16 transition-colors hover:bg-accent"
                  style={{ height: `${(value / max) * 100}%` }}
                >
                  <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-xs font-semibold group-hover:block">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              <span>Ngày -11</span>
              <span>Ngày -6</span>
              <span>Hôm nay</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-primary text-primary-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary-foreground">
              Ưu tiên hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              [
                AlertTriangle,
                '3 SKU dưới điểm đặt hàng',
                'Kiểm tra trước 10:00',
              ],
              [PackageOpen, '12 đơn chờ đóng gói', 'Cam kết SLA hôm nay'],
              [CircleCheck, 'Đối soát thanh toán', 'Hoàn tất lúc 16:00'],
            ].map(([Icon, title, copy]) => (
              <div
                key={String(title)}
                className="group flex gap-3 rounded-xl bg-white/8 p-3 transition-colors hover:bg-white/12"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-semibold">{String(title)}</p>
                  <p className="mt-1 text-xs text-primary-foreground/55">
                    {String(copy)}
                  </p>
                </div>
                <ArrowRight className="ml-auto size-4 self-center text-primary-foreground/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
            <Button
              nativeButton={false}
              variant="outline"
              className="mt-2 w-full rounded-full border-white/15 bg-transparent text-primary-foreground hover:bg-white/10"
              render={<Link href="/admin/don-hang" />}
            >
              Mở hàng đợi vận hành
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Đơn hàng mới</CardTitle>
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/admin/don-hang" />}
            >
              Tất cả <ArrowRight />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Đơn</th>
                  <th className="pb-3 font-medium">Khách hàng</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Thanh toán</th>
                  <th className="pb-3 text-right font-medium">Tổng</th>
                  <th className="w-10 pb-3">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminOrders.slice(0, 4).map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="py-3 font-mono text-xs">{order.number}</td>
                    <td className="py-3">
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt}
                      </p>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.payment} />
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {formatVnd(order.total)}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Thao tác với ${order.number}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Cảnh báo tồn kho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventoryRows
              .filter((row) => row.onHand - row.reserved <= row.reorder)
              .map((row) => (
                <div key={row.sku} className="rounded-xl bg-amber-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{row.product}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.sku} · {row.variant}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-700">
                      ATP {row.onHand - row.reserved}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-200">
                    <div
                      className="h-full rounded-full bg-amber-600"
                      style={{
                        width: `${Math.min(100, ((row.onHand - row.reserved) / row.reorder) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            <Button
              nativeButton={false}
              variant="ghost"
              className="w-full rounded-full"
              render={<Link href="/admin/ton-kho" />}
            >
              Xem toàn bộ tồn kho <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="border-0 bg-card shadow-sm xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Phễu chuyển đổi minh họa</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Tracking phiên truy cập chưa được kết nối
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              <Download /> Xuất dữ liệu
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            {[
              ['Lượt truy cập', '8.420', '100%', 100],
              ['Xem sản phẩm', '5.186', '61,6%', 72],
              ['Thêm vào giỏ', '842', '10,0%', 45],
              ['Đặt hàng', '288', '3,42%', 28],
            ].map(([label, value, rate, width], index) => (
              <div
                key={String(label)}
                className="relative rounded-xl bg-secondary/55 p-4"
              >
                <p className="text-xs text-muted-foreground">{String(label)}</p>
                <strong className="mt-2 block font-heading text-3xl">
                  {String(value)}
                </strong>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className={`h-full rounded-full ${index === 3 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-semibold">{String(rate)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Nhịp vận hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              [Clock3, 'Thời gian xử lý TB', '2 giờ 18 phút'],
              [PackageOpen, 'Đơn đúng SLA', '96,4%'],
              [CircleCheck, 'Tỷ lệ giao thành công', '97,8%'],
            ].map(([Icon, label, value]) => (
              <div
                key={String(label)}
                className="flex items-center gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="size-4 text-accent" />
                </span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {String(label)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {String(value)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
