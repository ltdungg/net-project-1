import { BasePage } from './base.page';
import { data } from '../support/data';

export class CheckoutPage extends BasePage {
  async contact(email: string) {
    for (const [id, value] of Object.entries({name:data.customer.fullName,email,phone:data.customer.phone,line1:data.customer.line1,district:data.customer.district,province:data.customer.province})) {
      await this.fill(id, value);
    }
  }
  async place() { await this.button('Đặt hàng an toàn'); }
  async success() { await this.heading(data.messages.orderCreated); }
  async online() {
    const label = await this.byText('Thanh toán trực tuyến', 'form label', false);
    await this.hydrated(label);
    await this.clickElement(label);
  }
  async track() { await this.button('Theo dõi đơn hàng'); }
}
