'use client';

import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CommerceApiError,
  commerceRequest,
  notifyAuthChanged,
} from '@/lib/commerce-api-client';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const requestedReturnTo = searchParams.get('returnTo');
  const returnTo = safeReturnTo(requestedReturnTo);
  const resumedSession = useRef(false);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      requestedReturnTo &&
      !resumedSession.current
    ) {
      resumedSession.current = true;
      router.replace(returnTo);
      router.refresh();
    }
  }, [authLoading, requestedReturnTo, returnTo, router, user]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNeedsVerification(false);
    const form = new FormData(event.currentTarget);
    try {
      await commerceRequest('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      notifyAuthChanged();
      router.replace(returnTo);
      router.refresh();
    } catch (reason) {
      if (reason instanceof CommerceApiError) {
        setError(reason.message);
        setNeedsVerification(reason.code === 'EMAIL_NOT_VERIFIED');
      } else {
        setError('Không thể kết nối hệ thống đăng nhập. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-accent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="py-6">
        <CheckCircle2 className="size-11 text-emerald-600" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Đã đăng nhập
        </p>
        <h2 className="mt-2 font-heading text-4xl font-semibold">
          Xin chào, {user.fullName}
        </h2>
        <p className="mt-3 text-muted-foreground">{user.email}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            nativeButton={false}
            className="rounded-full"
            render={<Link href={returnTo} />}
          >
            {requestedReturnTo ? 'Tiếp tục' : 'Mở tài khoản'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => void logout()}
          >
            <LogOut /> Đăng xuất
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Chào mừng trở lại
      </p>
      <h2 className="mt-2 font-heading text-4xl font-semibold">
        Đăng nhập tài khoản
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Quản lý đơn hàng, địa chỉ giao nhận và danh sách yêu thích trên mọi
        thiết bị.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-11"
            placeholder="ban@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Mật khẩu</Label>
            <Link
              href={`/quen-mat-khau${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative mt-2">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={72}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mt-5 rounded-xl bg-destructive/8 p-4 text-sm text-destructive">
          <p>{error}</p>
          {needsVerification ? (
            <Link
              href={`/xac-minh-email?email=${encodeURIComponent(email)}`}
              className="mt-2 inline-block font-semibold underline"
            >
              Gửi lại email xác minh
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="mt-7 h-12 w-full rounded-full text-base"
      >
        {submitting ? <LoaderCircle className="animate-spin" /> : null}
        Đăng nhập
      </Button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link href="/dang-ky" className="font-semibold text-accent">
          Đăng ký thành viên
        </Link>
      </p>
    </form>
  );
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/tai-khoan';
  try {
    const parsed = new URL(value, 'https://net.local');
    return parsed.origin === 'https://net.local'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : '/tai-khoan';
  } catch {
    return '/tai-khoan';
  }
}
