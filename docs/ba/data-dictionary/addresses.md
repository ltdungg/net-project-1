# Bảng addresses

**Nguồn:** V1__commerce_schema.sql  
**Mục đích:** Sổ địa chỉ của thành viên; order dùng snapshot riêng.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| user_id | varchar(64) | Không | FK users; ON DELETE CASCADE |
| label | varchar(50) | Không | — |
| recipient_name | varchar(100) | Không | — |
| phone | varchar(20) | Không | — |
| line1 | varchar(255) | Không | — |
| ward | varchar(100) | Có | — |
| district | varchar(100) | Không | — |
| city | varchar(100) | Không | API gọi province |
| postal_code | varchar(20) | Có | — |
| is_default | boolean | Không | false |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (user_id, is_default DESC, created_at); partial UNIQUE(user_id) khi
is_default. AccountService kiểm tra ownership. Xóa/sửa address không thay đổi
shipping_address_json của order đã đặt.

Kiểm thử: hai default, Customer A sửa address B, field bắt buộc và snapshot.
