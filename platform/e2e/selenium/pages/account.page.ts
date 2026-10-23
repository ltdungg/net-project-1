import { until } from 'selenium-webdriver';
import { BasePage } from './base.page';
import { data } from '../support/data';

export class AccountPage extends BasePage {
  async address() {
    await this.open('/tai-khoan/dia-chi');
    await this.button('Thêm địa chỉ');
    for (const [id, value] of Object.entries({label:'Nhà Selenium',recipientName:data.customer.fullName,phone:data.customer.phone,province:data.customer.province,line1:data.customer.line1,ward:data.customer.ward,district:data.customer.district})) await this.fill(id, value);
  }
  async saveAddress() {
    await this.button('Lưu địa chỉ', '[role="dialog"]');
  }
  async deleteAddress(confirm = true) {
    await this.button('Xóa', 'article');
    const alert = await this.driver.wait(until.alertIsPresent(), 10000);
    if (confirm) await alert.accept(); else await alert.dismiss();
  }
}
