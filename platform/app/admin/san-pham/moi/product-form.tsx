'use client';

import { type SyntheticEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { commerceRaw } from '@/lib/commerce-api-client';

function formString(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

export function ProductForm({
  categories,
  warehouses,
}: {
  categories: { id: string; name: string }[];
  warehouses: { id: string; code: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    const response = await commerceRaw('/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        slug: data.get('slug'),
        subtitle: data.get('subtitle'),
        description: data.get('description'),
        material: data.get('material'),
        status: data.get('status'),
        featured,
        categoryId: data.get('categoryId'),
        initialVariant: {
          sku: data.get('sku'),
          size: data.get('size'),
          color: data.get('color'),
          colorHex: data.get('colorHex'),
          priceCents: Number(data.get('priceCents')),
          compareAtPriceCents: data.get('compareAtPriceCents')
            ? Number(data.get('compareAtPriceCents'))
            : undefined,
          warehouseId: data.get('warehouseId'),
          openingStock: Number(data.get('openingStock')),
          safetyStock: Number(data.get('safetyStock')),
          reorderPoint: Number(data.get('reorderPoint')),
        },
      }),
    });
    const payload = (await response.json()) as {
      data?: { id?: string };
      error?: { message?: string };
    };
    if (!response.ok) {
      setMessage(payload.error?.message ?? 'Chưa thể tạo sản phẩm.');
      setLoading(false);
      return;
    }
    const image = data.get('image');
    if (image instanceof File && image.size && payload.data?.id) {
      const uploadBody = new FormData();
      uploadBody.set('file', image);
      const uploadResponse = await commerceRaw('/admin/uploads', {
        method: 'POST',
        body: uploadBody,
      });
      const uploadPayload = (await uploadResponse.json()) as {
        data?: { key?: string; url?: string };
        error?: { message?: string };
      };
      if (
        !uploadResponse.ok ||
        !uploadPayload.data?.key ||
        !uploadPayload.data.url
      ) {
        setMessage(
          uploadPayload.error?.message ??
            'Sản phẩm đã tạo nhưng ảnh chưa tải lên được.',
        );
        setLoading(false);
        return;
      }
      const mediaResponse = await commerceRaw(
        `/admin/products/${payload.data.id}/media`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            storageKey: uploadPayload.data.key,
            publicUrl: uploadPayload.data.url,
            altText:
              formString(data, 'imageAlt') ||
              formString(data, 'name') ||
              'Ảnh sản phẩm',
          }),
        },
      );
      if (!mediaResponse.ok) {
        setMessage('Sản phẩm đã tạo nhưng chưa liên kết được ảnh đại diện.');
        setLoading(false);
        return;
      }
    }
    router.push('/admin/san-pham');
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <section className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="grid gap-5">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input id="name" name="name" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Mô tả ngắn</Label>
            <Input id="subtitle" name="subtitle" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={20}
              rows={8}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="material">Chất liệu</Label>
            <Input id="material" name="material" className="mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="image">Ảnh đại diện</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="mt-2 h-10"
              />
            </div>
            <div>
              <Label htmlFor="imageAlt">Mô tả ảnh</Label>
              <Input
                id="imageAlt"
                name="imageAlt"
                placeholder="Sản phẩm trên nền trung tính"
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="categoryId">Danh mục chính</Label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t border-border pt-5">
            <h2 className="font-heading text-2xl font-semibold">
              Biến thể đầu tiên
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SKU, giá và số dư mở kho sẽ được tạo cùng sản phẩm.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  required
                  placeholder="NET-ABC-M"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="size">Kích cỡ</Label>
                <Input
                  id="size"
                  name="size"
                  required
                  defaultValue="M"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="color">Màu sắc</Label>
                <Input
                  id="color"
                  name="color"
                  required
                  placeholder="Xanh rừng"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="colorHex">Mã màu</Label>
                <Input
                  id="colorHex"
                  name="colorHex"
                  required
                  type="color"
                  defaultValue="#26352f"
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label htmlFor="priceCents">Giá bán (VND)</Label>
                <Input
                  id="priceCents"
                  name="priceCents"
                  required
                  type="number"
                  min="1000"
                  step="1000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="compareAtPriceCents">Giá so sánh (VND)</Label>
                <Input
                  id="compareAtPriceCents"
                  name="compareAtPriceCents"
                  type="number"
                  min="1000"
                  step="1000"
                  className="mt-2"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="warehouseId">Kho mở tồn</Label>
                <select
                  id="warehouseId"
                  name="warehouseId"
                  required
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} · {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="openingStock">Tồn đầu</Label>
                <Input
                  id="openingStock"
                  name="openingStock"
                  required
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="safetyStock">Safety stock</Label>
                <Input
                  id="safetyStock"
                  name="safetyStock"
                  required
                  type="number"
                  min="0"
                  defaultValue="2"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="reorderPoint">Điểm đặt hàng</Label>
                <Input
                  id="reorderPoint"
                  name="reorderPoint"
                  required
                  type="number"
                  min="0"
                  defaultValue="5"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <aside className="h-fit rounded-2xl bg-card p-6 shadow-sm">
        <Label htmlFor="status">Trạng thái</Label>
        <select
          id="status"
          name="status"
          className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="draft">Bản nháp</option>
          <option value="active">Đang bán</option>
          <option value="archived">Lưu trữ</option>
        </select>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <Label>Nổi bật</Label>
            <p className="text-xs text-muted-foreground">
              Hiển thị tại trang chủ
            </p>
          </div>
          <Switch checked={featured} onCheckedChange={setFeatured} />
        </div>
        <Button type="submit" disabled={loading} className="mt-7 w-full">
          {loading ? <LoaderCircle className="animate-spin" /> : <Save />} Lưu
          sản phẩm
        </Button>
        {message ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {message}
          </p>
        ) : null}
      </aside>
    </form>
  );
}
