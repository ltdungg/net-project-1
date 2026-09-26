# Kiến trúc nền tảng NÉT Commerce

## Stack

- **UI:** React 19, Vinext, TypeScript, Tailwind CSS, shadcn/base-ui.
- **BFF:** route `/api/commerce/**` chạy cùng origin với frontend, kiểm tra Origin,
  chuyển tiếp cookie/header cần thiết và chuẩn hóa URL media.
- **Backend:** Java 21, Spring Boot, Spring Security, JDBC và Flyway.
- **Data:** PostgreSQL 17 là nguồn dữ liệu nghiệp vụ; Redis 7 phục vụ catalog
  cache và giới hạn tần suất xác thực.
- **Files:** volume upload ở backend, phục vụ qua API media cùng origin.
- **Identity:** email/password, xác minh email, access JWT 15 phút và refresh
token opaque được băm trong PostgreSQL, xoay vòng tối đa 30 ngày. Cookie dùng
HttpOnly/SameSite=Strict; RBAC gồm customer, staff, manager và admin.
- **Guest order access:** token HMAC theo order/email, hết hạn sau bảy ngày và
  được chuyển qua header riêng; token không xuất hiện trong URL hay log truy vấn.
- **Admin insights:** report/finance lấy dữ liệu PostgreSQL; Copilot dùng rule
  engine phân loại prompt và dựng câu trả lời từ snapshot, không gọi LLM ngoài.
- **Delivery:** hai Docker Compose stack local, healthcheck xuyên
  frontend–backend. CI hiện kiểm tra frontend; backend được xác minh bằng
  Maven/Testcontainers.

## Biên module

```text
Storefront / Backoffice
          │
 Vinext Server Components ───────────────┐
          │                              │
 BFF /api/commerce                      │
          │
       Spring Boot REST API ◀────────────┘
          │
Auth ─ Catalog ─ Cart ─ Order ─ Payment ─ Inventory ─ Fulfillment
 │       │        │       │          │          │           │
 │       │        │       │          │          ├─ Reservation
 │       │        │       │          │          ├─ Receipt / Transfer / Stocktake
 │       │        │       │          │          └─ Immutable movement ledger
 │       │        │       ├─ Customer 360° / Segmentation
 │       │        │       └─ Report / Finance / Promotion / Copilot rules
 │       └─ Media upload
 └─ Account / Address / Wishlist
          │
 PostgreSQL + Flyway + Audit     Redis     Upload volume
```

`Order` là nguồn tạo fulfillment nhưng không phải nơi điều khiển trạng thái giao
hàng. Sau checkout, backend nhóm các dòng đã giữ tồn theo warehouse và tạo đúng
một fulfillment cho mỗi kho. Từ đó, module `Fulfillment` là write-authority duy
nhất cho các bước xuất kho, giao thành công, giao lỗi, hoàn và hủy kiện. Trang chi
tiết đơn chỉ liên kết sang màn hình vận chuyển để tránh hai luồng cập nhật xung
đột.

Phân khúc khách hàng là read model được tính từ tài khoản và các đơn đã thanh
toán, không phải nhãn nhập tay. Thứ tự ưu tiên là `at_risk` → `vip` → `loyal` →
`new` → `potential` → `prospect`; vì vậy một khách hàng chỉ thuộc một phân khúc
tại mỗi thời điểm và tự đổi nhóm khi hành vi mua hàng thay đổi.

Payment online hiện đi qua mock confirm và webhook HMAC để minh họa state/idempotency;
không có kết nối merchant thật. Fulfillment là quy trình vận hành thủ công:
back-office nhập carrier/tracking/ETA/chi phí và chuyển state; không gọi hoặc
nhận webhook hãng vận chuyển.

## Vòng đời fulfillment

```text
pending ──► processing ──► ready_to_ship ──► shipped ──► delivered
   │              │               │              │            │
   └──────────────┴───────────────┴──► cancelled │            └──► returned
                  │               │              ├──► failed ──► returned
                  └───────────────┴──► failed ───┴──► processing (thử lại)
```

State machine còn cho phép `shipped → returned`, `delivered → returned` và
`failed → processing|shipped|returned|cancelled`. Lệnh chuyển sang `failed`,
`returned` hoặc `cancelled` phải có lý do.

- `trackingNumber`, `carrierCode` và `carrierName` là bắt buộc trước khi ship.
- `expectedVersion` bắt buộc ở mọi lệnh cập nhật để phát hiện dữ liệu đã bị một
  người khác thay đổi.
