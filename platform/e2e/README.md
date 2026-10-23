# Browser E2E audit and execution

## Selenium 4 suite

The separate Selenium 4 + TypeScript/Vitest POM suite lives in `selenium/` and reuses
this E2E stack and database helper. It has isolated per-test data, parallel workers,
failure screenshots and HTML/JSON/JUnit reports. See the Vietnamese
[run guide](./selenium/HƯỚNG_DẪN_CHẠY_TEST.md),
[test cases](./selenium/TEST_CASES.md) and
[execution report](./selenium/KẾT_QUẢ_KIỂM_THỬ.md).
Run `npm run test:selenium` from `platform` after starting the stack as described
in that guide. Do not run both browser suites simultaneously against the same stack.

## Existing test layers

Before this suite, the repository had no Playwright or Cypress configuration. `ops/smoke-test.mjs` fetched four HTTP URLs without a browser. Vitest tests under `tests/` exercise BFF and frontend modules with mocked requests. Backend unit, API, service, and PostgreSQL integration tests live under `backend/src/test/`. None of those tests drove a customer through the rendered storefront, so the browser suite focuses on cross-system journeys rather than repeating endpoint validation.

## Isolated environment

The E2E backend uses Compose project `net-commerce-e2e`, database `net_commerce_e2e`, and local ports 18080 and 55432. The Compose project name gives it separate PostgreSQL, Redis, and upload volumes. The checked-in `backend.compose.env` contains disposable local credentials only. Playwright starts Vinext on `http://127.0.0.1:18787` with its BFF pointed at the isolated API. The runner requires the dedicated backend to be healthy, and the database helper rejects any database other than `net_commerce_e2e` on localhost. Do not set `E2E_DB_URL` to a shared database.

From `platform/backend`:

```sh
docker compose -p net-commerce-e2e --env-file ../e2e/backend.compose.env \
  -f docker-compose.yml -f ../e2e/backend.override.yml up --build -d
```

From `platform`:

```sh
npm ci
npm run test:e2e -- e2e/smoke/catalog.spec.ts
npm run test:e2e -- e2e/journeys/auth.spec.ts
npm run test:e2e -- e2e/journeys/checkout.spec.ts
npm run test:e2e
```

Playwright 1.58.2 uses Chromium. On a new machine, run `npx playwright install chromium` once. Failures retain a trace, screenshot, and video in ignored `test-results/`; the HTML report is in ignored `playwright-report/`. No retries are configured. Tests use fresh browser contexts, unique emails, and one worker. A fresh Compose project starts with migration seed data. Orders consume stock on dispatch, so reset this dedicated project between full campaigns for deterministic seed stock. To remove only this disposable project and its data after the run, execute the same Compose command with `down -v` instead of `up --build -d`.

## Test plan

| Priority | Journey and preconditions | Browser actions and expected UI | Persisted outcome | Status |
| --- | --- | --- | --- | --- |
| P0 | Storefront, seeded catalog | Open home, search catalog, inspect product and availability; no-match search shows empty state | Catalog reads the seeded API data | Passed |
| P0 | Member identity, local verification mode | Register, verify email, view account, reject bad password, log in and log out | Account exists and session changes via real backend | Passed |
| P0 | Guest checkout, seeded `ALM-s`, `CHAONET` | Change cart quantity, reject unknown code, apply valid voucher, submit COD, follow order | Order 790000 subtotal, 79000 discount, 35000 shipping, 746000 total; one active reservation and pending HCM fulfillment | Passed |
| P0 | Member checkout, fresh account | Verify member, add seeded product, submit COD, open order history | Order has matching user ID and 825000 total | Passed |
| P1 | Warehouse adjustment, seeded `QCV-l`, disposable admin | Reject guest/customer, reject excessive decrease, adjust HCM stock by +1 then -1, check admin and storefront | Stock increases then returns to baseline; invalid change leaves stock untouched | Passed |
| P1 | Manual fulfillment, fresh guest order and disposable admin | Create order, advance warehouse fulfillment, reject shipment without tracking, enter carrier/tracking, ship | HCM fulfillment and order become shipped; reservation consumed; HCM on-hand and reserved each decrease by one | Passed |
| P1 | Catalog administration, disposable admin | Create/update a unique product through the admin UI; inspect publication state and storefront visibility | Product, variant, and publication state match the UI | Gap |
| P1 | Customer segmentation, deterministic customer history | Open customer management and inspect calculated segment after relevant orders | Segment matches the implemented rules and stored order history | Gap |
| P1 | Reporting and financial management, deterministic orders | Open authorized report, apply date filters, inspect totals and empty state | Displayed amounts reconcile to stored records | Gap |
| P2 | Rule-based administrative Copilot, disposable admin | Submit supported and unsupported prompts through the UI; check access control | Rule response matches deterministic business data | Gap |

Additional gaps include invalid product routes, expired or ineligible vouchers, insufficient stock at checkout, direct unauthorized admin mutations, and later order states. Lower-level tests do not establish that these browser workflows work. Real payment providers, carriers, email delivery, and external AI are out of scope; tests use COD, manual fulfillment, and local verification.

## Execution report

On 2026-10-12, the backend was built and started from a fresh disposable Compose project using the command above. One complete run passed on fresh volumes; the final rerun also passed after the local URL guard was tightened. That rerun used Playwright 1.58.2 and Chromium 145.0.7632.6, one worker, no retries, a local Vinext server, real BFF/backend, PostgreSQL 17, and Redis 7. `npm run test:e2e` completed in 41.1 seconds: **7 passed, 0 failed, 0 skipped**. The seven tests cover storefront search, identity, guest checkout, member checkout, admin authorization, reversible warehouse adjustment, and manual fulfillment. Test files are under `smoke/`, `journeys/`, and `admin/`; database verification helpers are under `support/`.

Related checks: `npm run typecheck` and `npm run lint` both passed. `mvn --batch-mode --no-transfer-progress -Dtest=CartServiceTest -Dit.test=PostgresCommerceIntegrationTest verify` passed with 2 CartService tests and 20 PostgreSQL integration tests, with no failures or skips. `npm test` ran 71 Vitest tests: 70 passed and 1 failed. The failure is the already documented `tests/authz-security.test.ts` case `does not grant scaffold admin privileges outside local when role lookup fails` (expected `customer`, got `admin`); E2E work did not change that test or the role fallback. It remains a production security defect, not an infrastructure failure.

During incremental execution, browser locator/hydration timing failures were corrected in the tests. Three application defects were confirmed and fixed: checkout reservation and inventory adjustments left cached storefront availability stale, and the admin inventory date used different server/browser time zones, causing a hydration error. The full E2E suite and targeted backend checks passed after those changes. Sandbox access to Docker and loopback initially blocked startup; the final run used approved local execution. Vinext/Base UI still emitted a product accordion hydration attribute warning and an uncontrolled FieldControl warning during fulfillment; the tested interactions succeeded, but those warnings remain uninvestigated. Failure traces, screenshots, and videos are retained in ignored `test-results/` when a case fails, and the generated HTML report is in ignored `playwright-report/`. The final run produced no failure artifacts. The isolated Compose project and its volumes were removed with `down -v` after verification.
