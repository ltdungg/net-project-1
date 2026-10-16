# API and service test inventory — 2026-10-11

## Boundaries and test setup

The browser uses the same-origin Vinext BFF at `/api/commerce/**`; that route forwards to Spring Boot `/api/**`. Many older `platform/app/api/**` commerce routes are D1 compatibility routes and are not the current commerce data path; `/api/health` is still used for health checks. Spring Boot uses JUnit 5, Mockito, Spring MVC, JDBC and Testcontainers. Vitest exercises frontend logic and the BFF proxy with a mocked upstream. Maven Surefire runs `*Test` classes; Failsafe runs `*IntegrationTest` classes. JaCoCo and Vitest V8 coverage are already configured.

The backend Compose stack contains PostgreSQL 17, Redis 7 and the API; the frontend Compose stack contains Vinext. The PostgreSQL integration suite uses its own Testcontainers database. The HTTP security suite uses separate PostgreSQL and Redis containers and a random localhost port. Neither suite uses the local Compose volumes. Separate frontend, backend and E2E workflows run typecheck/lint/Vitest with coverage, `mvn clean verify` with Testcontainers, and Playwright against a fresh, isolated Compose backend. They run independently, so failures in one test layer do not hide results from the others. The production image build remains gated on the frontend checks. CI uploads coverage, JUnit and Playwright reports for diagnosis. The known security assertion failures below still make their workflows fail until the application defects are fixed.

## Pre-audit coverage

| Layer | Existing suites and behavior | Why it was not repeated |
| --- | --- | --- |
| Backend unit/policy | `auth/*Test`, `common/*Test`, `config/SecurityStartupValidatorTest`, `cart/VoucherPolicyTest`, `payment/*PolicyTest`, `fulfillment/FulfillmentStateMachineTest`, `adminorder/AdminOrderStateMachineTest`, `admincustomer/*PolicyTest`, `admin/report/ReportDateRangePolicyTest`, `admin/insights/AdminPromptEngineTest`, `catalog/AdminCatalogValidationTest`, `media/MediaStorageServiceTest` | JWT, Origin, voucher arithmetic, payment signatures/state, order/fulfillment transitions, six segment names/priority, report date boundaries, prompt classification and admin catalog DTO validation already have focused cases. |
| Backend service/database integration | `integration/PostgresCommerceIntegrationTest` (15 cases before this audit) | Covers auth token lifecycle, guest order token, checkout replay, warehouse reservation/shipping/COD settlement, cancellation, address and wishlist ownership, receipt idempotency, stale fulfillment version and local payment confirmation against PostgreSQL. |
| Backend HTTP integration | `integration/HttpSecurityIntegrationTest` (85 cases in this working tree) | Exercises real filters, method security, validation, ownership, roles, side effects, token lifecycle and Redis rate limiting. Existing failing regression assertions were preserved. |
| BFF API | `tests/commerce-proxy.test.ts` | Covers Origin, credential precheck, forwarded headers and bytes, upstream errors, status propagation, cookies, redirects and media URL rewriting. |
| Frontend unit | `tests/api-response.test.ts`, `authz*.test.ts`, `catalog.test.ts`, `commerce-api-client.test.ts`, `inventory.test.ts`, `order.test.ts`, `promotion.test.ts`, `validation.test.ts` | Covers local formatting, state and validation helpers. These do not substitute for backend business or HTTP tests. |

Coverage gaps identified from the source and suites: public catalog HTTP filtering and error envelope; promotion HTTP validation and creation shape; cart service handling of unavailable stock and absent vouchers; report service translation of invalid ranges and pagination; catalog publication rules against real persistence; six customer segment threshold transitions in the database view; report/finance calculations with nonempty records; warehouse-specific shipping; inventory concurrency and reservation expiry reconciliation; payment/order races and COD reservation expiry. The last two include known defects listed in the root README. There is no catalog pagination contract to test: `/api/products` returns filtered `items` and `total` without page parameters.

## Prioritized plan and implementation status

