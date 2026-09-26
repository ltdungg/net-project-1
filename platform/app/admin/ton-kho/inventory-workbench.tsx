'use client';

import { type SyntheticEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  ClipboardCheck,
  Clock3,
  Download,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { commerceRaw } from '@/lib/commerce-api-client';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryDashboard } from '@/lib/inventory-data';

type OperationType = 'receipt' | 'transfer' | 'stocktake' | 'adjustment';

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

const operationConfig: Record<
  OperationType,
  {
    title: string;
    description: string;
    endpoint: string;
    quantityLabel: string;
  }
> = {
  receipt: {
    title: 'Tạo phiếu nhập kho',
    description:
      'Cộng tồn thực tế và ghi đồng thời phiếu nhập, sổ cái và audit log.',
    endpoint: '/api/commerce/admin/inventory/receipts',
    quantityLabel: 'Số lượng nhập',
  },
  transfer: {
    title: 'Tạo phiếu chuyển kho',
    description:
      'Trừ kho nguồn và cộng kho đích trong cùng một batch nguyên tử.',
    endpoint: '/api/commerce/admin/inventory/transfers',
    quantityLabel: 'Số lượng chuyển',
  },
  stocktake: {
    title: 'Chốt kiểm kê',
    description: 'Ghi nhận số đếm thực tế và tự động tạo biến động chênh lệch.',
    endpoint: '/api/commerce/admin/inventory/counts',
    quantityLabel: 'Số đếm thực tế',
  },
  adjustment: {
    title: 'Điều chỉnh tồn kho',
    description:
      'Chỉ dành cho quản lý; luôn yêu cầu lý do và khóa chống gửi lặp.',
    endpoint: '/api/commerce/admin/inventory/adjust',
    quantityLabel: 'Chênh lệch (+/-)',
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatDate(value: number | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    receipt: 'Nhập kho',
    transfer_in: 'Chuyển đến',
    transfer_out: 'Chuyển đi',
    stocktake: 'Kiểm kê',
    manual_adjustment: 'Điều chỉnh',
    reservation: 'Giữ tồn',
    release: 'Nhả tồn',
    sale: 'Xuất bán',
  };
  return labels[type] ?? type;
}

function inventoryTypeLabel(type: string) {
  const labels: Record<string, string> = {
    receipt: 'Nhập kho',
    transfer: 'Chuyển kho',
    stocktake: 'Kiểm kê',
    adjustment: 'Điều chỉnh',
  };
  return labels[type] ?? type;
}

export function InventoryWorkbench({
  initialData,
  canAdjust,
}: {
  initialData: InventoryDashboard;
  canAdjust: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState('');
  const [warehouseId, setWarehouseId] = useState('all');
  const [stockState, setStockState] = useState('all');
  const [operation, setOperation] = useState<OperationType | null>(null);
  const [selectedItemId, setSelectedItemId] = useState(
    initialData.items[0]?.id ?? '',
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi');
    return data.items.filter((item) => {
      if (warehouseId !== 'all' && item.warehouseId !== warehouseId) {
        return false;
      }
      if (
        normalized &&
        !`${item.sku} ${item.product} ${item.color} ${item.size}`
          .toLocaleLowerCase('vi')
          .includes(normalized)
      ) {
        return false;
      }
      if (stockState === 'out' && item.available > 0) return false;
      if (stockState === 'low' && item.available > item.reorderPoint) {
        return false;
      }
      if (stockState === 'healthy' && item.available <= item.reorderPoint) {
        return false;
      }
      return true;
    });
  }, [data.items, query, stockState, warehouseId]);

  const selectedItem = data.items.find((item) => item.id === selectedItemId);
  const destinationWarehouses = data.warehouses.filter(
    (warehouse) => warehouse.id !== selectedItem?.warehouseId,
  );

  async function refresh() {
    setBusy(true);
    try {
      const response = await commerceRaw('/admin/inventory', {
        cache: 'no-store',
      });
      const payload = (await response.json()) as {
        data?: InventoryDashboard;
        error?: { message?: string } | null;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? 'Không thể làm mới dữ liệu.');
      }
      setData(payload.data);
      setNotice({
        tone: 'success',
        title: 'Đã đồng bộ',
        message: 'Số liệu tồn kho vừa được tải lại từ PostgreSQL.',
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Chưa thể đồng bộ',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function releaseExpiredReservations() {
    setBusy(true);
    try {
      const response = await commerceRaw(
        '/admin/inventory/reservations/release-expired',
        { method: 'POST' },
      );
      const payload = (await response.json()) as {
        data?: { released?: number; ordersCancelled?: number };
        error?: { message?: string } | null;
      };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Chưa thể nhả reservation.');
      }
      setNotice({
        tone: 'success',
        title: 'Đã xử lý reservation quá hạn',
        message: `Đã nhả ${payload.data?.released ?? 0} reservation và đóng ${payload.data?.ordersCancelled ?? 0} đơn chờ thanh toán.`,
      });
      const refreshed = await commerceRaw('/admin/inventory', {
        cache: 'no-store',
      });
      const refreshedPayload = (await refreshed.json()) as {
        data?: InventoryDashboard;
      };
      if (refreshedPayload.data) setData(refreshedPayload.data);
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Chưa thể xử lý reservation',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setBusy(false);
    }
  }

  function openOperation(type: OperationType, itemId?: string) {
    if (itemId) setSelectedItemId(itemId);
    setNotice(null);
    setOperation(type);
  }

  async function submitOperation(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!operation) return;
    const form = new FormData(event.currentTarget);
    const itemId = formString(form, 'inventoryItemId');
    const item = data.items.find((row) => row.id === itemId);
    if (!item) return;

    const quantity = Number(form.get('quantity'));
    const common = {
      reason: formString(form, 'reason'),
      notes: formString(form, 'notes'),
      referenceNumber: formString(form, 'referenceNumber'),
      idempotencyKey: crypto.randomUUID(),
    };
    const body =
      operation === 'receipt'
        ? {
            ...common,
            warehouseId: item.warehouseId,
            inventoryItemId: item.id,
            quantity,
            unitCostCents: Math.round(Number(form.get('unitCost') ?? 0) * 1000),
          }
        : operation === 'transfer'
          ? {
              ...common,
              sourceInventoryItemId: item.id,
              destinationWarehouseId: formString(
                form,
                'destinationWarehouseId',
              ),
              quantity,
            }
          : operation === 'stocktake'
            ? {
                ...common,
                inventoryItemId: item.id,
                actualQuantity: quantity,
              }
            : {
                ...common,
                inventoryItemId: item.id,
                quantityDelta: quantity,
              };

    setBusy(true);
    try {
      const response = await commerceRaw(operationConfig[operation].endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        data?: { operationNumber?: string };
        error?: { message?: string } | null;
      };
      if (!response.ok) {
        throw new Error(
          payload.error?.message ?? 'Không thể ghi nhận phiếu kho.',
        );
      }
      setOperation(null);
      setNotice({
        tone: 'success',
        title: 'Đã ghi nhận nghiệp vụ',
        message: `${payload.data?.operationNumber ?? 'Phiếu kho'} đã được post và lưu audit log.`,
      });
      const refreshed = await commerceRaw('/admin/inventory', {
        cache: 'no-store',
      });
      const refreshedPayload = (await refreshed.json()) as {
        data?: InventoryDashboard;
      };
      if (refreshedPayload.data) setData(refreshedPayload.data);
    } catch (error) {
      setNotice({
        tone: 'error',
        title: 'Nghiệp vụ chưa được ghi nhận',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Tồn kho đa kho"
        description="Nguồn dữ liệu vận hành theo thời gian thực: on-hand, reserved, ATP, safety stock, phiếu kho và sổ cái bất biến."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/api/commerce/admin/inventory/export" />}
            >
              <Download /> Xuất CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => void refresh()}
              disabled={busy}
            >
              <RefreshCw className={busy ? 'animate-spin' : ''} /> Làm mới
            </Button>
            <Button
              variant="outline"
              onClick={() => void releaseExpiredReservations()}
              disabled={busy}
            >
              <Clock3 /> Nhả giữ quá hạn
            </Button>
            <Button onClick={() => openOperation('receipt')}>
              <PackageCheck /> Nhập kho
            </Button>
          </div>
        }
      />

      {notice ? (
        <Alert
          variant={notice.tone === 'error' ? 'destructive' : 'default'}
          className="mb-5 bg-card"
        >
          {notice.tone === 'success' ? <ShieldCheck /> : <AlertTriangle />}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            Icon: Warehouse,
            label: 'Kho hoạt động',
            value: data.summary.warehouseCount,
            tone: 'text-accent',
          },
          {
            Icon: Boxes,
            label: 'Tồn khả dụng',
            value: data.summary.totalAvailable,
            tone: 'text-primary',
          },
          {
            Icon: ShieldCheck,
            label: 'ATP sau safety',
            value: data.summary.totalAtp,
            tone: 'text-emerald-700',
          },
          {
            Icon: AlertTriangle,
            label: 'SKU cần bổ sung',
            value: data.summary.lowStock,
            tone: 'text-amber-700',
          },
          {
            Icon: PackageCheck,
            label: 'Đang giữ cho đơn',
            value: data.summary.totalReserved,
            tone: 'text-sky-700',
          },
        ].map(({ Icon, label, value, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <Icon className={`size-5 ${tone}`} />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <strong className="mt-1 block font-heading text-3xl">
              {formatNumber(Number(value))}
            </strong>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm SKU, sản phẩm, màu hoặc kích cỡ…"
              className="h-10 pl-9"
              aria-label="Tìm trong tồn kho"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              className="min-w-48"
              aria-label="Lọc theo kho"
            >
              <NativeSelectOption value="all">Tất cả kho</NativeSelectOption>
              {data.warehouses.map((warehouse) => (
                <NativeSelectOption key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              value={stockState}
              onChange={(event) => setStockState(event.target.value)}
              className="min-w-40"
              aria-label="Lọc theo trạng thái tồn"
            >
              <NativeSelectOption value="all">
                Mọi trạng thái
              </NativeSelectOption>
              <NativeSelectOption value="low">Cần bổ sung</NativeSelectOption>
              <NativeSelectOption value="out">Hết hàng</NativeSelectOption>
              <NativeSelectOption value="healthy">An toàn</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3">SKU / Sản phẩm</th>
                <th className="px-4 py-3">Kho</th>
                <th className="px-4 py-3 text-right">On hand</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Safety</th>
                <th className="px-4 py-3 text-right">ATP</th>
                <th className="px-4 py-3">Mức tồn</th>
                <th className="rounded-r-xl px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const low = item.available <= item.reorderPoint;
                const out = item.available <= 0;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{item.product}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.sku} · {item.color} / {item.size}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline">{item.warehouseCode}</Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {item.onHand}
                    </td>
                    <td className="px-4 py-4 text-right">{item.reserved}</td>
                    <td className="px-4 py-4 text-right">{item.safetyStock}</td>
                    <td
                      className={`px-4 py-4 text-right font-semibold ${low ? 'text-amber-700' : ''}`}
                    >
                      {item.atp}
                    </td>
                    <td className="w-48 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(
                            100,
                            Math.max(
                              0,
                              (item.available /
                                Math.max(item.reorderPoint * 3, 1)) *
                                100,
                            ),
                          )}
                        />
                        <Badge
                          variant={
                            out ? 'destructive' : low ? 'secondary' : 'outline'
                          }
                        >
                          {out ? 'Hết hàng' : low ? 'Sắp hết' : 'An toàn'}
                        </Badge>
                      </div>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        Điểm đặt hàng: {item.reorderPoint} · v{item.version}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openOperation('transfer', item.id)}
                        >
                          Chuyển
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openOperation('stocktake', item.id)}
                        >
                          Kiểm kê
                        </Button>
                        {canAdjust ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openOperation('adjustment', item.id)}
                          >
                            Điều chỉnh
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredItems.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Không có SKU phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Hiển thị {filteredItems.length}/{data.items.length} bản ghi tồn kho.
          ATP = on-hand − reserved − safety stock.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <Tabs defaultValue="operations">
          <TabsList>
            <TabsTrigger value="operations">
              <ClipboardCheck /> Phiếu kho
            </TabsTrigger>
            <TabsTrigger value="movements">
              <ArrowDownUp /> Sổ cái biến động
            </TabsTrigger>
          </TabsList>
          <TabsContent value="operations" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3">Mã phiếu</th>
                    <th className="px-3 py-3">Nghiệp vụ</th>
                    <th className="px-3 py-3">Luồng kho</th>
                    <th className="px-3 py-3">Lý do</th>
                    <th className="px-3 py-3 text-right">Số lượng</th>
                    <th className="px-3 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-3 font-mono text-xs font-semibold">
                        {item.operationNumber}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary">
                          {inventoryTypeLabel(item.type)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {item.sourceWarehouse ?? 'Bên ngoài'} →{' '}
                        {item.destinationWarehouse ?? 'Điều chỉnh nội bộ'}
                      </td>
                      <td className="max-w-72 truncate px-3 py-3">
                        {item.reason}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatNumber(item.totalQuantity)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDate(item.postedAt ?? item.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!data.operations.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Chưa có phiếu kho.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="movements" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Kho</th>
                    <th className="px-3 py-3">Loại</th>
                    <th className="px-3 py-3 text-right">Biến động</th>
                    <th className="px-3 py-3 text-right">Sau giao dịch</th>
                    <th className="px-3 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs font-semibold">
                          {movement.sku}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {movement.product}
                        </p>
                      </td>
                      <td className="px-3 py-3">{movement.warehouseCode}</td>
                      <td className="px-3 py-3">
                        {movementLabel(movement.type)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          movement.quantityDelta > 0
                            ? 'text-emerald-700'
                            : movement.quantityDelta < 0
                              ? 'text-rose-700'
                              : ''
                        }`}
                      >
                        {movement.quantityDelta > 0 ? '+' : ''}
                        {movement.quantityDelta}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {movement.balanceAfter}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDate(movement.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!data.movements.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Chưa có biến động tồn kho.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Dialog
        open={Boolean(operation)}
        onOpenChange={(open) => !open && setOperation(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          {operation ? (
            <form onSubmit={submitOperation}>
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">
                  {operationConfig[operation].title}
                </DialogTitle>
                <DialogDescription>
                  {operationConfig[operation].description}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="inventoryItemId">SKU và kho</Label>
                  <NativeSelect
                    id="inventoryItemId"
                    name="inventoryItemId"
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                    className="mt-2 w-full"
                    required
                  >
                    {data.items.map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.sku} · {item.product} · {item.warehouseCode} · khả
                        dụng {item.available}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                {operation === 'transfer' ? (
                  <div className="sm:col-span-2">
                    <Label htmlFor="destinationWarehouseId">Kho đích</Label>
                    <NativeSelect
                      id="destinationWarehouseId"
                      name="destinationWarehouseId"
                      className="mt-2 w-full"
                      required
                    >
                      <NativeSelectOption value="">
                        Chọn kho đích
                      </NativeSelectOption>
                      {destinationWarehouses.map((warehouse) => (
                        <NativeSelectOption
                          key={warehouse.id}
                          value={warehouse.id}
                        >
                          {warehouse.code} · {warehouse.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {!destinationWarehouses.length ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Cần ít nhất hai kho hoạt động để chuyển kho.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="quantity">
                    {operationConfig[operation].quantityLabel}
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    required
                    step="1"
                    min={operation === 'adjustment' ? undefined : 0}
                    defaultValue={
                      operation === 'stocktake' ? selectedItem?.onHand : 1
                    }
                    className="mt-2 h-10"
                  />
                  {operation === 'adjustment' ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ví dụ: -2 nếu thiếu, 5 nếu bổ sung.
                    </p>
                  ) : null}
                </div>
                {operation === 'receipt' ? (
                  <div>
                    <Label htmlFor="unitCost">Đơn giá nhập (nghìn đồng)</Label>
                    <Input
                      id="unitCost"
                      name="unitCost"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue="0"
                      className="mt-2 h-10"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="referenceNumber">Mã tham chiếu</Label>
                    <Input
                      id="referenceNumber"
                      name="referenceNumber"
                      placeholder="PO, biên bản hoặc yêu cầu"
                      className="mt-2 h-10"
                    />
                  </div>
                )}
                {operation === 'receipt' ? (
                  <div>
                    <Label htmlFor="referenceNumber">Mã PO/phiếu giao</Label>
                    <Input
                      id="referenceNumber"
                      name="referenceNumber"
                      placeholder="PO-2026-001"
                      className="mt-2 h-10"
                    />
                  </div>
                ) : null}
                <div className={operation === 'receipt' ? '' : 'sm:col-span-2'}>
                  <Label htmlFor="reason">Lý do nghiệp vụ</Label>
                  <Input
                    id="reason"
                    name="reason"
                    required
                    minLength={3}
                    placeholder="Nêu rõ căn cứ thực hiện"
                    className="mt-2 h-10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Thông tin bổ sung cho người duyệt và kiểm toán…"
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOperation(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    (operation === 'transfer' && !destinationWarehouses.length)
                  }
                >
                  {busy ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  Xác nhận và post phiếu
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
