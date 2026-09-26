# Bảng carts

**Nguồn:** V1, constraint/index V3  
**Mục đích:** Giỏ theo member hoặc guest cookie.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| user_id | varchar(64) | Có | FK users; SET NULL |
| guest_token | varchar(160) | Có | UNIQUE |
| currency | varchar(3) | Không | VND; ba chữ in hoa |
| coupon_code | varchar(60) | Có | — |
| expires_at | timestamptz | Có | Nếu có phải sau created_at |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

CHECK yêu cầu user_id hoặc guest_token. Index user_id/updated_at và partial
expires_at. Bảng không có status và hiện lưu cart guest token, không phải hash.
Cookie net_cart HttpOnly, SameSite=Lax, TTL 30 ngày.

Phân biệt: cart guest token là credential giỏ trong cookie; guestAccessToken của
order là HMAC stateless 7 ngày gửi bằng X-Guest-Order-Token.

Kiểm thử token đoán/lặp, expiry, owner, coupon và checkout xóa cart items.

