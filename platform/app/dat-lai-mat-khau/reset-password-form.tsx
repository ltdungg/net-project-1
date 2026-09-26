'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommerceApiError, commerceRequest } from '@/lib/commerce-api-client';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setToken(
          window.sessionStorage.getItem('net:development-reset-token') ?? '',
        );
      }
    });
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const passwordEntry = form.get('password');
    const confirmationEntry = form.get('confirmPassword');
    const password = typeof passwordEntry === 'string' ? passwordEntry : '';
    const confirmation =
      typeof confirmationEntry === 'string' ? confirmationEntry : '';
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await commerceRequest('/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      window.sessionStorage.removeItem('net:development-reset-token');
      setSuccess(true);
    } catch (reason) {
      setError(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể đặt lại mật khẩu. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">Mật khẩu đã đổi</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Các phiên làm mới đã bị thu hồi; access token cũ tự hết hạn trong tối
          đa 15 phút.
        </p>
        <Button nativeButton={false} className="mt-7 rounded-full" render={<Link href="/dang-nhap" />}>
          Đăng nhập bằng mật khẩu mới
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <KeyRound className="size-5 text-accent" />
      </span>
      <h1 className="mt-6 font-heading text-4xl font-semibold">Đặt lại mật khẩu</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Chọn mật khẩu mới chưa từng dùng cho tài khoản này.
      </p>
      <div className="mt-7 space-y-5">
        <div>
          <Label htmlFor="reset-token">Mã đặt lại</Label>
          <Input id="reset-token" value={token} onChange={(event) => setToken(event.target.value)} required className="mt-2 h-11 font-mono text-xs" />
        </div>
        <div>
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}" className="mt-2 h-11" />
          <p className="mt-2 text-xs text-muted-foreground">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
        </div>
        <div>
          <Label htmlFor="confirm-new-password">Nhập lại mật khẩu</Label>
          <Input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className="mt-2 h-11" />
        </div>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading || !token} className="mt-6 h-11 w-full rounded-full">
        {loading ? <LoaderCircle className="animate-spin" /> : null}
        Cập nhật mật khẩu
      </Button>
    </form>
  );
}
