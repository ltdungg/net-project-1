# Bảng wishlist_items

**Nguồn:** V4__customer_wishlist.sql  
**Mục đích:** Liên kết sản phẩm yêu thích của thành viên.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| user_id | varchar(64) | Không | PK, FK users; CASCADE |
| product_id | varchar(64) | Không | PK, FK products; CASCADE |
| created_at | timestamptz | Không | now() |

PK(user_id, product_id); index (product_id, created_at DESC) và
(user_id, created_at DESC, product_id). Chỉ account owner được GET/POST/DELETE.
Add lặp không tạo dòng thứ hai.

Kiểm thử ownership, product không tồn tại/inactive theo service, add lặp và
delete product/user cascade.
