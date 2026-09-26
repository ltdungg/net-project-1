# Danh mục sự kiện miền

## 1. Outbox event đang được ghi

| event_type | Aggregate | Nguồn |
|---|---|---|
| user.registered | user | Đăng ký |
| user.email_verified | user | Xác minh email |
| user.verification_requested | user | Gửi lại xác minh |
| user.logged_in | user | Đăng nhập |
| user.password_reset_requested | user | Quên mật khẩu |
| user.password_reset | user | Đặt lại mật khẩu |
| order.created | order | Checkout |
| order.status.changed | order | Admin/order reconcile |
| order.payment_expired | order | Reservation expiry |
| payment.succeeded | order | Mock/webhook |
| payment.failed | order | Webhook |
| payment.refunded | order | Webhook full refund |
| fulfillment.created | fulfillment | Checkout |
| fulfillment.tracking.updated | fulfillment | Cập nhật vận đơn |
| fulfillment.status.changed | fulfillment | Transition |
| customer.status.changed | customer | Admin enable/disable |

Danh sách được ghi theo tên chữ thường có dấu chấm như source code, không dùng
tên viết hoa giả định.

## 2. Bảng lịch sử khác outbox

- order_status_history lưu chuyển trạng thái đơn.
- fulfillment_events lưu trạng thái/tracking event của từng kiện.
- inventory_movements là sổ cái biến động/điểm cân bằng tồn.
- payment_events là receipt webhook/mock với provider event ID.
- audit_logs lưu actor, before/after và correlation ID cho thao tác nhạy cảm.

Các bảng này không thay thế lẫn nhau.

## 3. Payload tối thiểu

- Không chứa password, raw token, secret, full address hoặc payment raw payload
  nếu consumer không cần.
- Auth event hiện có thể chứa email và actionTokenId; raw token không được ghi.
- Fulfillment event/outbox dùng fulfillment/order/shipment identifier, trạng thái
  và tracking public cần thiết.
- Event payment dùng order/payment state và provider metadata đã kiểm soát.

## 4. Giới hạn hiện tại

outbox_events được ghi transactionally nhưng chưa có dispatcher/consumer. Vì vậy:

- status thường còn pending;
- chưa bảo đảm email, cache invalidation hay tích hợp ngoài đã chạy;
- runbook phải theo dõi backlog;
- việc thêm dispatcher cần inbox/dedup, retry/backoff và dead-letter.

## 5. Kiểm thử

- Transaction rollback không để outbox/event/history mồ côi.
- Idempotent replay không tạo event business trùng.
- Payment webhook duplicate được ignore nhưng receipt vẫn truy vết theo contract.
- Fulfillment version conflict không ghi event/audit/movement.
- Payload scan không thấy password, guest/access/refresh token hoặc secret.
