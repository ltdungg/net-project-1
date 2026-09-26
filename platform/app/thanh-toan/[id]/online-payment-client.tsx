'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';

import { MockPaymentButton } from './mock-payment-button';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { formatVnd } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';

type PaymentOrder = {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  grandTotalCents: number;
};

export function OnlinePaymentClient({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [guestToken, setGuestToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      const token =
        window.sessionStorage.getItem(`net:guest-order:${orderId}`) ?? '';
      setGuestToken(token);
      const path = token
        ? `/orders/${encodeURIComponent(orderId)}/guest?token=${encodeURIComponent(token)}`
        : user
          ? `/orders/${encodeURIComponent(orderId)}`
          : null;
      if (!path) {
        setLoading(false);
        return;
      }
      try {
        const result = await commerceRequest<PaymentOrder>(path);
        if (active) setOrder(result);
      } catch {
        if (active) setOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [authLoading, orderId, user]);

  if (authLoading || loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-accent" /></div>;

  return (
    <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-9">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><CreditCard /></span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Cổng thanh toán</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">Thanh toán trực tuyến</h1>
      {!order ? (
        <div className="mt-5">
          <p className="text-muted-foreground">Không tìm thấy giao dịch hoặc bạn chưa có quyền mở đơn này.</p>
          <Button nativeButton={false} variant="outline" className="mt-5 rounded-full" render={<Link href={`/dang-nhap?returnTo=${encodeURIComponent(`/thanh-toan/${orderId}`)}`} />}>Đăng nhập</Button>
        </div>
      ) : (
        <>
          <dl className="mt-7 space-y-3 rounded-xl bg-secondary/60 p-5 text-sm">
            <div className="flex justify-between"><dt>Mã đơn</dt><dd className="font-mono font-semibold">{order.orderNumber}</dd></div>
            <div className="flex justify-between"><dt>Số tiền</dt><dd className="font-semibold">{formatVnd(order.grandTotalCents)}</dd></div>
            <div className="flex justify-between"><dt>Trạng thái</dt><dd>{order.paymentStatus}</dd></div>
          </dl>
          <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-accent" /><p>Production nhận kết quả qua webhook có chữ ký; hệ thống không lưu số thẻ.</p></div>
          <div className="mt-4 flex items-start gap-3 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" /><p>Tồn kho được giữ trong 2 giờ trong khi chờ thanh toán.</p></div>
          <div className="mt-7">
            {order.paymentStatus === 'paid' ? (
              <Button nativeButton={false} className="w-full rounded-full" render={<Link href={`/don-hang/${order.id}`} />}>Xem đơn đã thanh toán</Button>
            ) : (
              <MockPaymentButton orderId={order.id} guestAccessToken={guestToken || undefined} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
