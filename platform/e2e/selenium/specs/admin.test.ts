import { expect, test } from 'vitest';
import { browserFixture } from '../support/fixture';
import { data, withDatabase } from '../support/data';

const browser = browserFixture();
async function admin() {
  const app = browser();
  await app.auth.login(await app.fixture.account({ admin: true }));
  await app.auth.signedIn();
  return app;
}

test('ADM-001 @smoke @regression Admin yêu cầu đăng nhập', async () => {
  const { page } = browser();
  await page.open('/admin/ton-kho');
  await page.url('/dang-nhap');
  await page.heading('Đăng nhập tài khoản');
});

test('ADM-002 @regression Khách hàng không có quyền quản trị', async () => {
  const { page, auth, fixture } = browser();
  await auth.login(await fixture.account());
  await auth.signedIn();
  await page.open('/admin/ton-kho');
  await auth.signedIn();
});

test('ADM-003 @regression Điều chỉnh tồn kho phản ánh ra storefront', async () => {
  const app = await admin();
  const product = await app.fixture.product();
  await app.admin.inventory(product);
  await app.admin.adjust(1);
  await app.page.text('Đã ghi nhận nghiệp vụ');
  await app.catalog.product(product);
  await app.page.text(`Còn ${data.product.stock + 1} sản phẩm ở size này`);
  expect(await withDatabase(async db => (await db.query('select on_hand from inventory_items where id=$1', [product.inventory])).rows[0].on_hand)).toBe(data.product.stock + 1);
});

test('ADM-004 @regression Điều chỉnh âm vượt tồn kho bị từ chối', async () => {
  const app = await admin();
  const product = await app.fixture.product();
  await app.admin.inventory(product);
  await app.admin.adjust(-9999);
  await app.page.text('Nghiệp vụ chưa được ghi nhận');
  expect(await withDatabase(async db => (await db.query('select on_hand from inventory_items where id=$1', [product.inventory])).rows[0].on_hand)).toBe(data.product.stock);
});

test('ADM-005 @regression Điều chỉnh không có lý do bị chặn', async () => {
  const app = await admin();
  const product = await app.fixture.product();
  await app.admin.inventory(product);
  await app.admin.adjust(1, '');
  expect(await app.page.invalid('reason')).toBe(true);
  expect(await withDatabase(async db => (await db.query('select on_hand from inventory_items where id=$1', [product.inventory])).rows[0].on_hand)).toBe(data.product.stock);
});

test('ADM-006 @regression Copilot trả lời câu hỏi tồn kho', async () => {
  const app = await admin();
  await app.page.open('/admin/ai');
  await app.admin.ask('Tồn kho nào sắp hết?');
  await app.page.text('ƯU TIÊN BỔ SUNG TỒN KHO');
  await app.page.byText('Mở quản lý tồn kho', 'a');
});

test('ADM-007 @regression Copilot không gửi câu hỏi chỉ có khoảng trắng', async () => {
  const app = await admin();
  await app.page.open('/admin/ai');
  await app.page.fillCss('textarea[aria-label="Câu hỏi cho NÉT AI Copilot"]', '   ');
  expect(await (await app.page.visible('[aria-label="Gửi câu hỏi"]')).isEnabled()).toBe(false);
});

test('ADM-008 @regression Copilot câu ngoài chủ đề trả tổng quan', async () => {
  const app = await admin();
  await app.page.open('/admin/ai');
  await app.admin.ask('Hôm nay trời có mưa không?');
  await app.page.text('TÓM TẮT ĐIỀU HÀNH');
});

async function createForm() {
  const app = await admin();
  const slug = `${app.fixture.id}-ui`;
  await app.admin.productForm(slug);
  await app.page.fill('sku', slug);
  await app.page.fill('size', 'S');
  await app.page.fill('color', 'Kem');
  await app.page.fill('priceCents', '790000');
  await app.page.fill('openingStock', '2');
  return { ...app, slug };
}

test('ADM-009 @regression Tạo sản phẩm active qua UI', async () => {
  const app = await createForm();
  await app.page.select('status', 'active');
  await app.page.button('Lưu sản phẩm');
  await app.page.url('/admin/san-pham');
  await app.page.open(`/san-pham/${app.slug}`);
  await app.page.heading(`Selenium ${app.slug}`);
  await app.page.text('Còn 2 sản phẩm ở size này');
});

test('ADM-010 @regression Tạo sản phẩm với giá âm bị chặn', async () => {
  const app = await createForm();
  await app.page.fill('priceCents', '-1');
  await app.page.button('Lưu sản phẩm');
  expect(await app.page.invalid('priceCents')).toBe(true);
  expect(await withDatabase(async db => (await db.query('select id from products where slug=$1', [app.slug])).rows)).toHaveLength(0);
});

test('ADM-011 @regression Tạo bản nháp không xuất hiện storefront', async () => {
  const app = await createForm();
  await app.page.button('Lưu sản phẩm');
  await app.page.url('/admin/san-pham');
  const row = await withDatabase(async db => (await db.query('select status from products where slug=$1', [app.slug])).rows[0]);
  expect(row.status).toBe('draft');
  await app.catalog.search(app.slug);
  await app.page.heading(data.messages.noProducts);
});

test('ADM-012 @regression Giao hàng cần vận đơn và COD trả tiền khi giao xong', async () => {
  const app = await admin();
  const product = await app.fixture.product();
  const order = await app.fixture.api<{ id: string }>('/orders', {
    email: app.fixture.email(), phone: data.customer.phone, paymentMethod: 'cod', idempotencyKey: app.fixture.id,
    shippingAddress: { ...data.customer, recipientName: data.customer.fullName },
    items: [{ variantId: product.variant, quantity: 1 }],
  });
  const shipment = await withDatabase(async db => (await db.query('select id from fulfillments where order_id=$1', [order.id])).rows[0]);
  await app.page.open(`/admin/van-chuyen/${shipment.id}`);
  await app.page.button('Đang chuẩn bị');
  await app.page.button('Sẵn sàng bàn giao');
  await app.page.button('Đang giao');
  await app.page.text('Chưa thể cập nhật');
  expect(await withDatabase(async db => (await db.query('select status from fulfillments where id=$1', [shipment.id])).rows[0].status)).toBe('ready_to_ship');
  await app.page.fill('carrier', 'Selenium Carrier');
  await app.page.fill('trackingNumber', app.fixture.id);
  await app.page.button('Lưu vận đơn');
  await app.page.text('Đã lưu đơn vị vận chuyển và mã vận đơn.');
  await app.page.button('Đang giao');
  await app.page.text('Đã chuyển phiếu giao sang “Đang giao”.');
  await app.page.button('Đã giao');
  await app.page.text('Đã chuyển phiếu giao sang “Đã giao”.');
  expect((await app.fixture.orders())[0]).toMatchObject({ status: 'delivered', payment_status: 'paid' });
  expect(await withDatabase(async db => (await db.query('select on_hand,reserved from inventory_items where id=$1', [product.inventory])).rows[0])).toEqual({ on_hand: data.product.stock - 1, reserved: 0 });
});