| Module / boundary | Scenario and expected behavior | Type | Priority | Status |
| --- | --- | --- | --- | --- |
| Auth/accounts, Spring HTTP | Invalid/expired token, roles, ownership, login/refresh/logout and validation return the established envelope without side effects | API/integration | P0 | Existing HTTP suite; failing regressions remain |
| Checkout/order/payment, PostgreSQL + HTTP | Idempotent checkout, exact voucher totals, guest token ownership, stock reservation, payment and order transition consistency | Service/integration + API | P0 | Existing suites plus voucher checkout regression; known races remain |
| Inventory/fulfillment, PostgreSQL + HTTP | Stock movement, warehouse-specific reservation consumption, COD paid only after every delivery, stale version, cancellation | Service/integration + API | P0 | Existing suites plus multi-warehouse regression; concurrency and expiry reconciliation remain |
| Cart/voucher, `CartService` and checkout | Empty guest cart, unavailable variant cannot create cart, expired voucher, per-customer usage and exact persisted totals | Service + integration | P0 | `CartServiceTest` (2 cases) plus voucher checkout regression; removed a weak SQL deep-stub test |
| Storefront catalog, `/api/products` and `CatalogService` | Search/category/featured filters, price and total, invalid boolean, missing product envelope, published/active visibility and availability | API/MockMvc + integration | P1 | `CatalogApiTest` (3 cases) plus real JDBC catalog regression |
| Promotions/Copilot, `/api/admin` | Invalid promotion window/percentage and malformed Copilot JSON cannot invoke service; valid promotion returns identifiers | API/MockMvc | P1 | **Added** `AdminInsightsApiTest` (3 cases) |
| Reporting/finance, `AdminReportService` | Reversed date range and invalid pagination fail before querying; nonempty paid/cancelled aggregation reconciles with ledger | Service + integration | P1 | `AdminReportServiceTest` (2 cases) plus nonempty PostgreSQL regression |
| Customers/segments, database view | Six segments, 90-day boundary, VIP revenue threshold and cancellation recalculation | Integration | P1 | Added PostgreSQL regression through `AdminCustomerService.detail` |
| Catalog administration/media | DTO validation and upload storage; publication and referential conflicts | API/integration | P2 | DTO/storage existing; real persistence conflicts planned |
| BFF `/api/commerce/**` | Header forwarding, Origin/credential gate, status, redirect/cookie/media transformation | BFF API | P1 | Existing proxy suite; no duplicate added |

The MockMvc tests use standalone controllers and mocked services. They verify MVC routing, conversion, validation and JSON envelopes; they do not load Spring Security or prove persistence. In particular, a passing promotion controller-slice validation test does **not** mean the deployed HTTP validation envelope is correct: the full HTTP suite currently has failures for that contract. The separate HTTP integration suite covers real security and committed database behavior. The service tests isolate the service under test and use repository/service collaborators only where needed.

## Execution report

Commands were run from `platform/backend` or `platform` as appropriate on 2026-10-11 (Asia/Ho_Chi_Minh). This table reflects the audit rerun and supersedes the earlier counts:

| Command | Result |
| --- | --- |
| `mvn -Dtest=CatalogApiTest,AdminInsightsApiTest,CartServiceTest,AdminReportServiceTest -Dit.test=PostgresCommerceIntegrationTest verify` | Focused final run: **10 unit/controller tests and 20 PostgreSQL integration tests passed**, 0 failed/skipped. An earlier attempt exposed a missing required idempotency key in a test fixture; a second exposed the Redis cache proxy in the PostgreSQL-only suite. Both test setup problems were corrected before this result. |
| `mvn --batch-mode --no-transfer-progress clean verify` | Compilation and jar packaging succeeded. Surefire: **85 passed, 0 failed, 0 skipped**. Failsafe: **105 run, 73 passed, 32 assertion failures, 0 errors/skipped** (PostgreSQL suite 20/20 passed; HTTP security suite 53/85 passed). Maven exits 1 at Failsafe verify. |
| `mvn --batch-mode --no-transfer-progress jacoco:report` | Report generated at `backend/target/site/jacoco/index.html`: **71.9% lines** (2516/3501), **53.2% branches** (687/1292). This includes execution from failing integration cases; it is not a green-suite score. |
| `npm run typecheck`, `npm run lint`, `npm run build` | All passed. |
| `npm test` | **71 run, 70 passed, 1 failed**. The known `authz-security.test.ts` regression expects `customer` but receives `admin`. The preceding coverage run reported **87.82% lines**, **78.18% branches**, **85.6% statements**, **82.35% functions** over files included in that report; coverage was not rerun in this audit because frontend code and tests were unchanged. |

