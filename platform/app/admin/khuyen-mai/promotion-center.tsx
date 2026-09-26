'use client';

import { type SyntheticEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Plus, TicketPercent } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
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
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { commerceRaw } from '@/lib/commerce-api-client';

type PromotionView = {
  id: string;
  name: string;
  code: string;
  typeLabel: string;
  usage: string;
  period: string;
  effectiveStatus: string;
};

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function PromotionCenter({
  promotions,
}: {
  promotions: PromotionView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await commerceRaw('/admin/promotions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        description: form.get('description'),
        code: formString(form, 'code').toUpperCase(),
        type: form.get('type'),
        value: Number(form.get('value')),
        minSubtotalCents: Number(form.get('minSubtotalCents')),
        maxDiscountCents: form.get('maxDiscountCents')
          ? Number(form.get('maxDiscountCents'))
          : undefined,
        usageLimit: form.get('usageLimit')
          ? Number(form.get('usageLimit'))
          : undefined,
        startsAt: new Date(formString(form, 'startsAt')).getTime(),
        endsAt: new Date(formString(form, 'endsAt')).getTime(),
      }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    if (!response.ok) {
      setError(payload.error?.message ?? 'Chưa thể tạo khuyến mãi.');
      setBusy(false);
      return;
    }
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  const start = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const inputDate = (date: Date) => date.toISOString().slice(0, 16);

  return (
    <>
      <PageHeader
        title="Khuyến mãi"
        description="Thiết lập điều kiện, quyền lợi, giới hạn sử dụng và snapshot giảm giá trên đơn."
        action={
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Plus /> Tạo chương trình
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <article
            key={promotion.id}
            className="rounded-2xl bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <TicketPercent />
              </span>
              <StatusBadge status={promotion.effectiveStatus} />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold">
              {promotion.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {promotion.code}
            </p>
            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ưu đãi</dt>
                <dd className="font-semibold">{promotion.typeLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sử dụng</dt>
                <dd>{promotion.usage}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Thời gian</dt>
                <dd className="text-right">{promotion.period}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">
                Tạo chương trình khuyến mãi
              </DialogTitle>
              <DialogDescription>
                Voucher được kiểm tra ở backend theo thời gian, giá trị đơn và
                giới hạn sử dụng.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Tên chương trình</Label>
                <Input id="name" name="name" required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="code">Mã voucher</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  pattern="[A-Za-z0-9_-]{3,40}"
                  className="mt-2 uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="type">Loại ưu đãi</Label>
                <NativeSelect id="type" name="type" className="mt-2 w-full">
                  <NativeSelectOption value="percentage">
                    Phần trăm
                  </NativeSelectOption>
                  <NativeSelectOption value="fixed">
                    Số tiền cố định
                  </NativeSelectOption>
                  <NativeSelectOption value="free_shipping">
                    Miễn phí vận chuyển
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="value">Giá trị</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  min="0"
                  required
                  defaultValue="10"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="minSubtotalCents">Giá trị đơn tối thiểu</Label>
                <Input
                  id="minSubtotalCents"
                  name="minSubtotalCents"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  defaultValue="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscountCents">Giảm tối đa</Label>
                <Input
                  id="maxDiscountCents"
                  name="maxDiscountCents"
                  type="number"
                  min="0"
                  step="1000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Tổng lượt dùng</Label>
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="startsAt">Bắt đầu</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={inputDate(start)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endsAt">Kết thúc</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  required
                  defaultValue={inputDate(end)}
                  className="mt-2"
                />
              </div>
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
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}{' '}
                Tạo voucher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
