import { expect, test } from '@playwright/test';
import { ensureAdmin } from '../support/admin';
import { withDatabase } from '../support/database';
import { fillCheckout, openProduct, uniqueEmail } from '../support/journeys';

test('manual warehouse fulfillment requires tracking and consumes the reservation on dispatch', async ({ page }) => {
  await openProduct(page);
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await fillCheckout(page, uniqueEmail('fulfillment'));
  const createResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/commerce/orders') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đặt hàng an toàn' }).click();
  const created = await createResponse;
  expect(created.status()).toBe(201);
  const order = (await created.json()).data as { id: string; orderNumber: string };
  await expect(page.getByRole('heading', { name: 'Đơn hàng đã được ghi nhận' })).toBeVisible();

  const before = await withDatabase(async (db) => {
    const result = await db.query<{
      id: string; shipment_number: string; warehouse_id: string; inventory_item_id: string;
      on_hand: number; reserved: number;
    }>(`select f.id,f.shipment_number,f.warehouse_id,r.inventory_item_id,i.on_hand,i.reserved
       from fulfillments f join fulfillment_items fi on fi.fulfillment_id=f.id
       join inventory_reservations r on r.id=fi.reservation_id
       join inventory_items i on i.id=r.inventory_item_id where f.order_id=$1`, [order.id]);
    expect(result.rows).toHaveLength(1);
    return result.rows[0]!;
  });
  expect(before.warehouse_id).toBe('wh-hcm');

  await ensureAdmin(page);
  await page.goto('/admin/van-chuyen');
  const row = page.getByRole('row').filter({ hasText: order.orderNumber });
  await expect(row).toContainText(before.shipment_number);
  await row.getByRole('link', { name: 'Xử lý' }).click();
  await expect(page.getByRole('heading', { name: before.shipment_number })).toBeVisible();
  await expect(page.getByText('HCM-01')).toBeVisible();

  async function transition(label: string) {
    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/commerce/admin/fulfillments/${before.id}/status`) &&
      response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: label, exact: true }).click();
    return responsePromise;
  }

  expect((await transition('Đang chuẩn bị')).ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Sẵn sàng bàn giao' })).toBeVisible();
  expect((await transition('Sẵn sàng bàn giao')).ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Đang giao' })).toBeVisible();

  const rejected = await transition('Đang giao');
  expect(rejected.status()).toBe(422);
  await expect(page.getByText('Chưa thể cập nhật')).toBeVisible();
  await withDatabase(async (db) => {
    const result = await db.query<{ status: string }>('select status from fulfillments where id=$1', [before.id]);
    expect(result.rows[0]?.status).toBe('ready_to_ship');
  });

  const tracking = `E2E-${crypto.randomUUID().slice(0, 8)}`;
  await page.getByLabel('Đơn vị vận chuyển').fill('Manual E2E Carrier');
  await page.getByLabel('Mã vận đơn').fill(tracking);
  const trackingResponse = page.waitForResponse((response) =>
    response.url().endsWith(`/api/commerce/admin/fulfillments/${before.id}/tracking`) &&
    response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Lưu vận đơn' }).click();
  expect((await trackingResponse).ok()).toBe(true);
  await expect(page.getByText('Đã lưu đơn vị vận chuyển và mã vận đơn.')).toBeVisible();

  expect((await transition('Đang giao')).ok()).toBe(true);
  await expect(page.getByText('Đã chuyển phiếu giao sang “Đang giao”.')).toBeVisible();
  await withDatabase(async (db) => {
    const shipment = await db.query<{ status: string; carrier: string; tracking_number: string }>(
      'select status,carrier,tracking_number from fulfillments where id=$1', [before.id],
    );
    expect(shipment.rows[0]).toMatchObject({
      status: 'shipped', carrier: 'Manual E2E Carrier', tracking_number: tracking,
    });
    const orderState = await db.query<{ status: string }>('select status from customer_orders where id=$1', [order.id]);
    expect(orderState.rows[0]?.status).toBe('shipped');
    const reservation = await db.query<{ status: string }>(
      'select status from inventory_reservations where order_id=$1', [order.id],
    );
    expect(reservation.rows).toEqual([{ status: 'consumed' }]);
    const stock = await db.query<{ on_hand: number; reserved: number }>(
      'select on_hand,reserved from inventory_items where id=$1', [before.inventory_item_id],
    );
    expect(stock.rows[0]).toEqual({ on_hand: before.on_hand - 1, reserved: before.reserved - 1 });
  });
});
