# Bảng fulfillment_events

**Nguồn:** V7__customer_segments_and_fulfillments.sql  
**Mục đích:** Timeline trạng thái/thao tác của từng fulfillment.

| Cột | Kiểu | Null | Mặc định/ràng buộc |
|---|---|:---:|---|
| id | varchar(64) | Không | PK |
| fulfillment_id | varchar(64) | Không | FK fulfillments; CASCADE |
| from_status | varchar(30) | Có | Null cho event khởi tạo |
| to_status | varchar(30) | Không | Trạng thái/event đích |
| reason | varchar(500) | Có | Lý do hoặc mô tả update tracking |
| actor_user_id | varchar(64) | Có | FK users; SET NULL |
| metadata_json | jsonb | Có | Metadata tối thiểu |
| created_at | timestamptz | Không | now() |

Index (fulfillment_id, created_at, id). Checkout ghi event pending; tracking
update ghi from=to và reason cập nhật thông tin vận đơn; status transition/expiry
ghi from/to thực tế.

Ứng dụng chỉ append nhưng database chưa có trigger/policy cấm UPDATE/DELETE.
Metadata không chứa full address hay raw token.

Kiểm thử event không ghi khi transition/version conflict, actor/reason, thứ tự
timeline và cascade khi xóa fulfillment trong migration/test.
