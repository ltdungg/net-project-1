import { BasePage } from './base.page';

export class CartPage extends BasePage {
  async quantity() { return Number(await (await this.visible('article [aria-label="Giảm"] + span')).getText()); }
  async change(direction: 'Tăng' | 'Giảm', expected: number) {
    await this.click(`article [aria-label="${direction}"]`);
    await this.waitUntil(async () => await this.quantity() === expected, `Giỏ chưa có số lượng ${expected}`);
  }
  async total(expected: number) {
    const value = new Intl.NumberFormat('vi-VN').format(expected);
    await this.waitUntil(async () => {
      const text = await (await this.visible('aside')).getText();
      return new RegExp(`Tổng cộng\\s+${value.replaceAll('.', '\\.')}(?:\\s|₫|đ|$)`).test(text);
    }, `Tổng tiền UI không phải ${value}`);
  }
  async apply(code: string) {
    await this.fill('voucher-code', code);
    await this.button('Áp dụng', 'aside');
  }
  async checkout() { await this.button('Tiến hành thanh toán'); await this.url('/thanh-toan'); await this.visible('#name'); }
}
