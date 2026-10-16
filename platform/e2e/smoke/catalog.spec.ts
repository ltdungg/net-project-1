import { expect, test } from '@playwright/test';
import { product } from '../support/journeys';

test('storefront catalog search opens an available product and handles no matches', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toContainText(product.name);

  await page.goto('/san-pham');
  await page.getByRole('textbox', { name: 'Tìm trong danh mục' }).fill('linen');
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.getByRole('link', { name: `Xem ${product.name}` })).toBeVisible();
  await page.getByRole('link', { name: `Xem ${product.name}` }).click();
  await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await expect(page.getByText(/Còn \d+ sản phẩm ở size này/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm vào giỏ' })).toBeEnabled();

  await page.goto('/san-pham');
  await page.getByRole('textbox', { name: 'Tìm trong danh mục' }).fill('e2e-no-match-7d4c');
  await page.getByRole('button', { name: 'Tìm', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy thiết kế phù hợp' })).toBeVisible();
});
