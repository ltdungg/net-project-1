import { appendFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, afterEach } from 'vitest';
import { Builder, logging, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { config } from '../config';
import { TestData } from './data';
import { BasePage } from '../pages/base.page';
import { AuthPage } from '../pages/auth.page';
import { CatalogPage } from '../pages/catalog.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { AccountPage } from '../pages/account.page';
import { AdminPage } from '../pages/admin.page';

export function browserFixture() {
  let driver: WebDriver | undefined;
  let fixture: TestData;
  let dir: string;
  let profile: string;
  let log: (message: string) => void;

  beforeEach(async context => {
    fixture = new TestData();
    driver = undefined;
    const id = context.task.name.match(/\b[A-Z]+-\d+\b/)?.[0] ?? fixture.id;
    dir = path.join(config.artifacts, id);
    profile = path.resolve('test-results/selenium/.profiles', fixture.id);
    mkdirSync(dir, { recursive: true });
    mkdirSync(profile, { recursive: true });
    log = message => appendFileSync(path.join(dir, 'steps.log'), `${new Date().toISOString()} ${message}\n`);
    log(`START ${context.task.name}; data namespace ${fixture.id}`);
    const builder = new Builder().forBrowser(config.browser);
    if (config.browser === 'chrome') {
      const options = new chrome.Options();
      options.addArguments('--window-size=1440,1100', '--disable-dev-shm-usage', `--user-data-dir=${profile}`);
      if (config.headless) options.addArguments('--headless=new');
      if (config.binary) options.setChromeBinaryPath(config.binary);
      const prefs = new logging.Preferences();
      prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
      options.setLoggingPrefs(prefs);
      builder.setChromeOptions(options);
    } else {
      const options = new firefox.Options();
      options.addArguments('-profile', profile);
      if (config.headless) options.addArguments('-headless');
      if (config.binary) options.setBinary(config.binary);
      builder.setFirefoxOptions(options);
    }
    driver = await builder.build(); // Selenium Manager resolves browser/driver.
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: 60000, script: config.timeout });
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
  });

  afterEach(async context => {
    const failures: unknown[] = [];
    const failed = context.task.result?.state === 'fail';
    let finalScreenshot: string | undefined;
    if (driver) {
      try {
        // Cookies are kept in memory solely to identify this test's disposable cart.
        for (const cookie of await driver.manage().getCookies()) if (cookie.name === 'net_cart') fixture.cartTokens.add(cookie.value);
        finalScreenshot = await driver.takeScreenshot();
        if (failed) {
          writeFileSync(path.join(dir, 'failure.png'), finalScreenshot, 'base64');
          const current = new URL(await driver.getCurrentUrl());
          log(`FAIL URL ${current.origin}${current.pathname}`);
        }
        if (config.browser === 'chrome') {
          const entries = await driver.manage().logs().get(logging.Type.BROWSER);
          const sanitized = JSON.stringify(entries, null, 2)
            .replace(/([?&](?:token|email)=)[^\s"&]+/gi, '$1[REDACTED]');
          writeFileSync(path.join(dir, 'browser.log'), sanitized);
        }
      } catch (error) { log(`ARTIFACT ERROR ${String(error)}`); }
      try { await driver.quit(); } catch (error) { failures.push(error); }
    }
    try { await fixture.cleanup(); log('CLEANUP OK'); }
    catch (error) { log(`CLEANUP FAILED ${String(error)}`); failures.push(error); }
    try { rmSync(profile, { recursive: true, force: true }); }
    catch (error) { log(`PROFILE CLEANUP FAILED ${String(error)}`); failures.push(error); }
    if (failures.length) {
      if (finalScreenshot) writeFileSync(path.join(dir, 'failure.png'), finalScreenshot, 'base64');
      throw new AggregateError(failures, 'Teardown thất bại; xem steps.log');
    }
  });

  return () => {
    if (!driver) throw new Error('WebDriver chưa khởi tạo');
    return {
      driver, fixture,
      page: new BasePage(driver, log), auth: new AuthPage(driver, log),
      catalog: new CatalogPage(driver, log), cart: new CartPage(driver, log),
      checkout: new CheckoutPage(driver, log), account: new AccountPage(driver, log),
      admin: new AdminPage(driver, log),
    };
  };
}
