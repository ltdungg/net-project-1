# Bảng categories

**Nguồn:** V1, constraint V3  
**Mục đích:** Cây danh mục catalog.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| parent_id | varchar(64) | Có | FK categories; ON DELETE SET NULL |
| slug | varchar(120) | Không | UNIQUE |
| name | varchar(120) | Không | — |
| description | text | Có | — |
| sort_order | integer | Không | 0; ≥0 |
| status | varchar(24) | Không | active; active/inactive/archived |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Quan hệ self-reference và N–N products qua product_categories. Storefront chỉ
hiển thị dữ liệu active theo service. Kiểm thử duplicate slug, parent không tồn
tại, sort âm và archive không làm mất order snapshot.

