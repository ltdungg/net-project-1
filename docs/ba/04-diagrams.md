# Sơ đồ use case, tuần tự và trạng thái

Các sơ đồ được tách theo miền để dễ đọc và tránh đường nối chồng chéo.

## 1. Use case storefront và tài khoản

~~~mermaid
flowchart LR
    Guest[Khách vãng lai]
    Customer[Thành viên]

    subgraph Storefront
      UC1((Duyệt và tìm sản phẩm))
      UC2((Quản lý giỏ và voucher))
      UC3((Checkout))
      UC4((Xem đơn bằng guest token))
      UC5((Đăng ký / xác minh / đăng nhập))
      UC6((Hồ sơ / địa chỉ / wishlist))
      UC7((Lịch sử đơn))
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC6
    Customer --> UC7
~~~

## 2. Use case back-office

~~~mermaid
flowchart LR
    Staff[Staff]
    Manager[Manager]
    Admin[Admin]

    subgraph Operations
      A((Tra cứu đơn))
      B((Điều phối fulfillment))
      C((Nhập / chuyển / kiểm kê kho))
      D((Xem khách và segment))
      E((Quản lý catalog / promotion))
      F((Điều chỉnh tồn))
      G((Đổi trạng thái khách))
      H((Báo cáo / tài chính))
    end

    Staff --> A
    Staff --> B
    Staff --> C
    Staff --> D
    Manager --> A
    Manager --> B
    Manager --> C
    Manager --> D
    Manager --> E
    Manager --> F
    Manager --> H
    Admin --> A
    Admin --> B
    Admin --> C
    Admin --> D
    Admin --> E
    Admin --> F
    Admin --> G
    Admin --> H
~~~

## 3. Kiến trúc request

~~~mermaid
flowchart LR
    Browser[Trình duyệt :8787]
    BFF[Vinext BFF /api/commerce]
    API[Spring Boot /api :8080]
    PG[(PostgreSQL 17)]
    Redis[(Redis 7)]
    Upload[(Upload volume)]

    Browser -->|cookie + Origin + header| BFF
    BFF -->|proxy có kiểm soát| API
    API --> PG
    API --> Redis
    API --> Upload
~~~

## 4. Tuần tự đăng ký và xác minh

~~~mermaid
sequenceDiagram
    actor U as Người dùng
    participant W as Frontend/BFF
    participant A as Auth API
    participant D as PostgreSQL

    U->>W: Gửi đăng ký
    W->>A: POST /auth/register + Origin
    A->>D: Tạo users(pending), role customer
    A->>D: Lưu hash token verify_email, TTL 24h
    A->>D: Ghi outbox user.registered
    A-->>W: 202 verificationRequired
    U->>W: Xác minh email
    W->>A: POST /auth/verify-email
    A->>D: Lock/consume auth_token
    A->>D: users.status=active, email_verified_at
    A->>D: Lưu refresh token hash
    A-->>W: Access cookie 15m + refresh cookie 30d
~~~

## 5. Tuần tự checkout đa kho

~~~mermaid
sequenceDiagram
    actor C as Guest/Customer
    participant W as Storefront/BFF
    participant O as OrderService
    participant I as Inventory
    participant D as PostgreSQL

    C->>W: Đặt hàng + idempotencyKey
    W->>O: POST /orders
    O->>D: BEGIN transaction
    O->>D: Advisory lock idempotency scope
    loop Theo variant đã sắp xếp
      O->>I: Chọn kho active đủ available và lock item
    end
    O->>D: Order + history + payment
    O->>D: Một fulfillment cho mỗi kho
    O->>D: Items + reservations + fulfillment_items
    O->>D: Movements reservation + outbox
    O->>D: COMMIT
    alt Guest
      O-->>W: 201 + guestAccessToken TTL 7 ngày
    else Member
      O-->>W: 201 + order
    end
~~~

## 6. Tuần tự xem đơn guest

Sơ đồ là contract đã hoạt động ở trang theo dõi đơn. Trang thanh toán online còn
known defect KD-GUEST-01: dùng query token thay vì header và vì vậy không hoàn
tất được nhánh đọc order của guest.

