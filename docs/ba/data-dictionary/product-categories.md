# Bảng product_categories

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Liên kết sản phẩm–danh mục và đánh dấu danh mục chính.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| product_id | varchar(64) | Không | PK, FK products; CASCADE |
| category_id | varchar(64) | Không | PK, FK categories; CASCADE |
| is_primary | boolean | Không | false |
| sort_order | integer | Không | 0; ≥0 |

PK(product_id, category_id); partial UNIQUE(product_id) khi is_primary; index
(category_id, sort_order, product_id). Bảng không có created_at.

Kiểm thử: duplicate pair, hai primary, FK và thứ tự hiển thị.

