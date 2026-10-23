import { expect, test } from 'vitest';
import { browserFixture } from '../support/fixture';
import { data, withDatabase, type Account } from '../support/data';

const browser = browserFixture();
async function checkout(member = false) {
  const app = browser();
  let account: Account | undefined;
  if (member) {
    account = await app.fixture.account();
    await app.auth.login(account);
    await app.auth.signedIn();
  }
  const email = account?.email ?? app.fixture.email();
  const product = await app.fixture.product();
  await app.catalog.product(product);
  await app.catalog.add();
  await app.cart.checkout();
  if (account) await app.page.waitUntil(async () => await app.page.value('email') === email, 'Chưa nạp hồ sơ checkout');
  await app.checkout.contact(email);
  return { ...app, email, product, user: account };
}

test('ORDER-001 @smoke @regression Khách đặt COD và theo dõi đơn', async () => {
  const { checkout: orderPage, fixture, page, product } = await checkout();
  await orderPage.place();
  await orderPage.success();
  const orders = await fixture.orders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({ status: 'confirmed', payment_status: 'cod_pending', grand_total_cents: '825000', user_id: null });
  await orderPage.track();
  await page.text(`Mã đơn: ${orders[0].order_number}`);
  await withDatabase(async db => {
    expect((await db.query('select status,quantity from inventory_reservations where order_id=$1', [orders[0].id])).rows).toEqual([{ status: 'active', quantity: 1 }]);
    expect((await db.query('select reserved from inventory_items where id=$1', [product.inventory])).rows[0].reserved).toBe(1);
  });
});

test('ORDER-002 @regression Checkout thành viên hiện trong lịch sử', async () => {
  const { checkout: orderPage, fixture, page, user } = await checkout(true);
  await orderPage.place();
  await orderPage.success();
  const orders = await fixture.orders();
  expect(orders).toHaveLength(1);
  expect(orders[0].user_id).toBe(user!.id);
  await page.open('/tai-khoan/don-hang');
  await page.text(orders[0].order_number);
});

test('ORDER-003 @regression Checkout thiếu họ tên', async () => {
  const { checkout: orderPage, fixture } = await checkout();
  await orderPage.fill('name', '');
  await orderPage.place();
  expect(await orderPage.invalid('name')).toBe(true);
  expect(await fixture.orders()).toHaveLength(0);
});

test('ORDER-004 @regression Checkout số điện thoại sai định dạng', async () => {
  const { checkout: orderPage, fixture } = await checkout();
  await orderPage.fill('phone', data.invalid.phone);
  await orderPage.place();
  // Checkout has no HTML phone pattern; it displays the API error or this
  // fallback when the response has no error envelope. Both must reject the order.
  expect(await orderPage.alert()).toMatch(/Không thể tạo đơn|Dữ liệu gửi lên chưa hợp lệ\./);
  expect(await fixture.orders()).toHaveLength(0);
});

test('ORDER-005 @regression Không đặt đơn từ giỏ trống', async () => {
  const { page, fixture } = browser();
  await page.open('/thanh-toan');
  const submit = await page.byText('Đặt hàng an toàn', 'button');
  await page.hydrated(submit);
  expect(await submit.isEnabled()).toBe(false);
  expect(await fixture.orders()).toHaveLength(0);
});

test('ORDER-006 @regression Thanh toán online mô phỏng thành công', async () => {
  const { checkout: orderPage, page, fixture } = await checkout(true);
  await orderPage.online();
  await orderPage.place();
  await orderPage.success();
  await page.button('Tiếp tục thanh toán');
  await page.heading('Thanh toán trực tuyến');
  await page.button('Mô phỏng thanh toán thành công');
  await page.text('Thanh toán local thành công');
  expect((await fixture.orders())[0].payment_status).toBe('paid');
});

test('ORDER-007 @regression Phiên mới không xem được đơn khách', async () => {
  const { checkout: orderPage, page, fixture, driver } = await checkout();
  await orderPage.place();
  await orderPage.success();
  const [order] = await fixture.orders();
  await driver.executeScript('sessionStorage.clear()');
  await page.open(`/don-hang/${order.id}`);
  await page.heading('Không thể mở đơn hàng');
});

test('ORDER-008 @regression Hết tồn sau khi mở checkout không tạo đơn', async () => {
  const { checkout: orderPage, fixture, product } = await checkout();
  await withDatabase(db => db.query('update inventory_items set on_hand=0 where id=$1', [product.inventory]));
  await orderPage.place();
  expect(await orderPage.alert()).toBe('Một sản phẩm không còn đủ tồn khả dụng tại cùng một kho.');
  expect(await fixture.orders()).toHaveLength(0);
});

test('ORDER-009 @regression Đơn voucher giữ đúng giá trị giảm', async () => {
  const app = browser();
  const product = await app.fixture.product();
  const email = app.fixture.email();
  await app.catalog.product(product);
  await app.catalog.add();
  await app.cart.apply(await app.fixture.voucher());
  await app.cart.total(746000);
  await app.cart.checkout();
  await app.checkout.contact(email);
  await app.checkout.place();
  await app.checkout.success();
  expect((await app.fixture.orders())[0]).toMatchObject({ subtotal_cents:'790000', discount_total_cents:'79000', shipping_total_cents:'35000', grand_total_cents:'746000' });
});

test('ORDER-010 @regression @known_bug Khách có token checkout mở được cổng online', async () => {
  const { checkout: orderPage, page, fixture } = await checkout();
  await orderPage.online();
  await orderPage.place();
  await orderPage.success();
  await page.button('Tiếp tục thanh toán');
  await page.heading('Thanh toán trực tuyến');
  await page.button('Mô phỏng thanh toán thành công');
  await page.text('Thanh toán local thành công');
  expect((await fixture.orders())[0].payment_status).toBe('paid');
});
