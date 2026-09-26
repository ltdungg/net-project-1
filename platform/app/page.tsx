import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Leaf,
  Quote,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';

import { ProductCard } from '@/components/storefront/product-card';
import { ProductImage } from '@/components/storefront/product-image';
import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listCatalogProductsFromDb } from '@/lib/catalog-repository';

export const dynamic = 'force-dynamic';

const categoryCards = [
  {
    title: 'Nữ',
    copy: 'Những đường cắt mềm, tôn dáng tự nhiên và dễ mặc mỗi ngày.',
    href: '/san-pham?danh-muc=nu',
    position: '50% 0%',
    alt: 'Bộ sưu tập thời trang nữ NÉT',
    count: '10 thiết kế',
  },
  {
    title: 'Nam',
    copy: 'Tối giản có cấu trúc, cân bằng giữa lịch thiệp và thoải mái.',
    href: '/san-pham?danh-muc=nam',
    position: '0% 100%',
    alt: 'Bộ sưu tập thời trang nam NÉT',
    count: '07 thiết kế',
  },
  {
    title: 'Phụ kiện',
    copy: 'Điểm nhấn vừa đủ, đồng hành bền bỉ qua nhiều mùa.',
    href: '/san-pham?danh-muc=phu-kien',
    position: '100% 100%',
    alt: 'Phụ kiện da NÉT',
    count: '05 thiết kế',
  },
];

const testimonials = [
  {
    quote:
      'Đầm lên phom rất gọn nhưng không gò bó. Hướng dẫn size rõ nên mình chọn đúng ngay lần đầu.',
    name: 'Minh Anh',
    detail: 'Đã mua Đầm midi An · Size M',
  },
  {
    quote:
      'Chất linen mềm và ít nhăn hơn mình nghĩ. Đóng gói đẹp, giao đúng ngày đã hẹn.',
    name: 'Hoàng Nam',
    detail: 'Đã mua Sơ mi resort Trầm · Size L',
  },
  {
    quote:
      'Chính sách đổi size dễ hiểu, nhân viên hỗ trợ rất nhanh. Đây là kiểu dịch vụ mình muốn quay lại.',
    name: 'Hải Yến',
    detail: 'Khách hàng thân thiết từ 2025',
  },
];

