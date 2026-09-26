'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CatalogVariant } from '@/lib/catalog-data';
import { commerceRaw } from '@/lib/commerce-api-client';

export function ProductActions({ variants }: { variants: CatalogVariant[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const selectedVariant =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];

  async function addToCart(destination: '/gio-hang' | '/thanh-toan') {
    setState('loading');
    try {
      const response = await commerceRaw('/cart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ variantId: selectedId, quantity }),
      });
      if (!response.ok) throw new Error('Không thể thêm vào giỏ');
      window.dispatchEvent(new Event('net:cart-changed'));
      router.push(destination);
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Chọn kích thước</span>
          <Link
            href="/huong-dan-chon-size"
            className="text-sm text-accent underline underline-offset-4"
          >
            Hướng dẫn size
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedId(variant.id)}
              disabled={variant.available < 1}
              className={`relative h-11 rounded-xl border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${selectedId === variant.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50'}`}
            >
              {variant.size}
              {variant.available < 1 ? (
                <span className="absolute inset-x-2 top-1/2 h-px rotate-[-18deg] bg-current" />
              ) : null}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedVariant?.available
            ? `Còn ${selectedVariant.available} sản phẩm ở size này`
            : 'Kích thước này đang tạm hết hàng'}
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        <div className="flex h-12 items-center rounded-full border border-border bg-background px-1">
          <button
            className="flex size-10 items-center justify-center"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Giảm số lượng"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            className="flex size-10 items-center justify-center"
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            aria-label="Tăng số lượng"
            disabled={quantity >= (selectedVariant?.available ?? 0)}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          onClick={() => addToCart('/gio-hang')}
          disabled={state === 'loading' || !selectedVariant?.available}
          className="h-12 flex-1 rounded-full text-base"
        >
          <ShoppingBag /> {state === 'loading' ? 'Đang thêm…' : 'Thêm vào giỏ'}
        </Button>
      </div>
      <Button
        onClick={() => addToCart('/thanh-toan')}
        disabled={state === 'loading' || !selectedVariant?.available}
        variant="outline"
        className="mt-3 h-12 w-full rounded-full text-base"
      >
        Mua ngay · Thanh toán trong 2 phút
      </Button>
      {state === 'error' ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Chưa thể thêm vào giỏ. Hãy thử lại sau vài giây.
        </p>
      ) : null}
    </div>
  );
}
