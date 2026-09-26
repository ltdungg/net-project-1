import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';

export const metadata: Metadata = { title: 'Câu chuyện' };

const principles = [
  [
    '01',
    'Phom trước xu hướng',
    'Mỗi thiết kế phải đứng dáng, dễ vận động và phối được nhiều cách.',
  ],
  [
    '02',
    'Minh bạch mặc định',
    'Giá, chất liệu, size, tồn kho và đổi trả được trình bày trước khi mua.',
  ],
  [
    '03',
    'Đo để cải thiện',
    'Dữ liệu đổi size và phản hồi khách hàng quay lại trực tiếp với đội thiết kế.',
  ],
];

export default function StoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8">
        <div className="grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground lg:grid-cols-2">
          <div className="p-9 sm:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Về NÉT
            </p>
            <h1 className="mt-5 font-heading text-5xl font-semibold leading-tight sm:text-6xl">
              Ít hơn, nhưng đúng hơn.
            </h1>
            <p className="mt-7 max-w-lg leading-7 text-primary-foreground/70">
              NÉT bắt đầu từ một câu hỏi đơn giản: vì sao một món đồ đẹp trên
              ảnh lại khó vừa khi mặc thật? Chúng tôi tập trung vào phom dáng
              người Việt, chất liệu phù hợp khí hậu và thông tin đủ rõ để bạn
              chọn đúng ngay từ lần đầu.
            </p>
          </div>
          <figure className="min-h-96 bg-[url(/hero-fashion.png)] bg-cover bg-[68%_center]">
            <figcaption className="sr-only">
              Người mẫu mặc thiết kế tối giản của NÉT
            </figcaption>
          </figure>
        </div>
        <div className="grid gap-8 py-16 md:grid-cols-3">
          {principles.map(([number, title, copy]) => (
            <article key={number} className="border-t border-border pt-5">
              <span className="font-mono text-xs text-accent">{number}</span>
              <h2 className="mt-5 font-heading text-3xl font-semibold">
                {title}
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
