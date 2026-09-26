import Link from 'next/link';
import { Download, MoreHorizontal, Plus, Search } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVnd } from '@/lib/catalog-data';
import { listCatalogProductsFromDb } from '@/lib/catalog-repository';
import { commerceServerRequest } from '@/lib/commerce-api-server';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [catalogProducts, actor] = await Promise.all([
    listCatalogProductsFromDb({ includeDrafts: true }),
    commerceServerRequest<{ roles: string[] }>('/auth/me'),
  ]);
  const canManage = actor.roles.some(
    (role) => role === 'manager' || role === 'admin',
  );
  return (
    <>
      <PageHeader
        title="Sản phẩm"
        description="Quản lý nội dung, biến thể, giá bán, trạng thái xuất bản và SEO."
        action={canManage ? (
          <Button
            nativeButton={false}
            className="rounded-full"
            render={<Link href="/admin/san-pham/moi" />}
          >
            <Plus /> Thêm sản phẩm
          </Button>
        ) : null}
      />
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm tên, SKU hoặc slug…" className="pl-9" />
          </div>
          <Button variant="outline">
            <Download /> Xuất CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-secondary/70 text-xs text-muted-foreground">
              <tr>
                <th className="rounded-l-xl px-4 py-3 font-medium">Sản phẩm</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium">Biến thể</th>
                <th className="px-4 py-3 font-medium">Giá</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="rounded-r-xl px-4 py-3">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {catalogProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{product.slug}
                    </p>
                  </td>
                  <td className="px-4 py-4">{product.category}</td>
                  <td className="px-4 py-4">{product.variants.length} SKU</td>
                  <td className="px-4 py-4 font-semibold">
                    {formatVnd(product.variants[0]?.priceCents ?? 0)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status="active" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Thao tác với ${product.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
