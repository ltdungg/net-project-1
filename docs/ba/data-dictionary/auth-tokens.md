# Bảng auth_tokens

**Nguồn:** V5__auth_lifecycle.sql  
**Mục đích:** Token hành động một lần cho xác minh email và đặt lại mật khẩu.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| user_id | varchar(64) | Không | FK users; ON DELETE CASCADE |
| type | varchar(32) | Không | verify_email hoặc password_reset |
| token_hash | varchar(100) | Không | UNIQUE |
| expires_at | timestamptz | Không | — |
| consumed_at | timestamptz | Có | Null khi còn dùng được |
| created_at | timestamptz | Không | now() |

Partial index (user_id, type, expires_at DESC) khi consumed_at IS NULL. Verify
email sống 24 giờ; reset password 30 phút. Phát token mới consume token cũ cùng
user/type. Chỉ hash được lưu; token raw chỉ trả ở local development theo policy.

Kiểm thử: single-use, sai type, hết hạn, phát lại, reset revoke refresh token.

