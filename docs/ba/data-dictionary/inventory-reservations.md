# Bảng inventory_reservations

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Giữ tồn cho order trước khi xuất kho.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| inventory_item_id | varchar(64) | Không | FK inventory_items |
| order_id | varchar(64) | Không | FK customer_orders; CASCADE |
| quantity | integer | Không | >0 |
| status | varchar(30) | Không | active; active/released/expired/consumed/returned/cancelled |
| expires_at | timestamptz | Không | Lớn hơn created_at |
| released_at | timestamptz | Có | Không trước created_at; dùng cả consume/expiry |
| created_at | timestamptz | Không | now() |

Index (status, expires_at), (order_id, status, created_at); partial UNIQUE
(order_id, inventory_item_id) khi active. fulfillment_items.reservation_id là
unique để một reservation không bị gán hai kiện.

Runtime dùng active → consumed khi shipped, active → released khi cancel và
active → expired khi TTL. Online TTL 2 giờ, COD 30 ngày. Không có consumed_at hay
updated_at.

Known defect KD-INV-02: scheduler chỉ query order pending_payment nên TTL 30 ngày
của COD order confirmed hiện chưa được thực thi; reservation COD có thể tiếp tục
active sau expires_at.

Kiểm thử expiry/payment race, release/consume lặp, đúng fulfillment và reserved balance.
