# Bảng audit_logs

**Nguồn:** V1__commerce_schema.sql  
**Mục đích:** Nhật ký thao tác nhạy cảm có actor và correlation ID.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| actor_user_id | varchar(64) | Có | FK users; SET NULL |
| action | varchar(120) | Không | Ví dụ inventory.transfer |
| entity_type | varchar(80) | Không | — |
| entity_id | varchar(64) | Có | — |
| before_json | jsonb | Có | Trạng thái trước đã lọc |
| after_json | jsonb | Có | Trạng thái sau đã lọc |
| ip_hash | varchar(160) | Có | — |
| user_agent | varchar(500) | Có | — |
| correlation_id | varchar(100) | Không | — |
| created_at | timestamptz | Không | now() |

Index (entity_type, entity_id, created_at DESC). Không có actor_type,
resource_type/resource_id hay reason_code riêng.

Runtime ghi audit cho inventory operation, order/fulfillment transition,
tracking, status khách và batch expiry. Không ghi password, raw token, secret,
full provider payload hoặc PII không cần thiết.

Application coi audit là append-only; production cần DB permission/storage bất
biến nếu yêu cầu chống sửa mạnh.

