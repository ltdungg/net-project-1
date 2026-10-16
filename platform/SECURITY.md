# Chính sách bảo mật

## Kiểm soát đã áp dụng

- Xác thực email/password do Spring Security xử lý; access JWT ngắn hạn và
  refresh token opaque được xoay vòng. Authorization RBAC luôn kiểm tra phía
  server.
- Cookie xác thực dùng `HttpOnly`, `SameSite=Strict`; cookie giỏ hàng dùng
  `HttpOnly`, `SameSite=Lax`; tất cả bật `Secure` trên HTTPS.
- Request thay đổi dữ liệu qua BFF phải có `Origin`/`Referer` thuộc public
  origin. Vì vậy lệnh `curl` đăng nhập/ghi dữ liệu không có Origin hợp lệ nhận
  `ORIGIN_FORBIDDEN`; đây là kiểm soát chủ động, không phải lỗi kết nối.
- Đăng ký dùng trạng thái `pending` cho tới khi token xác minh một lần hợp lệ.
  Login/forgot/resend được giới hạn tần suất bằng Redis; refresh token được băm,
  xoay vòng và có thể thu hồi khi logout.
- Mã truy cập đơn của khách vãng lai được ký, giới hạn bảy ngày, giữ trong
  `sessionStorage` và truyền bằng header `X-Guest-Order-Token`, không đặt trong
  URL/query để tránh rò qua lịch sử trình duyệt và access log. Đây là contract
  chuẩn; riêng client online-payment hiện còn vi phạm contract này
  (`KD-GUEST-01`) và phải được sửa trước khi phát hành.
- Upload giới hạn 8 MB và chỉ nhận JPEG, PNG, WebP, AVIF; object được phát với `nosniff`.
- Webhook thanh toán xác minh HMAC SHA-256, so sánh constant-time và chống duplicate.
- Không lưu dữ liệu thẻ. Checkout online chỉ lưu payment reference của provider.
- Jakarta Validation giới hạn độ dài, định dạng và số lượng tại Java API; kiểm
  tra phía frontend chỉ hỗ trợ trải nghiệm và không thay thế validation server.
- Audit log chứa correlation ID; không ghi secret hoặc payload PII không cần thiết.
- Tất cả nghiệp vụ kho có idempotency key; trigger dữ liệu ngăn âm tồn và reserved vượt on-hand.
- Cập nhật fulfillment yêu cầu `expectedVersion`; carrier/tracking phải có trước
  `shipped`, tracking duy nhất theo carrier và các state lỗi/hủy/hoàn bắt buộc có
  lý do. API công khai chỉ trả phần tracking cần thiết.
- Customer segment là read model từ đơn đã thanh toán; chỉ Admin đổi được trạng
  thái tài khoản. Copilot chỉ đọc dữ liệu tổng hợp, không gọi LLM ngoài và không
  tự thực thi action.
- Runtime Docker chạy non-root, bật `no-new-privileges`, giới hạn log và dùng volume riêng cho trạng thái local.
- Endpoint mô phỏng thanh toán bị khóa cứng ngoài `APP_ENV=local`.

## Quản lý secret

Thiết lập `ADMIN_EMAILS`, `MANAGER_EMAILS`, `PAYMENT_WEBHOOK_SECRET` và origin public qua môi trường của nền tảng. Không commit `.env`.

Secret mẫu chỉ dùng local. Production cần secret manager, rotation, phân tách
theo môi trường và quy trình thu hồi; không dùng lại giá trị trong `.env.example`.

## Giới hạn và việc phải làm trước production

- Sửa `KD-GUEST-01`: bỏ guest token khỏi query ở trang online-payment, gửi bằng
  `X-Guest-Order-Token`, đồng thời scrub log và bổ sung test contract.
- Sửa `KD-PAY-01`: webhook thành công đến sau khi order đã hủy phải bị từ chối
  hoặc được reconcile theo chính sách rõ ràng; không cho hai aggregate lệch nhau.
- Payment mock chỉ được bật ở `APP_ENV=local`; chưa có đánh giá PCI/provider thật.
- Token xác minh/đặt lại được trả trực tiếp chỉ trong local; production phải gửi
  qua email service có chống abuse và không lộ token trong response/log.
- Upload dùng volume local và kiểm tra type/size, chưa có malware scan, object
  storage policy hoặc content moderation.
- Chưa có WAF, SIEM, CSP/reporting tập trung, database row-level security, secret
  manager, external pentest hoặc quy trình vulnerability SLA production.
