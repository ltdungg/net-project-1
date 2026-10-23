import { expect, test } from 'vitest';
import { By } from 'selenium-webdriver';
import { browserFixture } from '../support/fixture';
import { data, withDatabase } from '../support/data';

const browser = browserFixture();

test('CAT-001 @smoke @regression Tìm sản phẩm theo chất liệu', async () => {
  const { catalog } = browser();
  await catalog.search(data.search.match);
  await catalog.heading('Kết quả cho “linen”');
  const cards = await catalog.cards();
  expect(cards.length).toBeGreaterThan(0);
  // Material is searchable but not shown on every card. Compare each rendered
  // slug with the persisted material/name, rather than assuming visible copy.
  for (const card of cards) {
    const href = await card.findElement(By.css('a[aria-label^="Xem "]')).getAttribute('href');
    expect(href).not.toBeNull();
    const slug = new URL(href!).pathname.split('/').pop();
    const row = await withDatabase(async db => (await db.query('select name,subtitle,material from products where slug=$1', [slug])).rows[0]);
    expect([row.name, row.subtitle, row.material].join(' ').toLocaleLowerCase('vi')).toContain('linen');
  }
});

test('CAT-002 @regression Từ khóa không có kết quả', async () => {
  const { catalog } = browser();
  await catalog.search(data.search.noMatch);
  await catalog.heading(data.messages.noProducts);
  expect(await catalog.cards()).toHaveLength(0);
  await catalog.button('Xem tất cả sản phẩm');
  await catalog.heading('Tất cả sản phẩm');
  expect((await catalog.cards()).length).toBeGreaterThan(0);
});

test('CAT-003 @regression Tìm kiếm bỏ khoảng trắng và không phân biệt hoa thường', async () => {
  const { catalog } = browser();
  await catalog.search(data.search.caseAndWhitespace);
  await catalog.heading('Kết quả cho “LINEN”');
  expect((await catalog.cards()).length).toBeGreaterThan(0);
});

test('CAT-004 @regression Lọc danh mục và giá rồi đặt lại', async () => {
  const { catalog, driver } = browser();
  await catalog.open('/san-pham');
  await catalog.click('aside input[name="danh-muc"][value="nu"]');
  await catalog.filter('gia', 'duoi-800');
  await catalog.heading('Nữ');
  const cards = await catalog.cards();
  expect(cards.length).toBeGreaterThan(0);
  for (const price of await catalog.prices()) expect(price).toBeLessThan(800000);
  await catalog.button('Đặt lại', 'aside');
  await catalog.heading('Tất cả sản phẩm');
  expect(new URL(await driver.getCurrentUrl()).search).toBe('');
});

test('CAT-005 @regression Sắp xếp giá tăng và giảm', async () => {
  const { catalog } = browser();
  await catalog.open('/san-pham');
  for (const direction of ['gia-tang', 'gia-giam']) {
    await catalog.sort(direction);
    const prices = await catalog.prices();
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => direction === 'gia-tang' ? a - b : b - a));
  }
});

test('CAT-006 @regression Chi tiết sản phẩm và size có tồn kho', async () => {
  const { catalog, fixture } = browser();
  const product = await fixture.product();
  await catalog.product(product);
  await catalog.text(`Còn ${data.product.stock} sản phẩm ở size này`);
  await catalog.button('M');
  await catalog.text('Còn 1 sản phẩm ở size này');
  expect(await (await catalog.byText('L', 'button')).isEnabled()).toBe(false);
});

test('CAT-007 @regression Số lượng sản phẩm có biên 1 và 10', async () => {
  const { catalog, fixture } = browser();
  await catalog.product(await fixture.product());
  await catalog.click('[aria-label="Giảm số lượng"]');
  expect(await catalog.quantity()).toBe(1);
  await catalog.setQuantity(10);
  await catalog.click('[aria-label="Tăng số lượng"]');
  expect(await catalog.quantity()).toBe(10);
  await catalog.add();
  await catalog.text('Tạm tính (10 sản phẩm)', 'aside');
});

test('CAT-008 @regression Không cho mua sản phẩm hết hàng', async () => {
  const { catalog, fixture } = browser();
  const product = await fixture.product({ stock: 0 });
  await catalog.open(`/san-pham/${product.slug}`);
  // First variant is L (zero stock), S is also deliberately empty.
  await catalog.text('Kích thước này đang tạm hết hàng');
  expect(await (await catalog.byText('S', 'button')).isEnabled()).toBe(false);
  expect(await (await catalog.byText('Thêm vào giỏ', 'button')).isEnabled()).toBe(false);
});

test('CAT-009 @regression Slug không tồn tại trả trang 404', async () => {
  const { page, fixture, driver } = browser();
  await page.open(`/san-pham/${fixture.id}-missing`);
  await driver.wait(async () => /404|not found|không tìm thấy/i.test(await driver.findElement(By.css('body')).getText()), 15000);
  expect(await driver.findElements(By.css('[aria-label="Tăng số lượng"]'))).toHaveLength(0);
});

test('CAT-010 @regression Mua ngay mở checkout đúng sản phẩm', async () => {
  const { catalog, fixture, page } = browser();
  const product = await fixture.product();
  await catalog.product(product);
  await catalog.buyNow();
  await page.text(product.name, 'aside');
  await page.visible('#name');
});
