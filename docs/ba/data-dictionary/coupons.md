# Bảng coupons

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Mã kích hoạt promotion.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| promotion_id | varchar(64) | Không | FK promotions; CASCADE |
| code | varchar(60) | Không | UNIQUE và UNIQUE INDEX lower(code) |
| usage_limit | integer | Có | >0 |
| usage_limit_per_customer | integer | Không | 1; >0 |
| usage_count | integer | Không | 0; không vượt limit |
| status | varchar(30) | Không | active; active/inactive/exhausted/expired/archived |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (promotion_id, status). Không có normalized_code/display_code; service
normalize input và dùng lower(code). Usage per customer đối chiếu order
promotion theo user/email.

Kiểm thử code khác hoa/thường, limit tổng/per customer, trạng thái và concurrent checkout.

