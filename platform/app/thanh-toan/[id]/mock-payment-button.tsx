'use client';

import { useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { commerceRaw } from '@/lib/commerce-api-client';

export function MockPaymentButton({
  orderId,
  guestAccessToken,
}: {
  orderId: string;
  guestAccessToken?: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  async function confirm() {
    setState('loading');
    const response = await commerceRaw('/payments/mock/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId, guestAccessToken }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    if (!response.ok) {
      setState('error');
      setMessage(payload.error?.message ?? 'Chưa thể xác nhận thanh toán.');
      return;
    }
    setState('success');
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-4" /> Thanh toán local thành công
        </div>
        <a
          href={`/don-hang/${orderId}`}
          className="mt-2 inline-block underline underline-offset-4"
        >
          Mở trạng thái đơn hàng
        </a>
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={() => void confirm()}
        disabled={state === 'loading'}
        className="h-11 w-full rounded-full"
      >
        {state === 'loading' ? <LoaderCircle className="animate-spin" /> : null}
        Mô phỏng thanh toán thành công
      </Button>
      {state === 'error' ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
