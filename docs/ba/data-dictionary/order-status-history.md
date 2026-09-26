# Bảng order_status_history

**Nguồn:** V1, constraint/index V3  
**Mục đích:** Lịch sử chuyển trạng thái order.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| order_id | varchar(64) | Không | FK customer_orders; CASCADE |
| from_status | varchar(40) | Có | CHECK tập status order |
| to_status | varchar(40) | Không | CHECK tập status order |
| reason | varchar(500) | Có | — |
| actor_user_id | varchar(64) | Có | FK users; SET NULL |
| metadata_json | jsonb | Có | Correlation/fulfillment metadata tối thiểu |
| created_at | timestamptz | Không | now() |

Index (order_id, created_at, id). Bảng không có actor_type, reason_code, note hay
correlation_id riêng; correlation có thể nằm metadata_json.

Application ghi thêm mới khi checkout, admin transition, payment/fulfillment
reconcile và expiry. Database chưa có trigger append-only.

Kiểm thử thứ tự, from/to hợp lệ, reason cancel/return và không ghi khi transaction rollback.
