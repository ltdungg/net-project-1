import { expect, test } from '@playwright/test';
import { withDatabase } from '../support/database';
import { fillCheckout, openProduct, product, registerAndVerify, uniqueEmail } from '../support/journeys';

test('guest cart, voucher, COD checkout, and persisted stock reservation', async ({ page }) => {
  const email = uniqueEmail('guest');
  const before = await withDatabase(async (db) => {
    const result = await db.query<{ reserved: number }>(
      "select reserved from inventory_items where warehouse_id='wh-hcm' and variant_id='ALM-s'",
    );
    return result.rows[0]?.reserved;
  });
  expect(before).toBeDefined();

  await openProduct(page);
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn' })).toBeVisible();
  await page.getByRole('button', { name: 'Tăng', exact: true }).click();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Giảm', exact: true }).click();
  await expect(page.getByText('Tạm tính (1 sản phẩm)')).toBeVisible();

  await page.getByRole('textbox', { name: 'Nhập mã ưu đãi' }).fill('NOT-A-REAL-CODE');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('textbox', { name: 'Nhập mã ưu đãi' }).fill('CHAONET');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('CHAONET · Chào NÉT')).toBeVisible();
  await expect(page.getByText('746.000')).toBeVisible();

  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await fillCheckout(page, email);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/commerce/orders') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đặt hàng an toàn' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const order = (await response.json()).data as { id: string; orderNumber: string };
  await expect(page.getByRole('heading', { name: 'Đơn hàng đã được ghi nhận' })).toBeVisible();
  await expect(page.getByText(order.orderNumber)).toBeVisible();
  await page.getByRole('button', { name: 'Theo dõi đơn hàng' }).click();
  await expect(page.getByText(`Mã đơn: ${order.orderNumber}`)).toBeVisible();

  await withDatabase(async (db) => {
    const row = await db.query<{
      email: string; status: string; subtotal_cents: string; discount_total_cents: string;
      shipping_total_cents: string; grand_total_cents: string; user_id: string | null;
    }>('select email,status,subtotal_cents,discount_total_cents,shipping_total_cents,grand_total_cents,user_id from customer_orders where id=$1', [order.id]);
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]).toMatchObject({
      email, status: 'confirmed', subtotal_cents: '790000', discount_total_cents: '79000',
      shipping_total_cents: '35000', grand_total_cents: '746000', user_id: null,
    });
    const items = await db.query<{ sku: string; quantity: number }>(
      'select sku,quantity from order_items where order_id=$1', [order.id],
    );
    expect(items.rows).toEqual([{ sku: product.sku, quantity: 1 }]);
    const stock = await db.query<{ reserved: number }>(
      "select reserved from inventory_items where warehouse_id='wh-hcm' and variant_id='ALM-s'",
    );
    expect(stock.rows[0]?.reserved).toBe(before! + 1);
    const reservations = await db.query<{ status: string; quantity: number }>(
      'select status,quantity from inventory_reservations where order_id=$1', [order.id],
    );
    expect(reservations.rows).toEqual([{ status: 'active', quantity: 1 }]);
    const fulfillments = await db.query<{ warehouse_id: string; status: string }>(
      'select warehouse_id,status from fulfillments where order_id=$1', [order.id],
    );
    expect(fulfillments.rows).toEqual([{ warehouse_id: 'wh-hcm', status: 'pending' }]);
  });
});

test('registered member checkout belongs to the account and appears in history', async ({ page }) => {
  const email = uniqueEmail('member');
  await registerAndVerify(page, email);
  await openProduct(page);
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await fillCheckout(page, email);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/commerce/orders') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đặt hàng an toàn' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const order = (await response.json()).data as { id: string; orderNumber: string };
  await expect(page.getByRole('heading', { name: 'Đơn hàng đã được ghi nhận' })).toBeVisible();
  await page.goto('/tai-khoan/don-hang');
  await expect(page.getByText(order.orderNumber)).toBeVisible();

  await withDatabase(async (db) => {
    const result = await db.query<{ email: string; user_id: string | null; grand_total_cents: string }>(
      'select email,user_id,grand_total_cents from customer_orders where id=$1', [order.id],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.email).toBe(email);
    expect(result.rows[0]?.user_id).not.toBeNull();
    expect(result.rows[0]?.grand_total_cents).toBe('825000');
    const user = await db.query<{ id: string }>('select id from users where email=$1', [email]);
    expect(result.rows[0]?.user_id).toBe(user.rows[0]?.id);
  });
});
