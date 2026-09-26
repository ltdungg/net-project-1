# BRD/SRS — Yêu cầu nghiệp vụ và hệ thống

**Sản phẩm:** NÉT Commerce  
**Phiên bản tài liệu:** 1.0 — đồng bộ mã nguồn đến Flyway V7  
**Trạng thái:** BASELINE ĐỒ ÁN  
**Nguồn sự thật kỹ thuật:** Java Spring Boot API, Flyway V1–V7 và PostgreSQL

## 1. Bối cảnh và mục tiêu

NÉT Commerce giải quyết trọn luồng bán quần áo trực tuyến: khách khám phá sản
phẩm, chọn đúng biến thể, đặt hàng không bắt buộc tạo tài khoản, thanh toán,
theo dõi từng kiện; nhân viên quản lý catalog, khách hàng, tồn kho đa kho, đơn và
vận chuyển trên cùng một nguồn dữ liệu.

Mục tiêu nghiệp vụ của bản hiện tại:

| Mã | Mục tiêu | Bằng chứng chấp nhận |
|---|---|---|
| BR-01 | Nhận đơn storefront an toàn và không tạo trùng. | Checkout có idempotency, snapshot giá và transaction tích hợp. |
| BR-02 | Không bán vượt tồn khả dụng. | Ràng buộc on_hand/reserved, reservation và kiểm thử tranh chấp SKU cuối. |
| BR-03 | Theo dõi được đơn có hàng xuất từ nhiều kho. | Tự tạo một fulfillment cho mỗi kho tham gia cấp hàng. |
| BR-04 | Khách vãng lai vẫn tự xem được đơn mà không lộ đơn khác. | Guest order token ký HMAC, TTL 7 ngày, gửi qua header chuyên biệt. |
| BR-05 | Quản trị viên có hồ sơ khách hàng và phân khúc nhất quán. | View admin_customer_segments và API RFM-2026.1. |
| BR-06 | Mọi thao tác nhạy cảm có thể truy nguyên. | History, fulfillment event, movement, audit và correlation ID. |

## 2. Phạm vi hiện thực

### 2.1 Trong phạm vi

- Catalog 22 sản phẩm, 58 biến thể, media, tìm kiếm và lọc.
- Giỏ khách vãng lai, voucher, checkout COD/online giả lập.
- Đăng ký, xác minh email, đăng nhập, refresh, đăng xuất, quên và đặt lại mật khẩu.
- Hồ sơ, địa chỉ, wishlist và lịch sử đơn cho thành viên.
- Tồn kho theo SKU và kho; nhập, chuyển kho, kiểm kê, điều chỉnh và xuất CSV.
- Reservation theo đơn và có job tự giải phóng khi hết hạn; nhánh online hoạt
  động ở mức cơ bản, còn hai sai lệch KD-INV-01/KD-INV-02 được nêu tại mục 5.2.
- Phân khúc khách hàng và trang hồ sơ 360 độ cho back-office.
- Fulfillment đa kho, tracking, lịch sử trạng thái, đồng bộ trạng thái đơn và COD.
- Dashboard, báo cáo, tài chính, promotion, upload và AI Copilot đọc dữ liệu tổng hợp.

### 2.2 Ngoài phạm vi hiện tại

- Không có bảng refunds và chưa có command hoàn tiền trong back-office. Webhook
  chỉ hỗ trợ ghi nhận trạng thái hoàn tiền toàn phần trên payment/order.
- Chưa tích hợp API/webhook thật của hãng vận chuyển; tracking do nhân viên nhập.
- Chưa có dispatcher cho transactional outbox và chưa có dịch vụ email production.
- Chưa có bảng kiểm định hàng hoàn/cách ly hàng lỗi. Hàng đã xuất kho hoàn về
  không tự cộng tồn; kho xử lý bằng chứng từ tồn sau kiểm định.

## 3. Tác nhân và quyền

| Tác nhân | Khả năng chính |
|---|---|
| Guest | Xem catalog, dùng giỏ, áp voucher, checkout, xem đúng đơn bằng guest token. |
| Customer | Guest capability và hồ sơ, địa chỉ, wishlist, danh sách/chi tiết đơn của mình. |
| Staff | Đọc back-office; xử lý đơn, fulfillment và nghiệp vụ kho theo endpoint cho phép. |
| Manager | Staff capability; quản lý catalog, promotion, báo cáo, tài chính và điều chỉnh tồn. |
| Admin | Toàn bộ quyền trên; thay đổi trạng thái tài khoản khách hàng. |
| Payment provider | Gửi webhook có chữ ký; bản đồ án dùng mock provider. |
| Scheduler | Giải phóng reservation hết hạn và hủy đơn/fulfillment liên quan. |

