# Danh mục trạng thái và chuyển đổi

Tất cả giá trị dưới đây là chữ thường như database/API.

## 1. Users

Schema cho phép: pending, active, locked, blocked, disabled, deleted.

| Luồng hiện thực | Chuyển đổi/điều kiện |
|---|---|
| Register | Không có → pending |
| Verify email | pending/active → active; đặt email_verified_at |
| Login sau khi lock hết hạn | locked → active; xóa locked_until |
| Admin disable | active/pending → blocked qua API status disabled; cần reason |
| Admin enable | blocked/disabled/locked → active |
| Reset password | active/locked → active; thu hồi refresh token |

API danh sách khách quy về ba nhãn active, disabled, pending. blocked, disabled và
locked đều hiển thị disabled; endpoint PATCH chỉ nhận active hoặc disabled.

## 2. Catalog và kho

- products.status: draft, active, archived.
- categories.status: active, inactive, archived.
- product_variants.status: active, inactive, archived.
- warehouses.status: active, inactive, archived.
- promotions.status: draft, active, inactive, expired, archived.
- coupons.status: active, inactive, exhausted, expired, archived.
- inventory_operations.status cho phép draft, posted, cancelled; API hiện tại
  luôn tạo posted, chưa có workflow draft/approve.

## 3. Order

~~~mermaid
stateDiagram-v2
    [*] --> pending_payment: online
    [*] --> confirmed: COD
    pending_payment --> confirmed
    pending_payment --> cancelled
    confirmed --> processing
    confirmed --> cancelled
    processing --> ready_to_ship
    processing --> cancelled
    ready_to_ship --> shipped: qua fulfillment
    ready_to_ship --> cancelled
    shipped --> delivered: qua fulfillment
    shipped --> returned: qua fulfillment
    delivered --> returned: qua fulfillment
    cancelled --> [*]
    returned --> [*]
~~~

Schema còn cho packed và refunded để tương thích dữ liệu; AdminOrderStateMachine
không tạo packed/refunded. Direct order command shipped, delivered, returned bị
chặn bằng USE_FULFILLMENT_WORKFLOW.

Order.payment_status cho phép pending, cod_pending, authorized, paid, failed,
cancelled, partially_refunded, refunded. Payment record status cho phép pending,
authorized, succeeded, paid, failed, cancelled, partially_refunded, refunded.
Luồng hiện tại chủ yếu dùng pending → succeeded và order pending/cod_pending →
paid; webhook có thể đưa succeeded/paid → refunded/refunded.

Order.fulfillment_status cho phép unfulfilled, reserved, partially_fulfilled,
shipped, fulfilled, returned, cancelled và được tổng hợp từ mọi fulfillment.

## 4. Reservation

| Từ | Sang | Tác nhân |
|---|---|---|
| Không có | active | Checkout tăng reserved |
| active | consumed | Fulfillment shipped; giảm on_hand và reserved |
| active | released | Cancel trước xuất kho; giảm reserved |
| active | expired | Scheduler gặp payment quá TTL; giảm reserved và hủy order/fulfillment |

Schema còn cho returned/cancelled nhưng service hiện không dùng hai giá trị này
cho luồng shipment return. Hàng đã shipped giữ reservation consumed đến khi kho
kiểm định; không đổi nó thành returned.

## 5. Fulfillment

~~~mermaid
stateDiagram-v2
    [*] --> pending
    pending --> processing
    pending --> cancelled
    processing --> ready_to_ship
    processing --> failed
    processing --> cancelled
    ready_to_ship --> shipped
    ready_to_ship --> failed
    ready_to_ship --> cancelled
    shipped --> delivered
    shipped --> failed
    shipped --> returned
    failed --> processing
    failed --> shipped
    failed --> returned
    failed --> cancelled
    delivered --> returned
    returned --> [*]
    cancelled --> [*]
~~~

Quy tắc side effect:

- failed, returned, cancelled cần reason.
- shipped cần carrier/tracking và consume tồn đúng kiện.
- failed tăng delivery_attempts.
- delivered đặt delivered_at; shipped đặt shipped_at.
- returned sau shipment không cộng tồn.
- cancel riêng bị chặn nếu còn sibling khác cancelled/returned; whole-order
  cancel chỉ hợp lệ trước dispatch.
- không trộn sibling delivered và returned trong bản hiện tại.
- mỗi transition tăng version, ghi fulfillment_events, audit/outbox và reconcile order.

## 6. Payment event và outbox

- payment_events không có cột status. processed_at null nghĩa chưa xử lý; lỗi
  lưu processing_error.
- outbox_events.status cho phép pending, processing, processed, failed,
  dead_letter. Phiên bản hiện tại chỉ ghi pending, chưa có dispatcher.

## 7. Kiểm soát

- Transition ngoài ma trận phải trả stable error và không có side effect.
- State chính, history/event, inventory và outbox phải commit/rollback cùng transaction.
- expectedVersion bảo vệ fulfillment; inventory dùng row lock/conditional update.
- Không chỉnh status trực tiếp trong DB ngoài migration/runbook khẩn cấp có phê duyệt.
