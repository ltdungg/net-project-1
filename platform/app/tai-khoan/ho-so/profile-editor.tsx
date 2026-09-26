'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LoaderCircle, UserRound } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CommerceApiError,
  commerceRequest,
} from '@/lib/commerce-api-client';

type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  marketingConsent: boolean;
  createdAt: number;
};

export function ProfileEditor() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!user) return;
      try {
        const result = await commerceRequest<Profile>('/account/profile');
        if (active) setProfile(result);
      } catch {
        if (active) setError('Không thể tải hồ sơ thành viên.');
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await commerceRequest<Profile>('/account/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: form.get('fullName'),
          phone: form.get('phone'),
          marketingConsent: form.get('marketingConsent') === 'on',
        }),
      });
      setProfile(result);
      await refreshUser();
      setMessage('Hồ sơ đã được cập nhật.');
    } catch (reason) {
      setError(
        reason instanceof CommerceApiError
          ? reason.message
          : 'Chưa thể cập nhật hồ sơ.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-dashed border-border p-10 text-center">
        <UserRound className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-3xl font-semibold">
          Đăng nhập để chỉnh sửa hồ sơ
        </h1>
        <Button
          nativeButton={false}
          className="mt-6 rounded-full"
          render={<Link href="/dang-nhap?returnTo=%2Ftai-khoan%2Fho-so" />}
        >
          Đăng nhập
        </Button>
      </section>
    );
  }

  if (!profile || profile.id !== user.id) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <LoaderCircle className="size-7 animate-spin text-accent" />
        )}
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Tài khoản
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">
        Hồ sơ thành viên
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Email dùng để đăng nhập không thể thay đổi tại đây.
      </p>
      <form key={`${profile.id}-${profile.fullName}-${profile.phone}`} onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={profile.email} readOnly className="mt-2 h-11 bg-secondary/60" />
        </div>
        <div>
          <Label htmlFor="profile-name">Họ và tên</Label>
          <Input id="profile-name" name="fullName" defaultValue={profile.fullName} required minLength={2} maxLength={100} className="mt-2 h-11" />
        </div>
        <div>
          <Label htmlFor="profile-phone">Số điện thoại</Label>
          <Input id="profile-phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} required pattern="^(0|\+84)[0-9]{9,10}$" className="mt-2 h-11" />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/55 p-4 text-sm">
          <input type="checkbox" name="marketingConsent" defaultChecked={profile.marketingConsent} className="mt-0.5 size-4 accent-primary" />
          <span>Nhận NÉT Letter tối đa hai lần mỗi tháng.</span>
        </label>
        {message ? (
          <output className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> {message}
          </output>
        ) : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy} className="rounded-full">
            {busy ? <LoaderCircle className="animate-spin" /> : null} Lưu hồ sơ
          </Button>
          <Button nativeButton={false} variant="outline" className="rounded-full" render={<Link href="/tai-khoan" />}>
            Quay lại tài khoản
          </Button>
        </div>
      </form>
    </section>
  );
}
