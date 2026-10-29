'use client';

import { type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { ProductImage } from '@/components/storefront/product-image';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  formatVnd,
  type CatalogProduct,
  type CatalogVariant,
} from '@/lib/catalog-data';
import { commerceRaw, commerceRequest } from '@/lib/commerce-api-client';
import type { PaymentConfig } from '@/lib/payment-client';

type CheckoutItem = {
  variantId: string;
  quantity: number;
  lineTotalCents?: number;
  product?: CatalogProduct | null;
  variant?: CatalogVariant | null;
};

type CartPayload = {
  items: CheckoutItem[];
  subtotalCents: number;
  itemCount: number;
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

type CheckoutContact = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  province: string;
};

type SavedAddress = Omit<CheckoutContact, 'name' | 'email'> & {
  id: string;
  label: string;
  recipientName: string;
  isDefault: boolean;
};

const emptyContact: CheckoutContact = {
  name: '',
  email: '',
  phone: '',
  line1: '',
  ward: '',
  district: '',
  province: '',
};

export function CheckoutClient() {
  const { user, refreshUser } = useAuth();
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [contact, setContact] = useState<CheckoutContact>(emptyContact);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    'cod' | 'online' | 'sepay'
  >('cod');
  const [mockEnabled, setMockEnabled] = useState(false);
  const [sepayEnabled, setSepayEnabled] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState<{
    orderNumber: string;
    id: string;
    guestAccessToken?: string;
    nextAction?: { type: string; url: string };
  } | null>(null);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const controller = new AbortController();
    void commerceRequest<PaymentConfig>('/payments/config', {
      signal: controller.signal,
    })
      .then((config) => {
        if (!controller.signal.aborted) {
          setMockEnabled(config.mockEnabled);
          setSepayEnabled(config.sepaySandboxEnabled);
        }
      })
      .catch(() => {
        /* COD remains available when the payment service is unavailable. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    commerceRaw('/cart', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as {
          data: CartPayload | null;
          error?: { message?: string } | null;
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? 'Không thể tải giỏ hàng.');
        }
        return payload.data;
      })
      .then(setCart)
      .catch(() => setMessage('Không thể tải giỏ hàng.'));
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      if (!user) {
        setSavedAddresses([]);
        setContact(emptyContact);
        return;
      }
      try {
        const [profile, addressBook] = await Promise.all([
          commerceRequest<{
            fullName: string;
            email: string;
            phone: string | null;
          }>('/account/profile'),
          commerceRequest<{ items: SavedAddress[] }>('/account/addresses'),
        ]);
        if (!active) return;
        const addresses = addressBook.items;
        const preferred =
          addresses.find((address) => address.isDefault) ?? addresses[0];
        setSavedAddresses(addresses);
        setContact({
          name: preferred?.recipientName || profile.fullName,
          email: profile.email,
          phone: preferred?.phone || profile.phone || '',
          line1: preferred?.line1 || '',
          ward: preferred?.ward || '',
          district: preferred?.district || '',
          province: preferred?.province || '',
        });
      } catch {
        if (active) {
          setContact((current) => ({
            ...current,
            name: current.name || user.fullName,
            email: current.email || user.email,
          }));
        }
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  function chooseAddress(address: SavedAddress) {
    setContact((current) => ({
      ...current,
      name: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      ward: address.ward ?? '',
      district: address.district,
      province: address.province,
    }));
  }

  function updateContact(field: keyof CheckoutContact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (
      !cart?.items.length ||
      state === 'loading' ||
      (paymentMethod === 'online' && !mockEnabled) ||
      (paymentMethod === 'sepay' && !sepayEnabled)
    )
      return;
    setState('loading');
    const formData = new FormData(event.currentTarget);
    const body = {
      email: formData.get('email'),
      phone: formData.get('phone'),
      customerNote: formData.get('note'),
      paymentMethod,
      voucherCode: cart.voucher?.valid ? cart.voucher.code : undefined,
      idempotencyKey,
      shippingAddress: {
        recipientName: formData.get('name'),
        phone: formData.get('phone'),
        line1: formData.get('line1'),
        ward: formData.get('ward'),
        district: formData.get('district'),
        province: formData.get('province'),
      },
      items: cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };
    try {
      if (user && !(await refreshUser())) {
        throw new Error(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi đặt đơn.',
        );
      }
      const response = await commerceRaw('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        data: {
          orderNumber: string;
          id: string;
          guestAccessToken?: string;
          nextAction?: { type: string; url: string };
        };
        error?: { message?: string };
      };
      if (!response.ok)
        throw new Error(payload.error?.message ?? 'Không thể tạo đơn');
      if (payload.data.guestAccessToken) {
        window.sessionStorage.setItem(
          `net:guest-order:${payload.data.id}`,
          payload.data.guestAccessToken,
        );
      }
      setOrder(payload.data);
      setState('success');
    } catch (error) {
      setState('error');
      setMessage(
        error instanceof Error ? error.message : 'Không thể tạo đơn hàng.',
      );
    }
  }

  if (state === 'success' && order)
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-green-600" />
        <h1 className="mt-5 font-heading text-4xl font-semibold">
          Đơn hàng đã được ghi nhận
        </h1>
        <p className="mt-3 text-muted-foreground">
          Mã đơn{' '}
          <strong className="text-foreground">{order.orderNumber}</strong>.
          Chúng tôi đã gửi thông tin xác nhận tới email của bạn.
        </p>
        <Button
          nativeButton={false}
          className="mt-7 rounded-full"
          render={
            <Link href={order.nextAction?.url ?? `/don-hang/${order.id}`} />
          }
        >
          {order.nextAction?.type === 'redirect'
            ? 'Tiếp tục thanh toán'
            : 'Theo dõi đơn hàng'}
        </Button>
      </div>
    );

  const shipping = cart?.shippingCents ?? 0;
  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </span>
            <div>
              <h1 className="font-heading text-4xl font-semibold">
                Thông tin nhận hàng
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Chúng tôi dùng thông tin này để xác nhận và giao đơn.
              </p>
            </div>
          </div>
          {savedAddresses.length ? (
            <div className="mt-6 rounded-xl bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Địa chỉ đã lưu
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {savedAddresses.map((address) => (
                  <Button
                    key={address.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => chooseAddress(address)}
                  >
                    <MapPin /> {address.label}
                    {address.isDefault ? ' · Mặc định' : ''}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                name="name"
                required
                value={contact.name}
                onChange={(event) => updateContact('name', event.target.value)}
                className="mt-2 h-11"
                placeholder="Nguyễn Minh Anh"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={contact.email}
                onChange={(event) => updateContact('email', event.target.value)}
                className="mt-2 h-11"
                placeholder="ban@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                required
                value={contact.phone}
                onChange={(event) => updateContact('phone', event.target.value)}
                className="mt-2 h-11"
                placeholder="0901234567"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="line1">Địa chỉ</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="line1"
                  name="line1"
                  required
                  value={contact.line1}
                  onChange={(event) =>
                    updateContact('line1', event.target.value)
                  }
                  className="h-11 pl-9"
                  placeholder="Số nhà, tên đường"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ward">Phường/Xã</Label>
              <Input
                id="ward"
                name="ward"
                value={contact.ward}
                onChange={(event) => updateContact('ward', event.target.value)}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="district">Quận/Huyện</Label>
              <Input
                id="district"
                name="district"
                required
                value={contact.district}
                onChange={(event) =>
                  updateContact('district', event.target.value)
                }
                className="mt-2 h-11"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="province">Tỉnh/Thành phố</Label>
              <Input
                id="province"
                name="province"
                required
                value={contact.province}
                onChange={(event) =>
                  updateContact('province', event.target.value)
                }
                className="mt-2 h-11"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                name="note"
                className="mt-2"
                placeholder="Ví dụ: Giao giờ hành chính"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </span>
            <div>
              <h2 className="font-heading text-3xl font-semibold">
                Phương thức giao hàng
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Thời gian tính từ khi đơn được xác nhận.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="relative cursor-pointer rounded-xl border border-primary bg-secondary/70 p-4">
              <input
                type="radio"
                name="shippingMethod"
                value="standard"
                className="sr-only"
                defaultChecked
              />
              <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
              <Truck className="size-5 text-accent" />
              <span className="mt-3 block font-semibold">
                Giao hàng tiêu chuẩn
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                2–5 ngày · {shipping ? formatVnd(shipping) : 'Miễn phí'}
              </span>
            </label>
            <div className="relative rounded-xl border border-dashed border-border p-4 opacity-60">
              <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-1 text-[9px] font-semibold uppercase">
                Sắp có
              </span>
              <Truck className="size-5 text-muted-foreground" />
              <span className="mt-3 block font-semibold">
                Hỏa tốc nội thành
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Đang hoàn thiện kết nối đối tác giao hàng
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <div>
              <h2 className="font-heading text-3xl font-semibold">
                Phương thức thanh toán
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Không lưu trữ thông tin thẻ của bạn.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                'cod',
                Banknote,
                'Thanh toán khi nhận hàng',
                'Kiểm tra gói hàng trước khi thanh toán',
              ],
              [
                'online',
                CreditCard,
                'Thanh toán giả lập',
                mockEnabled
                  ? 'Demo thành công / thất bại · không thu tiền thật'
                  : 'Chưa khả dụng trong môi trường này',
              ],
              ...(sepayEnabled
                ? [
                    [
                      'sepay',
                      CreditCard,
                      'SePay Sandbox',
                      'QR chuyển khoản thử · xác nhận từ SePay',
                    ],
                  ]
                : []),
            ].map(([value, Icon, title, copy]) => (
              <label
                key={String(value)}
                className={`relative cursor-pointer rounded-xl border p-4 ${value === 'online' && !mockEnabled ? 'cursor-not-allowed opacity-50' : ''} ${paymentMethod === value ? 'border-primary bg-secondary/70' : 'border-border'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={String(value)}
                  disabled={value === 'online' && !mockEnabled}
                  className="sr-only"
                  checked={paymentMethod === value}
                  onChange={() =>
                    setPaymentMethod(value as 'cod' | 'online' | 'sepay')
                  }
                />
                {paymentMethod === value ? (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <Icon className="mb-3 size-5 text-accent" />
                <span className="font-semibold">{String(title)}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {String(copy)}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-2xl bg-secondary/70 p-6 lg:sticky lg:top-28">
        <h2 className="font-heading text-3xl font-semibold">Đơn hàng</h2>
        <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
          {cart?.items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-3 rounded-xl bg-card/65 p-2.5"
            >
              {item.product ? (
                <ProductImage
                  position={item.product.atlasPosition}
                  alt={item.product.imageAlt}
                  src={item.product.atlasImage}
                  backgroundSize={item.product.atlasSize}
                  className="size-16 shrink-0 rounded-lg"
                />
              ) : (
                <div className="size-16 shrink-0 rounded-lg bg-secondary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {item.product?.name ?? 'Sản phẩm NÉT'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.variant
                    ? `${item.variant.color} · ${item.variant.size}`
                    : `Số lượng ${item.quantity}`}
                </p>
                <div className="mt-2 flex justify-between text-xs">
                  <span>x{item.quantity}</span>
                  <strong>{formatVnd(item.lineTotalCents ?? 0)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
          <div className="flex justify-between">
            <span>{cart?.itemCount ?? 0} sản phẩm</span>
            <span>{formatVnd(cart?.subtotalCents ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Giao hàng</span>
            <span>{shipping ? formatVnd(shipping) : 'Miễn phí'}</span>
          </div>
          {cart?.discountCents ? (
            <div className="flex justify-between text-emerald-700">
              <span>Ưu đãi ({cart.voucher?.code})</span>
              <span>-{formatVnd(cart.discountCents)}</span>
            </div>
          ) : null}
        </div>
        {cart?.voucher?.valid ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <p className="font-semibold">
              {cart.voucher.code} · {cart.voucher.name}
            </p>
            <p className="mt-1">{cart.voucher.message}</p>
          </div>
        ) : null}
        <div className="flex justify-between py-5 text-lg font-semibold">
          <span>Tổng cộng</span>
          <span>{formatVnd(cart?.grandTotalCents ?? 0)}</span>
        </div>
        <Button
          type="submit"
          disabled={!cart?.items.length || state === 'loading'}
          className="h-12 w-full rounded-full text-base"
        >
          {state === 'loading' ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LockKeyhole />
          )}{' '}
          Đặt hàng an toàn
        </Button>
        {message ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Bằng việc đặt hàng, bạn đồng ý với điều khoản mua hàng và chính sách
          bảo mật.
        </p>
        <div className="mt-5 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" /> Thanh toán bảo mật
          </div>
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-accent" /> Theo dõi giao hàng trực
            tuyến
          </div>
        </div>
      </aside>
    </form>
  );
}
