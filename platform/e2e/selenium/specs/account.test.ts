import { expect, test } from 'vitest';
import { By } from 'selenium-webdriver';
import { browserFixture } from '../support/fixture';
import { data, withDatabase } from '../support/data';

const browser = browserFixture();
async function member() {
  const app = browser();
  const user = await app.fixture.account();
  await app.auth.login(user);
  await app.auth.signedIn();
  return { ...app, user };
}

test('ACC-001 @regression Hồ sơ cập nhật và giữ email chỉ đọc', async () => {
  const { page, user } = await member();
  await page.open('/tai-khoan/ho-so');
  expect(await (await page.visible('#profile-email')).getAttribute('readonly')).not.toBeNull();
  await page.fill('profile-name', 'Selenium Đã Đổi');
  await page.button('Lưu hồ sơ');
  await page.text('Hồ sơ đã được cập nhật.');
  await page.open('/tai-khoan/ho-so');
  expect(await page.value('profile-name')).toBe('Selenium Đã Đổi');
  expect(await page.value('profile-email')).toBe(user.email);
});

test('ACC-002 @regression Hồ sơ từ chối tên rỗng', async () => {
  const { page, user } = await member();
  await page.open('/tai-khoan/ho-so');
  await page.fill('profile-name', '');
  await page.button('Lưu hồ sơ');
  expect(await page.invalid('profile-name')).toBe(true);
  const row = await withDatabase(async db => (await db.query('select full_name from users where id=$1', [user.id])).rows[0]);
  expect(row.full_name).toBe(data.customer.fullName);
});

test('ACC-003 @regression Thêm sửa xóa địa chỉ mặc định', async () => {
  const { account, user } = await member();
  await account.address();
  await account.saveAddress();
  await account.heading('Nhà Selenium');
  await account.text('Mặc định', 'article');
  await account.button('Sửa', 'article');
  await account.fill('line1', '99 Đường Đã Sửa');
  await account.saveAddress();
  await account.text('99 Đường Đã Sửa', 'article');
  await account.deleteAddress();
  await account.text('Chưa có địa chỉ nhận hàng');
  expect(await withDatabase(async db => (await db.query('select id from addresses where user_id=$1', [user.id])).rows)).toHaveLength(0);
});

test('ACC-004 @regression Địa chỉ thiếu thông tin bắt buộc', async () => {
  const { account } = await member();
  await account.address();
  await account.fill('line1', '');
  await account.saveAddress();
  expect(await account.invalid('line1')).toBe(true);
  await account.visible('[role="dialog"]');
});

test('ACC-005 @regression Hủy xóa giữ nguyên địa chỉ', async () => {
  const { account } = await member();
  await account.address();
  await account.saveAddress();
  await account.heading('Nhà Selenium');
  await account.deleteAddress(false);
  await account.open('/tai-khoan/dia-chi');
  await account.heading('Nhà Selenium');
});

test('ACC-006 @regression Địa chỉ mặc định tự điền checkout', async () => {
  const { account, fixture, catalog, cart, page, user } = await member();
  await account.address();
  await account.saveAddress();
  await account.heading('Nhà Selenium');
  await catalog.product(await fixture.product());
  await catalog.add();
  await cart.checkout();
  await page.waitUntil(async () => await page.value('line1') === data.customer.line1, 'Địa chỉ chưa tự điền');
  expect(await page.value('email')).toBe(user.email);
  expect(await page.value('phone')).toBe(data.customer.phone);
  expect(await page.value('district')).toBe(data.customer.district);
});

test('ACC-007 @regression Lịch sử của thành viên mới trống', async () => {
  const { page } = await member();
  await page.open('/tai-khoan/don-hang');
  await page.heading('Chưa có đơn hàng');
});

test('WISH-001 @regression Yêu thích khách lưu qua tải lại và xóa được', async () => {
  const { catalog, fixture, page } = browser();
  const product = await fixture.product();
  await catalog.product(product);
  await catalog.favorite(product.name);
  await page.open('/yeu-thich');
  await page.text('1 thiết kế đã lưu');
  await catalog.favorite(product.name, true);
  await page.heading(data.messages.emptyWishlist);
  await page.open('/yeu-thich');
  await page.heading(data.messages.emptyWishlist);
});

test('WISH-002 @regression Yêu thích thành viên lưu trong database', async () => {
  const { catalog, fixture, page, user } = await member();
  const product = await fixture.product();
  await catalog.product(product);
  await catalog.favorite(product.name);
  await page.open('/yeu-thich');
  await page.text('1 thiết kế đã lưu');
  const rows = await withDatabase(async db => (await db.query('select product_id from wishlist_items where user_id=$1', [user.id])).rows);
  expect(rows).toEqual([{ product_id: product.id }]);
});

test('WISH-003 @regression Yêu thích mới trống và không có nút bỏ yêu thích', async () => {
  const { page, driver } = browser();
  await page.open('/yeu-thich');
  await page.heading(data.messages.emptyWishlist);
  expect(await driver.findElements(By.css('button[aria-label^="Bỏ yêu thích"]'))).toHaveLength(0);
});
