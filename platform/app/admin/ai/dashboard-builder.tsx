'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { BarChart3, LoaderCircle, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commerceRequest } from '@/lib/commerce-api-client';
import { formatVnd } from '@/lib/catalog-data';
import {
  widgetLabels,
  type AiDashboard,
  type WidgetId,
} from '@/lib/ai-contract';

type SavedDashboard = {
  id: string;
  title: string;
  days: number;
  updatedAt: string;
};
const presets = [
  'Dashboard doanh thu và sản phẩm bán chạy 7 ngày',
  'Tổng quan đơn hàng và doanh thu 30 ngày',
  'Theo dõi tồn kho và sản phẩm bán chạy',
];

export function DashboardBuilder() {
  const [prompt, setPrompt] = useState('');
  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState<AiDashboard | null>(null);
  const [saved, setSaved] = useState<SavedDashboard[]>([]);
  const [busy, setBusy] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const active = useRef(false);
  const mounted = useRef(true);
  async function loadList() {
    const rows = await commerceRequest<SavedDashboard[]>(
      '/admin/ai/dashboards',
    );
    if (mounted.current) setSaved(rows);
  }
  useEffect(() => {
    mounted.current = true;
    void loadList()
      .catch((e: unknown) => {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : 'Chưa tải được dashboard đã lưu.',
          );
      })
      .finally(() => {
        if (mounted.current) setListLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  async function perform(action: () => Promise<void>) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : 'Không thể xử lý dashboard.');
    } finally {
      active.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function generate(text = prompt) {
    if (text.trim().length < 2) return;
    setPrompt(text);
    void perform(async () => {
      const result = await commerceRequest<AiDashboard>('/admin/ai/dashboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim(), days }),
      });
      if (mounted.current) {
        setDashboard(result);
        setDays(result.plan.days);
        setNotice(
          'Đã tạo bản xem trước. Bạn có thể chỉnh tên và chọn chỉ số trước khi lưu.',
        );
      }
    });
  }
  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    generate();
  }
  function load(id: string) {
    void perform(async () => {
      const result = await commerceRequest<AiDashboard>(
        `/admin/ai/dashboards/${encodeURIComponent(id)}`,
      );
      if (mounted.current) {
        setDashboard(result);
        setDays(result.plan.days);
      }
    });
  }
  function save() {
    if (!dashboard) return;
    void perform(async () => {
      const result = await commerceRequest<{ id: string }>(
        '/admin/ai/dashboards',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(dashboard.plan),
        },
      );
      if (mounted.current) {
        setDashboard((current) =>
          current ? { ...current, id: result.id } : null,
        );
        setNotice('Đã lưu dashboard vào tài khoản của bạn.');
      }
      await loadList();
    });
  }
  function remove(id: string) {
    void perform(async () => {
      await commerceRequest(`/admin/ai/dashboards/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (mounted.current) {
        setSaved((list) => list.filter((item) => item.id !== id));
        setDashboard((current) =>
          current?.id === id ? { ...current, id: undefined } : current,
        );
        setNotice('Đã xóa bản lưu. Bản xem trước hiện tại vẫn được giữ.');
      }
    });
  }
  function toggleWidget(widget: WidgetId) {
    setDashboard((current) =>
      current
        ? {
            ...current,
            id: undefined,
            plan: {
              ...current.plan,
              widgets: current.plan.widgets.includes(widget)
                ? current.plan.widgets.filter((id) => id !== widget)
                : [...current.plan.widgets, widget],
            },
          }
        : current,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">
            Dashboard của bạn{' '}
            <span className="text-xs font-normal text-muted-foreground">
              {saved.length}/10
            </span>
          </h2>
          {listLoading ? (
            <output className="mt-4 text-sm text-muted-foreground">
              Đang tải…
            </output>
          ) : !saved.length ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Lưu một dashboard để mở lại với số liệu mới nhất mỗi ngày.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {saved.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-1 rounded-xl bg-secondary/60 p-2"
                >
                  <button
                    disabled={busy}
                    onClick={() => load(item.id)}
                    className="min-w-0 flex-1 rounded-lg p-1 text-left text-sm hover:underline"
                  >
                    <span className="block break-words font-medium">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.days} ngày gần nhất
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    aria-label={`Xóa dashboard ${item.title}`}
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <h2 className="font-heading text-xl font-semibold">
            Từ câu hỏi đến số liệu.
          </h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
            Mô tả điều bạn muốn theo dõi. Trợ lý chọn các chỉ số, vẽ biểu đồ và
            lấy dữ liệu hiện tại từ cửa hàng.
          </p>
          <p className="mt-4 text-xs leading-5 text-primary-foreground/60">
            Doanh thu tính trên đơn đã thanh toán, loại đơn hủy, trả và hoàn
            tiền. Tồn kho luôn phản ánh thời điểm tải dữ liệu.
          </p>
        </section>
      </aside>
      <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-2xl font-semibold">
            Bạn muốn theo dõi điều gì?
          </h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <textarea
              aria-label="Yêu cầu tạo dashboard"
              maxLength={1000}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ví dụ: tạo dashboard doanh thu, đơn hàng và sản phẩm bán chạy 7 ngày"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs">
                Khoảng thời gian
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  disabled={busy}
                  className="rounded-lg border border-border bg-background p-2"
                >
                  {[...new Set([7, 30, 90, days])]
                    .sort((a, b) => a - b)
                    .map((day) => (
                      <option key={day} value={day}>
                        {day} ngày
                      </option>
                    ))}
                </select>
              </label>
              <Button type="submit" disabled={busy || prompt.trim().length < 2}>
                {busy ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <BarChart3 />
                )}{' '}
                Tạo bản xem trước
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Nếu yêu cầu có số ngày cụ thể, trợ lý sẽ dùng khoảng thời gian đó
              (tối đa 90 ngày).
            </p>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((item) => (
              <button
                key={item}
                disabled={busy}
                onClick={() => generate(item)}
                className="rounded-full border border-border px-3 py-2 text-left text-xs hover:bg-secondary disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {notice && (
          <output className="text-sm text-emerald-700">{notice}</output>
        )}
        {dashboard ? (
          <section className="space-y-5" aria-label="Bản xem trước dashboard">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <label className="min-w-0 flex-1 text-xs font-semibold">
                  Tên dashboard
                  <input
                    maxLength={100}
                    disabled={busy}
                    value={dashboard.plan.title}
                    onChange={(e) =>
                      setDashboard({
                        ...dashboard,
                        id: undefined,
                        plan: { ...dashboard.plan, title: e.target.value },
                      })
                    }
                    className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold"
                  />
                </label>
                <div className="flex gap-2">
                  {dashboard.id && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => load(dashboard.id!)}
                      aria-label="Cập nhật số liệu dashboard"
                    >
                      <RefreshCw />
                    </Button>
                  )}
                  <Button
                    disabled={
                      busy ||
                      !!dashboard.id ||
                      !dashboard.plan.title.trim() ||
                      !dashboard.plan.widgets.length
                    }
                    onClick={save}
                  >
                    <Save /> {dashboard.id ? 'Đã lưu' : 'Lưu dashboard'}
                  </Button>
                </div>
              </div>
              <fieldset disabled={busy} className="mt-4 flex flex-wrap gap-2">
                <legend className="mb-2 text-xs text-muted-foreground">
                  Chọn các chỉ số cần hiển thị
                </legend>
                {(Object.keys(widgetLabels) as WidgetId[]).map((widget) => (
                  <label
                    key={widget}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={dashboard.plan.widgets.includes(widget)}
                      onChange={() => toggleWidget(widget)}
                    />
                    {widgetLabels[widget]}
                  </label>
                ))}
              </fieldset>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {dashboard.report.period.from.split('-').reverse().join('/')} –{' '}
                {dashboard.report.period.to.split('-').reverse().join('/')}
                <br />
                Cập nhật{' '}
                {new Date(dashboard.generatedAt).toLocaleString('vi-VN', {
                  timeZone: 'Asia/Ho_Chi_Minh',
                })}
              </p>
            </div>
            {!dashboard.plan.widgets.length && (
              <p className="text-sm text-muted-foreground">
                Chọn ít nhất một chỉ số để lưu dashboard.
              </p>
            )}
            <DashboardPreview dashboard={dashboard} />
          </section>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
            <BarChart3 className="size-9 text-accent" />
            <p className="mt-4 font-heading text-2xl font-semibold">
              Dashboard bắt đầu từ một yêu cầu.
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Chọn gợi ý hoặc mô tả mục tiêu. Bản xem trước sẽ xuất hiện tại đây
              để bạn điều chỉnh và lưu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPreview({ dashboard }: { dashboard: AiDashboard }) {
  const { plan, report, lowStock } = dashboard;
  const kpis = {
    revenue: formatVnd(report.kpis.netRevenueCents),
    orders: report.kpis.orders.toLocaleString('vi-VN'),
    average_order: formatVnd(report.kpis.averageOrderValueCents),
    items_sold: report.kpis.itemsSold.toLocaleString('vi-VN'),
    low_stock: lowStock.toLocaleString('vi-VN'),
  };
  const maxRevenue = Math.max(
    1,
    ...report.salesDaily.map((d) => d.netRevenueCents),
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[
        ...plan.widgets.filter((widget) => widget in kpis),
        ...plan.widgets.filter((widget) => !(widget in kpis)),
      ].map((widget) => {
        if (widget in kpis)
          return (
            <article
              key={widget}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-xs text-muted-foreground">
                {widgetLabels[widget]}
              </h3>
              <p className="mt-4 break-words text-2xl font-semibold tracking-tight">
                {kpis[widget as keyof typeof kpis]}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {widget === 'low_stock'
                  ? 'Vị trí SKU/kho ở hoặc dưới điểm đặt hàng · hiện tại'
                  : widget === 'orders'
                    ? 'Bao gồm tất cả trạng thái đơn'
                    : `${report.period.days} ngày · đơn đã thanh toán hợp lệ`}
              </p>
              {widget === 'low_stock' && (
                <Link
                  href="/admin/ton-kho"
                  className="mt-3 inline-block text-xs underline"
                >
                  Mở tồn kho
                </Link>
              )}
            </article>
          );
        if (widget === 'sales_daily')
          return (
            <article
              key={widget}
              className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:col-span-2 xl:col-span-3"
            >
              <h3 className="font-semibold">{widgetLabels[widget]}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Đơn vị: VNĐ · di chuột hoặc chọn cột để xem số liệu
              </p>
              {report.salesDaily.every((day) => day.netRevenueCents === 0) ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Chưa có doanh thu từ đơn đã thanh toán trong kỳ này.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <div
                    aria-label={`Biểu đồ doanh thu ${report.period.days} ngày; số liệu chi tiết ở bảng bên dưới`}
                    className="flex h-56 items-end gap-1 border-b border-border pb-6"
                    style={{
                      minWidth: Math.max(280, report.salesDaily.length * 22),
                    }}
                  >
                    {report.salesDaily.map((day, index) => (
                      <div
                        key={day.date}
                        className="relative flex h-full min-w-4 flex-1 items-end"
                      >
                        <button
                          className="w-full rounded-t bg-primary/80 hover:bg-accent focus:bg-accent"
                          style={{
                            height: `${Math.max(day.netRevenueCents > 0 ? 1 : 0, (day.netRevenueCents / maxRevenue) * 100)}%`,
                          }}
                          title={`${day.date}: ${formatVnd(day.netRevenueCents)}`}
                          aria-label={`${day.date}: ${formatVnd(day.netRevenueCents)}`}
                        />
                        {(index === 0 ||
                          index === report.salesDaily.length - 1 ||
                          index % 7 === 0) && (
                          <span className="absolute -bottom-5 left-0 whitespace-nowrap text-[9px] text-muted-foreground">
                            {day.date.slice(5)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium">
                  Xem bảng số liệu theo ngày
                </summary>
                <div className="mt-3 max-h-64 overflow-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="p-2">Ngày</th>
                        <th className="p-2 text-right">Đơn đã thanh toán</th>
                        <th className="p-2 text-right">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.salesDaily.map((d) => (
                        <tr key={d.date} className="border-t border-border">
                          <td className="p-2">{d.date}</td>
                          <td className="p-2 text-right">{d.paidOrders}</td>
                          <td className="p-2 text-right">
                            {formatVnd(d.netRevenueCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </article>
          );
        return (
          <article
            key={widget}
            className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:col-span-2 xl:col-span-3"
          >
            <h3 className="font-semibold">{widgetLabels[widget]}</h3>
            {!report.topProducts.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Chưa có sản phẩm bán được từ đơn đã thanh toán trong kỳ.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="py-3">Sản phẩm</th>
                      <th className="px-3 text-right">Đã bán</th>
                      <th className="whitespace-nowrap text-right">
                        Doanh số dòng hàng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p) => (
                      <tr
                        key={`${p.productId}-${p.productName}`}
                        className="border-t border-border"
                      >
                        <td className="py-3 pr-3">{p.productName}</td>
                        <td className="px-3 text-right tabular-nums">
                          {p.quantity}
                        </td>
                        <td className="whitespace-nowrap text-right tabular-nums">
                          {formatVnd(p.itemRevenueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground">
                  Doanh số dòng hàng chưa phân bổ giảm giá và phí vận chuyển của
                  đơn.
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
