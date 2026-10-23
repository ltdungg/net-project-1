import { By, Key } from 'selenium-webdriver';
import { BasePage } from './base.page';
import type { Product } from '../support/data';

export class CatalogPage extends BasePage {
  async search(query: string) {
    await this.open('/san-pham');
    await this.fill('catalog-search', query);
    await (await this.visible(By.id('catalog-search'))).sendKeys(Key.ENTER);
    await this.waitUntil(async () => new URL(await this.driver.getCurrentUrl()).searchParams.get('q') === query, 'Tìm kiếm chưa điều hướng');
  }
  async cards() { return this.driver.findElements(By.css('article:has(a[aria-label^="Xem "])')); }
  async prices() {
    const prices: number[] = [];
    for (const card of await this.cards()) {
      const candidates = await card.findElements(By.css('span.font-semibold'));
      const texts = await Promise.all(candidates.map(element => element.getText()));
      const amounts = texts.filter(text => /^\d[\d.]*\s*[₫đ]$/.test(text.trim()));
      if (amounts.length !== 1) throw new Error(`Card cần đúng một giá bán, tìm được ${amounts.length}`);
      prices.push(Number(amounts[0].replace(/\D/g, '')));
    }
    return prices;
  }
  async product(product: Product) {
    await this.open(`/san-pham/${product.slug}`);
    await this.heading(product.name);
    await this.button('S');
    await this.text(`Còn`, 'main');
  }
  async quantity() { return Number(await (await this.visible('[aria-label="Giảm số lượng"] + span')).getText()); }
  async setQuantity(quantity: number) {
    while (await this.quantity() < quantity) {
      const previous = await this.quantity();
      await this.click('[aria-label="Tăng số lượng"]');
      await this.waitUntil(async () => await this.quantity() === previous + 1, 'Số lượng chưa tăng');
    }
  }
  async add() { await this.button('Thêm vào giỏ'); await this.url('/gio-hang'); await this.visible('article'); }
  async buyNow() { await this.button('Mua ngay · Thanh toán trong 2 phút'); await this.url('/thanh-toan'); }
  async favorite(name: string, remove = false) {
    await this.click(`button[aria-label="${remove ? 'Bỏ yêu thích' : 'Yêu thích'} ${name}"]`);
    if (remove) {
      await this.waitUntil(async () => (await this.driver.findElements(By.css(`button[aria-label="Bỏ yêu thích ${name}"]`))).length === 0, 'Yêu thích chưa được gỡ');
    } else {
      await this.waitUntil(async () => (await this.visible(`button[aria-label="Bỏ yêu thích ${name}"]`)).isEnabled(), 'Yêu thích đang lưu');
    }
  }
  async filter(name: string, value: string) {
    await this.click(`aside input[name="${name}"][value="${value}"]`);
    await this.button('Áp dụng', 'aside');
    await this.waitUntil(async () => new URL(await this.driver.getCurrentUrl()).searchParams.get(name) === value, 'Bộ lọc chưa áp dụng');
  }
  async sort(value: string) {
    await this.select('sort', value);
    await this.click('form:has(#sort) button[type="submit"]');
    await this.waitUntil(async () => new URL(await this.driver.getCurrentUrl()).searchParams.get('sap-xep') === value, 'Sắp xếp chưa áp dụng');
  }
}
