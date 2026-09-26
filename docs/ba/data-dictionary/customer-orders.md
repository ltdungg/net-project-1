# Bảng customer_orders

**Nguồn:** V1, idempotency/constraint V3, fulfillment backfill V7  
**Mục đích:** Header đơn, snapshot liên hệ/địa chỉ và tổng tiền.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| order_number | varchar(100) | Không | UNIQUE |
| user_id | varchar(64) | Có | FK users; SET NULL |
| email | varchar(254) | Không | Snapshot |
| phone | varchar(20) | Không | Snapshot |
| status | varchar(40) | Không | pending_payment mặc định; CHECK V3 |
| payment_status | varchar(40) | Không | pending; CHECK V3 |
| fulfillment_status | varchar(40) | Không | unfulfilled; CHECK V3 |
| currency | varchar(3) | Không | VND |
| subtotal_cents | bigint | Không | ≥0 |
| discount_total_cents | bigint | Không | 0; 0≤discount≤subtotal |
| shipping_total_cents | bigint | Không | 0; ≥0 |
| tax_total_cents | bigint | Không | 0; ≥0 |
| grand_total_cents | bigint | Không | ≥0; đúng công thức |
| shipping_address_json | jsonb | Không | Snapshot |
| billing_address_json | jsonb | Có | Snapshot |
| customer_note | text | Có | — |
| source | varchar(30) | Không | web; web/mobile/admin/api/import |
| placed_at | timestamptz | Có | Không trước created_at |
| cancelled_at | timestamptz | Có | Không trước created_at |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |
| idempotency_key | varchar(160) | Không | UNIQUE; thêm ở V3 |

Index (user_id, created_at DESC), (status, created_at DESC). Bảng không có
version hay shipping_method_code. Fulfillment version nằm ở fulfillments.

Guest token không lưu trong bảng. Token đọc đơn được ký từ id, email và expiry,
TTL 7 ngày; header X-Guest-Order-Token.

Quan hệ items, history, reservations, payments, promotions và nhiều fulfillments.
Kiểm thử công thức cents, replay, owner/guest token, aggregate shipment và snapshot.

