'use client';

import { useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { commerceRequest } from '@/lib/commerce-api-client';

export function MockPaymentButton({
  orderId,
  guestAccessToken,
  onResult,
}: {
  orderId: string;
  guestAccessToken?: string;
  onResult: (status: 'paid' | 'failed') => void;
}) {
  const [busy, setBusy] = useState<'succeeded' | 'failed' | null>(null);
  const [message, setMessage] = useState('');
  const inFlight = useRef(false);

  async function simulate(outcome: 'succeeded' | 'failed') {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(outcome);
    setMessage('');
    try {
      const result = await commerceRequest<{ status: 'paid' | 'failed' }>(
        '/payments/mock/confirm',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId, guestAccessToken, outcome }),
        },
      );
      onResult(result.status);
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Chưa thể xác nhận thanh toán. Vui lòng thử lại.',
      );
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={() => void simulate('succeeded')}
        disabled={busy !== null}
        className="h-11 w-full rounded-full"
      >
        {busy === 'succeeded' && <LoaderCircle className="animate-spin" />}
        Mô phỏng thanh toán thành công
      </Button>
      <Button
        onClick={() => void simulate('failed')}
        disabled={busy !== null}
        variant="outline"
        className="h-11 w-full rounded-full"
      >
        {busy === 'failed' && <LoaderCircle className="animate-spin" />}
        Mô phỏng thanh toán thất bại
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
