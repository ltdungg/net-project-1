# Danh mục kiểm thử dữ liệu

## 1. Schema và migration

| ID | Test | Kỳ vọng |
|---|---|---|
| DB-S-01 | Migrate database rỗng V1→V7 | 33 bảng ứng dụng + 1 view |
| DB-S-02 | Nâng database có dữ liệu V6→V7 | Backfill không mất order/reservation |
| DB-S-03 | Đếm file từ điển | Đúng 33 file bảng + 1 file view |
| DB-S-04 | Kiểm tra Flyway checksum | V1–V7 không bị chỉnh sau áp dụng |
| DB-S-05 | Truy vấn refunds | Không có bảng; tài liệu ghi future scope |

## 2. Auth và guest token

| ID | Test | Kỳ vọng |
|---|---|---|
| DB-A-01 | Hai email khác hoa/thường | Unique violation/EMAIL_EXISTS |
| DB-A-02 | Verify token lần hai/hết 24h | Bị từ chối |
| DB-A-03 | Reset token lần hai/hết 30m | Bị từ chối |
| DB-A-04 | Refresh hai lần cùng raw token | Lần đầu rotate; lần hai REFRESH_EXPIRED |
| DB-A-05 | Reset/disable user | Mọi refresh token active bị revoke |
| DB-G-01 | Guest token còn hạn + header đúng | Đọc đúng order |
| DB-G-02 | Token đúng nhưng order ID khác | 404 ORDER_NOT_FOUND |
| DB-G-03 | Token hơn 7 ngày/biến đổi chữ ký | 404 ORDER_NOT_FOUND |
| DB-G-04 | Gửi token query, thiếu header | Bị từ chối; query không được coi là credential |

## 3. Inventory đa kho

| ID | Test | Kỳ vọng |
|---|---|---|
| DB-I-01 | Duplicate warehouse+variant | Unique violation |
| DB-I-02 | reserved âm, lớn hơn on_hand | CHECK reject |
| DB-I-03 | 20 checkout tranh item cuối | Tối đa một reservation hợp lệ |
| DB-I-04 | Receipt replay cùng key/actor | Một operation/movement |
| DB-I-05 | Transfer cùng kho/thiếu tồn | Reject, không partial movement |
| DB-I-06 | Transfer thành công | transfer_out + transfer_in và balance đúng |
| DB-I-07 | Count thấp hơn reserved | BELOW_RESERVED |
| DB-I-08 | Adjustment làm balance âm | INVALID_BALANCE |
| DB-I-09 | Expiry worker chạy đồng thời | Mỗi reservation expire/release một lần |

## 4. Fulfillment

| ID | Test | Kỳ vọng |
|---|---|---|
| DB-F-01 | Order có allocation ở hai kho | Hai fulfillment, unique order+warehouse |
| DB-F-02 | Một reservation map hai item | Unique violation |
| DB-F-03 | Tracking trùng cùng carrier | Unique violation/validation |
| DB-F-04 | Shipped thiếu tracking | TRACKING_REQUIRED |
| DB-F-05 | Shipped với payment chưa sẵn sàng | PAYMENT_NOT_READY |
| DB-F-06 | Hai PATCH cùng expectedVersion | Một success, một FULFILLMENT_CHANGED |
| DB-F-07 | Ship một trong hai kiện | Chỉ reservation kiện đó consumed; order partially_fulfilled |
| DB-F-08 | Tất cả kiện COD delivered | Một payment pending→succeeded; order paid |
| DB-F-09 | Cancel paid hoặc sibling outbound | REFUND_REQUIRED/PARTIAL_CANCEL_UNSUPPORTED |
| DB-F-10 | Returned sau shipped | on_hand không tự tăng |
| DB-F-11 | failed không reason | FULFILLMENT_REASON_REQUIRED |

## 5. Segmentation

| ID | Test | Kỳ vọng |
|---|---|---|
| DB-C-01 | VIP không giao dịch hơn 90 ngày | at_risk do ưu tiên |
| DB-C-02 | Doanh thu đúng 5.000.000 | vip |
| DB-C-03 | Hai paid order, gần nhất trong 90 ngày | loyal |
| DB-C-04 | User 30 ngày, tối đa một paid order | new |
| DB-C-05 | Một paid order nhưng không new/at-risk | potential |
| DB-C-06 | Không paid order | prospect |
| DB-C-07 | Order cancelled/returned/refunded | Không cộng paid revenue |
| DB-C-08 | Segment không có user | Dashboard vẫn trả zero row định nghĩa |

## 6. Tài chính, audit và privacy

- Property test công thức cents cho order/item/promotion.
- Duplicate provider event không lặp payment/order/outbox side effect.
- Payment failed muộn sau succeeded bị ignore.
- Correlation ID nối được audit với request.
- Raw token/password/provider secret không xuất hiện trong log/audit/outbox.
- Customer A không đọc resource Customer B; Staff không đổi status khách.

## 7. Evidence

Lưu build hash, Flyway version, dữ liệu đầu vào ẩn PII, request/header đã redact,
expected/actual, SQL verification, correlation ID và người xác nhận.

