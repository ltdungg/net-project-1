# Ánh xạ API với bảng và view

Đường dẫn dưới đây là Java API. Trình duyệt gọi cùng path sau tiền tố
/api/commerce tại BFF.

| API | Đọc | Ghi |
|---|---|---|
| POST /api/auth/register | users, roles | users, user_roles, auth_tokens, outbox_events |
| POST /api/auth/verify-email | auth_tokens, users, roles | auth_tokens, users, refresh_tokens, outbox_events |
| POST /api/auth/resend-verification | users | auth_tokens, outbox_events |
| POST /api/auth/login | users, user_roles, roles | users, refresh_tokens, outbox_events |
| POST /api/auth/refresh | refresh_tokens, users, roles | refresh_tokens cũ/new |
| POST /api/auth/logout | refresh_tokens | refresh_tokens.revoked_at |
| POST /api/auth/forgot-password | users | auth_tokens, outbox_events |
| POST /api/auth/reset-password | auth_tokens, users | users, auth_tokens, refresh_tokens, outbox_events |
| GET /api/auth/me | users, user_roles, roles | — |
| GET/POST /api/account/profile | users | users |
| GET/POST/PATCH/DELETE /api/account/addresses | users, addresses | addresses |
| GET/POST/DELETE /api/account/wishlist | wishlist_items, products, product_media, product_variants, inventory_items | wishlist_items |
| GET /api/products, /api/products/{slug} | products, product_categories, categories, product_variants, product_media, inventory_items, warehouses | — |
| GET/POST /api/cart | carts, cart_items, product_variants, products, product_media, promotions, coupons | carts, cart_items |
| PATCH/DELETE /api/cart/items/{id} | cart_items, product_variants | cart_items |
| POST/DELETE /api/vouchers | carts, cart_items, product_variants, promotions, coupons | carts.coupon_code |
| POST /api/orders | products, product_variants, product_media, inventory_items, warehouses, carts, promotions, coupons, order_promotions | customer_orders, order_items, order_status_history, payments, inventory_items, inventory_reservations, inventory_movements, fulfillments, fulfillment_items, fulfillment_events, order_promotions, promotions, coupons, carts, cart_items, outbox_events |
| GET /api/orders | customer_orders | — |
| GET /api/orders/{id} | customer_orders, order_items, order_status_history, fulfillments | — |
| GET /api/orders/{id}/guest | customer_orders, order_items, order_status_history, fulfillments | — |
| POST /api/payments/mock/confirm | payments, customer_orders | payments, customer_orders, order_status_history, outbox_events |
| POST /api/payments/webhook | payments, customer_orders, payment_events | payment_events, payments, customer_orders, order_status_history, outbox_events |
| GET /api/admin/inventory | inventory_items, inventory_operations, inventory_operation_items, inventory_movements, product_variants, products, warehouses | — |
| GET /api/admin/inventory/export | inventory_items, product_variants, products, warehouses | —; trả CSV |
| POST /api/admin/inventory/receipts | inventory_items | inventory_operations, inventory_operation_items, inventory_movements, inventory_items, audit_logs |
| POST /api/admin/inventory/transfers | inventory_items, warehouses | inventory_operations, inventory_operation_items, inventory_movements, inventory_items, audit_logs |
| POST /api/admin/inventory/counts | inventory_items | inventory_operations, inventory_operation_items, inventory_movements, inventory_items, audit_logs |
| POST /api/admin/inventory/adjust | inventory_items | inventory_operations, inventory_operation_items, inventory_movements, inventory_items, audit_logs |
| POST /api/admin/inventory/reservations/release-expired | inventory_reservations, inventory_items, customer_orders, fulfillments | inventory_reservations, inventory_items, inventory_movements, customer_orders, order_status_history, fulfillments, fulfillment_events, audit_logs, outbox_events; chưa ghi payments do KD-INV-01 |
| GET /api/admin/customers | admin_customer_segments | — |
| GET /api/admin/customers/segments | admin_customer_segments | — |
| GET /api/admin/customers/{id} | users, roles, user_roles, addresses, admin_customer_segments, customer_orders | — |
| PATCH /api/admin/customers/{id}/status | users | users, refresh_tokens, audit_logs, outbox_events |
| GET /api/admin/fulfillments | fulfillments, customer_orders, warehouses, fulfillment_items | — |
| GET /api/admin/fulfillments/{id} | fulfillments, fulfillment_items, fulfillment_events, customer_orders, warehouses, order_items, inventory_reservations | — |
| PATCH /api/admin/fulfillments/{id}/tracking | fulfillments | fulfillments, fulfillment_events, audit_logs, outbox_events |
| PATCH /api/admin/fulfillments/{id}/status | fulfillments, customer_orders, fulfillment_items, inventory_reservations, inventory_items, payments | fulfillments, fulfillment_events, customer_orders, order_status_history, inventory_reservations, inventory_items, inventory_movements, payments, audit_logs, outbox_events |
| GET /api/admin/orders, /api/admin/orders/{id} | customer_orders, order_items, order_status_history, inventory_reservations, inventory_items, payments, fulfillments | — |
| PATCH /api/admin/orders/{id}/status | customer_orders, fulfillments, inventory_reservations, inventory_items, payments | customer_orders, order_status_history, fulfillments, fulfillment_events, inventory_reservations, inventory_items, inventory_movements, payments, audit_logs, outbox_events theo command |
| GET /api/admin/products | catalog, inventory_items, warehouses | — |
| GET /api/admin/products/options | categories, warehouses | — |
| POST /api/admin/products | products, categories, warehouses, users | products, product_categories, product_variants, inventory_items/movements tùy payload, audit_logs |
| POST /api/admin/products/{id}/media | products, product_media | product_media |
| POST /api/admin/uploads | — | File upload volume; không ghi bảng |
| GET/POST /api/admin/promotions | promotions, coupons | promotions, coupons, audit_logs khi POST |
| GET /api/admin/metrics | customer_orders, inventory_items, users | — |
| POST /api/admin/ai | customer_orders, order_items, inventory_items, catalog, promotions/coupons | —; Copilot rule-based chỉ đọc |
| GET /api/admin/reports/overview, /api/admin/finance | customer_orders, order_items, payments | — |
| GET /api/health, GET /actuator/health | Health contributors | — |

