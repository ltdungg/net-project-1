# Mục lục từ điển dữ liệu

Baseline Flyway V7 gồm **33 bảng ứng dụng** và **1 view**. Mỗi bảng có đúng một
file; view được đánh dấu riêng. Tất cả định nghĩa dùng varchar(64) cho ID/FK và
bigint *_cents cho tiền VND theo DDL hiện tại.

## Identity và account — 6 bảng

- [roles](roles.md)
- [users](users.md)
- [user_roles](user-roles.md)
- [refresh_tokens](refresh-tokens.md)
- [auth_tokens](auth-tokens.md)
- [addresses](addresses.md)

## Catalog và wishlist — 6 bảng

- [categories](categories.md)
- [products](products.md)
- [product_categories](product-categories.md)
- [product_variants](product-variants.md)
- [product_media](product-media.md)
- [wishlist_items](wishlist-items.md)

## Inventory — 6 bảng

- [warehouses](warehouses.md)
- [inventory_items](inventory-items.md)
- [inventory_movements](inventory-movements.md)
- [inventory_operations](inventory-operations.md)
- [inventory_operation_items](inventory-operation-items.md)
- [inventory_reservations](inventory-reservations.md)

## Cart — 2 bảng

- [carts](carts.md)
- [cart_items](cart-items.md)

## Order — 3 bảng

- [customer_orders](customer-orders.md)
- [order_items](order-items.md)
- [order_status_history](order-status-history.md)

## Payment — 2 bảng

- [payments](payments.md)
- [payment_events](payment-events.md)

Không có bảng refunds trong schema hiện tại. Refund command/partial refund là
future scope; full refund chỉ được phản ánh qua payment webhook và trạng thái.

## Promotion — 3 bảng

- [promotions](promotions.md)
- [coupons](coupons.md)
- [order_promotions](order-promotions.md)

## Fulfillment — 3 bảng

- [fulfillments](fulfillments.md)
- [fulfillment_items](fulfillment-items.md)
- [fulfillment_events](fulfillment-events.md)

## Platform — 2 bảng

- [audit_logs](audit-logs.md)
- [outbox_events](outbox-events.md)

## View nghiệp vụ — 1 view

- [admin_customer_segments](admin-customer-segments.md)

## Tài liệu liên quan

- [Mô hình dữ liệu](../05-data-model.md)
- [Trạng thái](../database-design/01-trang-thai-va-chuyen-doi.md)
- [Transaction/idempotency](../database-design/02-giao-dich-va-dong-thoi.md)
- [CRUD và quyền](../database-design/03-ma-tran-crud-va-quyen.md)
- [Flyway](../database-design/04-thu-tu-migration-va-phu-thuoc.md)
- [Bảo mật/token](../database-design/05-bao-mat-va-luu-tru.md)
- [Kiểm thử dữ liệu](../database-design/06-danh-muc-kiem-thu-du-lieu.md)
- [Ánh xạ API](../database-design/07-anh-xa-api-voi-bang.md)
- [Sự kiện miền](../database-design/08-danh-muc-su-kien-domain.md)
