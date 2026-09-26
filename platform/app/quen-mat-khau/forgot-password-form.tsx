'use client';

import { type SyntheticEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommerceApiError, commerceRequest } from '@/lib/commerce-api-client';

type Action = {
  message: string;
  developmentToken?: string;
  expiresInSeconds: number;
};

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [action, setAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await commerceRequest<Action>('/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setAction(result);
      if (result.developmentToken) {
        window.sessionStorage.setItem('net:development-reset-token', result.developmentToken);
      }
    } catch (reason) {
      setError(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể xử lý yêu cầu. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (action) {
    const resetHref = action.developmentToken
      ? `/dat-lai-mat-khau?token=${encodeURIComponent(action.developmentToken)}`
      : '/dat-lai-mat-khau';
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">Kiểm tra hộp thư</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          {action.message} Liên kết đặt lại mật khẩu có hiệu lực trong 30 phút.
        </p>
        {action.developmentToken ? (
          <Button nativeButton={false} className="mt-7 rounded-full" render={<Link href={resetHref} />}>
            Mở trang đặt lại mật khẩu local
          </Button>
        ) : (
          <Button nativeButton={false} variant="outline" className="mt-7 rounded-full" render={<Link href="/dang-nhap" />}>
            Quay lại đăng nhập
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <KeyRound className="size-5 text-accent" />
      </span>
      <h1 className="mt-6 font-heading text-4xl font-semibold">Quên mật khẩu?</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Nhập email đã đăng ký. Phản hồi luôn giống nhau để không làm lộ tài khoản tồn tại.
      </p>
      <div className="mt-7">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11"
          placeholder="ban@example.com"
        />
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading} className="mt-6 h-11 w-full rounded-full">
        {loading ? <LoaderCircle className="animate-spin" /> : null}
        Gửi hướng dẫn
      </Button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        <Link href="/dang-nhap" className="font-semibold text-accent">Quay lại đăng nhập</Link>
      </p>
    </form>
  );
}
