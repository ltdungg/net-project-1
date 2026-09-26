import { PageHeader } from '@/components/admin/page-header';
import { commerceServerRequest } from '@/lib/commerce-api-server';
import { requireManagementRole } from '@/lib/admin-auth';
import { ProductForm } from './product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireManagementRole();
  const options = await commerceServerRequest<{
    categories: { id: string; name: string }[];
    warehouses: { id: string; code: string; name: string }[];
  }>('/admin/products/options');
  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Tạo sản phẩm"
        description="Tạo sản phẩm, biến thể đầu tiên, giá và tồn mở kho trong một lần lưu nguyên tử."
      />
      <ProductForm
        categories={options.categories}
        warehouses={options.warehouses}
      />
    </>
  );
}