Authorization luôn thực thi tại Spring Security hoặc method security. Ẩn nút ở
frontend không được xem là kiểm soát quyền.

## 4. Yêu cầu chức năng

### 4.1 Catalog, giỏ và voucher

- **FR-CAT-01:** Chỉ product và variant trạng thái active được bán.
- **FR-CAT-02:** SKU và slug là duy nhất; giá dùng price_cents kiểu bigint.
- **FR-CART-01:** Giỏ khách được nhận diện bằng cookie HttpOnly net_cart, TTL 30 ngày.
- **FR-CART-02:** Một variant xuất hiện tối đa một dòng; quantity từ 1 đến 10.
- **FR-CART-03:** Server tính subtotal, discount, shipping và grand total.
- **FR-PRO-01:** Voucher được kiểm tra lại trong transaction đặt đơn.

### 4.2 Checkout, đơn và quyền guest

- **FR-ORD-01:** POST /api/orders hỗ trợ guest và member; yêu cầu email, điện
  thoại, địa chỉ, paymentMethod, danh sách item và idempotencyKey.
- **FR-ORD-02:** Server gom dòng trùng variant, khóa tồn theo thứ tự ổn định,
  chọn một kho active có `available = on_hand - reserved` đủ số lượng cho từng
  variant và giữ tồn.
- **FR-ORD-03:** Order, items, payment, reservation, fulfillment, history và
  outbox được tạo nguyên tử; rollback không để dữ liệu mồ côi.
- **FR-ORD-04:** Online order bắt đầu ở pending_payment/pending; COD bắt đầu ở
  confirmed/cod_pending. Reservation online hết hạn sau 2 giờ, COD sau 30 ngày.
- **FR-GUEST-01:** Response tạo đơn guest trả guestAccessToken. Token được ký
  HMAC-SHA256 theo order ID, email chuẩn hóa và expiry; không lưu vào database.
- **FR-GUEST-02:** Token guest có hiệu lực 7 ngày. Đọc đơn bằng
  GET /api/orders/{id}/guest và header X-Guest-Order-Token.
- **FR-GUEST-03:** Token thiếu, sai, hết hạn hoặc thuộc đơn khác đều trả
  ORDER_NOT_FOUND để giảm khả năng dò quét.
- **FR-GUEST-04:** BFF cùng origin phải chuyển tiếp header x-guest-order-token.

**Known defect KD-GUEST-01:** trang theo dõi đơn đã gửi header đúng, nhưng
`platform/app/thanh-toan/[id]/online-payment-client.tsx` hiện ghép token vào
query `?token=` khi đọc đơn. Backend không nhận query token nên nhánh guest tại
trang thanh toán online sẽ không tải được order. Vì vậy FR-GUEST-02/04 và phần
bảo mật guest của NFR-04 mới đạt một phần cho đến khi client được sửa.

### 4.3 Xác thực và tài khoản

- **FR-AUTH-01:** Đăng ký tạo user pending, hash mật khẩu bằng BCrypt cost 12,
  gán role customer và phát token xác minh một lần.
- **FR-AUTH-02:** Token xác minh email có TTL 24 giờ; token reset mật khẩu có
  TTL 30 phút. Database chỉ lưu SHA-256 hash trong auth_tokens.
- **FR-AUTH-03:** Chỉ tài khoản đã xác minh và active mới đăng nhập.
- **FR-AUTH-04:** Access JWT mặc định 15 phút; refresh token opaque mặc định
  30 ngày, lưu hash và xoay vòng ở mỗi lần refresh.
- **FR-AUTH-05:** Access và refresh dùng cookie HttpOnly, SameSite=Strict;
  production bật Secure. Java API đặt refresh-cookie path `/api/auth`; BFF đổi
  path trả về trình duyệt thành `/api/commerce/auth`.
- **FR-AUTH-06:** Reset mật khẩu thu hồi mọi refresh token đang hoạt động.
- **FR-AUTH-07:** Register, verify, resend, login, forgot, reset và refresh có
  rate limit; forgot/resend dùng phản hồi chung để hạn chế enumeration.
