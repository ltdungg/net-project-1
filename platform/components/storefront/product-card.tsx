import Link from 'next/link';
import { ArrowUpRight, Star } from 'lucide-react';

import type { CatalogProduct } from '@/lib/catalog-data';
import { formatVnd } from '@/lib/catalog-data';
import { FavoriteButton } from './favorite-button';
import { ProductImage } from './product-image';

export function ProductCard({ product }: { product: CatalogProduct }) {
  const price = product.variants[0]?.priceCents ?? 0;
  const compareAtPrice = product.variants[0]?.compareAtPriceCents;
  const availableSizes = product.variants.filter(
    (variant) => variant.available > 0,
  );

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-secondary">
        <Link
          href={`/san-pham/${product.slug}`}
          aria-label={`Xem ${product.name}`}
        >
          <ProductImage
            position={product.atlasPosition}
            alt={product.imageAlt}
            src={product.atlasImage}
            backgroundSize={product.atlasSize}
            className="aspect-[4/5] w-full transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {compareAtPrice ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              -{Math.round((1 - price / compareAtPrice) * 100)}%
            </span>
          ) : product.featured ? (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              Bán chạy
            </span>
          ) : null}
        </div>
        <FavoriteButton
          productId={product.id}
          label={product.name}
          className="absolute right-3 top-3"
        />
        <Link
          href={`/san-pham/${product.slug}`}
          className="absolute inset-x-3 bottom-3 flex translate-y-4 items-center justify-between rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
        >
          Xem nhanh
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/san-pham/${product.slug}`}
              className="font-heading text-lg font-semibold leading-tight tracking-[-0.025em] hover:text-accent sm:text-xl"
            >
              {product.name}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
              {product.subtitle}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
            <Star className="size-3 fill-accent text-accent" /> {product.rating}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatVnd(price)}</span>
            {compareAtPrice ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatVnd(compareAtPrice)}
              </span>
            ) : null}
          </div>
          <div
            className="flex items-center gap-1.5"
            aria-label="Màu và kích thước"
          >
            <span
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: product.variants[0]?.colorHex }}
            />
            <span className="text-[11px] text-muted-foreground">
              {availableSizes.length} size
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
