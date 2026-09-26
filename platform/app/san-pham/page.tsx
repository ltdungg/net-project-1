import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import { ProductCard } from '@/components/storefront/product-card';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { Button } from '@/components/ui/button';
import type { CatalogProduct } from '@/lib/catalog-data';
import { listCatalogProductsFromDb } from '@/lib/catalog-repository';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sản phẩm',
  description: 'Khám phá thời trang nữ, nam và phụ kiện mới nhất từ NÉT.',
};

type FilterState = {
  category: string;
  price: string;
  size: string;
  query: string;
  saleOnly: boolean;
  newOnly: boolean;
  sort: string;
};

const categories = [
  ['Tất cả', ''],
  ['Nữ', 'nu'],
  ['Nam', 'nam'],
  ['Phụ kiện', 'phu-kien'],
];

function FilterPanel({
  filters,
  products,
}: {
  filters: FilterState;
  products: CatalogProduct[];
}) {
  return (
    <form action="/san-pham" className="space-y-7">
      {filters.query ? (
        <input type="hidden" name="q" value={filters.query} />
      ) : null}
      <fieldset>
        <legend className="text-sm font-semibold">Danh mục</legend>
        <div className="mt-3 space-y-2.5">
          {categories.map(([label, value]) => (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-3 text-sm"
            >
              <input
                type="radio"
                name="danh-muc"
                value={value}
                defaultChecked={filters.category === value}
                className="size-4 accent-primary"
              />
              <span className="flex-1">{label}</span>
              <span className="text-xs text-muted-foreground">
                {value
                  ? products.filter((product) =>
                      value === 'phu-kien'
                        ? product.category === 'Phụ kiện'
                        : product.category.toLowerCase() ===
                          label.toLowerCase(),
                    ).length
                  : products.length}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="border-t border-border pt-6">
        <legend className="text-sm font-semibold">Khoảng giá</legend>
        <div className="mt-3 space-y-2.5">
          {[
            ['Tất cả mức giá', ''],
            ['Dưới 800.000đ', 'duoi-800'],
            ['800.000đ – 1.200.000đ', '800-1200'],
            ['Trên 1.200.000đ', 'tren-1200'],
          ].map(([label, value]) => (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-3 text-sm"
            >
              <input
                type="radio"
                name="gia"
                value={value}
                defaultChecked={filters.price === value}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="border-t border-border pt-6">
        <legend className="text-sm font-semibold">Kích thước</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {['S', 'M', 'L', 'One size'].map((size) => (
            <label key={size}>
              <input
                type="radio"
                name="size"
                value={size}
                defaultChecked={filters.size === size}
                className="peer sr-only"
              />
              <span className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-border text-xs font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                {size === 'One size' ? 'One' : size}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-3 border-t border-border pt-6">
        <legend className="sr-only">Thuộc tính</legend>
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Chỉ sản phẩm mới</span>
          <input
            type="checkbox"
            name="moi"
            value="true"
            defaultChecked={filters.newOnly}
            className="size-4 accent-primary"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Đang có ưu đãi</span>
          <input
            type="checkbox"
            name="khuyen-mai"
            value="true"
            defaultChecked={filters.saleOnly}
            className="size-4 accent-primary"
          />
        </label>
      </fieldset>
      <input type="hidden" name="sap-xep" value={filters.sort} />
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" className="rounded-full">
          Áp dụng
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="rounded-full"
          render={<Link href="/san-pham" />}
        >
          Đặt lại
        </Button>
      </div>
    </form>
  );
}

function productPrice(product: CatalogProduct) {
  return product.variants[0]?.priceCents ?? 0;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalogProducts = await listCatalogProductsFromDb();
  const getParam = (key: string) =>
    typeof params[key] === 'string' ? params[key] : '';
  const filters: FilterState = {
    category: getParam('danh-muc'),
    price: getParam('gia'),
    size: getParam('size'),
    query: getParam('q').trim(),
    saleOnly: getParam('khuyen-mai') === 'true',
    newOnly: getParam('moi') === 'true',
    sort: getParam('sap-xep') || 'noi-bat',
  };
  const categoryMap: Record<string, CatalogProduct['category']> = {
    nu: 'Nữ',
    nam: 'Nam',
    'phu-kien': 'Phụ kiện',
  };
  const category = categoryMap[filters.category];
  const normalizedQuery = filters.query.toLocaleLowerCase('vi');

  const products = catalogProducts
    .filter((product) => {
      const price = productPrice(product);
      if (category && product.category !== category) return false;
      if (filters.saleOnly && !product.variants[0]?.compareAtPriceCents)
        return false;
      if (filters.newOnly && !product.featured) return false;
      if (
        filters.size &&
        !product.variants.some(
          (variant) => variant.size === filters.size && variant.available > 0,
        )
      )
        return false;
      if (filters.price === 'duoi-800' && price >= 800_000) return false;
      if (
        filters.price === '800-1200' &&
        (price < 800_000 || price > 1_200_000)
      )
        return false;
      if (filters.price === 'tren-1200' && price <= 1_200_000) return false;
      if (
        normalizedQuery &&
        ![product.name, product.subtitle, product.material, product.category]
          .join(' ')
          .toLocaleLowerCase('vi')
          .includes(normalizedQuery)
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'gia-tang') return productPrice(a) - productPrice(b);
      if (filters.sort === 'gia-giam') return productPrice(b) - productPrice(a);
      if (filters.sort === 'danh-gia') return b.rating - a.rating;
      return Number(b.featured) - Number(a.featured);
    });

  const activeLabels = [
    category,
    filters.query ? `“${filters.query}”` : '',
    filters.price === 'duoi-800'
      ? 'Dưới 800K'
      : filters.price === '800-1200'
        ? '800K–1,2 triệu'
        : filters.price === 'tren-1200'
          ? 'Trên 1,2 triệu'
          : '',
    filters.size ? `Size ${filters.size}` : '',
    filters.newOnly ? 'Hàng mới' : '',
    filters.saleOnly ? 'Đang ưu đãi' : '',
  ].filter(Boolean);

  const title = filters.query
    ? `Kết quả cho “${filters.query}”`
    : (category ??
      (filters.saleOnly
        ? 'Ưu đãi'
        : filters.newOnly
          ? 'Hàng mới'
          : 'Tất cả sản phẩm'));

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border bg-[#f1e9dd]">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <ChevronRight className="size-3" />
            <span>Sản phẩm</span>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Bộ sưu tập hiện tại
              </p>
              <h1 className="mt-2 font-heading text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Thiết kế tối giản, chất liệu rõ ràng và phom dáng được cân chỉnh
                cho người Việt. Lọc theo nhu cầu để tìm đúng món đồ nhanh hơn.
              </p>
            </div>
            <form
              action="/san-pham"
              className="flex h-12 w-full max-w-md items-center rounded-full border border-border bg-card px-4 shadow-sm"
            >
              <Search className="size-4 text-muted-foreground" />
              <label htmlFor="catalog-search" className="sr-only">
                Tìm trong danh mục
              </label>
              <input
                id="catalog-search"
                name="q"
                defaultValue={filters.query}
                placeholder="Tìm theo tên hoặc chất liệu"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="text-xs font-semibold text-accent"
              >
                Tìm
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-5">
          {categories.map(([label, value]) => (
            <Link
              key={label}
              href={value ? `/san-pham?danh-muc=${value}` : '/san-pham'}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filters.category === value && !filters.query ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/san-pham?moi=true"
            className="flex items-center gap-1.5 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
          >
            <Sparkles className="size-3.5" /> Hàng mới
          </Link>
        </div>

        <details className="mt-5 rounded-2xl border border-border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" /> Bộ lọc chi tiết
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
              {activeLabels.length}
            </span>
          </summary>
          <div className="mt-6 border-t border-border pt-5">
            <FilterPanel filters={filters} products={catalogProducts} />
          </div>
        </details>

        <div className="mt-7 grid gap-8 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-5">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  <SlidersHorizontal className="size-4" /> Bộ lọc
                </h2>
                {activeLabels.length ? (
                  <Link
                    href="/san-pham"
                    className="flex items-center gap-1 text-xs text-accent"
                  >
                    Xóa <X className="size-3" />
                  </Link>
                ) : null}
              </div>
              <FilterPanel filters={filters} products={catalogProducts} />
            </div>
          </aside>

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm">
                  <strong>{products.length}</strong>{' '}
                  <span className="text-muted-foreground">
                    sản phẩm phù hợp
                  </span>
                </p>
                {activeLabels.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-secondary px-2.5 py-1 text-[11px]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <form
                action="/san-pham"
                className="flex items-center gap-2 text-sm"
              >
                {filters.category ? (
                  <input
                    type="hidden"
                    name="danh-muc"
                    value={filters.category}
                  />
                ) : null}
                {filters.query ? (
                  <input type="hidden" name="q" value={filters.query} />
                ) : null}
                {filters.price ? (
                  <input type="hidden" name="gia" value={filters.price} />
                ) : null}
                {filters.size ? (
                  <input type="hidden" name="size" value={filters.size} />
                ) : null}
                {filters.saleOnly ? (
                  <input type="hidden" name="khuyen-mai" value="true" />
                ) : null}
                {filters.newOnly ? (
                  <input type="hidden" name="moi" value="true" />
                ) : null}
                <label htmlFor="sort" className="text-muted-foreground">
                  Sắp xếp
                </label>
                <select
                  id="sort"
                  name="sap-xep"
                  defaultValue={filters.sort}
                  className="h-10 rounded-full border border-border bg-card px-3 outline-none"
                >
                  <option value="noi-bat">Nổi bật</option>
                  <option value="danh-gia">Đánh giá cao</option>
                  <option value="gia-tang">Giá tăng dần</option>
                  <option value="gia-giam">Giá giảm dần</option>
                </select>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  Áp dụng
                </Button>
              </form>
            </div>

            {products.length ? (
              <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:gap-x-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-[2rem] border border-dashed border-border bg-card px-6 py-20 text-center">
                <PackageSearch className="mx-auto size-10 text-muted-foreground" />
                <h2 className="mt-5 font-heading text-3xl font-semibold">
                  Chưa tìm thấy thiết kế phù hợp
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Hãy thử bỏ bớt một bộ lọc hoặc tìm bằng từ khóa rộng hơn như
                  “linen”, “áo” hay “quần”.
                </p>
                <Button
                  nativeButton={false}
                  className="mt-6 rounded-full"
                  render={<Link href="/san-pham" />}
                >
                  Xem tất cả sản phẩm
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
