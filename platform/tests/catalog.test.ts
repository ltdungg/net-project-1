import { describe, expect, it } from 'vitest';

import { catalogProducts, formatVnd, getCatalogProduct } from '../lib/catalog-data';

describe('catalog invariants', () => {
  it('uses unique slugs and SKUs', () => {
    const slugs = catalogProducts.map((product) => product.slug);
    const skus = catalogProducts.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    );
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('has positive prices and non-negative availability', () => {
    for (const product of catalogProducts) {
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.priceCents).toBeGreaterThan(0);
        expect(variant.available).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('exposes the expanded 22-product catalog with generated imagery', () => {
    expect(catalogProducts).toHaveLength(22);
    const expanded = catalogProducts.filter(
      (product) => product.atlasImage === '/catalog-atlas-v2.png',
    );
    expect(expanded).toHaveLength(16);
    expect(expanded.every((product) => product.atlasSize === '400% 400%')).toBe(
      true,
    );
  });

  it('finds products by slug and formats Vietnamese currency', () => {
    expect(getCatalogProduct(catalogProducts[0]!.slug)).toEqual(catalogProducts[0]);
    expect(getCatalogProduct('missing-product')).toBeNull();
    expect(formatVnd(799_000)).toContain('799');
    expect(formatVnd(799_000)).toContain('₫');
  });
});