- **FR-ACC-01:** Customer chỉ đọc/sửa profile, address, wishlist và order thuộc mình.

### 4.4 Tồn kho đa kho

- **FR-INV-01:** Một inventory_items đại diện duy nhất cho một cặp warehouse và variant.
- **FR-INV-02:** Dashboard phân biệt `available = on_hand - reserved` và
  `ATP = greatest(available - safety_stock, 0)`. Checkout hiện kiểm tra
  available; safety_stock mới là chỉ số cảnh báo/hoạch định, chưa chặn bán.
- **FR-INV-03:** Nhập, chuyển kho, kiểm kê và điều chỉnh tạo
  inventory_operations trạng thái posted, một inventory_operation_items,
  inventory_movements và audit trong cùng transaction.
- **FR-INV-04:** Transfer tạo transfer_out ở kho nguồn và transfer_in ở kho đích
  cùng reference; không cho chuyển cùng kho hoặc làm on_hand thấp hơn reserved.
- **FR-INV-05:** Điều chỉnh trực tiếp chỉ dành cho Manager/Admin; mọi command kho
  cần reason và idempotencyKey.
- **FR-INV-06:** Khi shipped, chỉ reservation gắn với fulfillment đó được consume,
  đồng thời giảm on_hand và reserved. Hủy trước xuất kho chỉ giảm reserved.

**Known defect KD-INV-01:** job hết hạn reservation hiện đặt
`customer_orders.payment_status=cancelled` nhưng chưa đổi row `payments` đang
pending. Vì vậy tính nhất quán payment aggregate của NFR-02 mới đạt một phần ở
nhánh timeout cho đến khi hai trạng thái được đồng bộ cùng transaction.

**Known defect KD-INV-02:** checkout COD ghi `expires_at` sau 30 ngày nhưng đơn
bắt đầu ở confirmed/cod_pending; job expiry hiện chỉ chọn order
pending_payment với payment pending/failed. Vì vậy reservation COD quá hạn
không được job giải phóng và có thể giữ reserved vô thời hạn.

### 4.5 Fulfillment đa kho

- **FR-FUL-01:** Checkout tự tạo đúng một fulfillment cho mỗi kho tham gia đơn;
  unique trên order_id và warehouse_id.
- **FR-FUL-02:** Mỗi fulfillment có shipment number, snapshot địa chỉ, item,
  reservation, kho xuất, ETA và lịch sử sự kiện.
- **FR-FUL-03:** Vòng đời hỗ trợ pending, processing, ready_to_ship, shipped,
  delivered, failed, returned và cancelled.
- **FR-FUL-04:** Trước shipped phải có carrier và tracking number.
- **FR-FUL-05:** failed, returned và cancelled bắt buộc có lý do.
- **FR-FUL-06:** Update tracking/status dùng expectedVersion để phát hiện ghi đè đồng thời.
- **FR-FUL-07:** Đơn được tổng hợp từ mọi kiện; có partially_fulfilled khi mới
  một phần kiện ra kho. COD chỉ chuyển paid khi tất cả kiện delivered.
- **FR-FUL-08:** Không hủy riêng một fulfillment nếu còn sibling ở trạng thái
  khác cancelled/returned; trước xuất kho phải hủy toàn đơn qua order workflow.
  Đơn paid/authorized phải hoàn tiền trước khi hủy.
- **FR-FUL-09:** Hàng consumed chuyển returned vẫn chưa tăng on_hand; chờ kho kiểm định.
- **FR-FUL-10:** Bản hiện tại chặn kết quả đa kiện trộn delivered/returned: không
  return một kiện khi sibling đã delivered và không deliver khi sibling đã returned.

### 4.6 Phân khúc và quản trị khách hàng

- **FR-CUS-01:** Danh sách khách hỗ trợ tìm email/tên/điện thoại, lọc status,
  segment và phân trang.
- **FR-CUS-02:** Hồ sơ 360 trả profile, roles, addresses, thống kê, segment và
  tối đa 50 đơn gần nhất.
- **FR-CUS-03:** GET /api/admin/customers/segments trả đủ sáu segment theo
  ruleVersion RFM-2026.1, kể cả segment có số khách bằng 0.
