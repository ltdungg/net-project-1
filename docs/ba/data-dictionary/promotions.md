# Bảng promotions

**Nguồn:** V1, constraint V3  
**Mục đích:** Chương trình giảm phần trăm, số tiền cố định hoặc miễn phí giao.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| name | varchar(160) | Không | — |
| description | text | Có | — |
| type | varchar(30) | Không | percentage/fixed/free_shipping |
| value | bigint | Không | 0–100 cho percentage; ≥0 fixed; 0 free_shipping |
| min_subtotal_cents | bigint | Không | 0; ≥0 |
| max_discount_cents | bigint | Có | ≥0 |
| usage_limit | integer | Có | >0 |
| usage_count | integer | Không | 0; không vượt limit |
| starts_at | timestamptz | Không | — |
| ends_at | timestamptz | Không | Lớn hơn starts_at |
| status | varchar(30) | Không | draft; draft/active/inactive/expired/archived |
| rules_json | jsonb | Có | Điều kiện mở rộng |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Quan hệ coupons và order_promotions. Không có conditions/benefits/schema_version
hay created_by. Checkout khóa/validate lại promotion trước khi tăng usage_count.

Kiểm thử time window, type/value, cap, usage race và snapshot order.

