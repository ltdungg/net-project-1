import { BasePage } from './base.page';
import { data, type Account } from '../support/data';

export class AuthPage extends BasePage {
  async login(account: Pick<Account, 'email' | 'password'>, returnTo = '') {
    await this.open(`/dang-nhap${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
    await this.fill('login-email', account.email);
    await this.fill('login-password', account.password);
    await this.button('Đăng nhập', 'form');
  }
  async signedIn() { await this.url('/tai-khoan'); await this.heading(`Xin chào, ${data.customer.fullName}`); }
  async logout() {
    await this.open('/dang-nhap');
    await this.button('Đăng xuất');
    await this.visible('#login-email');
  }
  async registration(email: string, password: string, confirmation = password, terms = true) {
    await this.open('/dang-ky');
    await this.fill('fullName', data.customer.fullName);
    await this.fill('register-email', email);
    await this.fill('phone', data.customer.phone);
    await this.fill('register-password', password);
    await this.fill('confirm-password', confirmation);
    if (terms) await this.click('input[name="acceptedTerms"]');
  }
  async submitRegistration() { await this.button('Tạo tài khoản', 'form', false); }
  async verify(token: string) {
    await this.open('/xac-minh-email');
    await this.fill('verification-token', token);
    await this.button('Xác minh và đăng nhập');
  }
  async forgot(email: string) {
    await this.open('/quen-mat-khau');
    await this.fill('forgot-email', email);
    await this.button('Gửi hướng dẫn');
    await this.heading('Kiểm tra hộp thư');
  }
  async reset(password: string, confirmation = password) {
    await this.fill('new-password', password);
    await this.fill('confirm-new-password', confirmation);
    await this.click('form button[type="submit"]');
  }
}
