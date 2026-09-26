'use client';

import { type SyntheticEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save, Truck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  commerceRequest,
  CommerceApiError,
} from '@/lib/commerce-api-client';
import {
  fulfillmentLabels,
  type FulfillmentDetail,
  type FulfillmentStatus,
} from '@/lib/fulfillment-contract';

const workflowOrder: FulfillmentStatus[] = [
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'failed',
  'returned',
  'cancelled',
];

const reasonRequired = new Set<FulfillmentStatus>([
  'failed',
  'returned',
  'cancelled',
]);

function dateInput(value: number | null) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export function FulfillmentControl({
  initialData,
}: {
  initialData: FulfillmentDetail;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextStatuses = useMemo(
    () =>
      workflowOrder.filter((status) => data.nextStatuses.includes(status)),
    [data.nextStatuses],
  );

  async function saveTracking(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const estimatedDate = formText(form, 'estimatedDeliveryAt');
    setBusy('tracking');
    setError(null);
    setMessage(null);
    try {
      const updated = await commerceRequest<FulfillmentDetail>(
        `/admin/fulfillments/${encodeURIComponent(data.id)}/tracking`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            carrier: formText(form, 'carrier'),
            serviceCode: formText(form, 'serviceCode') || null,
            trackingNumber: formText(form, 'trackingNumber'),
            providerReference: formText(form, 'providerReference') || null,
            estimatedDeliveryAt: estimatedDate
              ? new Date(`${estimatedDate}T12:00:00+07:00`).getTime()
              : null,
            shippingCostCents: Math.max(
              0,
              Number(formText(form, 'shippingCostCents')) || 0,
            ),
            notes: formText(form, 'notes') || null,
            expectedVersion: data.version,
          }),
        },
      );
      setData(updated);
      setMessage('Đã lưu đơn vị vận chuyển và mã vận đơn.');
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof CommerceApiError
          ? cause.message
          : 'Không thể cập nhật vận đơn. Vui lòng thử lại.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(target: FulfillmentStatus) {
    if (reasonRequired.has(target) && !reason.trim()) {
      setError('Cần nhập lý do trước khi ghi nhận ngoại lệ, hủy hoặc hoàn hàng.');
      return;
    }
    setBusy(target);
    setError(null);
    setMessage(null);
    try {
      const updated = await commerceRequest<FulfillmentDetail>(
        `/admin/fulfillments/${encodeURIComponent(data.id)}/status`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            status: target,
            reason: reason.trim() || null,
            expectedVersion: data.version,
          }),
        },
      );
      setData(updated);
      setReason('');
      setMessage(`Đã chuyển phiếu giao sang “${fulfillmentLabels[target]}”.`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof CommerceApiError
          ? cause.message
          : 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Chưa thể cập nhật</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertTitle>Cập nhật thành công</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={saveTracking}
        className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-accent" />
          <h2 className="font-heading text-2xl">Thông tin bàn giao</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Bắt buộc có đơn vị và mã vận đơn trước khi chuyển sang đang giao.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="carrier">Đơn vị vận chuyển</Label>
            <Input
              id="carrier"
              name="carrier"
              required
              maxLength={80}
              defaultValue={data.carrier ?? ''}
              placeholder="GHN, GHTK, Viettel Post…"
              className="mt-2 h-10"
            />
          </div>
          <div>
            <Label htmlFor="serviceCode">Gói dịch vụ</Label>
            <Input
              id="serviceCode"
              name="serviceCode"
              maxLength={80}
              defaultValue={data.serviceCode ?? ''}
              placeholder="Standard / Express"
              className="mt-2 h-10"
            />
          </div>
          <div>
            <Label htmlFor="trackingNumber">Mã vận đơn</Label>
            <Input
              id="trackingNumber"
              name="trackingNumber"
              required
              maxLength={150}
              defaultValue={data.trackingNumber ?? ''}
              placeholder="Nhập mã do đối tác cấp"
              className="mt-2 h-10 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="providerReference">Mã đối soát đối tác</Label>
            <Input
              id="providerReference"
              name="providerReference"
              maxLength={150}
              defaultValue={data.providerReference ?? ''}
              placeholder="Tùy chọn"
              className="mt-2 h-10"
            />
          </div>
          <div>
            <Label htmlFor="estimatedDeliveryAt">Ngày giao dự kiến</Label>
            <Input
              id="estimatedDeliveryAt"
              name="estimatedDeliveryAt"
              type="date"
              defaultValue={dateInput(data.estimatedDeliveryAt)}
              className="mt-2 h-10"
            />
          </div>
          <div>
            <Label htmlFor="shippingCostCents">Chi phí vận chuyển nội bộ</Label>
            <Input
              id="shippingCostCents"
              name="shippingCostCents"
              type="number"
              min="0"
              step="1"
              defaultValue={data.shippingCostCents}
              className="mt-2 h-10"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Ghi chú vận hành</Label>
            <Textarea
              id="notes"
              name="notes"
              maxLength={2000}
              defaultValue={data.notes ?? ''}
              placeholder="Lưu ý giao hàng, đầu mối đối tác hoặc yêu cầu xử lý…"
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={busy !== null}>
            {busy === 'tracking' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Save />
            )}
            Lưu vận đơn
          </Button>
        </div>
      </form>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="font-heading text-2xl">Cập nhật hành trình</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Phiếu đang ở trạng thái “{fulfillmentLabels[data.status]}” · phiên bản{' '}
          {data.version}.
        </p>
        {nextStatuses.some((status) => reasonRequired.has(status)) ? (
          <div className="mt-4">
            <Label htmlFor="statusReason">Lý do ngoại lệ</Label>
            <Textarea
              id="statusReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              placeholder="Bắt buộc khi giao thất bại, hủy hoặc hoàn về…"
              className="mt-2"
            />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              variant={reasonRequired.has(status) ? 'outline' : 'default'}
              disabled={busy !== null}
              onClick={() => changeStatus(status)}
            >
              {busy === status ? (
                <LoaderCircle className="animate-spin" />
              ) : null}
              {fulfillmentLabels[status]}
            </Button>
          ))}
          {!nextStatuses.length ? (
            <p className="text-sm text-muted-foreground">
              Phiếu giao đã kết thúc, không còn bước chuyển tiếp.
            </p>
          ) : null}
        </div>
        {data.status === 'returned' ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            Phiếu hoàn về không tự cộng lại tồn kho. Hàng chỉ được nhập lại sau khi bộ
            phận kho kiểm tra tình trạng sản phẩm.
          </p>
        ) : null}
      </section>
    </div>
  );
}
