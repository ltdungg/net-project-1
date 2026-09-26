import { Activity, Database, ShieldCheck, Sparkles } from 'lucide-react';

import { AiCopilot } from './ai-copilot';

export default function AdminAiPage() {
  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="size-4" /> Trợ lý vận hành
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            NÉT AI Copilot
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Hỏi bằng tiếng Việt để tóm tắt doanh thu, đơn hàng, tồn kho và
            khuyến mãi dựa trên dữ liệu cửa hàng hiện tại.
          </p>
        </div>
        <span className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" /> Dữ liệu trực
          tiếp
        </span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <AiCopilot />
        <aside className="space-y-4">
          <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <h2 className="font-heading text-2xl font-semibold">
              Copilot có thể làm gì?
            </h2>
            <div className="mt-5 space-y-4 text-sm text-primary-foreground/68">
              {[
                [Activity, 'Tóm tắt nhịp vận hành và điểm cần ưu tiên'],
                [Database, 'Đọc dữ liệu đơn, tồn kho, doanh thu và voucher'],
                [ShieldCheck, 'Chỉ gợi ý; không tự thay đổi dữ liệu'],
              ].map(([Icon, copy]) => (
                <div key={String(copy)} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{String(copy)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Nguyên tắc an toàn</h2>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li>• Phân tích chỉ dựa trên dữ liệu nội bộ đã tổng hợp.</li>
              <li>• Không hiển thị thông tin nhạy cảm của khách hàng.</li>
              <li>• Mọi thao tác thay đổi vẫn cần người quản lý xác nhận.</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
