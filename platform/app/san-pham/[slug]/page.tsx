import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  Check,
  ChevronRight,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/storefront/favorite-button';
import { ProductCard } from '@/components/storefront/product-card';
import { ProductImage } from '@/components/storefront/product-image';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { formatVnd } from '@/lib/catalog-data';
import {
  getCatalogProductFromDb,
  listCatalogProductsFromDb,
} from '@/lib/catalog-repository';
import { ProductActions } from './product-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductFromDb(slug);
  if (!product)
    return {
      title: 'Không tìm thấy sản phẩm',
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  return {
    title: product.name,
    description: product.subtitle,
    openGraph: {
      title: product.name,
      description: product.subtitle,
      images: [],
    },
    twitter: { title: product.name, description: product.subtitle, images: [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await listCatalogProductsFromDb();
  const product = products.find((item) => item.slug === slug) ?? null;
  if (!product) notFound();
  const variant = product.variants[0];

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            Trang chủ
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/san-pham" className="hover:text-foreground">
            Sản phẩm
          </Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-7 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-12 lg:pb-16 lg:pt-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <ProductImage
              position={product.atlasPosition}
              alt={product.imageAlt}
              src={product.atlasImage}
              backgroundSize={product.atlasSize}
              className="aspect-[4/5] rounded-[1.6rem]"
            />
            <span className="absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold backdrop-blur">
              Ảnh tổng thể · 01 / 03
            </span>
          </div>
          <div className="flex aspect-[4/5] flex-col justify-between rounded-[1.4rem] bg-gradient-to-br from-secondary to-[#d8c5ae] p-7 sm:p-8">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/55">
              <Award className="size-5 text-accent" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/55">
                Chất liệu chính
              </p>
              <p className="mt-3 font-heading text-4xl font-semibold leading-tight text-primary">
                {product.material}
              </p>
              <p className="mt-4 max-w-xs text-sm leading-6 text-primary/70">
                Được thử độ co, bền màu và cảm giác trên da trong điều kiện khí
                hậu Việt Nam.
              </p>
            </div>
          </div>
          <div className="flex aspect-[4/5] flex-col justify-between rounded-[1.4rem] bg-primary p-7 text-primary-foreground sm:p-8">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <Ruler className="size-5 text-accent" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/50">
                Fit note
              </p>
              <p className="mt-3 font-heading text-4xl font-semibold leading-tight">
                Phom vừa. Nếu thích rộng, chọn tăng một size.
              </p>
              <Link
                href="/huong-dan-chon-size"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
              >
                Xem bảng số đo <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
        <section className="lg:sticky lg:top-28 lg:h-fit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.featured ? (
                <Badge className="bg-accent text-accent-foreground">
                  Được yêu thích
                </Badge>
              ) : null}
            </div>
            <FavoriteButton productId={product.id} label={product.name} />
          </div>
          <h1 className="mt-5 font-heading text-5xl font-semibold tracking-[-0.045em]">
            {product.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{product.subtitle}</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-xl font-semibold">
              {formatVnd(variant.priceCents)}
            </span>
            {variant.compareAtPriceCents ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatVnd(variant.compareAtPriceCents)}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Star className="size-4 fill-accent text-accent" />
            <strong>{product.rating}</strong>
            <a
              href="#danh-gia"
              className="text-muted-foreground underline underline-offset-4"
            >
              ({product.reviewCount} đánh giá)
            </a>
            <span className="text-border">|</span>
            <span className="font-mono text-xs text-muted-foreground">
              SKU {variant.sku}
            </span>
          </div>
          <p className="mt-7 border-y border-border py-6 leading-7 text-foreground/78">
            {product.description}
          </p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-semibold">Màu: {variant.color}</p>
              <span
                className="block size-8 rounded-full border-4 border-background shadow-[0_0_0_1px_var(--border)]"
                style={{ backgroundColor: variant.colorHex }}
              />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="size-3.5" /> Còn hàng, sẵn sàng giao
            </span>
          </div>
          <div className="mt-7">
            <ProductActions variants={product.variants} />
          </div>
          <div className="mt-7 grid gap-3 rounded-2xl bg-secondary/70 p-5 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              [Truck, 'Giao 2–5 ngày'],
              [RotateCcw, 'Đổi size 30 ngày'],
              [ShieldCheck, 'Thanh toán bảo mật'],
            ].map(([Icon, label]) => (
              <div key={String(label)} className="flex items-center gap-2">
                <Icon className="size-4 text-accent" />
                <span>{String(label)}</span>
              </div>
            ))}
          </div>
          <Accordion className="mt-6">
            <AccordionItem value="material">
              <AccordionTrigger>Chất liệu & chăm sóc</AccordionTrigger>
              <AccordionContent>
                {product.material}. Giặt nhẹ với sản phẩm cùng màu, không dùng
                chất tẩy mạnh và phơi nơi thoáng mát.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Giao hàng & đổi trả</AccordionTrigger>
              <AccordionContent>
                Miễn phí giao hàng từ 799.000đ. Đổi size trong 30 ngày nếu sản
                phẩm còn nguyên tem và chưa qua sử dụng.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fit">
              <AccordionTrigger>Thông tin phom & số đo mẫu</AccordionTrigger>
              <AccordionContent>
                Sản phẩm có phom vừa. Người mẫu cao 1m72, số đo 82–62–90 và đang
                mặc size M. Sai số thành phẩm cho phép ±1 cm.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
      <section
        id="danh-gia"
        className="border-y border-border bg-[#f1e9dd] scroll-mt-28"
      >
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Đánh giá đã xác minh
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold">
              Khách hàng mặc thật
            </h2>
            <div className="mt-7 flex items-end gap-3">
              <strong className="font-heading text-6xl">
                {product.rating}
              </strong>
              <div className="pb-2">
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Từ {product.reviewCount} lượt đánh giá
                </p>
              </div>
            </div>
            <div className="mt-7 space-y-2">
              {[
                ['Đúng size', 91],
                ['Đúng màu', 96],
                ['Hài lòng chất liệu', 94],
              ].map(([label, value]) => (
                <div key={String(label)} className="text-xs">
                  <div className="mb-1.5 flex justify-between">
                    <span>{label}</span>
                    <strong>{value}%</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: 'Nguyễn Minh Anh',
                meta: '1m60 · 52kg · Size M',
                copy: 'Mặc lên vừa vai và phần eo thoải mái. Màu thực tế trầm đẹp, chất vải mềm hơn sau lần giặt đầu.',
              },
              {
                name: 'Lê Hải Yến',
                meta: '1m67 · 57kg · Size M',
                copy: 'Phom đúng như tư vấn, đủ chỉn chu để đi làm nhưng không bị cứng. Mình đánh giá cao phần mô tả chất liệu.',
              },
            ].map((review) => (
              <article key={review.name} className="rounded-2xl bg-card p-6">
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7">“{review.copy}”</p>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm font-semibold">{review.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đã mua hàng · {review.meta}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:px-12">
        <h2 className="font-heading text-4xl font-semibold">
          Có thể bạn cũng thích
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-4">
          {products
            .filter((item) => item.id !== product.id)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
