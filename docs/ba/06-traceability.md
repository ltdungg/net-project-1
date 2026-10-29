# Ma trận truy vết yêu cầu

## 1. Ma trận từ yêu cầu đến hiện thực

| Yêu cầu | Use case | Thành phần mã/schema | API | Bằng chứng chính |
|---|---|---|---|---|
| FR-AUTH-01…07 | UC-04 | users, roles, user_roles, refresh_tokens, auth_tokens; AuthService | /api/auth/* | Auth unit/integration, token TTL/rotation |
| FR-ACC-01 | UC-05, UC-06 | addresses, wishlist_items, customer_orders; AccountService | /api/account/*, GET /api/orders | Ownership/RBAC tests |
| FR-GUEST-01…04 | UC-03, UC-07 | JwtService, OrderService, BFF proxy | GET /api/orders/{id}/guest | HMAC expiry/wrong-order/header tests |
| FR-INV-01…06 | UC-08 | six inventory tables; InventoryService | /api/admin/inventory/* | PostgreSQL transaction/concurrency tests |
| FR-FUL-01…10 | UC-03, UC-09 | fulfillments, fulfillment_items, fulfillment_events | /api/admin/fulfillments/* | State matrix, per-shipment stock, COD tests |
| FR-CUS-01…05 | UC-10 | admin_customer_segments; AdminCustomerService | /api/admin/customers/* | Segment precedence/filter/RBAC tests |
| FR-RET-01…04 | UC-13 | fulfillments/events + inventory operation/receipt; chưa có inspection entity | PATCH fulfillment status, POST inventory receipts | Không auto-restock, receipt idempotency/audit |
| FR-ORD-01…04 | UC-03, UC-06, UC-07 | order/payment/inventory/fulfillment aggregate | /api/orders | Idempotent replay and rollback tests |
| NFR-02/03 | UC-03, UC-08, UC-09 | Transaction, advisory lock, row lock, version | Write APIs | Concurrent/replay/conflict suites |
| NFR-04/05 | UC-04, UC-07 | Spring Security, Origin filter, rate limiter | Auth/guest/admin | Security negative tests |
| NFR-09 | Toàn bộ | Flyway V1–V7 | Startup | Assert 33 tables + 1 view |

## 2. Ma trận nghiệm thu chi tiết

| ID kiểm thử | Điều kiện | Kết quả mong đợi | Mức |
|---|---|---|---|
| UAT-AUTH-01 | Đăng ký email mới | User pending, role customer, token verify 24h | Must |
| UAT-AUTH-02 | Verify rồi login/refresh | Active; cookie đúng TTL/path; refresh cũ revoked | Must |
| UAT-AUTH-03 | Reset password | Token consumed, refresh token cũ bị revoked | Must |
| UAT-GST-01 | Guest đọc đơn với header/token đúng | 200 và chỉ public order detail | Must |
| UAT-GST-02 | Token sai/hết 7 ngày/dùng sai order | 404 ORDER_NOT_FOUND | Must |
| UAT-GST-03 | Guest mở trang thanh toán online | Client gửi header, URL không có raw token và order tải thành công | Đã kiểm tra local 29/10/2026: checkout guest → mock thất bại → thử lại thành công → theo dõi đơn |
| UAT-PAY-SEPAY-01 | Guest chọn SePay Sandbox | QR, số tiền và nội dung riêng; kiểm tra trạng thái qua BFF | Đã kiểm tra UI 29/10/2026 với API sandbox thật: tạo đơn, tải tài khoản/QR, sao chép, đối soát pending. Chưa tạo giao dịch trên dashboard vì chưa có phiên đăng nhập SePay |
| UAT-PAY-SEPAY-02 | Giao dịch khớp/sai/trùng; đơn hủy hoặc hết hạn | Chỉ khớp mới paid, không ghi nhận lặp hoặc khôi phục đơn terminal | 20 test mới đạt: 6 integration PostgreSQL với provider giả lập, 14 test adapter/policy; chưa thay thế kiểm thử E2E giao dịch tạo trong SePay Test mode |
| UAT-INV-01 | 20 checkout tranh SKU cuối | Tối đa một reservation hợp lệ; reserved không vượt on_hand | Must |
| UAT-INV-02 | Transfer kho | Hai movement đối ứng, operation/item/audit khớp | Must |
| UAT-INV-03 | Repost cùng idempotency | Không lặp balance/movement | Must |
| UAT-INV-04 | Online reservation hết hạn | Order và payment record cùng cancelled; tồn được release | Must — payment record đang fail bởi KD-INV-01 |
| UAT-INV-05 | COD reservation quá 30 ngày | Reservation được release/cancel theo policy và reserved giảm đúng | Must — đang fail bởi KD-INV-02 |
| UAT-FUL-01 | Đơn lấy hàng từ hai kho | Hai fulfillment, item và reservation map đúng | Must |
| UAT-FUL-02 | Ship một kiện | Chỉ tồn/reservation của kiện đó bị consume | Must |
| UAT-FUL-03 | Ship thiếu tracking | 422 TRACKING_REQUIRED, không thay đổi dữ liệu | Must |
| UAT-FUL-04 | Hai staff dùng version cũ | Một thành công, một FULFILLMENT_CHANGED | Must |
| UAT-FUL-05 | Tất cả kiện COD delivered | Payment/order chuyển paid đúng một lần | Must |
| UAT-FUL-06 | Returned sau shipped | Không tự tăng on_hand | Must |
| UAT-FUL-07 | Cancel riêng một kiện khi còn sibling active | PARTIAL_CANCEL_UNSUPPORTED; không có side effect | Must |
| UAT-FUL-08 | Return một kiện khi sibling delivered | PARTIAL_RETURN_UNSUPPORTED; không có side effect | Must |
| UAT-SEG-01 | Khách thỏa VIP và at-risk | Nhận at_risk do ưu tiên cao hơn | Must |
| UAT-SEG-02 | Segment không có khách | API vẫn trả định nghĩa với customers=0 | Must |
| UAT-SEC-01 | Staff đổi status khách | 403; chỉ Admin được phép | Must |
| UAT-RET-01 | Chuyển kiện đã ship sang returned | Không thay đổi on_hand/reserved đã consumed | Must |
| UAT-RET-02 | Hàng đạt kiểm định được nhập lại | Receipt tăng đúng on_hand; có operation/movement/audit và replay không tăng lặp | Must |
| UAT-PAY-01 | payment.succeeded đến sau khi order cancelled | Không ghi paid/succeeded; event được reject hoặc chuyển đối soát | Must — đang fail bởi KD-PAY-01 |

## 3. Ma trận tài liệu dữ liệu

| Đối tượng | Tài liệu nguồn |
|---|---|
| 33 bảng và 1 view | 05-data-model.md, data-dictionary/README.md |
| Trạng thái | database-design/01-trang-thai-va-chuyen-doi.md |
| Transaction/idempotency | database-design/02-giao-dich-va-dong-thoi.md |
| Quyền CRUD | database-design/03-ma-tran-crud-va-quyen.md |
| Flyway V1–V7 | database-design/04-thu-tu-migration-va-phu-thuoc.md |
| Token/PII/retention | database-design/05-bao-mat-va-luu-tru.md |
| Kiểm thử schema/data | database-design/06-danh-muc-kiem-thu-du-lieu.md |
| Endpoint/bảng | database-design/07-anh-xa-api-voi-bang.md |
| Outbox/event | database-design/08-danh-muc-su-kien-domain.md |

## 4. Quy trình cập nhật

1. Mỗi thay đổi nghiệp vụ nhận ID và cập nhật BRD, use case, rule, diagram, RTM.
2. Mỗi thay đổi schema đi qua migration mới; không sửa file V1–V7 đã chạy.
3. Từ điển dữ liệu được cập nhật trong cùng pull request với migration.
4. Evidence ghi build, Flyway version, dữ liệu đã ẩn PII, expected/actual,
   correlation ID và người xác nhận.
5. Không đánh dấu requirement hoàn thành chỉ dựa trên UI; cần test API và
   transaction PostgreSQL tương ứng.

## 5. Known defect đang mở

| ID | Requirement bị ảnh hưởng | Bằng chứng | Trạng thái |
|---|---|---|---|
| KD-GUEST-01 | FR-GUEST-02/04, BR-GST-03/06, NFR-04 | Online payment đã chuyển sang `X-Guest-Order-Token`, không ghép token vào URL | Fixed 29/10/2026; kiểm thử contract frontend, HTTP PostgreSQL và browser checkout guest đã đạt |
| KD-INV-01 | BR-INV-11, NFR-02 | InventoryService đổi customer_orders.payment_status nhưng không update payments.status | Open; release tồn đạt, payment aggregate không đồng bộ |
| KD-INV-02 | FR-ORD-04, BR-INV-11, NFR-02/03 | COD tạo confirmed/cod_pending với TTL 30 ngày; expiry query chỉ chọn pending_payment + pending/failed | Open; COD reserved có thể giữ vô hạn |
| KD-PAY-01 | BR-PAY-02/04, NFR-02/03 | Webhook policy không nhận order.status; late success sau cancel vẫn apply succeeded/paid | Open; order/payment aggregate có thể mâu thuẫn |
