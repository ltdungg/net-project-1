import { NextRequest } from 'next/server';

import { listCatalogProductsFromDb } from '@/lib/catalog-repository';
import { ok } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const catalogProducts = await listCatalogProductsFromDb();
  const search = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const category = request.nextUrl.searchParams
    .get('category')
    ?.trim()
    .toLowerCase();
  const featured = request.nextUrl.searchParams.get('featured') === 'true';

  const items = catalogProducts.filter((product) => {
    if (featured && !product.featured) return false;
    if (category && product.category.toLowerCase() !== category) return false;
    if (
      search &&
      !`${product.name} ${product.subtitle} ${product.material}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    return true;
  });

  return ok({ items, total: items.length });
}
