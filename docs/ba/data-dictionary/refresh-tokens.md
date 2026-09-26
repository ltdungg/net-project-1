# Bảng refresh_tokens

**Nguồn:** V1, constraint bổ sung V3  
**Mục đích:** Lưu phiên refresh dưới dạng hash, không lưu token thô.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| user_id | varchar(64) | Không | FK users; ON DELETE CASCADE |
| token_hash | varchar(100) | Không | UNIQUE, SHA-256 Base64 |
| expires_at | timestamptz | Không | Lớn hơn created_at |
| revoked_at | timestamptz | Có | Không trước created_at |
| created_at | timestamptz | Không | now() |

Index (user_id, expires_at). TTL mặc định 30 ngày từ application config. Mỗi
refresh khóa row, revoke token cũ và tạo token mới. Logout, reset password và
disable account revoke token đang hoạt động.

Kiểm thử: raw token không xuất hiện DB/log, reuse sau rotation, expiry, revoke all.

