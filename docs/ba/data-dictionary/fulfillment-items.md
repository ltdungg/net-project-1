# Bảng fulfillment_items

**Nguồn:** V7__customer_segments_and_fulfillments.sql  
**Mục đích:** Map dòng order và reservation vào đúng kiện.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| fulfillment_id | varchar(64) | Không | FK fulfillments; CASCADE |
| order_item_id | varchar(64) | Không | FK order_items |
| reservation_id | varchar(64) | Có | UNIQUE, FK inventory_reservations |
| quantity | integer | Không | >0 |
| created_at | timestamptz | Không | now() |

UNIQUE(fulfillment_id, order_item_id); index order_item_id. Application tạo
order_item, reservation và mapping trong cùng checkout transaction. reservation_id
unique bảo đảm một reservation không bị consume bởi hai kiện.

V7 backfill map legacy item/reservation theo variant và thứ hạng để tránh
cross-product. Với dữ liệu mới, warehouse của reservation phải khớp warehouse
của fulfillment và order_item phải thuộc cùng order; service/integration test
bảo vệ vì DDL chưa có cross-table CHECK.

Kiểm thử quantity, duplicate mapping, item khác order, reservation khác kho và
ship chỉ tác động row thuộc fulfillment.

