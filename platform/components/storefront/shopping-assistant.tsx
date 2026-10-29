'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, LoaderCircle, MessageCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { AiProviderStatus } from '@/components/ai/provider-status';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProductImage } from './product-image';
import { formatVnd } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';
import {
  aiModeLabel,
  recentProductIds,
  type ShopperReply,
} from '@/lib/ai-contract';

type Message = { id: string; question: string; reply?: ShopperReply };
const suggestions = [
  'Áo nữ dưới 800k, size M',
  'Tư vấn chọn size',
  'Chính sách giao hàng và đổi size',
];

export function ShoppingAssistant() {
  const { user } = useAuth();
  return <ShoppingAssistantSession key={user?.id ?? 'guest'} />;
}

function ShoppingAssistantSession() {
  const path = usePathname();
  const { favoriteIds } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);
  const currentSlug = path.startsWith('/san-pham/')
    ? decodeURIComponent(path.split('/')[2] ?? '')
    : undefined;

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('net:open-advisor', show);
    return () => window.removeEventListener('net:open-advisor', show);
  }, []);
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [],
  );
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, open]);

  async function ask(text: string) {
    const question = text.trim();
    if (question.length < 2 || question.length > 1000 || pending.current)
      return;
    const controller = new AbortController();
    pending.current = controller;
    const id = crypto.randomUUID();
    const previousQuestions = messages
      .filter((m) => m.reply)
      .slice(-6)
      .map((m) => m.question);
    setMessages((list) => [...list, { id, question }]);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const reply = await commerceRequest<ShopperReply>('/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: question,
          previousQuestions,
          currentSlug,
          recentIds: recentProductIds(),
          favoriteIds: favoriteIds.slice(0, 50),
        }),
      });
      if (!controller.signal.aborted)
        setMessages((list) =>
          list.map((m) => (m.id === id ? { ...m, reply } : m)),
        );
    } catch (reason) {
      if (!controller.signal.aborted) {
        setMessages((list) => list.filter((m) => m.id !== id));
        setDraft(question);
        setError(
          reason instanceof Error
            ? reason.message
            : 'Chưa thể kết nối trợ lý. Vui lòng thử lại.',
        );
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }
  if (path.startsWith('/admin') || path.startsWith('/quan-ly')) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="fixed bottom-5 right-5 z-40 h-12 rounded-full px-5 shadow-lg" />
        }
      >
        <MessageCircle className="size-4" /> Tư vấn cùng NÉT
      </SheetTrigger>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border p-6 pr-12">
          <SheetTitle className="font-heading text-2xl">
            NÉT · Trợ lý mua sắm
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5">
            Tìm thiết kế hợp gu, chất liệu và ngân sách của bạn.
          </SheetDescription>
          {open && <AiProviderStatus />}
        </SheetHeader>
        <div
          role="log"
          aria-label="Cuộc trò chuyện tư vấn"
          aria-live="polite"
          className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5"
        >
          {!messages.length && (
            <div className="py-6">
              <p className="font-heading text-3xl leading-tight">
                Hôm nay bạn muốn mặc gì?
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Kể cho mình dịp mặc, kiểu dáng hoặc mức giá bạn muốn. Mình sẽ
                tìm trong các thiết kế đang có tại cửa hàng.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void ask(s)}
                    className="rounded-full border border-border px-3 py-2 text-left text-xs hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              <p className="ml-8 whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground">
                {message.question}
              </p>
              {message.reply && (
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.reply.answer}
                  </p>
                  <div className="mt-4 space-y-2">
                    {message.reply.items.map(({ product, reason }) => (
                      <Link
                        key={product.id}
                        href={`/san-pham/${product.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 rounded-xl border border-border p-2 hover:bg-secondary"
                      >
                        <ProductImage
                          position={product.atlasPosition}
                          alt={product.imageAlt}
                          src={product.atlasImage}
                          backgroundSize={product.atlasSize}
                          className="h-24 w-20 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0 py-1">
                          <p className="text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs">
                            {formatVnd(product.variants[0]?.priceCents ?? 0)}
                          </p>
                          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                            {reason}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    {aiModeLabel[message.reply.mode]}
                  </p>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <output className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Đang tìm lựa chọn
              phù hợp…
            </output>
          )}
          <div ref={bottom} />
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex justify-between text-xs">
            <Link
              href="/huong-dan-chon-size"
              onClick={() => setOpen(false)}
              className="underline underline-offset-4"
            >
              Hướng dẫn chọn size
            </Link>
            <button
              disabled={busy || !messages.length}
              onClick={() => {
                setMessages([]);
                setError('');
                setDraft('');
              }}
              className="flex items-center gap-1 disabled:opacity-40"
            >
              <RotateCcw className="size-3" /> Bắt đầu lại
            </button>
          </div>
          {error && (
            <p role="alert" className="mb-3 text-xs text-destructive">
              {error}
            </p>
          )}
          <form
            onSubmit={submit}
            className="flex items-end gap-2 rounded-2xl border border-border p-2 focus-within:ring-2 focus-within:ring-primary/15"
          >
            <textarea
              aria-label="Tin nhắn cho trợ lý mua sắm"
              maxLength={1000}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void ask(draft);
                }
              }}
              placeholder="Ví dụ: áo linen nữ dưới 800k…"
              className="min-w-0 flex-1 resize-none bg-transparent p-2 text-sm outline-none"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Gửi tin nhắn"
              disabled={busy || draft.trim().length < 2}
              className="shrink-0 rounded-full"
            >
              <ArrowUp />
            </Button>
          </form>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            Tư vấn sử dụng Gemini khi cửa hàng bật kết nối. Không gửi mật khẩu
            hoặc thông tin thanh toán. Giá và tồn kho được kiểm tra lại khi đặt
            hàng.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