- Chỉ reservation gắn với kiện hiện tại được consume khi ship hoặc release khi
  hủy; đơn nhiều kho không làm biến động nhầm tồn của kiện khác.
- Đơn đã `paid`/`authorized` không được hủy trực tiếp vì cần quy trình refund.
  Nếu một kiện cùng đơn đã ra khỏi kho, hệ thống cũng chặn hủy từng phần không an
  toàn.
- COD chỉ chuyển sang `paid` khi toàn bộ fulfillment của đơn đã `delivered`.
- `returned` sau khi đã xuất kho không tự tăng `on_hand`. Đây là hàng đang chờ
  kiểm định; kho tiếp nhận bằng chứng từ nghiệp vụ sau khi xác định tình trạng.

Phạm vi hiện tại là điều phối thủ công: nhân viên nhập carrier/tracking và cập
nhật hành trình trong backoffice. Webhook/API hai chiều với hãng vận chuyển,
chia nhiều kiện trong cùng một kho và quy trình tài chính cho giao/hoàn một phần
là các hạng mục mở rộng; hệ thống chủ động chặn các tổ hợp chưa thể đối soát an
toàn.

Copilot cũng bị giới hạn tương tự: endpoint chỉ đọc snapshot tổng hợp, trả cảnh
báo/hành động điều hướng và không chạy mutation. Việc tích hợp LLM, lưu lịch sử
hội thoại hoặc cho agent tự hành động không nằm trong baseline.

## Nguyên tắc dữ liệu

- Tiền lưu bằng integer cents để tránh sai số dấu phẩy động.
- Order item và promotion được snapshot khi đặt hàng.
- Payment webhook idempotent theo `(provider, provider_event_id)`.
- Inventory movement, order history và audit log chỉ được service ghi nối tiếp;
  hiện chưa có database policy riêng để ngăn sửa trực tiếp ngoài ứng dụng.
- `inventory_operations` là chứng từ nghiệp vụ; `inventory_operation_items` là dòng SKU. Mỗi phiếu có idempotency key duy nhất.
- On-hand không được cập nhật trực tiếp từ giao diện. API kho ghi đồng thời
  balance, operation, movement và audit trong một transaction PostgreSQL.
- Ràng buộc dữ liệu chặn `on_hand < 0`, `reserved < 0` và `reserved > on_hand`;
  checkout giữ tồn, shipping tiêu thụ và cancellation nhả reservation.
- `fulfillment_items` lưu snapshot dòng hàng và liên kết reservation; event của
  kiện được ghi nối tiếp trong `fulfillment_events`. Mỗi fulfillment thuộc duy
  nhất một order và warehouse trong phiên bản MVP.
- Trạng thái fulfillment tổng hợp ngược lên đơn để storefront hiển thị tiến độ,
  nhưng chi tiết công khai chỉ trả dữ liệu theo dõi cần thiết, không lộ dữ liệu
  vận hành nội bộ.
- Transaction nghiệp vụ ghi sự kiện vào outbox. Dispatcher/consumer cho outbox
  chưa nằm trong phạm vi phiên bản hiện tại.
- Mọi API ghi dữ liệu kiểm tra quyền ở Spring Security và validate bằng Jakarta
  Validation; frontend chỉ kiểm tra bổ sung cho trải nghiệm người dùng.

## Mô hình triển khai

Trình duyệt chỉ gọi endpoint cùng origin. BFF chuyển request đến API Java và
không lưu session trong bộ nhớ. Spring Boot cũng stateless ở access token; refresh
session được lưu và xoay vòng ở server. PostgreSQL là nguồn sự thật cho dữ liệu
quan hệ. Secret được cấp qua runtime environment, không đưa vào repository.

Frontend và backend dùng image multi-stage, chạy bằng user không đặc quyền.
Backend áp dụng forward-only Flyway migration khi Spring khởi động. V1–V7 đã là
bất biến; thay đổi schema tiếp theo phải bắt đầu bằng V8. Workflow CI hiện xác
minh typecheck, lint, unit test và build frontend; lệnh `mvn clean verify` chạy
unit/integration test backend với PostgreSQL Testcontainers. Baseline kiểm thử là
12 frontend tests và 69 backend tests.

Hai Compose stack là topology local/demo, chưa phải production reference
architecture. Object storage/CDN, secret manager, metrics/alert tập trung,
outbox dispatcher, email service, provider payment/shipping và DR production là
những capability chưa triển khai.

Các route D1 còn trong mã nguồn là lớp tương thích của prototype, không nằm trên
đường gọi của giao diện hiện tại và không phải nguồn dữ liệu nghiệp vụ.
