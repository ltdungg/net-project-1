import { By } from 'selenium-webdriver';
import { BasePage } from './base.page';
import type { Product } from '../support/data';

export class AdminPage extends BasePage {
  async inventory(product: Product) {
    await this.open('/admin/ton-kho');
    await this.heading('Tồn kho đa kho');
    await this.fillCss('input[aria-label="Tìm trong tồn kho"]', product.variant);
    await this.waitUntil(async () => {
      const rows = await this.driver.findElements(By.css('tbody tr'));
      const matches = await Promise.all(rows.map(async row => (await row.getText()).includes(product.variant)));
      return matches.filter(Boolean).length === 1;
    }, 'Cần đúng một SKU riêng');
  }
  async adjust(quantity: number, reason = 'Kiểm thử Selenium') {
    await this.button('Điều chỉnh', 'tbody');
    await this.fill('quantity', String(quantity));
    await this.fill('reason', reason);
    await this.button('Xác nhận và post phiếu', '[role="dialog"]');
  }
  async productForm(slug: string) {
    await this.open('/admin/san-pham/moi');
    await this.fill('name', `Selenium ${slug}`);
    await this.fill('slug', slug);
    await this.fill('description', 'Sản phẩm tạo qua giao diện Selenium.');
    await this.fill('material', 'Linen');
  }
  async ask(prompt: string) {
    await this.fillCss('textarea[aria-label="Câu hỏi cho NÉT AI Copilot"]', prompt);
    await this.click('[aria-label="Gửi câu hỏi"]');
  }
}
