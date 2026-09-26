# Flyway, seed và phụ thuộc

## 1. Lịch sử migration hiện tại

| Version | Nội dung | Tổng bảng sau bước |
|---:|---|---:|
| V1 | Tạo 28 bảng nền: identity, catalog, inventory, cart, order, payment, promotion, platform | 28 |
| V2 | Seed roles, catalog, hai kho HCM/HN, tồn và promotion demo | 28 |
| V3 | Thêm order idempotency, unique/index và CHECK constraint | 28 |
| V4 | Tạo wishlist_items | 29 |
| V5 | Mở rộng users cho auth lifecycle và tạo auth_tokens | 30 |
| V6 | Mở rộng catalog/tồn tại hai kho | 30 |
| V7 | Tạo admin_customer_segments, fulfillments, fulfillment_items, fulfillment_events; backfill | 33 + 1 view |

Hai bảng inventory_operations và inventory_operation_items đã tồn tại từ V1,
không còn là đề xuất.

## 2. Thứ tự phụ thuộc logic

1. roles/users → user_roles, refresh_tokens, auth_tokens, addresses.
2. categories/products → product_categories, variants, media, wishlist.
3. warehouses + variants → inventory_items.
4. inventory_items/users → movements, operations/items.
5. carts/items.
6. customer_orders/items/history.
7. inventory_reservations, payments/events, promotions/coupons/order_promotions.
8. fulfillments/items/events.
9. audit/outbox và view phân khúc.

## 3. Quy tắc Flyway

- Migration đã được áp dụng là bất biến; không sửa V1–V7 vì sẽ lệch checksum.
- Mọi thay đổi tiếp theo dùng V8 trở lên.
- Migration dữ liệu phải restart-safe hoặc có preflight rõ.
- Thay đổi lớn dùng expand → backfill → validate → contract.
- Không rollback bằng DROP bảng có dữ liệu giao dịch; dùng migration bù.

## 4. Kiểm tra sau migration

~~~sql
select count(*) as application_tables
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
  and table_name <> 'flyway_schema_history';

select count(*) as business_views
from information_schema.views
where table_schema = 'public'
  and table_name = 'admin_customer_segments';
~~~

Kỳ vọng là 33 bảng ứng dụng và 1 view. flyway_schema_history là bảng công cụ,
không tính vào mô hình nghiệp vụ.

## 5. Backfill V7

V7:

- từ chối migrate nếu legacy order_items có quantity không dương;
- tạo một fulfillment cho từng order/warehouse hiện hữu;
- map item/reservation theo thứ hạng để tránh nhân chéo;
- tạo fulfillment event ban đầu;
- reconcile customer_orders.fulfillment_status;
- dùng ID/hash và idempotency key có độ dài phù hợp varchar.

Sau deploy phải đối chiếu số order có fulfillment, item mapping, shipment number
unique và không có reservation bị map cho nhiều fulfillment item.
