# Bảng product_media

**Nguồn:** V1, index/constraint V3  
**Mục đích:** Metadata ảnh/video của product hoặc tùy chọn variant.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| product_id | varchar(64) | Không | FK products; CASCADE |
| variant_id | varchar(64) | Có | FK product_variants; SET NULL |
| storage_key | varchar(500) | Không | — |
| public_url | varchar(1000) | Có | — |
| media_type | varchar(30) | Không | image; image/video |
| alt_text | varchar(255) | Không | — |
| sort_order | integer | Không | 0; ≥0 |
| created_at | timestamptz | Không | now() |
| updated_at | timestamptz | Không | now() |

Index (product_id, sort_order, id) và partial index variant_id. Không có cột
is_primary; media đầu theo sort_order được dùng làm ảnh chính trong một số query.
Kiểm thử FK variant/product, media type, alt text và path upload.

