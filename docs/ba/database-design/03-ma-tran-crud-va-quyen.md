# Ma trận CRUD, quyền và chủ sở hữu dữ liệu

Ký hiệu C/R/U/D/A là tạo/đọc/cập nhật/xóa/thêm bản ghi lịch sử. D là xóa trong
phạm vi FK/retention, không đại diện quyền sửa DB trực tiếp.

| Đối tượng | Guest | Customer | Staff | Manager | Admin | System |
|---|---|---|---|---|---|---|
| users, roles, user_roles | — | R bản thân | R hạn chế | R | R/U status/role theo API có sẵn | C/U auth |
| refresh_tokens, auth_tokens | — | Qua auth API | — | — | — | C/U/revoke/consume |
| addresses | — | C/R/U/D bản thân | R snapshot đơn | R | R | — |
| catalog tables | R active subset | R active subset | R | C/R/U product theo quyền | C/R/U | Seed/cache |
| wishlist_items | — | C/R/D bản thân | — | — | — | — |
| carts, cart_items | C/R/U/D qua cookie | C/R/U/D | — | — | R hỗ trợ gián tiếp | Expiry |
| warehouses, inventory_items | R availability gộp | R availability gộp | R | R/U qua service | R/U qua service | U |
| inventory_operations/items/movements | — | — | C/A/R receipt/transfer/count | C/A/R mọi loại | C/A/R mọi loại | A expiry/ship |
| inventory_reservations | — | Không public | R | R | R | C/U |
| customer_orders/items/history | C và R bằng guest token | C/R bản thân | R/U hợp lệ | R/U | R/U | C/U |
| payments/events | C qua checkout/mock; webhook ký | R trạng thái | R | R finance | R | C/U |
| promotions/coupons/order_promotions | Validate | Validate | R | C/R/U promotion | C/R/U | C/count |
| fulfillments/items/events | R public bằng quyền order | R public subset | C/R/U/A | C/R/U/A | C/R/U/A | C/U |
| audit_logs | — | — | Không public | R theo màn hình được cấp | R | A |
| outbox_events | — | — | — | R chẩn đoán | R | C/U tương lai |
| admin_customer_segments view | — | — | R | R | R | — |

## Ràng buộc endpoint

- /api/admin/** yêu cầu STAFF, MANAGER hoặc ADMIN.
- POST /api/admin/inventory/adjust yêu cầu MANAGER hoặc ADMIN.
- PATCH /api/admin/customers/{id}/status chỉ ADMIN.
- Ghi catalog/promotion và báo cáo/tài chính áp method security theo controller.
- /api/account/** và member /api/orders/** yêu cầu authenticated.
- GET /api/orders/{id}/guest public về authentication nhưng bắt buộc header token.
- Provider webhook public về login nhưng bắt buộc chữ ký hợp lệ.

## Bảo vệ dữ liệu

- Quyền luôn kiểm tra server-side; UI chỉ hỗ trợ trải nghiệm.
- Customer/guest không nhận warehouse nội bộ, reservation, audit hoặc metadata event.
- Customer list/detail là dữ liệu vận hành; không trả raw password/token/provider payload.
- Disable khách thu hồi refresh token; không xóa đơn hoặc lịch sử.

