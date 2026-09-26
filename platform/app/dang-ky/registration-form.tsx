'use client';

import { type SyntheticEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommerceApiError, commerceRequest } from '@/lib/commerce-api-client';

type Registration = {
  userId: string;
  email: string;
  verificationRequired: boolean;
  developmentVerificationToken?: string;
  expiresInSeconds: number;
};

export function RegistrationForm() {
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const passwordEntry = form.get('password');
    const confirmationEntry = form.get('confirmPassword');
    const password = typeof passwordEntry === 'string' ? passwordEntry : '';
    const confirmation =
      typeof confirmationEntry === 'string' ? confirmationEntry : '';
    if (password !== confirmation) {
      setMessage('Mật khẩu xác nhận chưa khớp.');
      setState('idle');
      return;
    }
    try {
      const result = await commerceRequest<Registration>('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: form.get('fullName'),
          email: form.get('email'),
          phone: form.get('phone'),
          password,
          acceptedTerms: form.get('acceptedTerms') === 'on',
          marketingConsent: form.get('marketingConsent') === 'on',
        }),
      });
      window.sessionStorage.setItem('net:pending-email', result.email);
      if (result.developmentVerificationToken) {
        window.sessionStorage.setItem(
          'net:development-verification-token',
          result.developmentVerificationToken,
        );
      }
      setRegistration(result);
      setState('success');
    } catch (reason) {
      setMessage(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể tạo tài khoản. Vui lòng thử lại.',
      );
      setState('idle');
    }
  }

  if (state === 'success' && registration) {
    const params = new URLSearchParams({ email: registration.email });
    if (registration.developmentVerificationToken) {
      params.set('token', registration.developmentVerificationToken);
    }
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="mt-5 font-heading text-4xl font-semibold">
          Kiểm tra email của bạn
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          Tài khoản <strong className="text-foreground">{registration.email}</strong>{' '}
          đã được tạo ở trạng thái chờ. Liên kết xác minh có hiệu lực trong 24 giờ.
        </p>
        {registration.developmentVerificationToken ? (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Môi trường local không gửi email thật, vì vậy nút dưới đây mang sẵn
            mã xác minh dùng để kiểm thử.
          </p>
        ) : null}
        <Button
          nativeButton={false}
          className="mt-7 rounded-full"
          render={<Link href={`/xac-minh-email?${params.toString()}`} />}
        >
          Xác minh email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Tài khoản thành viên
      </p>
      <h2 className="mt-2 font-heading text-4xl font-semibold">
        Tạo tài khoản NÉT
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Đăng ký bằng email; xác minh một lần trước khi đăng nhập.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            className="mt-2 h-11"
            placeholder="Nguyễn Minh Anh"
          />
        </div>
        <div>
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 h-11"
            placeholder="ban@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            pattern="^(0|\+84)[0-9]{9,10}$"
            className="mt-2 h-11"
            placeholder="0901234567"
          />
        </div>
        <div>
          <Label htmlFor="register-password">Mật khẩu</Label>
          <div className="relative mt-2">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}"
              className="h-11 pr-11"
              aria-describedby="password-hint"
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
        <div>
          <Label htmlFor="confirm-password">Nhập lại mật khẩu</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className="mt-2 h-11"
          />
        </div>
        <p id="password-hint" className="text-xs leading-5 text-muted-foreground sm:col-span-2">
          Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/55 p-4 text-sm">
          <input
            type="checkbox"
            name="acceptedTerms"
            required
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            Tôi đồng ý với điều khoản thành viên và chính sách bảo mật của NÉT.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 px-4 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="marketingConsent"
            className="mt-0.5 size-4 accent-primary"
          />
          <span>Nhận NÉT Letter tối đa 2 lần/tháng (không bắt buộc).</span>
        </label>
      </div>

      {message ? (
        <p role="alert" className="mt-5 rounded-xl bg-destructive/8 p-4 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={state === 'loading'}
        className="mt-7 h-12 w-full rounded-full text-base"
      >
        {state === 'loading' ? <LoaderCircle className="animate-spin" /> : null}
        Tạo tài khoản
      </Button>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-semibold text-accent">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
