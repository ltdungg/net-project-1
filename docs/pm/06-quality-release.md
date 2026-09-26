# Kế hoạch chất lượng, UAT, đóng gói và nghiệm thu

## 1. Chiến lược chất lượng

Chất lượng được xây từ requirement đến release candidate, không dồn về cuối.
Áp dụng test pyramid kết hợp exploratory test và NFR validation.

Baseline bằng chứng hiện tại là **69 kiểm thử backend** (unit + integration với
PostgreSQL Testcontainers) và **12 kiểm thử frontend**, kèm typecheck, build và
smoke test Docker. Đây là bằng chứng kỹ thuật của đồ án, không thay thế kiểm thử
provider, tải dài hạn, pentest hoặc DR rehearsal của production.

| Lớp kiểm thử | Phạm vi | Người phụ trách | Mục tiêu tự động hóa |
|---|---|---|---|
| Static/unit | Pricing, promotion, state rules, validation, lint/type | FE/BE1/BE2 | High |
| Component/API | Catalog/cart/order/payment/inventory contracts | BE1/BE2; DO giữ gate | High for critical APIs |
| Integration | PostgreSQL/Flyway, auth, inventory, payment webhook và fulfillment | BE2/DO | Critical paths + failures trong 69 backend tests |
| E2E/smoke | Storefront→BFF→Java health/catalog; authenticated flows theo UAT | DO với FE/BE1/BE2 | Small stable smoke/regression |
| Exploratory | UX, edge cases, device/browser, operations | PM/FE + business testers | Manual charter |
| NFR | Performance, accessibility, security và resilience local | DO; FE hỗ trợ accessibility | Tool-assisted; DR production ngoài baseline |

## 2. Ma trận phạm vi kiểm thử

- Functional: happy, alternate, negative, boundary, validation, state transition.
- Data: migration, snapshot, rounding, timezone, encoding, duplicate/idempotency.
- Integration: migration, duplicate/out-of-order webhook, idempotency, optimistic
  version conflict và failure transitions; provider thật được để ngoài baseline.
- Security: auth/authz, session, input, rate limit, secret/PII/logs và dependency
  audit; container/pentest production là hạng mục mở rộng.
- Performance: browse/search/PDP/cart/checkout, SKU-last-item concurrency, image/Web Vitals.
- Compatibility/accessibility: browser/device matrix, keyboard, focus, semantics, contrast, screen reader sample.
- Operational: Docker health/log, migration forward-only, backup/restore design,
  manual shipping fallback và support traceability; metrics/alert tập trung là gap.

## 3. Mức độ lỗi và ngưỡng phát hành

| Mức độ | Ví dụ định nghĩa | SLA/quy tắc phát hành |
|---|---|---|
| Sev-1 Critical | Data loss, security exploit, site/order/payment unavailable | Immediate; release blocker |
| Sev-2 High | Core purchase/fulfillment broken, wrong money/tồn, no workaround | Release blocker |
| Sev-3 Medium | Material issue with workaround/non-core degradation | Fix or documented risk acceptance |
| Sev-4 Low | Cosmetic/minor usability | Backlog unless acceptance affected |

## 4. Kế hoạch UAT

### Điều kiện bắt đầu

- Must-have code complete/deployed; system/integration regression pass.
- Stable Docker build/data; accounts cho customer/staff/manager/admin sẵn sàng;
  không yêu cầu provider sandbox trong baseline.
- UAT scripts mapped RTM; known issues and workarounds disclosed.
- Training/orientation completed; support triage channel active.

### Kịch bản nghiệp vụ

1. Đăng ký, xác minh email local, đăng nhập/refresh/logout và quên/đặt lại mật
   khẩu; role không đủ quyền bị từ chối.
2. Guest tìm/lọc, chọn size/màu, áp/gỡ voucher và COD checkout idempotent.
3. Guest chỉ đọc đúng đơn bằng `X-Guest-Order-Token` trong 7 ngày; token sai,
   thiếu hoặc của đơn khác bị từ chối.
4. Member dùng địa chỉ lưu, wishlist, mua hàng và xem lịch sử/chi tiết đơn.
5. Payment mock/webhook xử lý success/failed/pending/duplicate; endpoint mock bị
   khóa ngoài `APP_ENV=local`.
6. Admin tạo product/variant/media; nhập, chuyển, kiểm kê, điều chỉnh và export
   tồn; last-item concurrent checkout không oversell.
7. Đơn nhiều kho tự tạo đúng một fulfillment/kho. Operator cập nhật tracking rồi
   đi `pending→processing→ready_to_ship→shipped→delivered`; chuyển `shipped` mới
   consume đúng reservation của kiện.
8. Hai operator dùng cùng version: request cũ nhận
   `FULFILLMENT_VERSION_CONFLICT`; không ghi đè event mới.
9. Hủy trước ship nhả tồn; đơn paid/authorized nhận `REFUND_REQUIRED`; returned
   sau ship không tự cộng `on_hand` trước kiểm định.
