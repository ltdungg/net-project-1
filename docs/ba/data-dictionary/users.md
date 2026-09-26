# Bảng users

**Nguồn:** V1, mở rộng bởi V5  
**Mục đích:** Danh tính chung cho khách hàng và nhân viên.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| external_auth_id | varchar(160) | Có | UNIQUE |
| email | varchar(254) | Không | UNIQUE INDEX lower(email) |
| password_hash | varchar(100) | Có | BCrypt; null với placeholder local |
| full_name | varchar(100) | Có | — |
| phone | varchar(20) | Có | — |
| status | varchar(24) | Không | active; pending/active/locked/blocked/disabled/deleted |
| marketing_consent | boolean | Không | false |
| last_login_at | timestamptz | Có | — |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |
| email_verified_at | timestamptz | Có | V5 |
| locked_until | timestamptz | Có | V5 |

Quan hệ: user có roles, refresh/action token, addresses, carts, orders, wishlist
và có thể là actor trong movement/history/event/audit.

Runtime: đăng ký tạo pending; verify chuyển active; admin API status disabled lưu
blocked. Auth chỉ cấp principal cho active đã verify. Disable/reset thu hồi
refresh token theo service.

Kiểm thử: email khác hoa/thường, pending login, lock chưa/hết hạn, disable và
refresh, xóa mềm không phá order.

