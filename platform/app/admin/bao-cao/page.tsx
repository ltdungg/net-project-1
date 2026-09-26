import { Download, TrendingUp } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { getDashboardData } from '@/lib/backoffice-data';
import { requireManagementRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  await requireManagementRole();
  const { metrics: dashboardMetrics, revenueSeries } = await getDashboardData();
  const max = Math.max(1, ...revenueSeries);
  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Một nguồn số liệu cho doanh thu, funnel, sản phẩm, khách hàng và fulfillment."
        action={
          <Button variant="outline">
            <Download /> Xuất báo cáo
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <strong className="mt-3 block font-heading text-4xl">
              {metric.value}
            </strong>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="size-3" /> {metric.delta}
            </span>
          </div>
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            Doanh thu 12 ngày gần nhất
          </h2>
          <div className="mt-8 flex h-72 items-end gap-3 border-b border-border">
            {revenueSeries.map((value, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-lg bg-primary/70"
                style={{ height: `${(value / max) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            Funnel chuyển đổi minh họa
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Tracking phiên truy cập chưa được kết nối.
          </p>
          <div className="mt-6 space-y-5">
            {[
              ['Phiên chất lượng', '42.800', 100],
              ['Xem sản phẩm', '28.400', 66],
              ['Thêm giỏ', '4.120', 38],
              ['Checkout', '1.684', 24],
              ['Đơn thành công', '1.464', 19],
            ].map(([label, value, width]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="mt-2 h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
