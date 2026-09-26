# Bảng order_promotions

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Snapshot promotion/coupon đã áp vào order.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| order_id | varchar(64) | Không | FK customer_orders; CASCADE |
| promotion_id | varchar(64) | Có | FK promotions; SET NULL |
| coupon_id | varchar(64) | Có | FK coupons; SET NULL |
| name_snapshot | varchar(160) | Không | Tên + code tại checkout |
| discount_cents | bigint | Không | ≥0 |
| created_at | timestamptz | Không | now() |

Index (order_id, created_at, id). Không có coupon_code_snapshot hay
calculation_snapshot. Bản hiện tại áp tối đa một coupon; snapshot giữ lịch sử
khi promotion/coupon thay đổi.

Kiểm thử discount khớp order, FK set null, replay không tăng usage hai lần.
