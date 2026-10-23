# Hướng dẫn chạy Selenium E2E — NÉT Commerce

Bộ test dùng **Selenium 4 + TypeScript + Vitest + Page Object Model**, tái sử dụng ngôn ngữ, framework và thư mục E2E của dự án. Có 70 ca cho auth, catalog, chi tiết, yêu thích, giỏ/voucher, checkout COD/online local, lịch sử, hồ sơ/địa chỉ và các luồng admin đã chọn. Xem [khám phá dự án](KHÁM_PHÁ_DỰ_ÁN.md), [bảng test case](TEST_CASES.md) và [báo cáo xác minh](KẾT_QUẢ_KIỂM_THỬ.md).

## Cấu trúc

```text
platform/
├── package.json / package-lock.json       # Dependency dev và npm scripts
├── tsconfig.json                         # Cho phép import .ts cho script Node
├── e2e/
│   ├── support/database.ts               # Helper PostgreSQL được tái sử dụng
│   ├── backend.compose.env               # Credential chỉ dành cho DB E2E local
│   ├── backend.override.yml              # Port DB E2E
│   └── selenium/
│       ├── .env.example                  # Copy thành .env (gitignored)
│       ├── config.ts / vitest.config.ts
│       ├── backend.override.yml          # Port Redis E2E trên loopback
│       ├── start-app.mjs / run.mjs / cleanup.mjs
│       ├── pages/                        # Base, Auth, Catalog, Cart,
│       │                                 # Checkout, Account, Admin POM
│       ├── support/
│       │   ├── fixture.ts                # Browser riêng/test, log, screenshot
│       │   ├── data.ts                   # Seed/cleanup theo namespace UUID
│       │   ├── preflight.ts              # Health + đúng DB qua BFF
│       │   └── report.mjs                # HTML, bảng kết quả
│       ├── data/
│       │   ├── scenarios.json            # Dữ liệu nghiệp vụ
│       │   └── test-cases.json            # ID, bước, kỳ vọng, module, marker
│       ├── specs/
│       │   ├── auth.test.ts              # 15
│       │   ├── catalog.test.ts           # 10
│       │   ├── cart.test.ts              # 13
│       │   ├── checkout.test.ts          # 10
│       │   ├── account.test.ts           # 7 account + 3 wishlist
│       │   └── admin.test.ts             # 12
│       ├── HƯỚNG_DẪN_CHẠY_TEST.md
│       ├── KHÁM_PHÁ_DỰ_ÁN.md
│       ├── TEST_CASES.md
│       └── KẾT_QUẢ_KIỂM_THỬ.md
└── test-results/selenium/                 # Gitignored
    ├── index.html                        # Liên kết báo cáo mới nhất
    ├── latest-run.json                   # Dùng cho --rerun-failed
    └── <thời-gian-UTC>/
        ├── report.html / results.json / junit.xml / TEST_CASES.md
        └── <ID>/steps.log / browser.log / failure.png
```

## Yêu cầu trước khi chạy

- Node.js **24 LTS** được khuyến nghị; repo yêu cầu ít nhất 22.13.0. Có npm đi kèm.
- Docker Engine/Compose hoặc Docker Desktop đang chạy. Không cần Java/Maven/PostgreSQL cài trực tiếp nếu chạy backend bằng Docker.
- Chrome đã cài, hoặc cho Selenium Manager tải Chrome for Testing khi máy chưa có. Lần đầu cần kết nối mạng để lấy driver/browser. Không cài webdriver-manager.
- Các cổng `18787`, `18080`, `55432`, `56379` còn trống trước khi dựng stack.
- Chỉ chạy trên stack E2E local riêng. Suite chủ động từ chối hostname/port/database khác, kể cả production. Muốn hỗ trợ staging cần thiết kế lại fixture qua API và allowlist; không đơn thuần bỏ guard.
- Bạn đã có `uv` thì giữ nguyên; **bộ này không dùng Python**, do dự án đã có TypeScript/Vitest. Vì vậy không cần venv, `pyproject.toml` hay `uv.lock`.

## Cài môi trường

Từ thư mục repository:

```sh
cd platform
npm ci
cp e2e/selenium/.env.example e2e/selenium/.env
```

`npm ci` cài đúng phiên bản trong `package-lock.json`, gồm `selenium-webdriver`, type definitions, Vitest, pg và Redis client. Dependency thêm đều là devDependency.

