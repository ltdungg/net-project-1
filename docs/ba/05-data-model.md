# Mô hình dữ liệu vật lý

## 1. Baseline schema

Sau Flyway V7, PostgreSQL có **33 bảng ứng dụng** và **1 view nghiệp vụ**.
Danh sách này được đối chiếu trực tiếp từ V1, V4, V5 và V7; V2/V6 seed dữ liệu,
V3 bổ sung constraint/index.

| Miền | Bảng |
|---|---|
| Identity & account (6) | roles, users, user_roles, refresh_tokens, auth_tokens, addresses |
| Catalog & wishlist (6) | categories, products, product_categories, product_variants, product_media, wishlist_items |
| Inventory (6) | warehouses, inventory_items, inventory_movements, inventory_operations, inventory_operation_items, inventory_reservations |
| Cart (2) | carts, cart_items |
| Order (3) | customer_orders, order_items, order_status_history |
| Payment (2) | payments, payment_events |
| Promotion (3) | promotions, coupons, order_promotions |
| Fulfillment (3) | fulfillments, fulfillment_items, fulfillment_events |
| Platform (2) | audit_logs, outbox_events |
| View (1) | admin_customer_segments |

Không có bảng refunds trong schema hiện tại. Hoàn tiền chi tiết/partial refund là
phạm vi tương lai; payment webhook hiện chỉ có thể đồng bộ full refund vào
payments và customer_orders.

## 2. Quy ước vật lý

- ID/FK ứng dụng dùng varchar(64), giá trị do application/seed sinh.
- Tiền VND dùng bigint và hậu tố _cents; không dùng numeric(18,2) trong schema hiện tại.
- Timestamp dùng timestamptz, mặc định now() khi DDL quy định.
- JSON snapshot/payload dùng jsonb.
- Tên trạng thái trong DB là chữ thường.
- Flyway là forward-only; không sửa migration đã áp dụng.
- FK delete behavior theo đúng DDL, không mặc định một quy tắc chung.

## 3. ERD identity và account

