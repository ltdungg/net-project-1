'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Gift,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/storefront/product-image';
import {
  formatVnd,
  type CatalogProduct,
  type CatalogVariant,
} from '@/lib/catalog-data';
import { commerceRaw } from '@/lib/commerce-api-client';

type CartItem = {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  product: CatalogProduct | null;
  variant: CatalogVariant | null;
};

type Cart = {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  grandTotalCents: number;
  voucher:
    | {
        valid: true;
        code: string;
        name: string;
        message: string;
        savingsCents: number;
        freeShipping: boolean;
      }
    | { valid: false; code: string; message: string }
    | null;
};

export function CartClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherState, setVoucherState] = useState<'idle' | 'loading'>('idle');
  const [voucherError, setVoucherError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await commerceRaw('/cart', { cache: 'no-store' });
      const payload = (await response.json()) as {
        data: Cart;
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(payload.error?.message);
      setCart(payload.data);
      if (payload.data.voucher?.valid) {
        setVoucherCode(payload.data.voucher.code);
      }
    } catch {
      setError('Chưa thể tải giỏ hàng. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    commerceRaw('/cart', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as {
          data: Cart;
          error?: { message?: string };
        };
        if (!response.ok) throw new Error(payload.error?.message);
        if (active) setCart(payload.data);
      })
      .catch(() => {
        if (active) setError('Chưa thể tải giỏ hàng. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [load]);

  async function change(item: CartItem, quantity: number) {
    if (quantity < 1) return;
    await commerceRaw(`/cart/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    await load();
    window.dispatchEvent(new Event('net:cart-changed'));
  }

  async function remove(item: CartItem) {
    await commerceRaw(`/cart/items/${item.id}`, { method: 'DELETE' });
    await load();
    window.dispatchEvent(new Event('net:cart-changed'));
  }

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherState('loading');
    setVoucherError('');
    const response = await commerceRaw('/vouchers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: voucherCode }),
    });
    const payload = (await response.json()) as {
      error?: { message?: string } | null;
    };
    if (!response.ok) {
      setVoucherError(payload.error?.message ?? 'Mã ưu đãi không hợp lệ.');
      setVoucherState('idle');
      return;
    }
    await load();
    setVoucherState('idle');
  }

  async function removeVoucher() {
    setVoucherState('loading');
    await commerceRaw('/vouchers', { method: 'DELETE' });
    setVoucherCode('');
    setVoucherError('');
    await load();
    setVoucherState('idle');
  }

  if (!cart && !error)
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-accent" />
      </div>
    );
  if (error)
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive">
        {error}
      </div>
    );
  if (!cart?.items.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-20 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-5 font-heading text-3xl font-semibold">
          Giỏ hàng đang trống
        </h2>
        <p className="mt-2 text-muted-foreground">
          Khám phá những thiết kế mới và chọn sản phẩm phù hợp với bạn.
        </p>
        <Button
          nativeButton={false}
          className="mt-7 rounded-full"
          render={<Link href="/san-pham" />}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  const shipping = cart.shippingCents;
  const freeShippingRemaining = Math.max(0, 799_000 - cart.subtotalCents);
  const shippingProgress = Math.min(100, (cart.subtotalCents / 799_000) * 100);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <section>
        <div className="mb-5 rounded-2xl bg-secondary/70 p-5">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-card">
              <Truck className="size-4 text-accent" />
            </span>
            <p>
              {cart.voucher?.valid && cart.voucher.freeShipping
                ? `Mã ${cart.voucher.code} đã miễn phí giao hàng cho đơn này.`
                : freeShippingRemaining
                  ? `Mua thêm ${formatVnd(freeShippingRemaining)} để được miễn phí giao hàng.`
                  : 'Đơn hàng của bạn đã được miễn phí giao hàng.'}
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[112px_1fr] gap-5 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[144px_1fr]"
            >
              {item.product ? (
                <ProductImage
                  position={item.product.atlasPosition}
                  alt={item.product.imageAlt}
                  src={item.product.atlasImage}
                  backgroundSize={item.product.atlasSize}
                  className="aspect-[4/5] rounded-xl"
                />
              ) : (
                <div className="aspect-[4/5] rounded-xl bg-secondary" />
              )}
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-xl font-semibold">
                        {item.product?.name ?? 'Sản phẩm'}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.variant
                          ? `${item.variant.color} · Size ${item.variant.size}`
                          : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item)}
                      aria-label="Xóa khỏi giỏ"
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <p className="mt-3 font-semibold">
                    {formatVnd(item.unitPriceCents)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-10 items-center rounded-full border border-border">
                    <button
                      onClick={() => change(item, item.quantity - 1)}
                      className="flex size-9 items-center justify-center"
                      aria-label="Giảm"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => change(item, item.quantity + 1)}
                      className="flex size-9 items-center justify-center"
                      aria-label="Tăng"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <strong>{formatVnd(item.lineTotalCents)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
        <Button
          nativeButton={false}
          variant="ghost"
          className="mt-5 rounded-full"
          render={<Link href="/san-pham" />}
        >
          ← Tiếp tục mua sắm
        </Button>
      </section>
      <aside className="h-fit rounded-2xl bg-secondary/70 p-6 lg:sticky lg:top-28">
        <h2 className="font-heading text-3xl font-semibold">Tóm tắt đơn</h2>
        <div className="mt-6 space-y-3 border-b border-border pb-5 text-sm">
          <div className="flex justify-between">
            <span>Tạm tính ({cart.itemCount} sản phẩm)</span>
            <span>{formatVnd(cart.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phí giao hàng</span>
            <span>{shipping ? formatVnd(shipping) : 'Miễn phí'}</span>
          </div>
          {cart.discountCents ? (
            <div className="flex justify-between text-emerald-700">
              <span>Giảm giá ({cart.voucher?.code})</span>
              <span>-{formatVnd(cart.discountCents)}</span>
            </div>
          ) : null}
        </div>
        <div className="border-b border-border py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            Mã ưu đãi
          </p>
          {cart.voucher?.valid ? (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {cart.voucher.code} · {cart.voucher.name}
                </p>
                <p className="mt-1 text-xs">{cart.voucher.message}</p>
              </div>
              <button
                type="button"
                onClick={removeVoucher}
                aria-label="Gỡ mã ưu đãi"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex gap-2">
                <label htmlFor="voucher-code" className="sr-only">
                  Nhập mã ưu đãi
                </label>
                <input
                  id="voucher-code"
                  value={voucherCode}
                  onChange={(event) =>
                    setVoucherCode(event.target.value.toUpperCase())
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void applyVoucher();
                    }
                  }}
                  placeholder="Ví dụ: CHAONET"
                  className="h-10 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm uppercase outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={voucherState === 'loading' || !voucherCode.trim()}
                  onClick={applyVoucher}
                  className="h-10 rounded-full"
                >
                  {voucherState === 'loading' ? (
                    <LoaderCircle className="animate-spin" />
                  ) : null}
                  Áp dụng
                </Button>
              </div>
              {voucherError ? (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {voucherError}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['CHAONET', 'NET20', 'FREESHIP'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setVoucherCode(code)}
                    className="rounded-full bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-accent"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between py-5 text-lg font-semibold">
          <span>Tổng cộng</span>
          <span>{formatVnd(cart.grandTotalCents)}</span>
        </div>
        <Button
          nativeButton={false}
          className="h-12 w-full rounded-full text-base"
          render={<Link href="/thanh-toan" />}
        >
          Tiến hành thanh toán
        </Button>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Thuế đã bao gồm. Phí giao hàng được tính theo địa chỉ nhận hàng.
        </p>
        <div className="mt-5 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
          {[
            [ShieldCheck, 'Thanh toán và thông tin cá nhân được bảo mật'],
            [RotateCcw, 'Đổi size miễn phí trong vòng 30 ngày'],
            [Gift, 'Đóng gói chỉn chu, có thể gửi làm quà'],
          ].map(([Icon, copy]) => (
            <div key={String(copy)} className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-accent" />
              <span>{String(copy)}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