**Về `uv sync`:** lệnh này áp dụng cho dự án Python có pyproject.toml/uv.lock. Suite hiện tại tái sử dụng TypeScript/Vitest theo yêu cầu ưu tiên framework đã có; không chạy `uv sync` ở đây. Lệnh tương ứng để cài môi trường là `npm ci`. Không dùng pip hoặc requirements.txt.

## Khởi động ứng dụng cần test

Terminal 1, từ thư mục repository:

```sh
cd platform/backend

docker compose -p net-commerce-e2e \
  --env-file ../e2e/backend.compose.env \
  -f docker-compose.yml \
  -f ../e2e/backend.override.yml \
  -f ../e2e/selenium/backend.override.yml \
  up --build -d --wait

curl -fsS http://127.0.0.1:18080/actuator/health
```

Lệnh này dựng PostgreSQL, Redis, Java API; Flyway tự chạy migration. Dữ liệu nằm trong volume của project `net-commerce-e2e`. Không dùng stack đang chứa dữ liệu làm việc tại cổng 8080/8787.

Terminal 2, từ thư mục repository:

```sh
cd platform
npm run test:selenium:app
```

Giữ terminal này chạy. Runner tạo tạm `platform/.dev.vars` với backend `http://127.0.0.1:18080`, origin `http://127.0.0.1:18787`, `APP_ENV=local`, `LOCAL_AUTH_BYPASS=false`; không ghi đè `.env` của bạn. Nếu `.dev.vars` đã tồn tại, script dừng bằng EEXIST để tránh ghi đè cấu hình. Ctrl+C sẽ dừng server và xóa file tạm do script tạo.

Terminal 3:

```sh
cd platform
curl -fsS http://127.0.0.1:18787/api/health
```

Kết quả cần có `data.status="healthy"`. Mở ứng dụng tại **http://127.0.0.1:18787**. Không chạy Playwright và Selenium cùng lúc vì cùng dùng origin/stack E2E.

PowerShell: dùng cùng các lệnh npm; viết lệnh Docker trên một dòng hoặc thay dấu nối dòng `\` bằng backtick. Copy cấu hình bằng `Copy-Item e2e/selenium/.env.example e2e/selenium/.env`.

Sau khi chạy xong, Ctrl+C ở terminal frontend. Từ `platform/backend`, dừng các container E2E và giữ lại volume bằng:

```sh
docker compose -p net-commerce-e2e \
  --env-file ../e2e/backend.compose.env \
  -f docker-compose.yml \
  -f ../e2e/backend.override.yml \
  -f ../e2e/selenium/backend.override.yml \
  down
```

Stack dùng để xác minh bàn giao đã được dừng; hãy khởi động lại theo các lệnh trên trước khi chạy test.

## Cấu hình

Sửa `platform/e2e/selenium/.env`, hoặc đặt biến môi trường trước lệnh chạy. Biến môi trường đã có ưu tiên hơn file.

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| SELENIUM_BASE_URL | http://127.0.0.1:18787 | Frontend E2E; chỉ hostname local/port này |
| SELENIUM_API_URL | http://127.0.0.1:18080 | API setup E2E |
| E2E_DB_URL | postgres://net_e2e:net_e2e_local_only@127.0.0.1:55432/net_commerce_e2e | DB E2E; helper kiểm tra tên thật trong DB |
| SELENIUM_REDIS_URL | redis://127.0.0.1:56379 | Cache catalog E2E |
| SELENIUM_BROWSER | chrome | chrome hoặc firefox; đã xác minh bằng Chrome |
| SELENIUM_BROWSER_BINARY | tự tìm | Đường dẫn browser nếu không nằm ở vị trí chuẩn |
| SELENIUM_HEADLESS | true | false để nhìn thấy cửa sổ |
| SELENIUM_WORKERS | 1 | Số file chạy song song; đã thử 3 |
| SELENIUM_WAIT_MS | 15000 | Timeout của explicit wait, không phải sleep |
| SELENIUM_TEST_PASSWORD | tạo ngẫu nhiên mỗi test | Chỉ dùng mật khẩu disposable hợp lệ; không dùng mật khẩu thật |
| SE_CACHE_PATH | Selenium Manager mặc định | Ví dụ /tmp/net-selenium-cache nếu home bị hạn chế ghi |
| SELENIUM_ARTIFACTS | thư mục mới theo thời gian mỗi lượt | Ghi đè nơi lưu kết quả; nên dùng đường dẫn riêng mỗi lượt |

Không cần đặt email hay tài khoản admin có sẵn. Mỗi test tạo email `sel<UUID>-N@example.test`, tự cấp role cho admin fixture trong DB riêng và dọn cuối test. Dữ liệu contact, giá, stock, voucher nằm trong `data/scenarios.json`. Các file `.env` đã được `.gitignore` của repo loại trừ; `.env.example` không chứa mật khẩu thật.

## Các lệnh chạy

Các lệnh dưới chạy tại **platform/**, sau khi ứng dụng đã healthy.

```sh
# Toàn bộ 70 ca; headless mặc định; luôn sinh HTML/JSON/JUnit.
npm run test:selenium

