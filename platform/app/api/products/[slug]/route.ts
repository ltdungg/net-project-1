import { fail, ok } from '@/lib/api-response';
import { getCatalogProductFromDb } from '@/lib/catalog-repository';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const product = await getCatalogProductFromDb(slug);
  if (!product)
    return fail('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.', 404);
  return ok(product);
}
