import {
  catalogProducts,
  type CatalogProduct,
  getCatalogProduct,
} from '@/lib/catalog-data';
import { commerceServerRequest } from '@/lib/commerce-api-server';

export async function listCatalogProductsFromDb(options?: {
  includeDrafts?: boolean;
}) {
  try {
    const endpoint = options?.includeDrafts ? '/admin/products' : '/products';
    const result = await commerceServerRequest<{
      items: CatalogProduct[];
      total: number;
    }>(endpoint);
    return result.items.map(normalizeProduct);
  } catch {
    return catalogProducts;
  }
}

export async function getCatalogProductFromDb(slug: string) {
  try {
    const product = await commerceServerRequest<CatalogProduct>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return normalizeProduct(product);
  } catch {
    return getCatalogProduct(slug) ?? null;
  }
}

function normalizeProduct(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    atlasImage: product.atlasImage?.startsWith('/api/assets/')
      ? product.atlasImage.replace('/api/assets/', '/api/commerce/assets/')
      : product.atlasImage,
  };
}
