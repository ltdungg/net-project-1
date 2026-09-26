'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

import { ProductCard } from '@/components/storefront/product-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { catalogProducts, type CatalogProduct } from '@/lib/catalog-data';
import { commerceRequest } from '@/lib/commerce-api-client';

export function FavoritesClient() {
  const { favoriteIds, loading } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>(catalogProducts);

  useEffect(() => {
    commerceRequest<{ items: CatalogProduct[] }>('/products')
      .then((result) => setProducts(result.items))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="mx-auto min-h-80 max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12">
        <div className="h-80 animate-pulse rounded-[2rem] bg-secondary" />
      </div>
    );
  }

  const favorites = products.filter((product) =>
    favoriteIds.includes(product.id),
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12">
      {favorites.length ? (
        <>
          <div className="mb-7 flex items-center justify-between">
            <p className="text-sm">
              <strong>{favorites.length}</strong>{' '}
              <span className="text-muted-foreground">thiết kế đã lưu</span>
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Nhấn biểu tượng trái tim để bỏ khỏi danh sách
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
            <Heart className="size-6 text-accent" />
          </span>
          <h2 className="mt-5 font-heading text-3xl font-semibold">
            Danh sách đang trống
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Chạm vào biểu tượng trái tim trên sản phẩm để lưu lại và so sánh
            trước khi quyết định.
          </p>
          <Button
            nativeButton={false}
            className="mt-6 rounded-full"
            render={<Link href="/san-pham" />}
          >
            Khám phá sản phẩm
          </Button>
        </div>
      )}

      <section className="mt-20 border-t border-border pt-12">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          <Sparkles className="size-4" /> Gợi ý cho bạn
        </p>
        <h2 className="mt-2 font-heading text-4xl font-semibold">
          Đang được quan tâm
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
