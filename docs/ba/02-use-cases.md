# Đặc tả trường hợp sử dụng

## 1. Danh mục

| Mã | Trường hợp sử dụng | Tác nhân chính |
|---|---|---|
| UC-01 | Duyệt, tìm và xem sản phẩm | Guest/Customer |
| UC-02 | Quản lý giỏ và voucher | Guest/Customer |
| UC-03 | Checkout guest/member | Guest/Customer |
| UC-04 | Đăng ký, xác minh và đăng nhập | Customer |
| UC-05 | Quản lý hồ sơ, địa chỉ và wishlist | Customer |
| UC-06 | Xem đơn thành viên | Customer |
| UC-07 | Xem đơn bằng guest token | Guest |
| UC-08 | Thực hiện nghiệp vụ tồn kho đa kho | Staff/Manager/Admin |
| UC-09 | Điều phối fulfillment đa kho | Staff/Manager/Admin |
| UC-10 | Quản lý và phân khúc khách hàng | Staff/Manager/Admin |
| UC-11 | Quản lý catalog/promotion | Manager/Admin |
| UC-12 | Xử lý payment mock/webhook | Customer/Provider |
| UC-13 | Tiếp nhận hàng hoàn chờ kiểm định | Staff/Manager/Admin |

## 2. UC-03 — Checkout guest/member

**Mục tiêu:** tạo một đơn duy nhất từ dữ liệu hợp lệ và giữ đúng tồn tại từng kho.

**Tiền điều kiện:** variant active, có một inventory item tại kho active đủ
`available = on_hand - reserved`; paymentMethod là cod hoặc online;
idempotencyKey không rỗng.

### Luồng chính

1. Khách nhập email, điện thoại, địa chỉ, phương thức thanh toán và voucher.
2. Frontend gửi POST /api/orders với idempotencyKey trong body.
3. Backend tạo scope idempotency theo user, cart token hoặc email/điện thoại guest
   và lấy advisory lock.
4. Backend gom quantity theo variant, giới hạn tối đa 10 mỗi variant.
5. Theo thứ tự variant ổn định, hệ thống chọn một kho active có đủ available,
   ưu tiên available cao rồi mã kho, và khóa dòng tồn. Safety stock được hiển
   thị thành chỉ số ATP nhưng chưa bị trừ trong điều kiện checkout hiện tại.
6. Server tính lại giá/voucher và tạo order, history, payment.
7. Server tạo một fulfillment cho mỗi warehouse_id khác nhau.
8. Với từng dòng, server tăng reserved, tạo order item, reservation và
   fulfillment item liên kết reservation tương ứng.
9. Server ghi movement loại reservation và outbox; transaction commit.
10. Response 201 trả order ID, order number, reservation expiry, shipment count
    và next action. Với guest, response còn có guestAccessToken.

### Luồng thay thế

- A1: idempotency key đã có → trả order hiện hữu với idempotentReplay=true.
- A2: variant không đủ tồn trong cùng một kho → 409 VARIANT_UNAVAILABLE.
- A3: tồn thay đổi sau khi đọc → 409 INVENTORY_CHANGED và rollback toàn bộ.
- A4: voucher không hợp lệ/hết lượt → 422 VOUCHER_INVALID.
- A5: access cookie hỏng/hết hạn được gửi kèm → 401 ACCESS_EXPIRED, không tự
  hạ xuống guest để tránh gắn sai chủ đơn.

**Hậu điều kiện:** không có order mồ côi; tổng item, reservation và fulfillment
khớp; online có TTL reservation 2 giờ, COD 30 ngày. TTL COD đã được ghi nhưng
job hiện chưa xử lý do KD-INV-02.

## 3. UC-04 — Đăng ký, xác minh và đăng nhập

### Đăng ký/xác minh

1. Khách gửi email, mật khẩu, họ tên, điện thoại, acceptedTerms và lựa chọn marketing.
2. Backend normalize email, kiểm tra duy nhất và hash mật khẩu bằng BCrypt 12.
3. Tạo user pending, gán role customer và auth token verify_email đã băm.
4. Token xác minh dùng một lần, hết hạn sau 24 giờ.
5. Xác minh hợp lệ đặt user active, ghi email_verified_at, tiêu thụ token và cấp
   access/refresh cookie.

### Đăng nhập/refresh

1. Login chỉ chấp nhận user đã xác minh và active, hoặc lock đã hết hạn.
2. Access JWT mặc định sống 15 phút; refresh opaque sống 30 ngày.
3. Refresh khóa token hiện tại, thu hồi nó và cấp cặp mới.
4. Logout thu hồi refresh token; reset mật khẩu thu hồi mọi refresh token của user.

