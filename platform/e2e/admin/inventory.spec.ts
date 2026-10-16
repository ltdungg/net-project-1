import { expect, test } from '@playwright/test';
import { ensureAdmin } from '../support/admin';
import { withDatabase } from '../support/database';
import { registerAndVerify, uniqueEmail } from '../support/journeys';

const inventoryId = 'inv-hcm-QCV-l';

test('admin inventory page rejects guests and ordinary customers', async ({ page }) => {
  await page.goto('/admin/ton-kho');
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);

  await registerAndVerify(page, uniqueEmail('not-admin'));
  await page.goto('/admin/ton-kho');
  await expect(page).toHaveURL(/\/tai-khoan$/);
  await expect(page.getByRole('heading', { name: 'Xin chào, Khách E2E' })).toBeVisible();
});

test('admin rejects invalid adjustment and posts a reversible warehouse change', async ({ page }) => {
  await ensureAdmin(page);

  const starting = await withDatabase(async (db) => {
    const row = await db.query<{ on_hand: number }>(
      'select on_hand from inventory_items where id=$1', [inventoryId],
    );
    return row.rows[0]?.on_hand;
  });
  expect(starting).toBeDefined();
  const initialAvailable = await withDatabase(async (db) => {
    const result = await db.query<{ available: string }>(
      "select sum(on_hand-reserved)::text as available from inventory_items where variant_id='QCV-l'",
    );
    return Number(result.rows[0]?.available);
  });
  const storefront = await page.context().newPage();
  await storefront.goto('/san-pham/quan-chinos-vung');
  await expect(storefront.getByText(`Còn ${initialAvailable} sản phẩm ở size này`)).toBeVisible();
  await page.goto('/admin/ton-kho');
  await expect(page.getByRole('heading', { name: 'Tồn kho đa kho' })).toBeVisible();
  await page.waitForFunction(() => {
    const input = document.querySelector('input[aria-label="Tìm trong tồn kho"]');
    return input && Object.keys(input).some((key) => key.startsWith('__reactProps$'));
  });
  await page.getByRole('textbox', { name: 'Tìm trong tồn kho' }).fill('NET-QCV-L');
  await page.getByRole('combobox', { name: 'Lọc theo kho' }).selectOption('wh-hcm');
  await expect(page.getByRole('row').filter({ hasText: 'NET-QCV-L' })).toHaveCount(1);
  const row = page.getByRole('row').filter({ hasText: 'NET-QCV-L' });
  await expect(row).toContainText('HCM-01');

  async function adjust(quantity: number) {
    const control = row.getByRole('button', { name: 'Điều chỉnh' });
    await control.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await control.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Điều chỉnh tồn kho' })).toBeVisible();
    await dialog.getByLabel('Chênh lệch (+/-)').fill(String(quantity));
    await dialog.getByLabel('Lý do nghiệp vụ').fill('E2E warehouse audit');
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith('/api/commerce/admin/inventory/adjust') && response.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Xác nhận và post phiếu' }).click();
    return { dialog, response: await responsePromise };
  }

  const invalid = await adjust(-9999);
  expect(invalid.response.ok()).toBe(false);
  await expect(page.getByText('Nghiệp vụ chưa được ghi nhận')).toBeVisible();
  await withDatabase(async (db) => {
    const result = await db.query<{ on_hand: number }>('select on_hand from inventory_items where id=$1', [inventoryId]);
    expect(result.rows[0]?.on_hand).toBe(starting);
  });
  await invalid.dialog.getByRole('button', { name: 'Hủy' }).click();

  const increase = await adjust(1);
  expect(increase.response.ok()).toBe(true);
  await expect(page.getByText('Đã ghi nhận nghiệp vụ')).toBeVisible();
  await withDatabase(async (db) => {
    const result = await db.query<{ on_hand: number }>('select on_hand from inventory_items where id=$1', [inventoryId]);
    expect(result.rows[0]?.on_hand).toBe(starting! + 1);
  });
  await expect(row).toContainText(String(starting! + 1));
  await storefront.reload();
  await expect(storefront.getByText(`Còn ${initialAvailable + 1} sản phẩm ở size này`)).toBeVisible();

  const decrease = await adjust(-1);
  expect(decrease.response.ok()).toBe(true);
  await expect(page.getByText('Đã ghi nhận nghiệp vụ')).toBeVisible();
  await withDatabase(async (db) => {
    const result = await db.query<{ on_hand: number }>('select on_hand from inventory_items where id=$1', [inventoryId]);
    expect(result.rows[0]?.on_hand).toBe(starting);
  });
  await storefront.reload();
  await expect(storefront.getByText(`Còn ${initialAvailable} sản phẩm ở size này`)).toBeVisible();
});
