# Bảng cart_items

**Nguồn:** V1, constraint V3  
**Mục đích:** Dòng variant trong cart.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| cart_id | varchar(64) | Không | FK carts; CASCADE |
| variant_id | varchar(64) | Không | FK product_variants |
| quantity | integer | Không | 1; từ 1 đến 10 |
| unit_price_cents | bigint | Không | ≥0 |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

UNIQUE(cart_id, variant_id). unit_price_cents là giá quan sát trong cart; checkout
vẫn đọc lại giá variant và voucher. Không có observed_unit_price tên khác.

Kiểm thử add trùng thành update, quantity 0/11, variant inactive và reprice.