### Ngoại lệ và chống dò quét

- Chưa xác minh → EMAIL_NOT_VERIFIED.
- Tài khoản tạm khóa → ACCOUNT_LOCKED.
- Email/mật khẩu sai hoặc account không hoạt động → phản hồi credentials chung.
- Resend/forgot luôn trả thông báo chung; token cũ cùng loại bị vô hiệu hóa.
- Token reset sống 30 phút và chỉ được dùng một lần.

## 4. UC-07 — Xem đơn bằng guest token

**Tiền điều kiện:** đơn được tạo khi không có principal; client còn token đã nhận.

1. Client lưu guestAccessToken theo order ID. Frontend hiện dùng sessionStorage.
2. Client gọi GET /api/commerce/orders/{id}/guest.
3. Client gửi token trong header X-Guest-Order-Token; BFF chuyển tiếp header này
   tới GET /api/orders/{id}/guest.
4. Backend đọc email snapshot của order, xác minh HMAC trên order ID, email và
   epoch hết hạn.
5. Token hợp lệ và chưa quá 7 ngày → trả order, items, history và danh sách
   fulfillment công khai.
6. Token sai, hết hạn hoặc dùng cho order khác → trả 404 ORDER_NOT_FOUND.

Token không nằm trong query string, log, URL chia sẻ hoặc database. Endpoint
member GET /api/orders/{id} vẫn yêu cầu access token và kiểm tra ownership.

**Sai lệch hiện trạng:** `order-tracking-client.tsx` thực hiện bước 3 đúng.
`online-payment-client.tsx` còn gọi `/guest?token=...`; backend bỏ qua query và
trả lỗi, nên nhánh xem order của guest trên trang thanh toán chưa đạt UC-07.
Đây là defect cần sửa ở client, không phải contract thay thế.

## 5. UC-08 — Nghiệp vụ tồn kho đa kho

### 5.1 Nhập hàng

1. Staff chọn inventory item thuộc kho nhận, quantity, reason, reference và idempotency key.
2. POST /api/admin/inventory/receipts khóa dòng tồn.
3. Tạo operation posted, một operation item, movement receipt, cập nhật on_hand
   và audit trong cùng transaction.

### 5.2 Chuyển kho

1. Chọn source inventory item, kho đích và quantity.
2. Hệ thống khóa theo variant, rồi khóa hai dòng tồn theo thứ tự ổn định.
3. Chặn cùng kho, kho inactive, nguồn thiếu hàng hoặc on_hand sau chuyển thấp hơn reserved.
4. Tạo một operation item, transfer_out và transfer_in dùng chung operation.

### 5.3 Kiểm kê/điều chỉnh

- Count nhận actualQuantity; không cho actual thấp hơn reserved.
- Adjust nhận quantityDelta và chỉ Manager/Admin được gọi.
- Cả hai tạo chứng từ posted tức thời; bản hiện tại không có workflow
  draft/review/approve hay chứng từ nhiều dòng từ một request.

### Ngoại lệ chung

- Idempotency key lặp cùng actor/operation trả chứng từ cũ.
- Bất kỳ dòng update/movement/audit lỗi đều rollback transaction.
- Không cập nhật inventory_items trực tiếp từ giao diện.

## 6. UC-09 — Điều phối fulfillment đa kho

**Tiền điều kiện:** fulfillment tự sinh từ checkout; payment_status là paid hoặc
cod_pending, trừ thao tác cancelled.

1. Operator tìm theo shipment number, order number, email hoặc tracking; có thể
   lọc status/carrier.
2. Mở chi tiết để xem kho, snapshot địa chỉ, item, reservation và event.
3. Chuyển pending → processing → ready_to_ship.
4. Nhập carrier, service, tracking, ETA, provider reference, chi phí và notes với expectedVersion.
5. Chuyển ready_to_ship → shipped. Server yêu cầu tracking và consume đúng
   reservation của fulfillment, giảm on_hand/reserved, ghi sale movement.
6. Chuyển shipped → delivered hoặc failed. Failed cần reason và tăng delivery_attempts.
7. Failed có thể quay processing, chuyển shipped, returned hoặc cancelled theo state machine.
8. Mỗi thay đổi ghi fulfillment event, audit, outbox và tổng hợp lại order.

### Quy tắc hủy/hoàn

- Cancel cần reason, chỉ release reservation active.
- Fulfillment của order paid/authorized không được cancel trước khi hoàn tiền.
- Không cancel riêng kiện nếu còn sibling chưa cancelled/returned; với đơn đa
  kiện trước xuất kho phải dùng luồng hủy toàn đơn.
