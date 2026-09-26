# Bảng user_roles

**Nguồn:** V1, index bổ sung V3  
**Mục đích:** Liên kết N–N giữa users và roles.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| user_id | varchar(64) | Không | PK, FK users; ON DELETE CASCADE |
| role_id | varchar(64) | Không | PK, FK roles; ON DELETE CASCADE |
| assigned_at | timestamptz | Không | now() |

PK(user_id, role_id); index (role_id, user_id). Bảng hiện tại không có
assigned_by hay expires_at. Role customer được gán khi đăng ký; role back-office
có thể bootstrap theo danh sách email cấu hình local.

Kiểm thử: gán trùng idempotent theo PK, FK user/role, principal nhận đúng tập role.

