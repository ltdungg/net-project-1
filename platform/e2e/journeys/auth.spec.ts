import { expect, test } from '@playwright/test';
import { gotoHydrated, registerAndVerify, uniqueEmail } from '../support/journeys';

test('member registration, invalid login, valid login, and logout', async ({ page }) => {
  const email = uniqueEmail('auth');
  await registerAndVerify(page, email);
  await page.getByRole('button', { name: 'Mở tài khoản' }).click();
  await expect(page.getByRole('heading', { name: 'Xin chào, Khách E2E' })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập để quản lý đơn' })).toBeVisible();
  await gotoHydrated(page, '/dang-nhap');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('WrongPassword123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập tài khoản' })).toBeVisible();

  await page.getByLabel('Mật khẩu', { exact: true }).fill('E2ePassword123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Xin chào, Khách E2E' })).toBeVisible();
});
