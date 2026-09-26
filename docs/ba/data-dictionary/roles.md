# Bảng roles

**Nguồn:** V1__commerce_schema.sql  
**Mục đích:** Danh mục role dùng bởi Spring Security.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| code | varchar(32) | Không | UNIQUE |
| name | varchar(100) | Không | — |
| description | text | Có | — |

Quan hệ: roles 1–N user_roles. Seed hiện có customer, staff, manager, admin.
Permission không lưu JSON trong bảng; ứng dụng kiểm tra role ở SecurityConfig và
method security. Bảng không có created_at, updated_at hay is_system.

Kiểm thử: duplicate code, role không tồn tại khi gán, endpoint thiếu role trả 403.

