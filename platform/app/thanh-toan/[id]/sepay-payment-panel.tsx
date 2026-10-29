'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Copy, ExternalLink, LoaderCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commerceRequest } from '@/lib/commerce-api-client';
import { formatVnd } from '@/lib/catalog-data';
import type {
  SepayPaymentSession,
  SepayPaymentState,
} from '@/lib/payment-client';

export function SepayPaymentPanel({
  orderId,
  guestToken,
  onPaid,
}: {
  orderId: string;
  guestToken: string;
  onPaid: () => void;
}) {
  const [session, setSession] = useState<SepayPaymentSession | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState('');
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void commerceRequest<SepayPaymentSession>(
      `/payments/sepay-sandbox/${encodeURIComponent(orderId)}`,
      {
        headers: guestToken ? { 'x-guest-order-token': guestToken } : undefined,
        signal: controller.signal,
      },
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSession(result);
          setError('');
          if (result.paymentStatus === 'paid') onPaid();
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Chưa tải được thông tin SePay.',
          );
      });
    return () => controller.abort();
  }, [orderId, guestToken, attempt, onPaid]);

  const check = useCallback(async () => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    try {
      const result = await commerceRequest<SepayPaymentState>(
        `/payments/sepay-sandbox/${encodeURIComponent(orderId)}/check`,
        {
          method: 'POST',
          headers: guestToken
            ? { 'x-guest-order-token': guestToken }
            : undefined,
          signal: controller.signal,
        },
      );
      if (!controller.signal.aborted) {
        setSession((current) =>
          current ? { ...current, ...result } : current,
        );
        setNotice(
          result.paymentStatus === 'paid'
            ? 'Đã xác nhận giao dịch thử.'
            : 'Chưa ghi nhận giao dịch khớp. Kiểm tra số tiền và nội dung trên SePay Test mode.',
        );
        if (result.paymentStatus === 'paid') onPaid();
      }
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Chưa thể kiểm tra thanh toán.',
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
  }, [orderId, guestToken, onPaid]);

  useEffect(() => () => pending.current?.abort(), []);
  const stopped =
    !!session && (session.expired || session.orderStatus !== 'pending_payment');
  const hasSession = !!session;
  useEffect(() => {
    if (!hasSession || stopped) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void check();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [check, stopped, hasSession]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(`Đã sao chép ${label.toLowerCase()}.`);
    } catch {
      setCopied(
        'Chưa thể sao chép tự động. Bạn có thể chọn và sao chép nội dung bên dưới.',
      );
    }
  }

  return (
    <section aria-label="Chuyển khoản SePay Sandbox" className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {!session ? (
        error ? (
          <Button
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Tải lại thông tin SePay
          </Button>
        ) : (
          <output className="flex items-center gap-2 text-sm">
            <LoaderCircle className="size-4 animate-spin" /> Đang tải tài khoản
            thử nghiệm…
          </output>
        )
      ) : stopped ? (
        <output className="block rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Đơn đã hết thời gian thanh toán hoặc không còn chờ thanh toán. Vui
          lòng kiểm tra trạng thái đơn.
        </output>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-white p-4 text-center">
            <Image
              src={session.qrUrl}
              alt="Mã VietQR của tài khoản SePay thử nghiệm"
              width={260}
              height={260}
              unoptimized
              referrerPolicy="no-referrer"
              className="mx-auto max-w-full"
            />
            <p className="mt-2 text-xs font-semibold text-amber-800">
              TEST MODE · Không chuyển khoản bằng ứng dụng ngân hàng thật
            </p>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              ['Ngân hàng', session.bank.name],
              ['Chủ tài khoản', session.bank.accountHolder],
              ['Số tài khoản', session.bank.accountNumber],
              ['Số tiền', String(session.amountVnd)],
              ['Nội dung', session.transferContent],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-3 border-b border-border pb-2"
              >
                <dt className="shrink-0 text-muted-foreground">{label}</dt>
                <dd className="flex min-w-0 items-start gap-2 text-right font-medium">
                  <span className="break-all select-text">
                    {label === 'Số tiền' ? formatVnd(session.amountVnd) : value}
                  </span>
                  {['Số tài khoản', 'Số tiền', 'Nội dung'].includes(label!) && (
                    <button
                      type="button"
                      aria-label={`Sao chép ${label?.toLowerCase()}`}
                      onClick={() => void copy(label!, value!)}
                      className="shrink-0 rounded p-1 hover:bg-secondary"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {copied && (
            <output className="block text-xs text-muted-foreground">
              {copied}
            </output>
          )}
          <p className="text-sm leading-6 text-muted-foreground">
            Trong SePay Test mode, chọn “Mô phỏng giao dịch”, chọn tài khoản ở
            trên và nhập đúng số tiền, nội dung. Trang sẽ tự cập nhật khi giao
            dịch thử được ghi nhận.
          </p>
          <a
            href="https://my.sepay.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
          >
            Mở SePay để mô phỏng giao dịch <ExternalLink className="size-3.5" />
          </a>
          <Button
            onClick={() => void check()}
            disabled={busy}
            className="w-full rounded-full"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}{' '}
            Kiểm tra thanh toán
          </Button>
          {notice && (
            <output className="block text-xs leading-5 text-muted-foreground">
              {notice}
            </output>
          )}
        </>
      )}
    </section>
  );
}
