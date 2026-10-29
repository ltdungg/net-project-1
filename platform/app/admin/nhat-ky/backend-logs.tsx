'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commerceRequest } from '@/lib/commerce-api-client';

type LogEntry = { id: number; timestamp: string; level: string; logger: string; message: string; correlationId: string };
type Snapshot = { entries: LogEntry[]; matched: number; retained: number; capacity: number; fetchedAt: string };
const colors: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-800', WARN: 'bg-amber-100 text-amber-900',
  INFO: 'bg-emerald-100 text-emerald-800', DEBUG: 'bg-slate-100 text-slate-700', TRACE: 'bg-slate-100 text-slate-700',
};

export function BackendLogs() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [level, setLevel] = useState('ALL');
  const [query, setQuery] = useState('');
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({ level, query, limit: '200' });
      const result = await commerceRequest<Snapshot>(`/admin/logs?${params}`, { signal: controller.signal });
      if (!controller.signal.aborted) { setData(result); setError(''); }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Không thể tải nhật ký.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [level, query]);

  useEffect(() => {
    active.current?.abort();
    const timer = setTimeout(() => void refresh(), 300);
    return () => { clearTimeout(timer); active.current?.abort(); };
  }, [refresh]);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => clearInterval(timer);
  }, [live, refresh]);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Nhật ký backend">
      <div className="flex flex-wrap items-end gap-4 border-b p-5">
        <label className="grid gap-2 text-sm font-medium">Mức độ
          <select value={level} onChange={(event) => { setLevel(event.target.value); setData(null); setLoading(true); setError(''); }} className="h-10 rounded-lg border bg-background px-3">
            <option value="ALL">Tất cả</option>
            {['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid min-w-56 flex-1 gap-2 text-sm font-medium">Tìm nội dung, nguồn hoặc mã yêu cầu
          <span className="flex h-10 items-center gap-2 rounded-lg border bg-background px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={query} maxLength={200} onChange={(event) => { setQuery(event.target.value); setData(null); setLoading(true); setError(''); }} placeholder="Ví dụ: status=500" className="w-full bg-transparent outline-none" />
          </span>
        </label>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} /> Làm mới
        </Button>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} /> Tự cập nhật mỗi 5 giây
        </label>
      </div>
      <div className="flex flex-wrap justify-between gap-2 bg-muted/40 px-5 py-3 text-xs text-muted-foreground" aria-live="polite">
        <span>{loading ? 'Đang tải nhật ký…' : data ? `Hiển thị ${data.entries.length}/${data.matched} kết quả · Đang lưu ${data.retained}/${data.capacity} bản ghi` : 'Chưa tải được nhật ký'}</span>
        {data && <span>Cập nhật: {new Date(data.fetchedAt).toLocaleTimeString('vi-VN')}</span>}
      </div>
      {error && <div role="alert" className="border-b bg-red-50 p-4 text-sm text-red-800">{error} {data && 'Dữ liệu bên dưới là lần tải thành công trước.'}</div>}
      <div className="max-h-[65vh] overflow-auto" aria-busy={loading}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 bg-card shadow-sm"><tr>
            {['Thời gian', 'Mức độ', 'Nội dung'].map((title) => <th key={title} scope="col" className="px-5 py-3 font-semibold">{title}</th>)}
          </tr></thead>
          <tbody className="divide-y">
            {data?.entries.map((entry) => <tr key={entry.id} className="align-top hover:bg-muted/30">
              <td className="whitespace-nowrap px-5 py-4 text-xs tabular-nums text-muted-foreground">{new Date(entry.timestamp).toLocaleString('vi-VN')}</td>
              <td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${colors[entry.level] ?? colors.DEBUG}`}>{entry.level}</span></td>
              <td className="max-w-3xl px-5 py-4">
                <p className="whitespace-pre-wrap break-words font-mono text-xs leading-6">{entry.message}</p>
                <p className="mt-2 break-all text-xs text-muted-foreground">{entry.logger}{entry.correlationId && ` · Mã yêu cầu: ${entry.correlationId}`}</p>
              </td>
            </tr>)}
          </tbody>
        </table>
        {!loading && !error && data?.entries.length === 0 && <p className="p-12 text-center text-sm text-muted-foreground">Không có nhật ký phù hợp. Hãy đổi bộ lọc hoặc thử lại sau.</p>}
      </div>
      <p className="border-t px-5 py-4 text-xs leading-5 text-muted-foreground">Lưu tối đa 1.000 bản ghi trong phiên chạy hiện tại; nhật ký được đặt lại khi backend khởi động lại. Các mẫu thông tin đăng nhập được che. Chỉ quản trị viên được xem.</p>
    </section>
  );
}
