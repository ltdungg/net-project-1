# Giao dịch, đồng thời và idempotency

## 1. Checkout transaction

Checkout dùng một PostgreSQL transaction:

1. Tạo idempotency key đã scope và pg_advisory_xact_lock.
2. Replay nếu customer_orders đã có key.
3. Gom/sắp variant, chọn và khóa inventory_items đủ
   `available = on_hand - reserved`.
4. Reprice/voucher.
5. Ghi order, history, payment.
6. Ghi một fulfillment mỗi kho.
7. Với từng dòng: tăng reserved có điều kiện, ghi order item, reservation,
   fulfillment item và movement.
8. Ghi promotion snapshot/outbox, dọn cart rồi commit.

Không có provider call trong transaction.

## 2. Idempotency hiện thực

| Command | Guard |
|---|---|
| POST /api/orders | customer_orders.idempotency_key sau khi scope theo owner |
| Payment attempt | payments.idempotency_key |
| Payment webhook | UNIQUE(provider, provider_event_id) |
| Inventory receipt/transfer/count/adjust | inventory_operations.idempotency_key sau khi scope operation+actor |
| Inventory movement | inventory_movements.idempotency_key |
| Fulfillment create | fulfillments.idempotency_key và UNIQUE(order, warehouse) |
| Tracking/status | expectedVersion + row lock; không phải replay key |

Refund command không tồn tại; không mô tả refunds.idempotency_key như hiện thực.

## 3. Tranh chấp tồn

Checkout chỉ tăng reserved nếu on_hand - reserved đủ quantity. Inventory operation
khóa dòng tồn; transfer khóa theo variant và khóa hai đầu theo thứ tự ổn định.
Shipped khóa fulfillment/order và reservation/item liên quan.

Bất biến sau commit:

- 0 ≤ reserved ≤ on_hand.
- on_hand - reserved đủ cho checkout đã chấp nhận. Safety stock hiện chỉ tham
  gia chỉ số ATP trên dashboard, chưa tham gia guard của OrderService.
- Movement.balance_after bằng on_hand sau nghiệp vụ thay đổi tồn thực tế.
- Transfer có hai movement đối ứng.

## 4. Optimistic concurrency

fulfillments.version bắt đầu từ 1. PATCH tracking/status gửi expectedVersion;
service kiểm tra bản ghi đã khóa và WHERE id/version. Thành công tăng version,
xung đột trả FULFILLMENT_CHANGED.

inventory_items.version tăng ở mọi cập nhật balance, nhưng public inventory
commands hiện dùng row lock thay vì yêu cầu expectedVersion trong payload.

## 5. Guest token không phải session DB

Guest order token là HMAC stateless, không có table/row lock. Token mang epoch
hết hạn và chữ ký trên order ID + email + expiry. TTL 7 ngày. Việc đọc order vẫn
truy vấn email snapshot trước khi verify và trả 404 chung khi thất bại.

## 6. Scheduler hết hạn

Reservation expiry chọn tối đa 200 active row quá hạn của order
pending_payment/pending|failed bằng FOR UPDATE SKIP LOCKED. Trong cùng transaction:

- giảm reserved;
- đặt reservation expired/released_at;
- ghi movement release;
- hủy order và fulfillment còn trước xuất kho; order.payment_status cũng đổi
  cancelled nhưng row payments chưa được cập nhật (known defect KD-INV-01);
- ghi history, fulfillment event, outbox và audit.

Hai defect hiện trạng: KD-INV-01 không cập nhật row payments khi hủy order và
KD-INV-02 không chọn reservation COD vì COD order ở confirmed/cod_pending dù
có expires_at 30 ngày.

## 7. Race payment webhook

Webhook khóa payment/order và chống trùng provider event, nhưng policy success
hiện chỉ xét payment statuses, không xét order.status. KD-PAY-01 cho phép late
success sau cancel ghi succeeded/paid vào aggregate order cancelled. Tiêu chí
đúng là reject/no-apply hoặc đưa sang đối soát, vẫn lưu event theo policy được chọn.

## 8. Retry

- Idempotent command có thể retry cùng key.
- Optimistic conflict yêu cầu reload version, không retry mù.
- Deadlock/serialization có thể retry toàn transaction với backoff ở caller.
- Provider webhook retry phải giữ nguyên provider_event_id.
- Outbox hiện chưa được dispatch; không tuyên bố eventual side effect đã hoàn tất.
