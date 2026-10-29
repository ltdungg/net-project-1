'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { ProductCard } from './product-card';
import { useAuth } from '@/components/auth/auth-provider';
import { commerceRequest } from '@/lib/commerce-api-client';
import {
  recentProductIds,
  rememberProduct,
  type Recommendation,
} from '@/lib/ai-contract';

export function Recommendations({
  currentSlug,
  productId,
}: {
  currentSlug?: string;
  productId?: string;
}) {
  const { user, favoriteIds, loading: authLoading } = useAuth();
  const [result, setResult] = useState<{
    key: string;
    items: Recommendation[];
    error: string;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const favorites = favoriteIds.slice(0, 50).join(',');
  const requestKey = JSON.stringify([
    currentSlug,
    user?.id,
    favorites,
    revision,
  ]);
  const loading = authLoading || result?.key !== requestKey;
  const items = loading ? [] : result.items;
  const error = loading ? '' : result.error;
  useEffect(() => {
    if (productId) rememberProduct(productId);
  }, [productId]);
  useEffect(() => {
    const refresh = () => setRevision((v) => v + 1);
    window.addEventListener('net:cart-changed', refresh);
    return () => window.removeEventListener('net:cart-changed', refresh);
  }, []);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    void commerceRequest<{ items: Recommendation[] }>('/ai/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        currentSlug,
        recentIds: recentProductIds(),
        favoriteIds: favorites ? favorites.split(',') : [],
      }),
    })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, items: data.items, error: '' });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            items: [],
            error: 'Chưa tải được gợi ý lúc này.',
          });
      });
    return () => controller.abort();
  }, [currentSlug, favorites, requestKey, authLoading]);

  return (
    <section
      aria-label="Sản phẩm gợi ý tự động"
      className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-accent">
            Dành riêng cho bạn
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
            Một vài lựa chọn hợp gu.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Tự động chọn từ sản phẩm bạn xem, yêu thích và giỏ hàng. Khám phá
            thêm để gợi ý sát với bạn hơn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('net:open-advisor'))}
          className="flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
        >
          Nhờ trợ lý tư vấn <ArrowRight className="size-4" />
        </button>
      </div>
      {loading ? (
        <output className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-4">
          <span className="sr-only">Đang tìm sản phẩm phù hợp</span>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </output>
      ) : error ? (
        <output className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          {error}
          <button
            type="button"
            className="flex items-center gap-1 font-semibold"
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw className="size-3" /> Thử lại
          </button>
        </output>
      ) : items.length ? (
        <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.product.id}>
              <ProductCard product={item.product} />
              <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Chưa có thêm thiết kế phù hợp còn hàng. Bạn có thể nhờ trợ lý tìm theo
          nhu cầu khác.
        </p>
      )}
    </section>
  );
}
