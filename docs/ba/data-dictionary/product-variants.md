# Bảng product_variants

**Nguồn:** V1, constraint V3  
**Mục đích:** SKU bán được theo size/màu và giá.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| product_id | varchar(64) | Không | FK products; CASCADE |
| sku | varchar(100) | Không | UNIQUE |
| barcode | varchar(100) | Có | — |
| size | varchar(50) | Không | — |
| color | varchar(100) | Không | — |
| color_hex | varchar(20) | Có | — |
| price_cents | bigint | Không | ≥0 |
| compare_at_price_cents | bigint | Có | ≥ price_cents |
| cost_cents | bigint | Có | ≥0 |
| weight_grams | integer | Có | ≥0 |
| status | varchar(24) | Không | active; active/inactive/archived |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (product_id, status). Giá là số nguyên VND; không có currency/version hay
attributes JSON. Quan hệ inventory_items, cart_items, order_items và media.
Kiểm thử SKU, giá so sánh, variant inactive và tồn theo hai kho.

