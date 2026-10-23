import { By, Key, until, error, type WebDriver, type WebElement } from 'selenium-webdriver';
import { config } from '../config';

export class BasePage {
  constructor(readonly driver: WebDriver, readonly log: (message: string) => void = () => {}) {}

  async open(path: string) {
    this.log(`OPEN ${path.split('?')[0]}`);
    await this.driver.get(`${config.baseUrl}${path}`);
    await this.driver.wait(async () => await this.driver.executeScript('return document.readyState') === 'complete', config.timeout);
  }

  async visible(locator: By | string): Promise<WebElement> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    return await this.driver.wait(async () => {
      for (const element of await this.driver.findElements(by)) {
        try { if (await element.isDisplayed()) return element; }
        catch (e) { if (!(e instanceof error.StaleElementReferenceError)) throw e; }
      }
      return false;
    }, config.timeout, `Không thấy ${String(by)}`) as WebElement;
  }

  async hydrated(element: WebElement) {
    // Vinext renders HTML before React event handlers attach. This is an explicit
    // readiness check only; no JS click or application-state mutation is used.
    await this.driver.wait(() => this.driver.executeScript(
      'return Object.keys(arguments[0]).some(k => k.startsWith("__reactProps$"))', element), config.timeout, 'React chưa hydrate phần tử');
  }

  async click(locator: By | string) {
    const element = await this.visible(locator);
    await this.driver.wait(until.elementIsEnabled(element), config.timeout);
    await this.hydrated(element);
    await this.clickElement(element);
    this.log(`CLICK ${String(locator)}`);
  }

  async fill(id: string, value: string) { return this.fillCss(`#${id}`, value); }
  async fillCss(css: string, value: string) {
    const element = await this.visible(css);
    await this.hydrated(element);
    await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
    if (value) await element.sendKeys(value);
    // Deliberately never log field contents (passwords, tokens, contact details).
    this.log(`FILL ${css}`);
  }

  async byText(text: string, selector = 'button,a', exact = true): Promise<WebElement> {
    return await this.driver.wait(async () => {
      for (const element of await this.driver.findElements(By.css(selector))) {
        try {
          const actual = (await element.getText()).trim();
          if ((exact ? actual === text : actual.includes(text)) && await element.isDisplayed()) return element;
        } catch (e) { if (!(e instanceof error.StaleElementReferenceError)) throw e; }
      }
      return false;
    }, config.timeout, `Không thấy ${selector} có nhãn ${text}`) as WebElement;
  }

  async button(text: string, scope = '', exact = true) {
    const element = await this.byText(text, scope ? `${scope} button,${scope} a` : 'button,a', exact);
    await this.driver.wait(until.elementIsEnabled(element), config.timeout);
    await this.hydrated(element);
    await this.clickElement(element);
    this.log(`ACTION ${text}`);
  }

  async clickElement(element: WebElement) {
    // CSS enables smooth scrolling. Wait for a visible, unobstructed target before
    // issuing a real WebDriver click; never bypass handlers with JS click().
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center",inline:"center",behavior:"instant"})', element);
    if ((await element.getTagName()) !== 'option') {
      await this.driver.wait(() => this.driver.executeScript(`
        const e=arguments[0], r=e.getBoundingClientRect();
        const x=r.left+r.width/2,y=r.top+r.height/2;
        const top=document.elementFromPoint(x,y);
        return x>=0 && y>=0 && x<innerWidth && y<innerHeight && top && (top===e || e.contains(top));
      `, element), config.timeout, 'Phần tử chưa sẵn sàng nhận click');
    }
    await element.click();
  }

  async select(id: string, value: string) {
    const element = await this.visible(By.id(id));
    await this.hydrated(element);
    // Native keyboard selection also works in headless mode without opening an OS popup.
    const options = await element.findElements(By.css('option'));
    const values = await Promise.all(options.map(option => option.getAttribute('value')));
    const index = values.indexOf(value);
    if (index < 0) throw new Error(`Không có option ${value} trong ${id}`);
    await element.sendKeys(Key.HOME, ...Array(index).fill(Key.ARROW_DOWN), Key.TAB);
    await this.waitUntil(async () => await element.getAttribute('value') === value, `Select ${id} chưa nhận ${value}`);
    this.log(`SELECT ${id}`);
  }

  async text(text: string, selector = 'main') {
    return this.byText(text, selector, false);
  }

  async heading(text: string) { return this.byText(text, 'h1,h2,h3'); }
  async url(path: string) {
    await this.driver.wait(async () => new URL(await this.driver.getCurrentUrl()).pathname === path, config.timeout, `URL không tới ${path}`);
  }
  async alert() { return (await this.visible('[role="alert"]')).getText(); }
  async value(id: string) { return (await this.visible(By.id(id))).getAttribute('value'); }
  async invalid(id: string) {
    const element = await this.visible(By.id(id));
    return this.driver.executeScript<boolean>('return !arguments[0].checkValidity()', element);
  }
  async waitUntil(check: () => Promise<unknown>, message: string) { return this.driver.wait(check, config.timeout, message); }
}
