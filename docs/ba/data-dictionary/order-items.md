# Bảng order_items

**Nguồn:** V1, constraint/index V3  
**Mục đích:** Snapshot mỗi dòng hàng khi đặt.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| order_id | varchar(64) | Không | FK customer_orders; CASCADE |
| variant_id | varchar(64) | Có | FK product_variants; SET NULL |
| sku | varchar(100) | Không | Snapshot |
| product_name | varchar(200) | Không | Snapshot |
| variant_name | varchar(200) | Không | Snapshot size/màu |
| image_url | varchar(1000) | Có | Snapshot |
| quantity | integer | Không | >0 |
| unit_price_cents | bigint | Không | ≥0 |
| discount_cents | bigint | Không | 0; trong giá trị dòng |
| total_cents | bigint | Không | unit_price × quantity - discount |
| created_at | timestamptz | Không | now() |

Index (order_id, created_at, id). Không dùng attributes_snapshot hoặc tên cột có
hậu tố _snapshot ngoài ý nghĩa nghiệp vụ. Một dòng được map vào
fulfillment_items; checkout hiện cấp toàn dòng từ một kho.

Kiểm thử công thức, variant bị xóa mềm, snapshot và mapping reservation/fulfillment.