- Auth rate limiter hiện fail-open khi Redis không khả dụng để tránh làm sập
  luồng local; production phải quyết định fail-closed/fallback phù hợp và cảnh
  báo ngay khi Redis rate-limit mất tác dụng.
- Docker log/healthcheck và audit không thay thế metrics/alert tập trung. Outbox
  chưa có dispatcher nên không được coi là cơ chế notification hoàn chỉnh.
- Test regression không phải chứng nhận bảo mật hay bằng chứng kiểm thử tải/DR
  production. Kết quả review security và các regression còn đỏ được ghi bên dưới.

## Review test security 2026-10-09

Phạm vi thay đổi: test, cấu hình báo cáo test và tài liệu; không sửa runtime,
business rules, schema/migration hay các thay đổi đang có trong working tree.
Các lỗi dưới đây giữ assertion an toàn mong đợi, không dùng `skip`, `todo`,
`test.fails` hoặc đổi kỳ vọng theo hành vi lỗi để làm suite xanh.

### Review baseline và phần bổ sung

Đã rà soát các suite Vitest, JUnit unit và PostgreSQL integration hiện có.
Frontend dùng Vitest/node; backend Spring Boot/JDBC dùng JUnit, Surefire/Failsafe
và Testcontainers. Baseline trước phần security này có 54 frontend, 74 backend
unit và 15 PostgreSQL integration cases. Những thiếu sót chính:

- Test filter/handler độc lập không chứng minh được thứ tự xử lý thực tế của
  Spring Security, `@PreAuthorize`, MVC validation và exception advice.
- Integration cũ gọi service với principal dựng sẵn, bỏ qua HTTP/security chain.
- Test role fallback cũ chưa tách cấu hình local/production, nên chấp nhận
  scaffold admin fallback nhưng không phát hiện privilege escalation ngoài local.
- BFF mock upstream không chứng minh được authorization và committed DB writes.
- Chưa có kiểm tra JWT cũ sau khi block tài khoản hoặc thu hồi role.

Đã thêm 85 HTTP integration cases, 1 backend unit case và 17 frontend cases:

| Nhóm | Kiểm chứng mới |
| --- | --- |
| Authentication | JWT sai chữ ký/sửa role/`alg:none`/hết hạn, giả header danh tính, refresh cookie không thay access token, không fallback guest với JWT hết hạn |
| Auth lifecycle | Register không tự gán admin; verify/reset token một lần, sai purpose/hết hạn; password reset không đổi tài khoản khác; refresh rotation/logout, hash/revoke token, Redis giới hạn login |
| Authorization | Guest/customer/staff/manager/admin; đọc backoffice, ghi catalog/promotion/upload/inventory/fulfillment, giả role/method override, audit actor từ principal |
| IDOR | Địa chỉ, order/payment, wishlist, cart khác session, guest token ràng buộc order; payload/query `userId`, `admin=true` không đổi chủ sở hữu |
| Mass assignment | Profile không đổi id/roles/status/password; register không tự gán admin; checkout không đổi owner/giá/status, idempotency theo user |
| Validation | Register, checkout, profile, địa chỉ và malformed JSON; kiểm tra cả response lẫn dữ liệu không đổi |
| Permission bypass | JWT cũ sau block/revoke role; Origin/cookie/Authorization; BFF kiểm tra origin chính xác, các mutation verbs, thiếu credential, loại bỏ identity headers giả |

HTTP suite dùng ứng dụng thật trên `127.0.0.1` với random port, PostgreSQL 17 và
Redis 7 container riêng; suite service cũ dùng PostgreSQL 16. Chỉ dùng tài khoản,
JWT signing key và webhook secret fixture. Không gọi hoặc đọc credential từ
production. Upload root là thư mục tạm JUnit. Không mock Spring Security hoặc DB.

Mỗi ca HTTP từ chối chụp digest toàn bộ nội dung từng bảng public trước/sau request
(trừ Flyway history), kiểm tra status, error code, không trả data và không có
committed side effect. `assertAll` vẫn kiểm tra DB khi status sai. Không bọc test
trong transaction rollback vì request chạy ở thread HTTP khác. Các ca thành công
kiểm tra riêng ownership, giá trị cột, token revocation, balance/movement/audit.
Fixture user/key riêng mỗi case; chạy tuần tự để so sánh toàn DB không bị nhiễu,
job expiry được trì hoãn. Container và HTTP client được đóng sau chạy.

File mới/thay đổi trong đợt này:

- `backend/src/test/java/vn/netfashion/commerce/integration/HttpSecurityIntegrationTest.java`:
  HTTP security suite và snapshot DB helper.