~~~mermaid
erDiagram
    USERS ||--o{ USER_ROLES : duoc_gan
    ROLES ||--o{ USER_ROLES : gom
    USERS ||--o{ REFRESH_TOKENS : co_phien
    USERS ||--o{ AUTH_TOKENS : co_token
    USERS ||--o{ ADDRESSES : so_huu

    USERS {
      varchar id PK
      varchar email UK
      varchar password_hash
      varchar status
      timestamptz email_verified_at
      timestamptz locked_until
    }
    ROLES {
      varchar id PK
      varchar code UK
      varchar name
    }
    USER_ROLES {
      varchar user_id PK,FK
      varchar role_id PK,FK
    }
    REFRESH_TOKENS {
      varchar id PK
      varchar user_id FK
      varchar token_hash UK
      timestamptz expires_at
      timestamptz revoked_at
    }
    AUTH_TOKENS {
      varchar id PK
      varchar user_id FK
      varchar type
      varchar token_hash UK
      timestamptz expires_at
      timestamptz consumed_at
    }
    ADDRESSES {
      varchar id PK
      varchar user_id FK
      varchar line1
      varchar district
      varchar city
      boolean is_default
    }
~~~

## 4. ERD catalog và wishlist

~~~mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : cha_con
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : phan_loai
    CATEGORIES ||--o{ PRODUCT_CATEGORIES : gom
    PRODUCTS ||--|{ PRODUCT_VARIANTS : co
    PRODUCTS ||--o{ PRODUCT_MEDIA : co_media
    PRODUCT_VARIANTS ||--o{ PRODUCT_MEDIA : media_bien_the
    USERS ||--o{ WISHLIST_ITEMS : yeu_thich
    PRODUCTS ||--o{ WISHLIST_ITEMS : duoc_thich

    PRODUCTS {
      varchar id PK
      varchar slug UK
      varchar name
      varchar status
      boolean featured
    }
    PRODUCT_VARIANTS {
      varchar id PK
      varchar product_id FK
      varchar sku UK
      bigint price_cents
      varchar status
    }
    CATEGORIES {
      varchar id PK
      varchar parent_id FK
      varchar slug UK
      varchar status
    }
    PRODUCT_CATEGORIES {
      varchar product_id PK,FK
      varchar category_id PK,FK
      boolean is_primary
    }
    PRODUCT_MEDIA {
      varchar id PK
      varchar product_id FK
      varchar variant_id FK
      varchar storage_key
      varchar public_url
    }
    WISHLIST_ITEMS {
      varchar user_id PK,FK
      varchar product_id PK,FK
      timestamptz created_at
    }
~~~

## 5. ERD inventory đa kho

~~~mermaid
erDiagram
    WAREHOUSES ||--o{ INVENTORY_ITEMS : chua
    PRODUCT_VARIANTS ||--o{ INVENTORY_ITEMS : ton_tai
    INVENTORY_ITEMS ||--o{ INVENTORY_MOVEMENTS : co_so_cai
    INVENTORY_ITEMS ||--o{ INVENTORY_RESERVATIONS : duoc_giu
    CUSTOMER_ORDERS ||--o{ INVENTORY_RESERVATIONS : tao
    INVENTORY_OPERATIONS ||--|{ INVENTORY_OPERATION_ITEMS : co_dong
    WAREHOUSES ||--o{ INVENTORY_OPERATIONS : nguon
    WAREHOUSES ||--o{ INVENTORY_OPERATIONS : dich
    PRODUCT_VARIANTS ||--o{ INVENTORY_OPERATION_ITEMS : tac_nghiep
    INVENTORY_ITEMS ||--o{ INVENTORY_OPERATION_ITEMS : tham_chieu

    WAREHOUSES {
      varchar id PK
      varchar code UK
      varchar name
      varchar address
      varchar status
    }
    INVENTORY_ITEMS {
      varchar id PK
      varchar warehouse_id FK
      varchar variant_id FK
      int on_hand
      int reserved
      int safety_stock
      int reorder_point
      int version
    }
    INVENTORY_MOVEMENTS {
      varchar id PK
      varchar inventory_item_id FK
      varchar type
      int quantity_delta
      int balance_after
      varchar idempotency_key UK
    }
    INVENTORY_OPERATIONS {
      varchar id PK
      varchar operation_number UK
      varchar type
      varchar status
      varchar idempotency_key UK
    }
    INVENTORY_OPERATION_ITEMS {
      varchar id PK
      varchar operation_id FK
      varchar variant_id FK
      varchar source_inventory_item_id FK
      varchar destination_inventory_item_id FK
      int quantity
    }
    INVENTORY_RESERVATIONS {
      varchar id PK
      varchar inventory_item_id FK
      varchar order_id FK
      int quantity
      varchar status
      timestamptz expires_at
    }
~~~

## 6. ERD cart, order, payment và promotion

~~~mermaid
erDiagram
    USERS ||--o{ CARTS : co
    CARTS ||--o{ CART_ITEMS : chua
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : duoc_chon
    USERS ||--o{ CUSTOMER_ORDERS : dat
    CUSTOMER_ORDERS ||--|{ ORDER_ITEMS : chua
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : snapshot_tu
    CUSTOMER_ORDERS ||--o{ ORDER_STATUS_HISTORY : co_lich_su
    CUSTOMER_ORDERS ||--o{ PAYMENTS : thanh_toan
    PAYMENTS ||--o{ PAYMENT_EVENTS : nhan_event
    PROMOTIONS ||--o{ COUPONS : co_ma
    CUSTOMER_ORDERS ||--o{ ORDER_PROMOTIONS : nhan_uu_dai
    PROMOTIONS ||--o{ ORDER_PROMOTIONS : duoc_ap
    COUPONS ||--o{ ORDER_PROMOTIONS : kich_hoat

    CARTS {
      varchar id PK
      varchar user_id FK
      varchar guest_token UK
      varchar currency
      varchar coupon_code
    }
    CUSTOMER_ORDERS {
      varchar id PK
      varchar order_number UK
      varchar user_id FK
      varchar status
      varchar payment_status
      varchar fulfillment_status
      bigint grand_total_cents
      varchar idempotency_key UK
    }
    ORDER_ITEMS {
      varchar id PK
      varchar order_id FK
      varchar variant_id FK
      varchar sku
      int quantity
      bigint total_cents
    }
    ORDER_STATUS_HISTORY {
      varchar id PK
      varchar order_id FK
      varchar from_status
      varchar to_status
    }
    PAYMENTS {
      varchar id PK
      varchar order_id FK
      varchar provider
      varchar provider_payment_id
      varchar status
      bigint amount_cents
      varchar idempotency_key UK
    }
    PAYMENT_EVENTS {
      varchar id PK
      varchar payment_id FK
      varchar provider
      varchar provider_event_id
      varchar event_type
    }
    PROMOTIONS {
      varchar id PK
      varchar type
      bigint value
      varchar status
    }
    COUPONS {
      varchar id PK
      varchar promotion_id FK
      varchar code UK
    }
    ORDER_PROMOTIONS {
      varchar id PK
      varchar order_id FK
      varchar promotion_id FK
      varchar coupon_id FK
      bigint discount_cents
    }
~~~

## 7. ERD fulfillment và platform

~~~mermaid
erDiagram
    CUSTOMER_ORDERS ||--o{ FULFILLMENTS : co_kien
    WAREHOUSES ||--o{ FULFILLMENTS : xuat_tu
    FULFILLMENTS ||--|{ FULFILLMENT_ITEMS : chua
    ORDER_ITEMS ||--o{ FULFILLMENT_ITEMS : duoc_xep
    INVENTORY_RESERVATIONS ||--o| FULFILLMENT_ITEMS : lien_ket
    FULFILLMENTS ||--o{ FULFILLMENT_EVENTS : co_lich_su
    USERS ||--o{ FULFILLMENT_EVENTS : thao_tac
    USERS ||--o{ AUDIT_LOGS : thuc_hien

    FULFILLMENTS {
      varchar id PK
      varchar shipment_number UK
      varchar order_id FK
      varchar warehouse_id FK
      varchar status
      varchar carrier
      varchar tracking_number
      int version
    }
    FULFILLMENT_ITEMS {
      varchar id PK
      varchar fulfillment_id FK
      varchar order_item_id FK
      varchar reservation_id FK,UK
      int quantity
    }
    FULFILLMENT_EVENTS {
      varchar id PK
      varchar fulfillment_id FK
      varchar from_status
      varchar to_status
      varchar actor_user_id FK
    }
    AUDIT_LOGS {
      varchar id PK
      varchar actor_user_id FK
      varchar action
      varchar entity_type
      varchar entity_id
      varchar correlation_id
    }
    OUTBOX_EVENTS {
      varchar id PK
      varchar aggregate_type
      varchar aggregate_id
      varchar event_type
      varchar status
    }
~~~

## 8. View admin_customer_segments

View đọc users có role customer và tổng hợp customer_orders thành các cột:
id, email, full_name, phone, status, marketing_consent, last_login_at,
created_at, updated_at, total_orders, paid_orders, delivered_orders,
cancelled_orders, total_revenue_cents, last_order_at, last_paid_order_at và
segment_code.

Đây là view thường, không lưu cache. Cột segment_code được tính theo thứ tự
at_risk → vip → loyal → new → potential → prospect. Chi tiết ở
data-dictionary/admin-customer-segments.md.

## 9. Bất biến xuyên aggregate

- reserved không vượt on_hand; shipment consume đúng reservation được map.
- Một order/warehouse có một fulfillment; một reservation chỉ thuộc tối đa một
  fulfillment item.
- Tổng quantity fulfillment item của một order item không được vượt quantity
  dòng đơn; application đảm bảo khi tạo transaction.
- carrier/tracking duy nhất khi có đủ hai giá trị.
- COD chỉ paid khi mọi fulfillment delivered.
- Hàng returned sau shipped chưa trở thành sellable inventory.
- Guest order token không phải cột/bảng; đó là chứng thực HMAC stateless.

## 10. Từ điển dữ liệu

Mỗi bảng có đúng một file tại data-dictionary. View có file riêng và được đánh
dấu rõ không phải bảng. Mục lục chuẩn nằm ở
[data-dictionary/README.md](data-dictionary/README.md).
