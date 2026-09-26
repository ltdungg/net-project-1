# View admin_customer_segments

**Loại:** PostgreSQL view, không phải bảng  
**Nguồn:** V7__customer_segments_and_fulfillments.sql  
**Mục đích:** Read model thống nhất cho danh sách, dashboard và hồ sơ khách.

| Cột | Nguồn/ý nghĩa |
|---|---|
| id, email, full_name, phone | users |
| status, marketing_consent | users |
| last_login_at, created_at, updated_at | users |
| total_orders | COUNT mọi customer_orders của user |
| paid_orders | payment_status=paid, loại cancelled/returned/refunded |
| delivered_orders | COUNT order status=delivered |
| cancelled_orders | COUNT order status=cancelled |
| total_revenue_cents | SUM grand_total_cents của paid order hợp lệ |
| last_order_at | MAX order.created_at |
| last_paid_order_at | MAX order.created_at của paid order hợp lệ |
| segment_code | CASE theo thứ tự chính sách |

Chỉ user status khác deleted và có role code customer xuất hiện.

## Thứ tự segment

1. at_risk: có paid order và lần paid cuối quá 90 ngày.
2. vip: doanh thu từ 5.000.000 hoặc ít nhất 5 paid order.
3. loyal: ít nhất 2 paid order và có paid order trong 90 ngày.
4. new: account trong 30 ngày và tối đa 1 paid order.
5. potential: đúng 1 paid order.
6. prospect: còn lại.

View được tính tại thời điểm query bằng now(), không materialize và không có cột
rule_version. API gắn ruleVersion=RFM-2026.1 và calculatedAt trong response.

API sử dụng:

- GET /api/admin/customers với search/status/segment/limit/offset.
- GET /api/admin/customers/segments.
- GET /api/admin/customers/{id} cho thống kê và segment.

Kiểm thử ưu tiên rule, biên 30/90 ngày, loại đơn huỷ/hoàn, user không có order,
user không có role customer và dashboard luôn đủ sáu định nghĩa.
