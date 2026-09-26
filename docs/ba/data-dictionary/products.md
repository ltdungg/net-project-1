# Bảng products

**Nguồn:** V1, seed mở rộng V6  
**Mục đích:** Nội dung sản phẩm cấp mẫu.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| slug | varchar(180) | Không | UNIQUE |
| name | varchar(200) | Không | — |
| subtitle | varchar(255) | Có | — |
| description | text | Không | — |
| material | varchar(255) | Có | — |
| status | varchar(24) | Không | draft; draft/active/archived |
| featured | boolean | Không | false |
| published_at | timestamptz | Có | — |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (status, published_at DESC). Quan hệ variants, media, categories và
wishlist_items. Không có brand/care_instructions trong schema hiện tại.
Kiểm thử slug, active storefront, archive và snapshot dòng đơn.