The 32 HTTP failures and single frontend failure match the pre-existing security findings in `SECURITY.md`; no production code or test assertions were changed to hide them. Backend failures include stale privilege after role removal, disabled-user access, Origin bypass, access-denied mapped as 500, and validation errors outside the API envelope. The frontend failure concerns legacy scaffold admin role fallback outside local mode. No new or improved test fails in the full run.

## Audit findings and test strength

- Removed `CartServiceTest`'s deep-stubbed voucher query. Because it accepted any SQL string and always returned no row, it could pass even if the active/date eligibility predicates were removed. The PostgreSQL voucher checkout case now fails if expiration, per-customer limit, persisted discount, shipping or payment amount is broken.
- Strengthened the promotion API success test with a captured `PromotionCommand`, so discarded or misbound request fields fail the test. Strengthened the catalog API test with item count, price and service routing assertions. These still isolate the controllers; they do not prove authorization.
- Added five focused cases to the existing PostgreSQL suite. They fail if draft products or inactive variants become public, paid/cancelled report aggregates drift, any of the six segment assignments or the exact 90-day boundary changes, one warehouse shipment consumes another warehouse's reservation, or COD settles before all shipments are delivered. The voucher case also checks no second order or usage increment after an ineligible attempt.
- Reviewed the existing order, voucher, state-machine, HTTP security and BFF suites. Their assertions include response bodies, database side effects and state changes; they are not status-only tests. No test calls a real payment, carrier, email or AI provider. The five new PostgreSQL cases roll back their fixture changes; HTTP tests use unique actors and an isolated container, with no execution-order dependency found. No production implementation was modified for these tests.
- Standalone MockMvc tests remain unable to detect Spring Security or global MVC advice behavior. The already-failing full HTTP cases are the authoritative evidence for those contracts. PostgreSQL service tests run inside test transactions, while HTTP integration verifies committed writes for its covered flows.

| If this behavior regresses | Assertion that detects it |
| --- | --- |
| Voucher applies after expiration, exceeds customer usage, or changes checkout/payment totals | `voucherCheckoutPersistsExactTotalsAndRejectsExpiredOrRepeatedUse` checks error codes, absence of an extra order, exact order/payment/promotion amounts and usage count. |
| Shipping one warehouse consumes another warehouse's reservation or COD settles early | `shippingOneWarehouseConsumesOnlyItsReservationsAndCodWaitsForAllDeliveries` checks each warehouse balance and reservation status, partial order state and pending payment before the final delivery. |
| Order or fulfillment transitions skip required states or ignore version/tracking | Existing `AdminOrderStateMachineTest`, `FulfillmentStateMachineTest` and PostgreSQL workflow/version cases check transitions and persisted states. |
| Role or ownership checks permit forbidden writes | Existing `HttpSecurityIntegrationTest` checks error codes and whole-database snapshots; several assertions already fail against confirmed application defects. |
| Segment priority, VIP threshold, 90-day cutoff or cancellation recomputation changes | `customerSegmentsFollowPaidOrderThresholdsAndRecalculateAfterCancellation` checks all six assignments and the exact cutoff before/after a one-second shift. |
| Reports include cancelled revenue or disagree with payment ledger | `nonemptyReportsReconcilePaidOrdersPaymentsAndDailyTotals` checks exact KPI, daily, product, finance and pagination values. |

## Remaining gaps and next steps

1. Fix the security regressions in `SECURITY.md`, preserving their tests, then rerun `mvn clean verify` and `npm test` as release gates.
2. Add concurrent inventory reservation/transfer tests and regressions for documented payment and reservation expiry races (`KD-PAY-01`, `KD-INV-01`, `KD-INV-02`).
3. Add report date-range tests that straddle midnight in `Asia/Ho_Chi_Minh`, plus partial refund and multi-warehouse partial return cases where supported by the current contract.
4. Verify catalog cache invalidation with Redis; keep the new backend CI job as a failing release gate until the existing security regressions are resolved.

The new tests found no additional production defect. No percentage here is a claim of complete business coverage.