10. COD chỉ thành paid khi mọi kiện delivered; khách thấy timeline công khai mà
    không lộ dữ liệu vận hành nội bộ.
11. Customer list/detail/segments đúng thứ tự rule; Admin mới đổi được trạng thái
    tài khoản; audit có actor/correlation.
12. Report/finance/promotion đúng quyền. Copilot đọc snapshot và đề xuất link
    nhưng không tự mutation và không được mô tả như LLM ngoài.

### Điều kiện hoàn thành

- 100% Must-have scenarios pass; 69 backend tests, 12 frontend tests,
  typecheck/build/smoke đạt; 0 Sev-1/2; deviations có approval.
- PM/PO và người phê duyệt ký UAT summary.
- RTM có evidence; seed data/content và known-limit list đạt gate nghiệm thu.

## 5. Danh sách kiểm tra sẵn sàng phát hành

### Sản phẩm/nghiệp vụ

- [ ] Scope/known limitations/release notes approved.
- [ ] Giá, SKU, tồn, ảnh, size guide, policy và support content signed off.
- [ ] Customer segments, inventory/fulfillment dashboard và CS order lookup được xác minh.

### Kỹ thuật/chất lượng

- [ ] Source revision và image được nhận diện; CI/tests/audit hiện có đều pass.
- [ ] Local config/secrets/origin và payment webhook HMAC được xác minh; mọi
      hạng mục production chưa có phải nằm trong known limits.
- [ ] Flyway V1–V7 và upgrade path đạt; không sửa migration đã chạy; thay đổi mới dùng V8+.
- [ ] Docker health/log và correlation ID được xác minh; centralized metrics/alert là gap đã ghi nhận.
- [ ] Performance/accessibility/security findings within accepted threshold.
- [ ] Rollback image/roll-forward migration và thẩm quyền quyết định được ghi;
      không rollback schema bằng cách sửa/xóa migration cũ.

### Vận hành

- [ ] Catalog/inventory reconciliation completed.
- [ ] Người dùng demo theo role customer/staff/manager/admin được hướng dẫn; quyền theo least privilege.
- [ ] Runbook, known limits, dữ liệu demo và roster 5 người được xác nhận.
- [ ] Tracking thủ công, payment mock và quy trình kiểm định hàng hoàn được hiểu đúng.

## 6. Kế hoạch đóng gói và nghiệm thu trong tuần 8

| Thời điểm tương đối | Hoạt động | Người phụ trách | Cách xác minh |
|---|---|---|---|
| T-5d | Freeze scope/seed data; chạy Flyway trên database test sạch | PM/BE1/DO | Migration/test report |
| T-2d | Final release candidate, regression, backup | DO + FE/BE1/BE2 | Signed checklist |
| T-1d | Đạt/Không đạt release candidate; xác nhận 5 người và known limits | Người phê duyệt/PM | Decision recorded |
| T-2h | Backup dữ liệu demo; ghi image/source revision; baseline health | DO | Backup/build/health evidence |
| T0 | Khởi động backend rồi frontend bằng Docker Compose | DO | Deployment log |
| T+15m | Smoke: health, catalog, login, customer segments và fulfillment read | FE/BE1/BE2; PM ghi | Smoke report |
| T+30m | UAT nghiệp vụ ghi ở mục 4 | PM/cả đội | UAT evidence |
| T+2h | Đối chiếu order/payment/inventory/fulfillment/audit | BE1/BE2/PM | Transaction evidence |
| T+1d | Tổng hợp lỗi, bài học và bàn giao trước khi hết tuần 8 | PM/cả đội | Báo cáo kết thúc |

## 7. Điều kiện kích hoạt quay lui

- Sev-1/security incident; corrupt/inconsistent order/payment/inventory data.
- Core purchase unavailable hoặc order/payment/inventory/fulfillment sai nhất quán.
- Migration không thể reconcile; health/log/correlation mất ở critical path.
- Rollback gây rủi ro data lớn hơn thì chuyển sang roll-forward/feature disable theo quyết định incident commander.

## 8. Giới hạn sau nghiệm thu

- Baseline kết thúc ở tuần 8; không ngầm cộng tuần 9/hypercare vào timeline 2 tháng.
- Nếu đưa lên production, phải mở phase riêng cho provider/email, cloud/TLS/CDN,
  centralized observability, secret manager, load/pentest, backup/restore và DR rehearsal.
- Mọi production fix vẫn cần review, test và chiến lược roll-forward tương thích
  với Flyway; không sửa migration đã chạy.

## 9. Kết thúc dự án

- Người phê duyệt chấp nhận deliverables và danh sách giới hạn.
- Lessons learned, outcome baseline và benefits review date (30/60/90 ngày).
- Handover repository, cách chạy, test evidence, dữ liệu demo và quy trình secret;
  SLA/dashboard production chưa được coi là đã có.
- Archive decision/change/RAID/test/release evidence theo retention policy.
