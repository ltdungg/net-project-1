# Quy tắc nghiệp vụ và quy tắc nghiệm thu

## 1. Quy ước dữ liệu

| ID | Quy tắc |
|---|---|
| BR-DAT-01 | Khóa chính và khóa ngoại ứng dụng dùng varchar(64), không giả định UUID database-native. |
| BR-DAT-02 | Tiền VND lưu bằng bigint đơn vị đồng với hậu tố _cents; không dùng floating point. |
| BR-DAT-03 | Thời gian lưu timestamptz; API trả epoch milliseconds trừ token expiry nội bộ dùng epoch seconds. |
| BR-DAT-04 | Schema hiện tại có 33 bảng ứng dụng và 1 view admin_customer_segments. |
| BR-DAT-05 | Refunds là phạm vi tương lai; hiện không có bảng refunds. |

## 2. Danh mục, giỏ và giá

| ID | Quy tắc |
|---|---|
| BR-CAT-01 | Product bán được khi status=active; variant cũng phải active. |
| BR-CAT-02 | Slug product và SKU variant là duy nhất. |
| BR-CAT-03 | Mỗi product chỉ có tối đa một category primary. |
| BR-PRI-01 | Server là nguồn sự thật cho giá, discount, shipping và grand total. |
| BR-PRI-02 | grand_total_cents = subtotal_cents - discount_total_cents + shipping_total_cents + tax_total_cents. |
| BR-CAR-01 | Cart phải có user_id hoặc guest_token; một variant chỉ có một dòng mỗi cart. |
| BR-CAR-02 | Quantity cart/order từ 1 đến 10 mỗi variant trong request checkout. |
| BR-PRO-01 | Coupon so khớp không phân biệt hoa/thường, phải active, đúng thời gian và còn lượt. |
| BR-PRO-02 | Mỗi order chỉ áp tối đa một coupon trong bản hiện tại. |

## 3. Xác thực và tài khoản

| ID | Quy tắc |
|---|---|
| BR-AUTH-01 | Email duy nhất không phân biệt hoa/thường; mật khẩu 8–72 ký tự và không quá 72 byte. |
| BR-AUTH-02 | Mật khẩu cần chữ hoa, chữ thường và số; lưu BCrypt cost 12. |
| BR-AUTH-03 | User đăng ký ở pending; chỉ token verify_email hợp lệ trong 24 giờ mới active. |
| BR-AUTH-04 | Token verify_email/password_reset chỉ dùng một lần; DB chỉ lưu token_hash. |
| BR-AUTH-05 | Token password_reset hết hạn sau 30 phút và khi dùng thành công phải thu hồi toàn bộ refresh token. |
| BR-AUTH-06 | Access JWT mặc định 15 phút; refresh token opaque mặc định 30 ngày và xoay vòng mỗi refresh. |
| BR-AUTH-07 | Refresh/logout chỉ dùng hash; không lưu raw refresh token. |
| BR-AUTH-08 | User pending, blocked, disabled, deleted hoặc lock chưa hết hạn không được đăng nhập. |
| BR-AUTH-09 | owner@example.com/manager@example.com chỉ là bootstrap role theo biến môi trường local, không phải mật khẩu hard-code. |

## 4. Guest order token

| ID | Quy tắc |
|---|---|
| BR-GST-01 | Guest token được trả trong response tạo đơn và idempotent replay; member không nhận token này. |
| BR-GST-02 | Token là HMAC-SHA256 trên order ID, email chuẩn hóa và expiry; TTL cố định 7 ngày. |
| BR-GST-03 | GET guest order bắt buộc header X-Guest-Order-Token; không nhận token qua query string. |
| BR-GST-04 | Token chỉ mở đúng order/email đã ký; sai/hết hạn trả ORDER_NOT_FOUND. |
| BR-GST-05 | BFF chuyển tiếp x-guest-order-token và không buộc member cookie cho route /orders/{id}/guest. |
| BR-GST-06 | Không ghi raw token vào DB, URL, analytics, audit hoặc log. |

Known defect KD-GUEST-01: order tracking tuân BR-GST-03/06, nhưng online payment
client hiện còn đặt raw token trong query. Không nới BR-GST-03 để hợp thức hóa;
đánh giá nhánh này là chưa đạt cho đến khi client dùng header.