# Chỉ một file/module auth.
npm run test:selenium -- e2e/selenium/specs/auth.test.ts

# Một test cụ thể theo ID ổn định.
npm run test:selenium -- -t 'AUTH-007'

# Một nhóm chức năng/module theo tiền tố ID.
npm run test:selenium -- -t 'CART-'

# Marker trong tên test (tương đương chọn marker của pytest).
npm run test:selenium -- -t '@smoke'
npm run test:selenium -- -t '@regression'

# Chỉ tái hiện hai bug đã xác nhận; vẫn trả exit code fail khi bug còn tồn tại.
npm run test:selenium -- -t '@known_bug'

# Chạy headless rõ ràng.
SELENIUM_HEADLESS=true npm run test:selenium

# Hiện trình duyệt để debug.
SELENIUM_HEADLESS=false npm run test:selenium -- -t 'AUTH-007'

# Chạy song song 3 worker; mỗi test vẫn có browser và dữ liệu riêng.
SELENIUM_WORKERS=3 npm run test:selenium

# Chạy lại đúng các test fail trong lượt hoàn tất gần nhất.
npm run test:selenium -- --rerun-failed

# Typecheck và lint bộ test.
npm run typecheck
npx oxlint e2e/selenium
```

PowerShell đặt biến bằng `$env:SELENIUM_HEADLESS='true'` hoặc `$env:SELENIUM_WORKERS='3'`, sau đó chạy npm. Có thể đặt các giá trị này trong file `.env` để không phụ thuộc shell.

Không dùng `test.concurrent`: chạy song song theo file bằng Vitest worker; các test trong một file dùng hook riêng tuần tự. Không có implicit wait, sleep cố định, retry test tự động hoặc expected-failure làm ẩn bug.

## Báo cáo HTML, screenshot và log

```sh
# Lệnh này luôn xuất HTML, không cần cài thêm reporter.
npm run test:selenium

# Linux: mở liên kết đến báo cáo gần nhất.
xdg-open test-results/selenium/index.html
```

Có thể mở file `test-results/selenium/<timestamp>/report.html` trực tiếp bằng Chrome, không cần HTTP server. Trên macOS dùng `open`; Windows mở bằng Explorer. Mỗi lần chạy có thư mục mới, không ghi đè evidence trước. `TEST_CASES.md` trong thư mục kết quả chứa bảng ID, tên, bước, kỳ vọng và trạng thái thực tế.

- `<ID>/failure.png`: chụp trước khi đóng browser khi fail; lỗi teardown cũng giữ ảnh cuối nếu browser đã khởi tạo.
- `<ID>/steps.log`: các bước, namespace, trạng thái cleanup. Không log giá trị password/token nhập vào.
- `<ID>/browser.log`: console Chrome, có HTTP errors. Firefox chưa hỗ trợ console log trong harness này; vẫn có steps và screenshot.
- `results.json`, `junit.xml`: cho máy đọc/CI. Fail thật giữ exit code khác 0. BLOCKED/setup lỗi không được tính PASS.
- Nếu driver chưa khởi tạo được thì không có screenshot; xem lỗi Selenium Manager/console runner.

Sau khi tiến trình bị kill hoặc mất điện, dọn theo đúng namespace đã ghi nhận (chỉ khi lượt chạy đó đã dừng):

```sh
node e2e/selenium/cleanup.mjs test-results/selenium/<timestamp>
```

Không chạy cleanup đồng thời với test. Không dùng `TRUNCATE` hoặc xóa toàn database để chữa test fail.

## Thêm test theo POM

Ví dụ một test địa chỉ mới, dùng các Page Object hiện có:

```ts
import { expect, test } from 'vitest';
import { browserFixture } from '../support/fixture';

