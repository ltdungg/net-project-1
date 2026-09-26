# Bảng warehouses

**Nguồn:** V1, seed V2/V6, constraint V3  
**Mục đích:** Kho logic/vật lý cho tồn và fulfillment.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| code | varchar(50) | Không | UNIQUE |
| name | varchar(150) | Không | — |
| address | varchar(500) | Có | Chuỗi địa chỉ, không phải JSON |
| status | varchar(24) | Không | active; active/inactive/archived |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Seed có HCM-01 và HN-01. Quan hệ inventory_items, inventory_operations nguồn/đích
và fulfillments. Bảng không có timezone. Checkout chỉ chọn kho active.

Kiểm thử duplicate code, kho inactive không được cấp hàng/chuyển tới, quan hệ
fulfillment và không xóa kho đã có dữ liệu.

