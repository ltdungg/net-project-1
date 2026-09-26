# Bảng inventory_operation_items

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Dòng SKU thuộc chứng từ tồn kho.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| operation_id | varchar(64) | Không | FK inventory_operations; CASCADE |
| variant_id | varchar(64) | Không | FK product_variants |
| source_inventory_item_id | varchar(64) | Có | FK inventory_items |
| destination_inventory_item_id | varchar(64) | Có | FK inventory_items |
| quantity | integer | Không | Ý nghĩa theo operation type |
| expected_quantity | integer | Có | ≥0 |
| actual_quantity | integer | Có | ≥0 |
| variance | integer | Có | — |
| unit_cost_cents | bigint | Có | ≥0 |
| note | text | Có | — |
| created_at | timestamptz | Không | now() |

Index (operation_id, created_at, id). Receipt dùng destination item; transfer
dùng source và destination; stocktake/adjust dùng cùng item ở hai cột. API hiện
mỗi operation có một item, dù schema cho nhiều dòng.

Bảng không có line_status, counted_by/counted_at hay updated_at. Kiểm thử FK,
expected/actual, transfer mapping và rollback nếu movement lỗi.