- `backend/src/test/java/vn/netfashion/commerce/auth/JwtAuthenticationFilterTest.java`:
  kiểm tra production không bật local bypass dù flag được đặt.
- `tests/commerce-proxy.test.ts`: ma trận origin/header/credential và giữ response
  từ chối của backend.
- `tests/authz-security.test.ts`: regression privilege escalation legacy;
  `tests/authz.test.ts`: tách rõ characterization của local scaffold.
- `vitest.config.ts`: thêm authz vào coverage và xuất report khi fail.
- `README.md`, `backend/README.md`, `SECURITY.md`: lệnh, kết quả và bằng chứng.

Không thêm dependency trong phần security này; các thay đổi Maven/Vitest và test
đã có sẵn từ đợt mở rộng trước được giữ nguyên.

### Lỗi ứng dụng được tái hiện

Mức ưu tiên dưới đây là đánh giá từ fixture, không phải kết luận pentest production.

| ID / ưu tiên | Bằng chứng HTTP và database | Test tái hiện / hướng sửa riêng |
| --- | --- | --- |
| SEC-01 / cao | Xóa role manager khỏi `user_roles`, dùng JWT đã cấp gọi `POST /api/admin/inventory/adjust`: trả **200**, đổi `inventory_items`, tạo movement/operation/audit và **khôi phục role manager trong DB**. | `removingManagerRoleMustPreventFurtherPrivilegedWritesWithExistingToken`; xác thực trạng thái/role hiện hành hoặc auth-version, không đồng bộ quyền DB từ claims JWT cũ trong `AccountService.ensure`. |
| SEC-02 / cao | Admin khóa customer: DB `status=blocked`, refresh bị revoke, audit đúng actor. JWT cũ vẫn `POST /api/account/profile` được **200**, sửa `users`. | `adminDisablingCustomerRevokesRefreshAndPreventsFurtherWritesWithExistingAccessToken`; kiểm tra trạng thái tài khoản khi xác thực request và có cơ chế thu hồi access token. |
| SEC-03 / vừa | Cookie access hợp lệ + `Authorization: Basic ignored`, thiếu Origin: backend trả **200**, ghi profile. Thiếu Origin không có header này bị **403** đúng. | Nhánh `invalid-bearer-with-cookie` của `cookieMutationsCannotBypassOriginProtection`; chỉ miễn Origin cho bearer thực sự được xác thực, không dựa vào sự hiện diện của header. Chỉ chứng minh direct-backend bypass; chưa chứng minh CSRF từ trình duyệt qua CORS/BFF. |
| SEC-04 / cao, có điều kiện | Unit test legacy `resolveRole` với `APP_ENV=production`, DB lookup lỗi và email `member@sites.test` trả **admin** thay vì customer. | `tests/authz-security.test.ts`; bỏ hoặc ràng buộc scaffold fallback vào local, fail closed khi lookup lỗi. Đây là D1/compatibility helper, chưa xác minh khả năng đưa danh tính này vào deployment thật; không phải bypass JWT của Spring. |
| SEC-05 / vừa | 8 ca staff/manager thiếu quyền `@PreAuthorize` trả **500 / INTERNAL_ERROR** thay vì **403 / FORBIDDEN**. Snapshot DB không đổi, không có dữ liệu được trả. | `onlyAdminMayDisableCustomers`, `staffCannotAccessManagementReadEndpoints`, `staffCannotPerformManagerOnlyInventoryAdjustment`; xử lý access-denied riêng, không để generic exception handler biến thành 500. |
| SEC-06 / vừa | 20 ca Bean Validation trả **400 ProblemDetail** thay vì **422 / VALIDATION_ERROR**; malformed JSON trả 400 nhưng thiếu `INVALID_JSON` envelope. Cả 21 ca **không ghi DB**. | Các `invalidRegistration/Checkout/Profile/Address...` và `malformedJsonCannotMutateProfile`; thống nhất ưu tiên MVC ProblemDetails/advice với API contract. Đây là lỗi contract, không phải chấp nhận input sai. |

SEC-01 quan trọng hơn riêng cửa sổ JWT TTL: quyền bị xóa còn được ghi trở lại DB.
Không đổi business logic để khắc phục các lỗi trong đợt review này.

### Lệnh và kết quả thực thi

Chạy từ `platform`:

```sh
npm test
npm run test:coverage
npm run typecheck
npm run lint
npm run build
```

Chạy từ `platform/backend` với Docker daemon được phép:

