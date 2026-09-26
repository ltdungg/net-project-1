'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import {
  Check,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { commerceRaw } from '@/lib/commerce-api-client';

export type AddressRecord = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  ward: string | null;
  district: string;
  province: string;
  isDefault: boolean;
};

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: AddressRecord[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<AddressRecord | null | undefined>(
    undefined,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    const response = await commerceRaw('/account/addresses', {
      cache: 'no-store',
    });
    const payload = (await response.json()) as {
      data?: { items?: AddressRecord[] };
    };
    if (payload.data?.items)
      setAddresses(
        payload.data.items.map((item) => ({
          ...item,
          isDefault: Boolean(item.isDefault),
        })),
      );
  }

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, []);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const body = {
      label: form.get('label'),
      recipientName: form.get('recipientName'),
      phone: form.get('phone'),
      line1: form.get('line1'),
      ward: form.get('ward'),
      district: form.get('district'),
      province: form.get('province'),
      isDefault: form.get('isDefault') === 'on',
    };
    const response = await commerceRaw(
      editing
        ? `/account/addresses/${editing.id}`
        : '/account/addresses',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    if (!response.ok) {
      setBusy(false);
      setError(payload.error?.message ?? 'Chưa thể lưu địa chỉ.');
      return;
    }
    await reload();
    setBusy(false);
    setEditing(undefined);
  }

  async function remove(id: string) {
    if (!window.confirm('Xóa địa chỉ này khỏi sổ địa chỉ?')) return;
    setBusy(true);
    const response = await commerceRaw(`/account/addresses/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) await reload();
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Tài khoản
          </p>
          <h1 className="mt-2 font-heading text-5xl font-semibold">
            Sổ địa chỉ
          </h1>
          <p className="mt-2 text-muted-foreground">
            Lưu thông tin nhận hàng để checkout nhanh và chính xác hơn.
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="rounded-full">
          <Plus /> Thêm địa chỉ
        </Button>
      </div>
      <section className="mt-9 grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <article
            key={address.id}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-accent">
                <MapPin />
              </span>
              {address.isDefault ? (
                <Badge>
                  <Check /> Mặc định
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold">
              {address.label}
            </h2>
            <p className="mt-3 font-semibold">
              {address.recipientName} · {address.phone}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {address.line1}
              {address.ward ? `, ${address.ward}` : ''}, {address.district},{' '}
              {address.province}
            </p>
            <div className="mt-5 flex gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(address)}
              >
                <Pencil /> Sửa
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void remove(address.id)}
                disabled={busy}
              >
                <Trash2 /> Xóa
              </Button>
            </div>
          </article>
        ))}
        {!addresses.length ? (
          <button
            onClick={() => setEditing(null)}
            className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground md:col-span-2"
          >
            <MapPin className="mx-auto size-10" />
            <span className="mt-4 block font-semibold text-foreground">
              Chưa có địa chỉ nhận hàng
            </span>
            <span className="mt-1 block text-sm">
              Thêm địa chỉ đầu tiên để dùng cho lần mua tiếp theo.
            </span>
          </button>
        ) : null}
      </section>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
      >
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">
                {editing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </DialogTitle>
              <DialogDescription>
                Thông tin chỉ được dùng cho giao nhận và chăm sóc đơn hàng.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="label">Nhãn địa chỉ</Label>
                <Input
                  id="label"
                  name="label"
                  required
                  defaultValue={editing?.label ?? 'Nhà'}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="recipientName">Người nhận</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  required
                  minLength={2}
                  defaultValue={editing?.recipientName ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  name="phone"
                  required
                  defaultValue={editing?.phone ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="province">Tỉnh/Thành phố</Label>
                <Input
                  id="province"
                  name="province"
                  required
                  defaultValue={editing?.province ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Số nhà, tên đường</Label>
                <Input
                  id="line1"
                  name="line1"
                  required
                  minLength={5}
                  defaultValue={editing?.line1 ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="ward">Phường/Xã</Label>
                <Input
                  id="ward"
                  name="ward"
                  defaultValue={editing?.ward ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="district">Quận/Huyện</Label>
                <Input
                  id="district"
                  name="district"
                  required
                  defaultValue={editing?.district ?? ''}
                  className="mt-2 h-10"
                />
              </div>
              <label className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={editing?.isDefault ?? !addresses.length}
                  className="size-4 accent-primary"
                />{' '}
                Dùng làm địa chỉ mặc định
              </label>
            </div>
            {error ? (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(undefined)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Check />}{' '}
                Lưu địa chỉ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
