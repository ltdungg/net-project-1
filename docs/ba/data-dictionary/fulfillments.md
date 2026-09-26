# Bảng fulfillments

**Nguồn:** V7__customer_segments_and_fulfillments.sql  
**Mục đích:** Một kiện/vận đơn được xuất từ một kho cho một order.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| shipment_number | varchar(100) | Không | UNIQUE |
| order_id | varchar(64) | Không | FK customer_orders |
| warehouse_id | varchar(64) | Có | FK warehouses; null chỉ cho legacy |
| status | varchar(30) | Không | pending; tám trạng thái |
| carrier | varchar(80) | Có | — |
| service_code | varchar(80) | Có | — |
| tracking_number | varchar(150) | Có | Nếu có thì carrier phải có |
| provider_reference | varchar(150) | Có | — |
| shipping_cost_cents | bigint | Không | 0; ≥0 |
| address_snapshot_json | jsonb | Không | Snapshot địa chỉ |
| estimated_delivery_at | timestamptz | Có | — |
| shipped_at | timestamptz | Có | Không trước created_at |
| delivered_at | timestamptz | Có | Có shipped_at và không trước shipped_at |
| delivery_attempts | integer | Không | 0; ≥0 |
| last_failure_reason | varchar(500) | Có | — |
| notes | text | Có | — |
| idempotency_key | varchar(160) | Không | UNIQUE |
| version | integer | Không | 1; >0 |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Status: pending, processing, ready_to_ship, shipped, delivered, failed, returned,
cancelled. Index (status, created_at DESC), (order_id, status); UNIQUE
(order_id, coalesce(warehouse_id,'')); partial UNIQUE lower(carrier),
lower(tracking_number) khi có.

Checkout tự tạo một row mỗi kho. Tracking/status update dùng expectedVersion.
Shipped consume đúng reservation của item trong kiện; COD paid khi mọi kiện
delivered; returned không tự cộng tồn.

Kiểm thử unique order/kho, tracking, timestamps, version, state matrix, sibling
cancel và aggregate order.

