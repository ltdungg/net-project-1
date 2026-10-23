import { expect, test } from 'vitest';
import { browserFixture } from '../support/fixture';
import { data, withDatabase } from '../support/data';

const browser = browserFixture();
async function cartWithProduct(options = {}) {
  const app = browser();
  const product = await app.fixture.product(options);
  await app.catalog.product(product);
  await app.catalog.add();
  return { ...app, product };
}

test('CART-001 @regression Giỏ hàng mới trống', async () => {
  const { page } = browser();
  await page.open('/gio-hang');
  await page.heading('Giỏ hàng đang trống');
  await page.button('Tiếp tục mua sắm');
  await page.heading('Tất cả sản phẩm');
});

test('CART-002 @smoke @regression Thêm sản phẩm và lưu giỏ khi tải lại', async () => {
  const { cart, page, product } = await cartWithProduct();
  await page.text(product.name, 'article');
  expect(await cart.quantity()).toBe(1);
  await cart.total(825000);
  await page.open('/gio-hang');
  expect(await cart.quantity()).toBe(1);
  await cart.total(825000);
});

test('CART-003 @regression Tăng giảm số lượng cập nhật tổng và phí ship', async () => {
  const { cart } = await cartWithProduct();
  await cart.change('Tăng', 2);
  await cart.total(1580000);
  await cart.text('Miễn phí', 'aside');
  await cart.change('Giảm', 1);
  await cart.total(825000);
});

test('CART-004 @regression Giảm ở số lượng một không xóa sản phẩm', async () => {
  const { cart } = await cartWithProduct();
  await cart.change('Giảm', 1);
  expect(await cart.quantity()).toBe(1);
  await cart.total(825000);
});

test('CART-005 @regression Xóa sản phẩm cuối cùng', async () => {
  const { page } = await cartWithProduct();
  await page.click('[aria-label="Xóa khỏi giỏ"]');
  await page.heading('Giỏ hàng đang trống');
});

test('CART-006 @regression @known_bug Vượt tồn kho phải báo lỗi và giữ số lượng', async () => {
  const { cart, product } = await cartWithProduct({ stock: 1 });
  await cart.click('article [aria-label="Tăng"]');
  // Correct UX expectation: backend rejects this, but current UI discards the response.
  expect(await cart.alert()).toContain('Sản phẩm không còn đủ tồn kho.');
  expect(await cart.quantity()).toBe(1);
  const row = await withDatabase(async db => (await db.query('select quantity from cart_items where variant_id=$1', [product.variant])).rows);
  expect(row).toEqual([{ quantity: 1 }]);
});

test('CART-007 @regression Áp voucher phần trăm và gỡ mã', async () => {
  const { cart, fixture } = await cartWithProduct();
  const code = await fixture.voucher();
  await cart.apply(code.toLowerCase());
  await cart.text(`${code} · Ưu đãi Selenium`, 'aside');
  await cart.total(746000);
  await cart.click('[aria-label="Gỡ mã ưu đãi"]');
  await cart.total(825000);
  await cart.visible('#voucher-code');
});

test('CART-008 @regression Voucher không tồn tại', async () => {
  const { cart } = await cartWithProduct();
  await cart.apply(data.invalid.unknownVoucher);
  expect(await cart.alert()).toContain('Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
  await cart.total(825000);
});

test('CART-009 @regression Voucher chưa đạt đơn tối thiểu', async () => {
  const { cart, fixture } = await cartWithProduct();
  await cart.apply(await fixture.voucher('minimum'));
  expect(await cart.alert()).toContain('Đơn hàng chưa đạt giá trị tối thiểu.');
  await cart.total(825000);
});

test('CART-010 @regression Voucher hết hạn', async () => {
  const { cart, fixture } = await cartWithProduct();
  await cart.apply(await fixture.voucher('expired'));
  expect(await cart.alert()).toContain('Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
  await cart.total(825000);
});

test('CART-011 @regression Voucher chạm trần giảm giá', async () => {
  const { cart, fixture } = await cartWithProduct();
  await cart.change('Tăng', 2);
  await cart.apply(await fixture.voucher());
  await cart.total(1430000);
});

test('CART-012 @regression Voucher miễn phí giao hàng', async () => {
  const { cart, fixture } = await cartWithProduct();
  await cart.apply(await fixture.voucher('free_shipping'));
  await cart.total(790000);
  await cart.text('Miễn phí', 'aside');
});

test('CART-013 @regression Mốc miễn phí giao hàng đúng 799000', async () => {
  const { cart } = await cartWithProduct({ price: 799000 });
  await cart.total(799000);
  await cart.text('Miễn phí', 'aside');
});
