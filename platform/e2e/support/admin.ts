import { expect, type Page } from '@playwright/test';
import { withDatabase } from './database';
import { gotoHydrated, registerAndVerify } from './journeys';

export const adminEmail = 'e2e-admin@example.test';

export async function ensureAdmin(page: Page) {
  const exists = await withDatabase(async (db) => {
    const result = await db.query('select id from users where email=$1', [adminEmail]);
    return result.rowCount === 1;
  });
  if (exists) {
    await gotoHydrated(page, '/dang-nhap');
    await page.getByLabel('Email').fill(adminEmail);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Xin chào, Khách E2E' })).toBeVisible();
  } else {
    await registerAndVerify(page, adminEmail);
  }
}
