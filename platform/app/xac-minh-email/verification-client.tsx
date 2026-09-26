'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, LoaderCircle, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CommerceApiError,
  commerceRequest,
  notifyAuthChanged,
} from '@/lib/commerce-api-client';

type Action = {
  message: string;
  developmentToken?: string;
  expiresInSeconds: number;
};

export function VerificationClient() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [state, setState] = useState<'idle' | 'verifying' | 'verified' | 'resending'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (email && token) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      if (!email) {
        setEmail(window.sessionStorage.getItem('net:pending-email') ?? '');
      }
      if (!token) {
        setToken(
          window.sessionStorage.getItem(
            'net:development-verification-token',
          ) ?? '',
        );
      }
    });
    return () => {
      active = false;
    };
  }, [email, token]);

  async function verify() {
    if (!token.trim()) {
      setMessage('Vui lòng nhập mã xác minh trong email.');
      return;
    }
    setState('verifying');
    setMessage('');
    try {
      await commerceRequest('/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      window.sessionStorage.removeItem('net:development-verification-token');
      window.sessionStorage.removeItem('net:pending-email');
      notifyAuthChanged();
      setState('verified');
    } catch (reason) {
      setMessage(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể xác minh email. Vui lòng thử lại.',
      );
      setState('idle');
    }
  }

  async function resend(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('resending');
    setMessage('');
    try {
      const action = await commerceRequest<Action>('/auth/resend-verification', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (action.developmentToken) {
        setToken(action.developmentToken);
        window.sessionStorage.setItem(
          'net:development-verification-token',
          action.developmentToken,
        );
      }
      setMessage(action.message);
    } catch (reason) {
      setMessage(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể gửi lại email xác minh.',
      );
    } finally {
      setState('idle');
    }
  }

  if (state === 'verified') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">
          Email đã được xác minh
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          Phiên đăng nhập đã được tạo. Bạn có thể tiếp tục quản lý hồ sơ hoặc mua sắm.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button nativeButton={false} className="rounded-full" render={<Link href="/tai-khoan" />}>
            Mở tài khoản
          </Button>
          <Button nativeButton={false} variant="outline" className="rounded-full" render={<Link href="/san-pham" />}>
            Xem sản phẩm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <MailCheck className="size-5 text-accent" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Bảo vệ tài khoản
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">Xác minh email</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Mỗi mã chỉ dùng một lần và tự hết hạn sau 24 giờ.
      </p>
      <div className="mt-7">
        <Label htmlFor="verification-token">Mã xác minh</Label>
        <Input
          id="verification-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="one-time-code"
          className="mt-2 h-11 font-mono text-xs"
          placeholder="Dán mã nhận được trong email"
        />
        <Button
          type="button"
          onClick={() => void verify()}
          disabled={state === 'verifying' || !token.trim()}
          className="mt-4 h-11 w-full rounded-full"
        >
          {state === 'verifying' ? <LoaderCircle className="animate-spin" /> : null}
          Xác minh và đăng nhập
        </Button>
      </div>

      <form onSubmit={resend} className="mt-8 border-t border-border pt-7">
        <Label htmlFor="verification-email">Chưa nhận được email?</Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="verification-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@example.com"
            className="h-11"
          />
          <Button type="submit" variant="outline" disabled={state === 'resending'} className="h-11 shrink-0 rounded-full">
            {state === 'resending' ? <LoaderCircle className="animate-spin" /> : null}
            Gửi lại
          </Button>
        </div>
      </form>
      {message ? (
        <output className="mt-4 block rounded-xl bg-secondary p-4 text-sm">
          {message}
        </output>
      ) : null}
    </div>
  );
}
