'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { MockPaymentButton } from './mock-payment-button';
import { SepayPaymentPanel } from './sepay-payment-panel';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';
import {
  orderAccess,
  paymentStatusLabel,
  type PaymentConfig,
} from '@/lib/payment-client';

type PaymentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  grandTotalCents: number;
};

export function OnlinePaymentClient({ orderId }: { orderId: string }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPayment />;
  return (
    <PaymentSession
      key={`${orderId}:${user?.id ?? 'guest'}`}
      orderId={orderId}
      signedIn={!!user}
    />
  );
}

function LoadingPayment() {
  return (
    <output
      aria-label="Đang tải giao dịch"
      className="flex min-h-72 items-center justify-center"
    >
      <LoaderCircle className="size-7 animate-spin text-accent" />
    </output>
  );
}

function PaymentSession({
  orderId,
  signedIn,
}: {
  orderId: string;
  signedIn: boolean;
}) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [guestToken, setGuestToken] = useState('');
  const [mockEnabled, setMockEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const paid = useCallback(
    () =>
      setOrder((current) =>
        current
          ? { ...current, paymentStatus: 'paid', status: 'confirmed' }
          : current,
      ),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError('');
      try {
        const token =
          window.sessionStorage.getItem(`net:guest-order:${orderId}`) ?? '';
        const access = orderAccess(orderId, token, signedIn);
        if (!access)
          throw new Error(
            'Đăng nhập bằng tài khoản đặt đơn hoặc mở lại trong phiên checkout của bạn.',
          );
        const [result, config] = await Promise.all([
          commerceRequest<PaymentOrder>(access.path, {
            headers: access.headers,
            signal: controller.signal,
          }),
          commerceRequest<PaymentConfig>('/payments/config', {
            signal: controller.signal,
          }),
        ]);
        if (!controller.signal.aborted) {
          setGuestToken(token);
          setOrder(result);
          setMockEnabled(config.mockEnabled);
        }
      } catch (reason) {
        if (!controller.signal.aborted) {
          setOrder(null);
          setError(
            reason instanceof Error
              ? reason.message
              : 'Không thể tải giao dịch.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [orderId, signedIn, attempt]);

  if (loading) return <LoadingPayment />;
  const terminal =
    order &&
    (['cancelled', 'returned'].includes(order.status) ||
      order.paymentStatus === 'refunded');
  const payable =
    order &&
    order.status === 'pending_payment' &&
    ['pending', 'failed'].includes(order.paymentStatus);
  const isSepay = order?.paymentProvider === 'sepay_sandbox';

  return (
    <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-9">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CreditCard />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        NÉT · Thanh toán demo
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">
        {isSepay ? 'SePay Sandbox' : 'Thanh toán giả lập'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Đây là giao dịch thử nghiệm, không thu tiền thật. Bạn không cần nhập
        thông tin thẻ hoặc tài khoản ngân hàng.
      </p>
      {!order ? (
        <div className="mt-5">
          <p role="alert" className="text-muted-foreground">
            {error}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Thử tải lại
            </Button>
            {!signedIn && (
              <Button
                nativeButton={false}
                variant="outline"
                className="rounded-full"
                render={
                  <Link
                    href={`/dang-nhap?returnTo=${encodeURIComponent(`/thanh-toan/${orderId}`)}`}
                  />
                }
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <dl className="mt-7 space-y-3 rounded-xl bg-secondary/60 p-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Mã đơn</dt>
              <dd className="font-mono font-semibold">{order.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Số tiền mô phỏng</dt>
              <dd className="font-semibold">
                {formatVnd(order.grandTotalCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Trạng thái</dt>
              <dd aria-live="polite">
                {paymentStatusLabel(order.paymentStatus)}
              </dd>
            </div>
          </dl>
          {payable && (
            <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-accent" />
              <p>
                Tồn kho được giữ trong 2 giờ kể từ khi đặt đơn.{' '}
                {isSepay
                  ? 'Hoàn tất giao dịch thử trước khi hết thời gian giữ hàng.'
                  : 'Bạn có thể thử lại sau khi mô phỏng thất bại.'}
              </p>
            </div>
          )}
          <div className="mt-7 space-y-4">
            {order.paymentStatus === 'paid' ? (
              <output className="block rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mb-2 size-5" />
                <strong>
                  {isSepay
                    ? 'SePay Sandbox đã xác nhận thanh toán.'
                    : 'Thanh toán giả lập thành công.'}
                </strong>
                <span className="mt-1 block">
                  Đơn đã được xác nhận. Không có khoản tiền thật nào được thu.
                </span>
              </output>
            ) : terminal ? (
              <output className="block text-sm text-muted-foreground">
                Đơn đã hủy, hoàn trả hoặc hoàn tiền nên không thể tiếp tục thanh
                toán.
              </output>
            ) : payable && isSepay ? (
              <SepayPaymentPanel
                orderId={order.id}
                guestToken={guestToken}
                onPaid={paid}
              />
            ) : payable && mockEnabled ? (
              <>
                {order.paymentStatus === 'failed' && (
                  <output className="block rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Đã mô phỏng thanh toán thất bại. Đơn vẫn chờ thanh toán;
                    chọn kết quả thành công để thử lại.
                  </output>
                )}
                <MockPaymentButton
                  orderId={order.id}
                  guestAccessToken={guestToken || undefined}
                  onResult={(status) =>
                    setOrder((current) =>
                      current
                        ? {
                            ...current,
                            paymentStatus: status,
                            status:
                              status === 'paid' ? 'confirmed' : current.status,
                          }
                        : current,
                    )
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Thanh toán giả lập hiện không khả dụng cho đơn này.
              </p>
            )}
            <Button
              nativeButton={false}
              variant="outline"
              className="w-full rounded-full"
              render={<Link href={`/don-hang/${order.id}`} />}
            >
              Xem trạng thái đơn hàng
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