const browser = browserFixture();

test('ACC-008 @regression Sổ địa chỉ mới trống', async () => {
  const { fixture, auth, account } = browser();
  await auth.login(await fixture.account());
  await auth.signedIn();
  await account.open('/tai-khoan/dia-chi');
  const empty = await account.text('Chưa có địa chỉ nhận hàng');
  expect(await empty.isDisplayed()).toBe(true);
});
```

Đặt file `*.test.ts` trong `specs/`, hoặc thêm vào module phù hợp. Nếu cần thao tác mới, thêm method/locator vào `pages/`; thêm dữ liệu vào `data/scenarios.json`; thêm ID/tên/bước/kỳ vọng vào `data/test-cases.json` để bảng HTML có đầy đủ hàng. Không dùng tài khoản hoặc đơn của test trước. Dùng `fixture.product()`, `fixture.account()`, `fixture.voucher()`, `fixture.email()` để teardown nhận diện quyền sở hữu. Không sửa seed chung.

## Locator và đề xuất data-testid

Ưu tiên ID có sẵn, sau đó data-testid nếu UI bổ sung, rồi CSS có thuộc tính ngữ nghĩa. Suite không dùng XPath. Với nút chưa có ID, POM tìm button/link theo nội dung hiển thị và phạm vi container. Không dùng CSS class ngẫu nhiên hoặc XPath theo vị trí. Card giá hiện phải đọc span giá có ký hiệu tiền vì UI chưa có định danh riêng.

| UI/source | Locator hiện có | Nên bổ sung |
| --- | --- | --- |
| sign-in-form.tsx | #login-email, #login-password, aria-label hiện/ẩn | login-submit, auth-error |
| registration-form.tsx | #fullName, #register-email, #register-password, #confirm-password, name=acceptedTerms | register-submit, registration-success |
| verification/reset forms | #verification-token, #reset-token, #new-password | verification-submit, verification-message, reset-submit |
| san-pham/page.tsx | #catalog-search, #sort, aside input[name=...] | catalog-results, catalog-count, filter-apply, sort-apply, empty-results |
| product-card.tsx | article chứa a[aria-label^="Xem "] | product-card + data-product-id, product-price, product-name |
| product-actions.tsx | aria-label tăng/giảm; nút S/M/L theo nhãn | variant-button + data-variant-id, selected-quantity, stock-message, add-to-cart, buy-now |
| cart-client.tsx | article, aria-label Tăng/Giảm/Xóa, #voucher-code | cart-item + data-variant-id, cart-quantity, subtotal, shipping, discount, grand-total, cart-error |
| checkout-client.tsx | #name/#email/#phone/#line1/#district/#province | payment-cod, payment-online, checkout-submit, checkout-error, order-success |
| online-payment-client.tsx | h1 và nội dung lỗi/nút | payment-status, payment-access-error, payment-mock-confirm |
| profile/address | #profile-name, #profile-phone, dialog và ID form | address-card + data-address-id, address-save, address-default |
| orders-client.tsx | Nội dung order number | order-row + data-order-id, order-status, orders-empty |
| inventory-workbench.tsx | aria-label tìm/lọc, #quantity/#reason, tbody | inventory-row + data-inventory-id, inventory-table, operation-table, operation-notice |
| fulfillment-control.tsx | #carrier/#trackingNumber, nhãn nút trạng thái | fulfillment-status, transition-button + data-status, fulfillment-notice |
| ai-copilot.tsx | textarea aria-label, button aria-label gửi | copilot-answer, copilot-headline, copilot-error |

Đây là đề xuất cho đội frontend; lượt làm này **không thêm thuộc tính vào UI hay sửa code nghiệp vụ**.

## Xử lý sự cố

- **App chưa chạy / BLOCKED:** kiểm tra hai health URL, `docker compose ... ps`, log `api postgres redis`; BFF phải dùng API 18080. Preflight còn tạo sentinel để kiểm tra frontend thật sự đọc đúng DB E2E.
- **Docker socket / daemon:** khởi động Docker Desktop, hoặc `sudo systemctl start docker` trên Linux; tài khoản cần quyền Docker. Không cần chạy browser bằng root.
- **EEXIST `.dev.vars`:** kiểm tra file do phiên trước hay do bạn tạo. Nếu do bạn tạo, sao lưu/chuyển tên trước; nếu runner bị kill, dừng Vinext còn chạy rồi xóa đúng file tạm. Script không tự ghi đè.
- **Driver/browser không tìm thấy:** kiểm tra Chrome; đặt SELENIUM_BROWSER_BINARY nếu cần, kiểm tra mạng/proxy và quyền ghi SE_CACHE_PATH. Selenium Manager giải quyết driver; không cài webdriver-manager. Xem [hướng dẫn Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/).
- **Không tìm thấy phần tử/timeout:** đọc screenshot và steps.log; kiểm tra route, role, dữ liệu và selector. Client React có thể chưa hydrate; BasePage đợi handler và khả năng nhận click. Đừng thêm sleep cố định hoặc tăng timeout để che bug.
- **Click intercepted:** giao diện bật smooth scroll. Harness cuộn tức thời rồi explicit-wait kiểm tra elementFromPoint trước native click. Modal/sticky header mới cần locator và điều kiện readiness phù hợp, không dùng JavaScript click để bỏ qua UI.
- **429:** backend có rate limit thật; số lần chạy auth dày trên cùng IP có thể bị giới hạn. Không xóa toàn Redis khi suite đang chạy. Chờ cửa sổ rate limit, hoặc dựng một stack E2E mới cho chiến dịch CI. Test không vô hiệu hóa cơ chế này.
- **Fixture cleanup failed:** kiểm tra lỗi FK/DB và steps.log. Sửa helper rồi chạy cleanup.mjs với thư mục lượt đó; lỗi cleanup vẫn làm test fail.
- **Phân vùng tạm đầy:** fixture dùng profile riêng tại `test-results/selenium/.profiles/<namespace>` và xóa sau mỗi test, tránh tích lũy cache Chrome trong `/tmp`. Nếu tiến trình bị kill, dừng browser của lượt đó rồi chạy cleanup.mjs; không xóa profile Chrome cá nhân. Lượt thử ban đầu đã phát hiện và khắc phục vấn đề profile tạm còn sót.
- **Số điện thoại checkout:** UI hiện chỉ hiện thông báo chung `Không thể tạo đơn` khi API trả body ngoài envelope. Test kiểm tra bị từ chối và DB không có đơn; đây là hạn chế thông báo UX, không phải đơn sai được chấp nhận.
- **HTML vẫn có FAIL:** xem các bug thật bên dưới; không đổi expected hoặc thêm skip để làm báo cáo xanh.

## Bug và giới hạn đã phát hiện

- **BUG-SEL-001 / CART-006:** tăng vượt tồn kho bị backend trả 409 nhưng CartClient.change bỏ qua response, tải lại giỏ và không hiển thị lỗi cho khách. Test yêu cầu thông báo lỗi và giữ fail.
- **BUG-SEL-002 / ORDER-010:** khách vừa checkout online bị trang payment từ chối quyền. OnlinePaymentClient gửi token qua `?token=...`, trong khi OrderController.guestDetail yêu cầu header `X-Guest-Order-Token`. Thanh toán online member hoạt động. Test khách giữ fail.
- Các cảnh báo console/hydration và lỗi cũ trong suite khác được phân biệt với Selenium trong KẾT_QUẢ_KIỂM_THỬ.md. Không sửa nghiệp vụ để vượt test.

## CI/CD

Dùng runner Linux có Docker và Node 24. Chạy `npm ci`, dựng Compose E2E như trên, chạy frontend nền và đợi HTTP health với deadline; sau đó `SELENIUM_WORKERS=3 npm run test:selenium`. Luôn upload `platform/test-results/selenium/**` kể cả job fail; publish `junit.xml`. Dừng frontend và Compose bằng bước `always()`; chỉ xóa volume của project E2E nếu job tạo riêng nó. Cache npm và Selenium Manager theo OS/browser; không cache DB test giữa các job.

Giữ exit code fail cho hai bug đang mở. Sau khi đội phát triển sửa nghiệp vụ, chạy lại cả tuần tự và song song rồi mới bật suite làm release gate. Có thể dùng `@smoke` làm kiểm tra nhanh trong khi xử lý regression fail; không xem smoke xanh là toàn hệ thống xanh.

Nguồn kỹ thuật: [explicit waits của Selenium](https://www.selenium.dev/documentation/webdriver/waits/), [Vitest reporters](https://vitest.dev/guide/reporters.html). Harness dùng native WebDriver interactions; reporter HTML tĩnh được tạo từ kết quả JSON của Vitest.
