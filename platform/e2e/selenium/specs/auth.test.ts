import { expect, test } from 'vitest';
import { browserFixture } from '../support/fixture';
import { data, withDatabase } from '../support/data';

const browser = browserFixture();

test('AUTH-001 @smoke @regression Đăng ký và xác minh qua UI', async () => {
  const { auth, fixture, page } = browser();
  const email = fixture.email();
  await auth.registration(email, fixture.password);
  await auth.submitRegistration();
  await page.heading(data.messages.registered);
  await page.button('Xác minh email');
  await page.button('Xác minh và đăng nhập');
  await page.heading(data.messages.verified);
  await page.open('/tai-khoan');
  await auth.signedIn();
  const row = await withDatabase(async db => (await db.query('select status,email_verified_at from users where email=$1', [email])).rows[0]);
  expect(row.status).toBe('active');
  expect(row.email_verified_at).not.toBeNull();
});

test('AUTH-002 @regression Từ chối email đã đăng ký', async () => {
  const { auth, fixture } = browser();
  const account = await fixture.account();
  await auth.registration(account.email, account.password);
  await auth.submitRegistration();
  expect(await auth.alert()).toBe('Email đã được sử dụng.');
});

test('AUTH-003 @regression Mật khẩu xác nhận không khớp', async () => {
  const { auth, fixture } = browser();
  await auth.registration(fixture.email(), fixture.password, `${fixture.password}A`);
  await auth.submitRegistration();
  expect(await auth.alert()).toBe(data.messages.passwordMismatch);
});

test('AUTH-004 @regression Mật khẩu yếu bị HTML validation chặn', async () => {
  const { auth, fixture } = browser();
  await auth.registration(fixture.email(), data.invalid.password);
  await auth.submitRegistration();
  expect(await auth.invalid('register-password')).toBe(true);
  await auth.url('/dang-ky');
});

test('AUTH-005 @regression Chưa đồng ý điều khoản', async () => {
  const { auth, fixture, driver } = browser();
  await auth.registration(fixture.email(), fixture.password, fixture.password, false);
  await auth.submitRegistration();
  expect(await driver.executeScript('return document.querySelector("input[name=acceptedTerms]").validity.valueMissing')).toBe(true);
  await auth.url('/dang-ky');
});

test('AUTH-006 @regression Email sai định dạng khi đăng ký', async () => {
  const { auth, fixture } = browser();
  await auth.registration(fixture.email(), fixture.password);
  await auth.fill('register-email', data.invalid.email);
  await auth.submitRegistration();
  expect(await auth.invalid('register-email')).toBe(true);
});

test('AUTH-007 @smoke @regression Đăng nhập và đăng xuất', async () => {
  const { auth, fixture, page } = browser();
  await auth.login(await fixture.account());
  await auth.signedIn();
  await auth.logout();
  await page.open('/tai-khoan/don-hang');
  await page.heading('Đăng nhập để xem đơn hàng');
});

test('AUTH-008 @regression Đăng nhập sai mật khẩu', async () => {
  const { auth, fixture } = browser();
  const account = await fixture.account();
  await auth.login({ ...account, password: `${account.password}X` });
  expect(await auth.alert()).toBe(data.messages.badLogin);
  await auth.url('/dang-nhap');
});

test('AUTH-009 @regression Chặn đăng nhập tài khoản chưa xác minh', async () => {
  const { auth, fixture } = browser();
  await auth.login(await fixture.account({ verified: false }));
  expect(await auth.alert()).toContain('Bạn cần xác minh email trước khi đăng nhập.');
  await auth.visible('a[href^="/xac-minh-email?email="]');
});

test('AUTH-010 @regression Hiện và ẩn mật khẩu', async () => {
  const { auth, fixture } = browser();
  await auth.open('/dang-nhap');
  await auth.fill('login-password', fixture.password);
  await auth.click('[aria-label="Hiện mật khẩu"]');
  expect(await (await auth.visible('#login-password')).getAttribute('type')).toBe('text');
  await auth.click('[aria-label="Ẩn mật khẩu"]');
  expect(await (await auth.visible('#login-password')).getAttribute('type')).toBe('password');
});

test('AUTH-011 @regression Không chuyển hướng ra ngoài từ returnTo', async () => {
  const { auth, fixture, driver } = browser();
  await auth.login(await fixture.account(), '//example.invalid');
  await auth.signedIn();
  expect(new URL(await driver.getCurrentUrl()).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
});

test('AUTH-012 @regression Token xác minh chỉ dùng một lần', async () => {
  const { auth, fixture } = browser();
  const account = await fixture.account({ verified: false });
  await auth.verify(account.token);
  await auth.heading(data.messages.verified);
  await auth.logout();
  await auth.verify(account.token);
  await auth.text('Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
});

test('AUTH-013 @regression Quên và đặt lại mật khẩu qua UI', async () => {
  const { auth, fixture, page } = browser();
  const account = await fixture.account();
  const nextPassword = `${account.password}New1`;
  await auth.forgot(account.email);
  await page.button('Mở trang đặt lại mật khẩu local');
  await auth.reset(nextPassword);
  await page.heading('Mật khẩu đã đổi');
  await auth.login(account);
  expect(await auth.alert()).toBe(data.messages.badLogin);
  await auth.login({ ...account, password: nextPassword });
  await auth.signedIn();
});

test('AUTH-014 @regression Quên mật khẩu với email chưa tồn tại', async () => {
  const { auth, fixture } = browser();
  await auth.forgot(fixture.email());
  await auth.text('Nếu email hợp lệ, hướng dẫn sẽ được gửi trong ít phút.');
  await auth.button('Quay lại đăng nhập');
  await auth.url('/dang-nhap');
});

test('AUTH-015 @regression Token reset không hợp lệ', async () => {
  const { auth, fixture } = browser();
  await auth.open('/dat-lai-mat-khau');
  await auth.fill('reset-token', data.invalid.token);
  await auth.reset(fixture.password);
  expect(await auth.alert()).toContain('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
});
