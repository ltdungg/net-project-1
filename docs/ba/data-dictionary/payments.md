# Bảng payments

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Payment record của order cho COD hoặc online/mock.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| order_id | varchar(64) | Không | FK customer_orders |
| provider | varchar(60) | Không | cod/mockpay… |
| provider_payment_id | varchar(160) | Có | UNIQUE cùng provider khi có |
| method | varchar(40) | Không | cod/online/card/bank_transfer/e_wallet |
| status | varchar(40) | Không | pending; CHECK V3 |
| amount_cents | bigint | Không | ≥0 |
| currency | varchar(3) | Không | VND; ba chữ hoa |
| idempotency_key | varchar(160) | Không | UNIQUE |
| failure_code | varchar(100) | Có | — |
| failure_message | varchar(500) | Có | — |
| captured_at | timestamptz | Có | Không trước created_at |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (order_id, created_at DESC). Status cho phép pending, authorized,
succeeded, paid, failed, cancelled, partially_refunded, refunded. Service hiện
dùng succeeded cho payment record và paid cho order payment_status. COD capture
khi tất cả kiện delivered.

Không có attempt_no/provider_status và không có quan hệ refunds table. Full
refund hiện được ghi trực tiếp thành refunded từ webhook.

Known defect KD-INV-01: reservation expiry hiện chỉ đặt payment_status trên
customer_orders thành cancelled; row payments tương ứng vẫn pending. Đây là sai
lệch runtime cần được kiểm thử và sửa trong cùng transaction.

Known defect KD-PAY-01: webhook success đến muộn sau cancel vẫn có thể đặt row
này succeeded và customer_orders.payment_status paid trong khi order.status vẫn
cancelled, vì webhook policy chưa xét order status.

Kiểm thử amount/currency, provider ID, duplicate success, stale failure và full refund.
