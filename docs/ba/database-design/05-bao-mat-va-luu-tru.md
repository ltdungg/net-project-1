# Bảo mật, token và lưu trữ

## 1. Phân loại

| Loại | Dữ liệu | Đối tượng |
|---|---|---|
| Công khai | Catalog active, media public | products, variants, media, categories |
| Nội bộ | SKU, kho, tồn, movement, shipment cost | inventory/fulfillment |
| PII | Email, phone, tên, địa chỉ, user agent | users, addresses, order snapshot, audit |
| Xác thực bí mật | Password hash, refresh/action token hash, JWT secret | users, refresh_tokens, auth_tokens, secret manager |
| Tài chính | Order totals, payment reference/status | customer_orders, payments, payment_events |

Không lưu PAN/CVV. Không đưa raw password, raw refresh/action/guest token hay
provider secret vào log, audit, outbox hoặc analytics.

## 2. Auth lifecycle

- BCrypt cost 12 cho password.
- Access JWT HS256 mặc định 15 phút, issuer net-commerce-api.
- Refresh token ngẫu nhiên 48 byte, lưu SHA-256 hash, TTL mặc định 30 ngày,
  rotate mỗi lần refresh và revoke khi logout/reset/disable.
- verify_email token TTL 24 giờ; password_reset token TTL 30 phút.
- Action token cũ cùng user/type bị consume khi phát lại.
- Cookie HttpOnly, SameSite=Strict; Secure ngoài local. Upstream Java đặt refresh
  cookie dưới `/api/auth`; BFF rewrite thuộc tính Path thành
  `/api/commerce/auth` trước khi trả cho browser.
- OriginValidationFilter bảo vệ request thay đổi dữ liệu dùng cookie.

## 3. Guest order token

- Token do JwtService ký HMAC-SHA256 bằng JWT_SECRET.
- Scope gồm literal guest-order, order ID, email lowercase/trim và epoch expiry.
- Format truyền là expiry.signature, TTL 7 ngày.
- Token không lưu database. Frontend lưu sessionStorage; đóng browser session có
  thể làm mất khả năng truy cập dù token API chưa hết hạn.
- Request dùng header X-Guest-Order-Token qua BFF cùng origin.
- Không dùng query parameter vì URL có thể rò qua history, referrer và access log.
- Response sai/hết hạn là 404 chung để giảm enumeration.

Known defect KD-GUEST-01: order tracking client đã dùng header, nhưng online
payment client hiện còn đưa token vào query. Backend không hỗ trợ query token;
nhánh này vừa không hoạt động vừa vi phạm mục tiêu chống lộ URL cho đến khi sửa.

## 4. Quyền và PII

- Spring Security stateless; RBAC customer, staff, manager, admin.
- Account/order member kiểm tra ownership.
- Guest chỉ nhận public order/fulfillment subset.
- Admin list cần cân nhắc masking theo môi trường; bản hiện tại trả email/phone
  cho role vận hành đã xác thực.
- Audit before/after dùng whitelist; fulfillment event metadata không chứa full address.

## 5. Retention đề xuất

| Đối tượng | Baseline đề xuất | Ghi chú |
|---|---|---|
| auth_tokens consumed/expired | 30–90 ngày | Sau đó xóa batch |
| refresh_tokens revoked/expired | 30–90 ngày | Phục vụ điều tra phiên |
| cart hết hạn | 30–90 ngày | Giữ aggregate analytics ẩn danh nếu cần |
| order/payment/inventory/fulfillment | Theo kế toán/pháp lý | Không hard-delete trong luồng thường |
| payment event raw JSON | 90–365 ngày | Redact/archive theo provider |
| audit log | 1–7 năm theo policy | Cần storage bất biến nếu production |
| outbox processed | 7–30 ngày hot | Hiện chưa có dispatcher |

Con số cuối cần quyết định Legal/Security; đây là baseline đồ án.

## 6. Khoảng trống production

- JWT guest/access dùng chung secret; production cần rotation/key management.
- CORS backend trực tiếp hiện chưa khai báo X-Guest-Order-Token trong allowed
  headers; browser phải đi qua BFF same-origin hoặc cấu hình được cập nhật.
- Outbox chưa dispatch, email provider chưa nối.
- Audit/event append-only mới được bảo vệ ở application, chưa có DB role/policy
  ngăn sửa trực tiếp.