```sh
mvn --batch-mode --no-transfer-progress clean verify
# Chạy riêng HTTP security, không bỏ assertion thất bại:
mvn --batch-mode --no-transfer-progress -Dit.test=HttpSecurityIntegrationTest verify
# Kiểm tra phụ thuộc thứ tự (cú pháp quoting cho shell POSIX):
mvn --batch-mode --no-transfer-progress -Dit.test=HttpSecurityIntegrationTest \
  '-Djunit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random' \
  -Djunit.jupiter.execution.order.random.seed=20261009 verify
# verify dừng vì regression đỏ; xuất coverage từ dữ liệu đã thu được:
mvn --batch-mode --no-transfer-progress jacoco:report
```

| Bộ kiểm tra | Pass | Fail | Error | Skip |
| --- | ---: | ---: | ---: | ---: |
| Frontend Vitest, gồm BFF route mocks | 70 | 1 | 0 | 0 |
| Backend unit | 75 | 0 | 0 | 0 |
| PostgreSQL service integration cũ | 15 | 0 | 0 | 0 |
| HTTP security integration mới | 53 | 32 | 0 | 0 |

`npm test`, coverage và `mvn verify` có exit code 1 do các regression trên, không
được diễn giải là pass. Typecheck, lint và build frontend pass. Không chạy smoke
test xuyên frontend–BFF–backend đang deploy; HTTP integration chỉ chứng minh
stack backend và BFF test chỉ gọi route với upstream mock.

Lần chạy clean đầy đủ và lần chạy HTTP theo thứ tự ngẫu nhiên seed `20261009`
cho cùng 53 pass / 32 fail của HTTP suite. Không chứng minh mọi thứ tự đều ổn,
nhưng không thấy phụ thuộc thứ tự trong hai lần chạy này. Sau khi kết thúc,
`docker ps --filter label=org.testcontainers=true` không còn container đang chạy.
Các lỗi setup ban đầu do test lifecycle đã sửa; các regression còn lại không
phải lỗi tải image, thiếu dependency hay Docker unavailable.

### Coverage và rủi ro còn lại

Vitest đã bật xuất coverage khi test fail và đưa `authz.ts` vào phạm vi đo.
Report hiện chỉ có **3 file** (`authz.ts`, `commerce-api-client.ts`,
`promotion-engine.ts`): line **87.82%**, branch **78.18%**, function **82.35%**,
statement **85.60%**. Riêng authz: line **61.53%**, branch **57.89%**, function
**55.55%**, statement **56.25%**. Không dùng tổng này để khẳng định toàn frontend
hoặc BFF đạt 80%: các file khác trong `coverage.include` chưa xuất hiện trong
report và cần kiểm tra tiếp instrumentation/remapping.

JaCoCo xuất thành công sau `clean verify` và lần chạy lại, chỉ dùng dữ liệu từ
những lần chạy mới này (không cộng execution data cũ trước clean):

| Phạm vi backend | Line | Branch | Method | Instruction |
| --- | ---: | ---: | ---: | ---: |
| Toàn backend | 66.02% | 48.76% | 69.68% | 61.52% |
| Package auth | 90.87% | 60.85% | 93.00% | 88.35% |
| Package account | 77.78% | 50.00% | 85.19% | 77.88% |

Report tại `backend/target/site/jacoco/index.html` và `coverage/index.html`;
test detail tại `backend/target/surefire-reports` và `backend/target/failsafe-reports`.
Chưa đạt mục tiêu 80% cho mọi module/metric trọng yếu; đặc biệt branch auth và
account còn thấp. Không hạ threshold để che lỗi hoặc tuyên bố release-ready.

Các khoảng trống còn lại: browser end-to-end và cookie Secure trên HTTPS,
production email/provider thật, upload multipart qua HTTP và side effect file,
ma trận role chi tiết cho mọi admin endpoint, concurrent refresh/reset/rate-limit,
trust boundary của forwarded IP, JWT revocation trên mọi luồng ghi, toàn bộ route
legacy D1, XSS/SQL injection fuzzing và kiểm thử tải. Positive controls mới không
thay thế toàn bộ ma trận quyền. Docker không khả dụng phải báo chưa xác minh;
HTTP suite mới cố ý fail setup thay vì tự skip.

Ưu tiên sửa riêng SEC-01/02 và đánh giá khả năng tiếp cận SEC-04, sau đó SEC-03,
error mapping SEC-05/06; chạy lại suite nguyên vẹn rồi bổ sung browser E2E.

## Báo cáo lỗ hổng

Không công bố lỗ hổng trong issue công khai. Gửi mô tả, tác động, bước tái hiện và bằng chứng tới đầu mối Security của dự án.
