# Bảng inventory_items

**Nguồn:** V1, constraint V3  
**Mục đích:** Số dư một variant tại một kho.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| warehouse_id | varchar(64) | Không | FK warehouses |
| variant_id | varchar(64) | Không | FK product_variants |
| on_hand | integer | Không | 0; ≥0 |
| reserved | integer | Không | 0; 0≤reserved≤on_hand |
| safety_stock | integer | Không | 0; ≥0 |
| reorder_point | integer | Không | 0; ≥0 |
| version | integer | Không | 1; >0 |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

UNIQUE(warehouse_id, variant_id); index variant_id. Dashboard trả
`available = on_hand - reserved` và
`ATP = greatest(on_hand - reserved - safety_stock, 0)`. OrderService hiện dùng
available để chọn/giữ hàng; safety_stock chưa phải checkout guard. Balance
không được sửa trực tiếp từ UI. Checkout tăng reserved; shipped giảm
on_hand/reserved; receipt/transfer/count/adjustment cập nhật on_hand và version.

Kiểm thử constraint, tranh SKU cuối, selection đa kho, stale balance và movement rollback.