export default async function Home() {
  const catalogProducts = await listCatalogProductsFromDb();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-8 sm:py-7 lg:px-12">
        <div className="relative min-h-[650px] overflow-hidden rounded-[2rem] bg-[#e9dfd1] lg:min-h-[720px]">
          <Image
            src="/hero-fashion.png"
            alt="Hai người mẫu Việt Nam mặc trang phục tối giản trong không gian nắng ấm"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1440px"
            className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eee5d8]/98 via-[#eee5d8]/78 to-transparent lg:via-[#eee5d8]/20" />
          <div className="relative z-10 flex min-h-[650px] max-w-2xl flex-col justify-center px-7 py-16 sm:px-14 lg:min-h-[720px] lg:px-20">
            <Badge
              className="mb-6 w-fit bg-accent/12 text-accent ring-1 ring-accent/25"
              variant="secondary"
            >
              <Sparkles /> Bộ sưu tập Thu 2026
            </Badge>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              Quietly distinct
            </p>
            <h1 className="max-w-xl font-heading text-5xl font-medium leading-[0.98] tracking-[-0.055em] text-primary sm:text-6xl lg:text-[5.35rem]">
              Mặc đúng chất,
              <br />
              sống đúng nhịp.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-primary/72 sm:text-lg">
              Thiết kế tinh giản cho người Việt hiện đại — phom đẹp, chất liệu
              dễ chịu và minh bạch từ giá đến chính sách đổi trả.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                size="lg"
                className="h-12 rounded-full px-6"
                render={<Link href="/san-pham?moi=true" />}
              >
                Khám phá bộ sưu tập <ArrowRight />
              </Button>
              <Button
                nativeButton={false}
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-primary/25 bg-white/35 px-6"
                render={<Link href="/huong-dan-chon-size" />}
              >
                Tìm size của bạn
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-primary/65">
              <div className="flex -space-x-2" aria-hidden="true">
                {['MA', 'HN', 'HY'].map((name) => (
                  <span
                    key={name}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-[#eee5d8] bg-primary text-[9px] font-bold text-primary-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <span>
                <strong className="text-primary">4,8/5</strong> từ hơn 1.200
                khách hàng
              </span>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 hidden max-w-xs rounded-2xl border border-white/50 bg-white/78 p-4 shadow-sm backdrop-blur-md lg:block">
            <div className="flex items-center justify-between gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Được yêu thích
                </p>
                <p className="mt-1 font-heading text-lg font-medium">
                  Sơ mi resort Trầm
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  690.000đ · Còn đủ size
                </p>
              </div>
              <Button
                nativeButton={false}
                size="icon"
                variant="secondary"
                className="rounded-full"
                render={<Link href="/san-pham/so-mi-resort-tram" />}
                aria-label="Xem Sơ mi resort Trầm"
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
          {[
            [Truck, 'Giao nhanh toàn quốc', 'Dự kiến 2–5 ngày làm việc'],
            [RotateCcw, 'Đổi size 30 ngày', 'Thao tác online trong 2 phút'],
            [
              ShieldCheck,
              'Thanh toán an toàn',
              'Bảo vệ dữ liệu theo tiêu chuẩn',
            ],
            [Ruler, 'Tư vấn đúng size', 'Theo số đo và phom sản phẩm'],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">{String(title)}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {String(copy)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Chọn theo bạn
            </p>
            <h2 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Tủ đồ bắt đầu từ đâu?
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Mỗi danh mục được xây quanh nhu cầu sử dụng thật: đủ chỉn chu để đi
            làm và đủ thoải mái cho những ngày chậm hơn.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {categoryCards.map((category, index) => (
            <Link
              key={category.title}
              href={category.href}
              className="group relative overflow-hidden rounded-[1.7rem]"
            >
              <ProductImage
                position={category.position}
                alt={category.alt}
                className="aspect-[4/5] transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/5 to-transparent" />
              <span className="absolute left-5 top-5 text-xs font-semibold text-white/70">
                0{index + 1} · {category.count}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                <h3 className="font-heading text-4xl font-semibold">
                  {category.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
                  {category.copy}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  Khám phá{' '}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#f1e9dd]">
        <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                22 thiết kế · 16 mặt hàng mới
              </p>
              <h2 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Bộ sưu tập vừa cập bến
              </h2>
            </div>
            <Button
              nativeButton={false}
              variant="outline"
              className="rounded-full bg-transparent"
              render={<Link href="/san-pham" />}
            >
              Xem tất cả <ArrowRight />
            </Button>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 lg:gap-x-7">
            {catalogProducts.slice(6, 14).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch lg:px-12">
        <div className="grid min-h-[560px] grid-cols-2 gap-4">
          <ProductImage
            position="0% 0%"
            alt="Chi tiết trang phục linen NÉT"
            className="rounded-[1.6rem]"
          />
          <div className="grid gap-4">
            <ProductImage
              position="100% 0%"
              alt="Chi tiết phom quần NÉT"
              className="rounded-[1.6rem]"
            />
            <div className="flex flex-col justify-between rounded-[1.6rem] bg-accent p-6 text-accent-foreground">
              <Leaf className="size-7" />
              <p className="font-heading text-3xl font-semibold leading-tight">
                Ít hơn,
                <br />
                nhưng tốt hơn.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-[2rem] bg-primary px-7 py-12 text-primary-foreground sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Made with intention
          </p>
          <h2 className="mt-5 font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.04em]">
            Chất liệu được chọn cho khí hậu và nhịp sống Việt Nam.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-primary-foreground/68">
            Linen xử lý mềm, Tencel có nguồn gốc rõ ràng và cotton định lượng
            bền. Mỗi chất liệu đều được thử độ co, bền màu và cảm giác sau nhiều
            lần giặt trước khi đưa vào bộ sưu tập.
          </p>
          <div className="mt-9 grid grid-cols-3 gap-4 border-y border-white/10 py-6">
            {[
              ['32', 'lần thử phom'],
              ['18', 'chỉ số QC'],
              ['4,8/5', 'độ hài lòng'],
            ].map(([value, label]) => (
              <div key={label}>
                <strong className="font-heading text-3xl">{value}</strong>
                <span className="mt-1 block text-xs text-primary-foreground/50">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/cau-chuyen"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold"
          >
            Đọc câu chuyện NÉT <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              NÉT trong đời thật
            </p>
            <h2 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Khách hàng nói gì?
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-4 fill-current" />
              ))}
            </div>
            <strong>4,8/5</strong>
            <span className="text-muted-foreground">· 1.248 đánh giá</span>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="flex min-h-64 flex-col rounded-[1.5rem] border border-border bg-card p-6"
            >
              <Quote className="size-7 text-accent" />
              <blockquote className="mt-5 flex-1 font-heading text-xl font-medium leading-8">
                “{testimonial.quote}”
              </blockquote>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {testimonial.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-8 lg:px-12">
        <div className="overflow-hidden rounded-[2rem] bg-[#d8c5ae] px-7 py-12 text-primary sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              NÉT letter · 2 email/tháng
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight">
              Câu chuyện chất liệu và ưu đãi vừa đủ.
            </h2>
            <p className="mt-3 text-sm text-primary/65">
              Nhận mã giảm 10% cho đơn đầu tiên. Không gửi email dồn dập.
            </p>
          </div>
          <form className="mt-7 flex max-w-md flex-1 gap-2 lg:mt-0">
            <label htmlFor="newsletter-email" className="sr-only">
              Email nhận bản tin
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Email của bạn"
              className="h-12 min-w-0 flex-1 rounded-full border border-primary/15 bg-white/70 px-5 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <Button className="h-12 rounded-full px-6">Đăng ký</Button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
