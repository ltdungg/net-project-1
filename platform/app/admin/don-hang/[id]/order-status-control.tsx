'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, LoaderCircle } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { commerceRaw } from '@/lib/commerce-api-client';
import { orderTransitions } from '@/lib/order-state';

const labels: Record<string, string> = {
  confirmed: 'Xác nhận',
  processing: 'Bắt đầu xử lý',
  ready_to_ship: 'Sẵn sàng giao',
  shipped: 'Bàn giao vận chuyển',
  delivered: 'Đã giao',
  cancelled: 'Hủy đơn',
  returned: 'Hoàn trả',
};

export function OrderStatusControl({
  orderId,
  currentStatus,
  paymentStatus,
  fulfillmentId,
}: {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  fulfillmentId?: string;
}) {
  const paymentReady = ['paid', 'cod_pending'].includes(paymentStatus);
  const options = (orderTransitions[currentStatus] ?? []).filter(
    (option) =>
      !['shipped', 'delivered', 'returned'].includes(option) &&
      (paymentReady || !['confirmed', 'processing', 'ready_to_ship'].includes(option)),
  );
  const [status, setStatus] = useState(options[0] ?? '');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  async function update() {
    if (!status) return;
    setState('loading');
    const response = await commerceRaw(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, reason: reason || undefined }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    if (!response.ok) {
      setState('error');
      setMessage(payload.error?.message ?? 'Chưa thể cập nhật đơn hàng.');
      return;
    }
    setState('success');
    window.location.reload();
  }

  if (!options.length) {
    return (
      <div className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
        <p>
          Các bước bàn giao, giao thành công và hoàn về được quản lý theo từng
          phiếu giao.
        </p>
        {fulfillmentId ? (
          <Link
            href={`/admin/van-chuyen/${fulfillmentId}`}
            className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-3`}
          >
            Mở phiếu giao
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="next-status">Trạng thái tiếp theo</Label>
        <NativeSelect
          id="next-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 w-full"
        >
          {options.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {labels[option] ?? option}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="status-reason">Lý do/Ghi chú</Label>
        <Input
          id="status-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Bắt buộc khi hủy hoặc hoàn trả"
          className="mt-2 h-10"
        />
      </div>
      <Button
        onClick={() => void update()}
        disabled={state === 'loading'}
        className="w-full"
      >
        {state === 'loading' ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Check />
        )}{' '}
        Xác nhận chuyển trạng thái
      </Button>
      {state === 'error' ? (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
