import { expect, type Page } from '@playwright/test';
import { withDatabase } from './database';

export const product = {
  name: 'Áo linen cổ V Mộc',
  slug: 'ao-linen-co-v-moc',
  sku: 'NET-ALM-S',
};

export function uniqueEmail(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

export async function gotoHydrated(page: Page, path: string) {
  const authCheck = page.waitForResponse((response) =>
    response.url().includes('/api/commerce/auth/me') && response.request().method() === 'GET',
  );
  await page.goto(path);
  await authCheck;
}

export async function registerAndVerify(page: Page, email: string) {
  await gotoHydrated(page, '/dang-ky');
  await page.getByLabel('Họ và tên').fill('Khách E2E');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
  await page.getByLabel('Nhập lại mật khẩu').fill('E2ePassword123');
  await page.getByRole('checkbox', { name: /Tôi đồng ý/ }).check();
  await page.getByRole('button', { name: /Tạo tài khoản/ }).click();
  await expect(page.getByRole('heading', { name: 'Kiểm tra email của bạn' })).toBeVisible();
  await page.getByRole('button', { name: 'Xác minh email' }).click();
  await page.getByRole('button', { name: 'Xác minh và đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: 'Email đã được xác minh' })).toBeVisible();
}

export async function openProduct(page: Page) {
  await page.goto('/san-pham');
  const cartReady = page.waitForResponse((response) =>
    response.url().endsWith('/api/commerce/cart') && response.request().method() === 'GET',
  );
  await page.getByRole('link', { name: `Xem ${product.name}` }).click();
  await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await cartReady;
  // Vinext can display server HTML before the client action handler is attached.
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find((element) =>
      element.textContent?.includes('Thêm vào giỏ'),
    );
    return button && Object.keys(button).some((key) => key.startsWith('__reactProps$'));
  });
  await page.getByRole('button', { name: 'S', exact: true }).click();
  const available = await withDatabase(async (db) => {
    const result = await db.query<{ available: string }>(
      "select sum(on_hand-reserved)::text as available from inventory_items where variant_id='ALM-s'",
    );
    return Number(result.rows[0]?.available);
  });
  await expect(page.getByText(`Còn ${available} sản phẩm ở size này`)).toBeVisible();
}

export async function fillCheckout(page: Page, email: string) {
  await page.getByLabel('Họ và tên').fill('Khách E2E');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByLabel('Địa chỉ', { exact: true }).fill('12 Test Street');
  await page.getByLabel('Quận/Huyện').fill('Quận 1');
  await page.getByLabel('Tỉnh/Thành phố').fill('TP Hồ Chí Minh');
}
