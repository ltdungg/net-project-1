'use client';

import { type SyntheticEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  LoaderCircle,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { commerceRaw } from '@/lib/commerce-api-client';
import type { AiMode } from '@/lib/ai-contract';

type AssistantResult = {
  headline: string;
  answer: string;
  insights: Array<{
    label: string;
    value: string;
    tone: 'good' | 'warning' | 'critical' | 'neutral';
  }>;
  actions: Array<{ label: string; href: string }>;
  mode: AiMode;
  generatedAt: string;
};

type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; result: AssistantResult };

const suggestions = [
  'Tóm tắt cửa hàng hôm nay',
  'SKU nào sắp hết hàng?',
  'Đơn nào đang cần ưu tiên?',
  'Đánh giá hiệu quả khuyến mãi',
  'Sản phẩm nào bán chạy nhất?',
];

export function StoreAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState('');

  async function ask(rawPrompt: string) {
    const text = rawPrompt.trim();
    if (!text || state === 'loading') return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
    };
    setMessages((current) => [...current, userMessage]);
    setPrompt('');
    setError('');
    setState('loading');
    try {
      const response = await commerceRaw('/admin/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const payload = (await response.json()) as {
        data?: AssistantResult;
        error?: { message?: string } | null;
      };
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message ?? 'Chưa thể phân tích dữ liệu.',
        );
      }
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', result: payload.data! },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Chưa thể kết nối với trợ lý. Vui lòng thử lại.',
      );
    } finally {
      setState('idle');
    }
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(prompt);
  }

  return (
    <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Trợ lý điều hành</h2>
            <p className="text-[11px] text-muted-foreground">
              Phân tích từ dữ liệu cửa hàng · 30 ngày gần nhất
            </p>
          </div>
        </div>
        <Sparkles className="size-4 text-accent" />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        {!messages.length ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
              <Sparkles className="size-6 text-accent" />
            </span>
            <h3 className="mt-5 font-heading text-3xl font-semibold">
              Bạn muốn biết gì về cửa hàng?
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Chọn một câu hỏi gợi ý hoặc nhập yêu cầu bằng ngôn ngữ tự nhiên.
              Trợ lý sẽ tổng hợp số liệu cửa hàng và gợi ý việc cần ưu tiên.
            </p>
            <div className="mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-primary/35 hover:bg-secondary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end gap-3">
                <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                  {message.text}
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <UserRound className="size-4" />
                </span>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Bot className="size-4" />
                </span>
                <div className="min-w-0 max-w-[92%] flex-1 rounded-2xl rounded-tl-sm border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    {message.result.headline}
                  </p>
                  <p className="mt-3 text-sm leading-7">
                    {message.result.answer}
                  </p>
                  {message.result.insights.length ? (
                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {message.result.insights.map((insight) => (
                        <div
                          key={`${insight.label}-${insight.value}`}
                          className={`rounded-xl p-3 ${
                            insight.tone === 'critical'
                              ? 'bg-red-50 text-red-800'
                              : insight.tone === 'warning'
                                ? 'bg-amber-50 text-amber-800'
                                : insight.tone === 'good'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-secondary'
                          }`}
                        >
                          <p className="truncate text-[10px] opacity-65">
                            {insight.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {insight.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    {message.result.actions.map((action) => (
                      <Button
                        key={action.href}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        render={<Link href={action.href} />}
                      >
                        {action.label} <ArrowRight />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ),
          )
        )}
        {state === 'loading' ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Bot className="size-4" />
            </span>
            <LoaderCircle className="size-4 animate-spin" /> Đang đọc dữ liệu
            vận hành…
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="border-t border-border p-4 sm:p-5">
        {error ? (
          <p role="alert" className="mb-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/10">
          <Textarea
            maxLength={500}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void ask(prompt);
              }
            }}
            placeholder="Ví dụ: Tôi nên ưu tiên việc gì trước 12 giờ?"
            aria-label="Câu hỏi cho trợ lý cửa hàng"
            className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!prompt.trim() || state === 'loading'}
            className="shrink-0 rounded-full"
            aria-label="Gửi câu hỏi"
          >
            <Send />
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Tham khảo số liệu chi tiết trước khi quyết định thay đổi hoạt động cửa hàng.
        </p>
      </form>
    </section>
  );
}