- Không tạo kết quả đa kiện trộn delivered/returned; service chặn transition ở
  cả hai chiều và yêu cầu đối soát riêng.
- Returned sau xuất kho giữ reservation consumed; kho chưa được cộng tồn cho đến
  khi kiểm định và tạo nghiệp vụ tồn riêng.
- COD chỉ thành paid khi tất cả fulfillment delivered.

## 7. UC-10 — Phân khúc và hồ sơ khách hàng

1. Staff mở danh sách khách, tìm theo email/tên/điện thoại hoặc lọc status/segment.
2. Backend đọc view admin_customer_segments trong repeatable-read transaction.
3. Dashboard trả sáu segment theo thứ tự chính sách và ruleVersion RFM-2026.1.
4. Chi tiết khách trả profile, roles, addresses, thống kê và 50 đơn gần nhất.
5. Admin có thể đổi active/disabled. Disable cần lý do, không cho tự disable,
   ghi audit/outbox và thu hồi refresh token.

Phân khúc không phải trường nhập tay. Một khách chỉ nhận rule đầu tiên phù hợp:
at_risk, vip, loyal, new, potential, rồi prospect.

## 8. UC-12 — Xử lý payment mock/webhook

- Mock confirm chỉ dùng local và cho staff, member sở hữu order hoặc guest có
  token hợp lệ; nhánh này chặn order đã cancelled.
- Webhook kiểm chữ ký trên raw body, giới hạn 64 KB, đối chiếu amount/currency và
  chống lặp bằng UNIQUE(provider, provider_event_id).
- Event hỗ trợ: payment.succeeded, payment.failed, payment.refunded. Refund chỉ
  là full refund sau succeeded/paid.
- Known defect KD-PAY-01: policy webhook chưa nhận order status, nên late success
  sau cancel có thể ghi payment succeeded/paid trong order cancelled. Đây là
  race chưa đạt tiêu chí nhất quán, không phải trạng thái nghiệp vụ hợp lệ.

## 9. UC-13 — Tiếp nhận hàng hoàn chờ kiểm định

**Phạm vi hiện thực:** hệ thống ghi trạng thái shipment và chứng từ nhập lại;
khâu nhận kiện, cách ly, chụp ảnh và kết luận kiểm định chưa có entity/workflow
riêng trong database.

1. Operator nhận kiện hoàn, đối chiếu shipment number/tracking và nhập reason.
2. Từ shipped, failed hoặc delivered, operator chuyển fulfillment sang returned
   với expectedVersion; hệ thống ghi event, audit, outbox và reconcile order.
3. Nếu reservation đã consumed do từng shipped, inventory không thay đổi và số
   hàng vật lý được giữ ngoài khu vực bán trong khi chờ kiểm định. Nếu failed
   xảy ra trước xuất kho và reservation còn active, transition returned chỉ
   release reserved; on_hand vẫn không tăng.
4. Với hàng đã rời kho, nhân viên kiểm tra đúng SKU/số lượng và tình trạng ở quy
   trình ngoài hệ thống.
5. Nếu đạt bán lại, Staff gọi inventory receipt cho đúng inventory item/kho,
   dùng referenceNumber là shipment number, reason nêu kết luận và idempotencyKey
   duy nhất. Transaction tăng on_hand, tạo operation/item, movement và audit.
6. Nếu hỏng/thiếu/sai hàng, không tạo receipt; cần lưu bằng chứng ở hệ thống
   ngoài phạm vi hiện tại.
7. Quyết định hoàn tiền không phát sinh tự động từ returned; full refund chỉ có
   thể được đồng bộ bằng payment webhook hiện hữu.

**Kiểm soát:** không dùng adjustment để né quy trình receipt; không cộng tồn tại
bước 2; không mô tả hàng là sellable trước bước 5.

## 10. Ma trận quyền thực thi

| Khả năng | Guest | Customer | Staff | Manager | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Checkout | Có | Có | Có qua storefront | Có | Có |
| Xem đơn | Bằng guest token | Đơn của mình | Back-office | Back-office | Back-office |
| Inventory dashboard/receipt/transfer/count | Không | Không | Có | Có | Có |
| Điều chỉnh tồn | Không | Không | Không | Có | Có |
| Fulfillment | Không | Chỉ public subset | Có | Có | Có |
| Xem segment/hồ sơ khách | Không | Không | Có | Có | Có |
| Đổi trạng thái khách | Không | Không | Không | Không | Có |
| Ghi catalog/promotion | Không | Không | Không | Có | Có |