- **FR-CUS-04:** Phân khúc được tính động từ view; không cho sửa tay.
- **FR-CUS-05:** Chỉ Admin được active/disable khách; disable cần lý do, không
  được tự disable và phải thu hồi refresh token.

### 4.7 Hàng hoàn và kiểm định

- **FR-RET-01:** Chuyển fulfillment đã shipped/delivered sang returned bắt buộc
  có reason và ghi event/audit/outbox; thao tác này không tăng tồn.
- **FR-RET-02:** Hàng vật lý phải được tách khỏi tồn bán được trong thời gian chờ
  kiểm định. Schema hiện chưa có return case, quarantine location hay inspection.
- **FR-RET-03:** Nếu kiểm định đạt, Staff ghi nhận nhập lại bằng inventory receipt
  với referenceNumber/idempotencyKey truy về shipment. Nếu không đạt, không tạo
  receipt; bằng chứng kiểm định hiện được quản lý ngoài hệ thống.
- **FR-RET-04:** Hoàn hàng và hoàn tiền là hai quyết định riêng. Bản hiện tại
  không có refund command/bảng refunds; chỉ payment webhook có thể phản ánh
  full refund.

**Known defect KD-PAY-01:** webhook `payment.succeeded` chưa xét order status.
Một event đến muộn sau khi order đã cancelled vẫn có thể đặt payment row thành
succeeded và order.payment_status thành paid trong khi order.status giữ
cancelled. BR-PAY-02 và NFR-02/03 chưa đạt ở race này.

## 5. Yêu cầu phi chức năng

| Mã | Nhóm | Tiêu chí |
|---|---|---|
| NFR-01 | Hiệu năng | API read p95 không quá 500 ms, write p95 không quá 900 ms trong tải chuẩn. |
| NFR-02 | Nhất quán | Checkout, inventory và fulfillment side effect nằm trong transaction PostgreSQL. |
| NFR-03 | Đồng thời | Idempotency, advisory/row lock, conditional update và optimistic version được kiểm thử. |
| NFR-04 | Bảo mật | TLS production, BCrypt, token hash, HttpOnly cookie, Origin validation, RBAC và rate limit. |
| NFR-05 | Riêng tư | Không log password, raw token, full provider payload hoặc PII không cần thiết. |
| NFR-06 | Truy vết | Correlation ID nối request với audit, history, movement và outbox. |
| NFR-07 | Khả dụng | Healthcheck cho frontend, API, PostgreSQL và Redis; container chạy non-root/read-only khi phù hợp. |
| NFR-08 | Khôi phục | RPO đề xuất 24 giờ, RTO 4 giờ; Flyway chỉ tiến và restore phải diễn tập. |
| NFR-09 | Dễ bảo trì | Schema gồm đúng 33 bảng ứng dụng và 1 view sau V7; migration mới không sửa checksum cũ. |
| NFR-10 | Trải nghiệm | Luồng chính responsive, trạng thái loading/error/empty rõ và hướng đến WCAG 2.2 AA. |

## 6. Quy ước API và lỗi

- Dữ liệu thành công dùng envelope { data, error: null }; lỗi dùng
  { data: null, error: { code, message, details } }.
- Thời gian API dùng epoch milliseconds; tiền dùng bigint cents với currency VND.
- Command thay đổi dữ liệu đi qua BFF cùng origin và Origin validation.
- Lỗi nghiệp vụ có mã ổn định, ví dụ INVENTORY_CHANGED, TRACKING_REQUIRED,
  FULFILLMENT_CHANGED, CUSTOMER_SEGMENT_INVALID và ORDER_NOT_FOUND.

## 7. Điều kiện nghiệm thu hệ thống

1. Flyway V1–V7 tạo đúng 33 bảng và view admin_customer_segments.
2. Auth lifecycle và rotation chạy với PostgreSQL thật.
3. Checkout replay không tạo order, reservation hay fulfillment trùng.
4. Đơn đa kho ánh xạ từng item/reservation vào đúng fulfillment.
5. Ship một kiện chỉ consume tồn của kiện đó.
6. Guest token đúng đọc được đơn qua header trong 7 ngày; token sai/hết hạn bị
   từ chối. Nghiệm thu toàn frontend còn mở do KD-GUEST-01 ở trang thanh toán.
7. Segment đúng thứ tự ưu tiên và loại đơn huỷ/hoàn khỏi doanh thu.
8. Hàng hoàn sau xuất kho không tự cộng lại tồn.