~~~mermaid
sequenceDiagram
    actor G as Guest
    participant W as Storefront
    participant B as BFF
    participant O as Order API
    participant D as PostgreSQL

    G->>W: Mở /don-hang/{id}
    W->>B: GET /api/commerce/orders/{id}/guest
    Note over W,B: Header X-Guest-Order-Token
    B->>O: GET /api/orders/{id}/guest + header
    O->>D: Đọc email snapshot của order
    O->>O: Verify HMAC(orderId,email,expiry)
    alt Hợp lệ và chưa quá 7 ngày
      O->>D: Đọc order, items, history, fulfillments
      O-->>W: 200 public order detail
    else Sai/hết hạn
      O-->>W: 404 ORDER_NOT_FOUND
    end
~~~

## 7. Tuần tự ship một kiện

~~~mermaid
sequenceDiagram
    actor S as Staff
    participant A as Admin UI/BFF
    participant F as FulfillmentService
    participant D as PostgreSQL

    S->>A: Nhập carrier/tracking/ETA
    A->>F: PATCH /fulfillments/{id}/tracking + expectedVersion
    F->>D: Lock fulfillment, kiểm tra version
    F->>D: Update tracking + event + audit + outbox
    F-->>A: Fulfillment version mới
    S->>A: Chuyển sang shipped
    A->>F: PATCH /fulfillments/{id}/status
    F->>D: Lock fulfillment/order/reservations
    F->>D: Consume reservation của đúng kiện
    F->>D: Giảm on_hand và reserved, ghi movement
    F->>D: Update shipment + event + audit + outbox
    F->>D: Tổng hợp order/fulfillment_status
    F-->>A: Chi tiết mới
~~~

## 8. Máy trạng thái fulfillment

~~~mermaid
stateDiagram-v2
    [*] --> pending
    pending --> processing
    pending --> cancelled
    processing --> ready_to_ship
    processing --> failed
    processing --> cancelled
    ready_to_ship --> shipped
    ready_to_ship --> failed
    ready_to_ship --> cancelled
    shipped --> delivered
    shipped --> failed
    shipped --> returned
    failed --> processing
    failed --> shipped
    failed --> returned
    failed --> cancelled
    delivered --> returned
    returned --> [*]
    cancelled --> [*]
~~~

## 9. Máy trạng thái order và reservation

~~~mermaid
stateDiagram-v2
    state Order {
      [*] --> pending_payment: online
      [*] --> confirmed: COD
      pending_payment --> confirmed
      pending_payment --> cancelled
      confirmed --> processing
      confirmed --> cancelled
      processing --> ready_to_ship
      processing --> cancelled
      ready_to_ship --> shipped: tổng hợp kiện
      shipped --> delivered
      shipped --> returned
      delivered --> returned
    }

    state Reservation {
      [*] --> active
      active --> consumed: shipped
      active --> released: cancel/expiry
      active --> expired: trạng thái schema
      active --> returned: trạng thái schema
      active --> cancelled: trạng thái schema
    }
~~~

## 10. Luồng phân khúc khách hàng

~~~mermaid
flowchart TD
    A[User có role customer và chưa deleted]
    A --> B[Tổng hợp order/payment]
    B --> C{Có paid order và quá 90 ngày?}
    C -->|Có| R[at_risk]
    C -->|Không| D{Doanh thu >= 5 triệu hoặc paid orders >= 5?}
    D -->|Có| V[vip]
    D -->|Không| E{Paid orders >= 2 và giao dịch trong 90 ngày?}
    E -->|Có| L[loyal]
    E -->|Không| F{Tài khoản <= 30 ngày và paid orders <= 1?}
    F -->|Có| N[new]
    F -->|Không| G{Paid orders = 1?}
    G -->|Có| P[potential]
    G -->|Không| X[prospect]
~~~

## 11. Luồng hàng hoàn chờ kiểm định

~~~mermaid
flowchart TD
    A[Fulfillment shipped / failed / delivered]
    A --> B[PATCH status returned + reason + expectedVersion]
    B --> C[Event + audit + outbox; on_hand không tăng]
    C --> R{Reservation đã consumed?}
    R -->|Không, failed trước xuất kho| Q[Release reserved; kết thúc luồng vật lý]
    R -->|Có, hàng đã rời kho| D[Giữ hàng vật lý ở khu chờ kiểm định]
    D --> E{Kết luận kiểm định ngoài hệ thống}
    E -->|Đạt bán lại| F[POST inventory receipts]
    F --> G[Operation + item + movement + audit]
    G --> H[on_hand tăng; hàng trở lại sellable]
    E -->|Hỏng / thiếu / sai| I[Không tạo receipt; không tăng tồn]
    C -. quyết định độc lập .-> J[Full refund qua payment webhook nếu có]
    J -. future scope .-> K[Refund command / partial refund]
~~~