## 5. Đơn và thanh toán

| ID | Quy tắc |
|---|---|
| BR-ORD-01 | Checkout idempotency được scope theo user, cart hoặc guest identity. |
| BR-ORD-02 | COD tạo order confirmed/payment cod_pending; online tạo pending_payment/pending. |
| BR-ORD-03 | Snapshot contact, address, item, SKU, tên, variant và giá không thay đổi theo catalog về sau. |
| BR-ORD-04 | Direct order endpoint chỉ điều khiển confirmed, processing, ready_to_ship và cancelled; shipped/delivered/returned phải đi qua fulfillment. |
| BR-ORD-05 | Cancel/returned cần reason; terminal cancelled/returned không đi tiếp. |
| BR-PAY-01 | Webhook unique theo provider và provider_event_id, kiểm tra HMAC trên raw body. |
| BR-PAY-02 | Payment success chỉ áp dụng khi amount/currency/order state hợp lệ; event lặp không tạo side effect. |
| BR-PAY-03 | COD chỉ paid khi mọi fulfillment delivered. |
| BR-PAY-04 | Đơn paid/authorized không được cancel fulfillment trước khi hoàn tiền. |
| BR-PAY-05 | Bản hiện tại chỉ ghi nhận full refund từ webhook; không có partial refund command hoặc bảng refunds. |

Known defect KD-PAY-01: webhook success không kiểm tra order.status, khác với
mock confirm có guard cancelled. Late success có thể tạo order cancelled nhưng
payment_status paid/payments succeeded; BR-PAY-02 và NFR transaction chưa đạt.

## 6. Tồn kho đa kho

| ID | Quy tắc |
|---|---|
| BR-INV-01 | UNIQUE(warehouse_id, variant_id) xác định một dòng tồn. |
| BR-INV-02 | on_hand ≥ 0, reserved ≥ 0, reserved ≤ on_hand, safety_stock/reorder_point ≥ 0. |
| BR-INV-03 | available = on_hand - reserved; ATP dashboard = greatest(available - safety_stock, 0). Checkout hiện yêu cầu available đủ quantity, chưa dùng safety_stock làm ngưỡng chặn bán. |
| BR-INV-04 | Mỗi variant của order được cấp hoàn toàn từ một kho có đủ quantity; không split cùng dòng qua nhiều kho. |
| BR-INV-05 | Ưu tiên kho có available cao hơn rồi warehouse code; selection được khóa trước khi giữ tồn. |
| BR-INV-06 | Inventory balance chỉ thay đổi qua domain service và luôn có movement tương ứng. |
| BR-INV-07 | Receipt, transfer, stocktake và adjustment tạo operation posted tức thời và một operation item mỗi command. |
| BR-INV-08 | Mỗi inventory command cần idempotency key scope theo operation và actor. |
| BR-INV-09 | Transfer cần hai kho khác nhau và đủ on_hand sau khi giữ reserved. |
| BR-INV-10 | Stocktake actualQuantity không thấp hơn reserved; adjustment không làm on_hand âm hoặc thấp hơn reserved. |
| BR-INV-11 | Reservation online sống 2 giờ, COD 30 ngày; scheduler chạy định kỳ để release expired. |
| BR-INV-12 | Shipped consume reservation và giảm on_hand/reserved; cancel trước ship chỉ giảm reserved. |
| BR-INV-13 | Returned sau khi đã shipped không tự tăng tồn; chỉ cộng lại sau kiểm định bằng nghiệp vụ kho riêng. |

Known defect KD-INV-01: expiry service đã hủy payment_status trên order nhưng
chưa hủy row payments. BR-INV-11 đạt về release tồn, chưa đạt tính nhất quán
payment aggregate ở nhánh này.

Known defect KD-INV-02: COD có expires_at 30 ngày nhưng expiry query chỉ chọn
order pending_payment; COD confirmed không bao giờ khớp. BR-INV-11 chưa đạt cho
reservation COD.

## 7. Fulfillment đa kho