## Contract guest order

~~~http
GET /api/commerce/orders/{orderId}/guest
X-Guest-Order-Token: <token nhận từ POST /orders>
~~~

Token TTL 7 ngày và không chấp nhận query parameter. Java endpoint trực tiếp là
/api/orders/{orderId}/guest.

Known defect KD-GUEST-01: `order-tracking-client.tsx` gửi header đúng;
`online-payment-client.tsx` hiện gọi `/guest?token=...`. Query không được proxy
thành header và Java endpoint không đọc nó, nên frontend payment guest chưa tuân
contract này.

Payment webhook còn known defect KD-PAY-01: event success đến sau cancel vẫn có
thể apply succeeded/paid vì policy chưa nhận order.status. Reservation expiry có
KD-INV-01 (không update payments) và KD-INV-02 (không chọn COD confirmed).

## Contract fulfillment

PATCH tracking nhận carrier, serviceCode tùy chọn, trackingNumber,
providerReference tùy chọn, estimatedDeliveryAt epoch milliseconds tùy chọn,
shippingCostCents không âm, notes tùy chọn và expectedVersion dương.

PATCH status nhận status, reason tùy trạng thái và expectedVersion dương.
Status hợp lệ: processing, ready_to_ship, shipped, delivered, failed, returned,
cancelled.

## Query contract

- Customer list: search, status, segment, limit, offset.
- Fulfillment list: search, status, carrier, limit, offset.
- Limit được chặn tối đa 100; offset âm được chuẩn hóa về 0.
- Response nghiệp vụ dùng envelope data/error, không trả trực tiếp row JSONB nội bộ.

## Endpoint chưa tồn tại

Không tài liệu hóa POST /refunds, POST /fulfillments hoặc webhook shipping như API
đã triển khai. Fulfillment được tạo tự động trong checkout; carrier update là
manual admin. Refund command/provider shipment webhook là future scope.

## Luồng hàng hoàn hiện tại

Không có `/api/returns` hay bảng inspection/quarantine. Operator dùng
`PATCH /api/admin/fulfillments/{id}/status` với `status=returned`, reason và
expectedVersion; bước này không ghi inventory movement và không cộng tồn. Sau
kiểm định vật lý ngoài hệ thống, hàng đạt bán lại được nhập bằng
`POST /api/admin/inventory/receipts` với referenceNumber là shipment number và
idempotencyKey riêng. Hàng không đạt không tạo receipt. Hoàn tiền không tự phát
sinh từ hai thao tác này.
