import type { Metadata } from 'next';

import { SiteFooter } from '@/components/storefront/site-footer';
import { SiteHeader } from '@/components/storefront/site-header';

export const metadata: Metadata = { title: 'Hướng dẫn chọn size' };

export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Fit confidence
        </p>
        <h1 className="mt-2 font-heading text-5xl font-semibold">
          Chọn đúng size trong 3 bước
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Dùng thước dây đo sát cơ thể nhưng không siết. Nếu số đo nằm giữa hai
          size, ưu tiên số đo lớn nhất và đọc fit note trên từng sản phẩm.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ['1', 'Đo cơ thể', 'Ngực, eo, mông và chiều cao.'],
            ['2', 'So bảng size', 'Đối chiếu với loại sản phẩm.'],
            ['3', 'Đọc fit note', 'Phom ôm, vừa hay rộng.'],
          ].map(([number, title, copy]) => (
            <div key={number} className="rounded-2xl bg-secondary/70 p-5">
              <span className="font-heading text-4xl text-accent">
                {number}
              </span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card p-5">
          <table className="w-full min-w-[620px] text-center text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="rounded-l-xl px-4 py-3 text-left">Size nữ</th>
                <th className="px-4 py-3">Ngực</th>
                <th className="px-4 py-3">Eo</th>
                <th className="px-4 py-3">Mông</th>
                <th className="rounded-r-xl px-4 py-3">Chiều cao</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['S', '80–84', '62–66', '88–92', '150–160'],
                ['M', '85–89', '67–71', '93–97', '155–165'],
                ['L', '90–95', '72–77', '98–103', '160–170'],
              ].map((row) => (
                <tr
                  key={row[0]}
                  className="border-b border-border last:border-0"
                >
                  {row.map((cell, index) => (
                    <td
                      key={cell}
                      className={`px-4 py-4 ${index === 0 ? 'text-left font-semibold' : ''}`}
                    >
                      {cell}
                      {index === 0 ? '' : ' cm'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