| ID | Quy tắc |
|---|---|
| BR-FUL-01 | Mỗi order/warehouse có tối đa một fulfillment; một order có thể có nhiều fulfillment. |
| BR-FUL-02 | shipment_number là duy nhất; carrier/tracking_number là duy nhất khi cả hai có giá trị. |
| BR-FUL-03 | tracking_number chỉ tồn tại khi carrier có giá trị. |
| BR-FUL-04 | estimated_delivery_at, shipped_at và delivered_at phải có thứ tự thời gian hợp lệ. |
| BR-FUL-05 | Update tracking không cho phép sau delivered, returned hoặc cancelled. |
| BR-FUL-06 | Shipped bắt buộc carrier và tracking; mọi non-cancel transition cần payment paid hoặc cod_pending. |
| BR-FUL-07 | failed, returned và cancelled bắt buộc reason; failed tăng delivery_attempts. |
| BR-FUL-08 | expectedVersion phải khớp fulfillment.version; ghi thành công tăng version. |
| BR-FUL-09 | Không cancel riêng một kiện nếu tồn tại sibling có status khác cancelled/returned; hủy trước dispatch đi qua whole-order workflow. |
| BR-FUL-10 | Trạng thái order và fulfillment_status được tổng hợp sau mỗi shipment transition. |
| BR-FUL-11 | Không cho trộn kết quả delivered/returned giữa các sibling trong bản hiện tại. |

### 7.1 Ma trận chuyển fulfillment

| Từ | Có thể sang |
|---|---|
| pending | processing, cancelled |
| processing | ready_to_ship, failed, cancelled |
| ready_to_ship | shipped, failed, cancelled |
| shipped | delivered, failed, returned |
| failed | processing, shipped, returned, cancelled |
| delivered | returned |
| returned | Không |
| cancelled | Không |

## 8. Phân khúc khách hàng

Do nhiều điều kiện có thể cùng đúng, hệ thống xét đúng thứ tự dưới đây và chọn
điều kiện đầu tiên:

| Ưu tiên | Code | Điều kiện |
|---:|---|---|
| 1 | at_risk | paid_orders ≥ 1 và last_paid_order_at trước hiện tại hơn 90 ngày. |
| 2 | vip | total_revenue_cents ≥ 5.000.000 hoặc paid_orders ≥ 5. |
| 3 | loyal | paid_orders ≥ 2 và có paid order trong 90 ngày. |
| 4 | new | created_at trong 30 ngày và paid_orders ≤ 1. |
| 5 | potential | paid_orders = 1. |
| 6 | prospect | Các trường hợp còn lại. |

| ID | Quy tắc |
|---|---|
| BR-SEG-01 | paid_orders/doanh thu chỉ tính payment_status=paid và loại order cancelled, returned, refunded. |
| BR-SEG-02 | Segment được tính động từ view, không lưu vào users và không sửa thủ công. |
| BR-SEG-03 | Dashboard luôn trả đủ sáu định nghĩa và ruleVersion RFM-2026.1. |
| BR-SEG-04 | Chỉ user có role customer và status khác deleted xuất hiện trong view. |

## 9. Audit, outbox và giới hạn hiện tại

### 9.1 Hàng hoàn chờ kiểm định

| ID | Quy tắc |
|---|---|
| BR-RET-01 | returned là trạng thái fulfillment/order, không phải giao dịch tăng tồn. |
| BR-RET-02 | Reservation đã consumed không được đổi ngược hoặc tự release khi returned. |
| BR-RET-03 | Hàng đạt kiểm định chỉ trở lại on_hand qua inventory receipt idempotent có reference shipment và audit. |
| BR-RET-04 | Hàng không đạt không tạo receipt; schema chưa có bảng quarantine/inspection/disposition. |
| BR-RET-05 | Return disposition và refund độc lập; không tự suy ra refund từ trạng thái returned. |

### 9.2 Audit, outbox và giới hạn

- History, fulfillment_events, inventory_movements và audit_logs được ứng dụng
  ghi nối tiếp; database chưa có policy chặn UPDATE/DELETE trực tiếp.
- Transaction ghi outbox cùng thay đổi nghiệp vụ. Phiên bản hiện tại chưa có
  dispatcher/consumer, vì vậy tài liệu không được tuyên bố email hay đồng bộ
  carrier đã tự động hoàn tất.
- Correlation ID tối đa 100 ký tự, được trả về response và đưa vào audit khi có.
