# Chân dung khách hàng và hành trình khách hàng

**Trạng thái:** hồ sơ thiết kế đồ án  

> Các chân dung dưới đây là **proto-persona mô phỏng**, được tạo từ giả thuyết và bộ dữ liệu khảo sát mô phỏng n=200. Đây không phải hồ sơ của người được phỏng vấn thật. Khi có nghiên cứu thực địa, nhóm phải cập nhật persona và lưu evidence/change log.

## 1. Các chân dung khách hàng chính

### Chân dung A — Linh, người mua nhanh trên điện thoại

- 25 tuổi, biết thương hiệu qua social; chủ yếu dùng điện thoại.
- Mục tiêu: tìm đúng mẫu/size và đặt nhanh trong giờ nghỉ.
- Nỗi đau: form dài, ảnh tải chậm, phí ship xuất hiện muộn, ép đăng ký.
- Tiêu chí thành công: hoàn tất mua trong vài phút, nhận xác nhận ngay.

### Chân dung B — Mai, người mua cần tự tin về kích cỡ

- 32 tuổi, so sánh nhiều sản phẩm trước khi mua.
- Mục tiêu: hiểu chất liệu, phom, số đo và chính sách đổi size.
- Nỗi đau: mô tả mơ hồ, ảnh thiếu góc, không biết model mặc size gì.
- Tiêu chí thành công: chọn đúng size, ít cần hỏi CS, dễ đổi nếu cần.

### Chân dung C — Nam, khách hàng quay lại

- 29 tuổi, đã mua và muốn đặt thêm màu/mẫu tương tự.
- Mục tiêu: đăng nhập, dùng địa chỉ cũ, xem lại đơn và mua nhanh.
- Nỗi đau: quên mật khẩu, lịch sử đơn thiếu, tracking rời rạc.
- Tiêu chí thành công: checkout nhanh, tự theo dõi được trạng thái.

### Chân dung D — Huyền, nhân viên vận hành

- Xử lý catalog, tồn kho và hàng chục/hàng trăm đơn mỗi ngày.
- Mục tiêu: ưu tiên đúng đơn, tránh oversell, ghi nhận ngoại lệ có audit.
- Nỗi đau: dữ liệu nhiều file, trạng thái không nhất quán, khó truy nguyên.
- Tiêu chí thành công: queue rõ ràng, thao tác ít, số liệu đối soát được.

### Chân dung E — An, quản lý cửa hàng

- Theo dõi doanh thu, sức khỏe tồn kho, tình trạng giao nhận và chất lượng tệp khách.
- Mục tiêu: phát hiện nhanh khách cần chăm sóc, SKU cần bổ sung và backlog giao hàng.
- Nỗi đau: phải ghép số từ nhiều màn hình, nhãn khách hàng dễ chủ quan, khó biết dữ liệu cập nhật lúc nào.
- Tiêu chí thành công: dashboard có nguồn dữ liệu rõ, sáu phân khúc được tính bằng luật và Copilot chỉ đưa gợi ý có thể kiểm tra.

## 2. Hành trình mua hàng lần đầu

| Giai đoạn | Hành động | Suy nghĩ/cảm xúc | Pain point | Cơ hội | KPI/Event |
|---|---|---|---|---|---|
| Awareness | Mở landing từ social/SEO | “Có hợp gu không?” | Tải chậm, thông điệp lệch ad | Landing đúng campaign, ảnh tối ưu | `session_start`, bounce |
| Discover | Duyệt/search/filter | “Có size/màu của mình?” | Filter khó dùng | Filter chips, stock-aware | `view_item_list`, `search` |
| Evaluate | Xem PDP/size guide | “Mặc lên sẽ thế nào?” | Thiếu số đo/chất liệu | Size chart, model info, return policy | `view_item`, `view_size_guide` |
| Decide | Chọn variant/add cart | “Giá cuối là bao nhiêu?” | Variant hết hàng, phí ẩn | Stock rõ, estimate shipping | `select_item`, `add_to_cart` |
| Checkout | Nhập địa chỉ/payment | “Có an toàn và nhanh không?” | Form dài, lỗi mất dữ liệu | Guest, validation inline, trust cues | `begin_checkout`, `add_payment_info` |
| Confirm | Nhận mã đơn | “Đặt thành công chưa?” | Callback chậm/không rõ | Pending state rõ, email xác nhận | `purchase` |
| Fulfill | Theo dõi giao hàng | “Đơn đang ở đâu?” | Một đơn có thể xuất từ nhiều kho | Timeline theo từng phiếu giao và trạng thái tổng hợp | `view_order_status` |
| Post-purchase | Nhận hàng/đổi trả | “Có đúng kỳ vọng?” | Quy trình đổi khó hiểu | Policy và CS entry point rõ | return rate, CSAT |

## 3. Hành trình xử lý đơn hàng

| Giai đoạn | Hành động của Operations | System support | Exception |
|---|---|---|---|
| Intake | Xem đơn mới/đã thanh toán | Queue, filter, SLA timestamp | Payment pending/failed |
| Verify | Kiểm tra rủi ro, địa chỉ, tồn | Snapshot, inventory reservation | Địa chỉ thiếu, tồn lệch |
| Pick/Pack | Chuẩn bị hàng | Pick list, status transition | Sản phẩm lỗi/thiếu |
| Allocate | Tiếp nhận phiếu giao được tạo sau checkout | Một fulfillment cho mỗi warehouse; dòng hàng gắn reservation | Thiếu mapping kho/dòng hàng |
| Ship | Nhập carrier/tracking và bàn giao | State machine, optimistic version, event log | Thiếu tracking, dữ liệu đã bị người khác đổi, giao lỗi |
| Close | Xác nhận delivered/đối soát | Tổng hợp các fulfillment về order; COD chỉ paid khi tất cả đã giao | COD không thu được, một kiện thất bại |
| Return | Nhận yêu cầu, kiểm hàng | Note, return/refund record | Quá hạn/không đủ điều kiện |

## 4. Hành trình quản lý khách hàng

| Giai đoạn | Hành động | Hệ thống hỗ trợ | Điểm kiểm soát |
|---|---|---|---|
| Tổng quan | Xem quy mô và doanh thu theo phân khúc | Dashboard sáu nhóm `at_risk`, `vip`, `loyal`, `new`, `potential`, `prospect` | Hiển thị phiên bản luật `RFM-2026.1` và thời điểm tính. |
| Tìm khách | Tìm theo email/tên/số điện thoại; lọc trạng thái/phân khúc | Danh sách có phân trang và masking theo quyền | Không trả tài khoản không thuộc vai trò customer. |
| Hiểu khách | Mở Customer 360° | Hồ sơ, địa chỉ, đơn, doanh thu, AOV và lần mua gần nhất | Số liệu chỉ tính đơn thanh toán hợp lệ theo luật. |
| Can thiệp | Kích hoạt/vô hiệu hóa tài khoản | RBAC, lý do bắt buộc và audit trail | Không tự vô hiệu hóa; không sửa tài khoản đã xóa. |
| Đánh giá lại | Hành vi mua thay đổi | View tự tính lại phân khúc | Không gắn nhãn VIP thủ công. |

## 5. Luồng trải nghiệm ưu tiên làm nguyên mẫu và kiểm thử

1. Social landing → PDP → chọn size/màu → guest COD checkout.
2. Search/filter → PDP → coupon → online payment success/failure/pending.
3. Member login → mua lại → dùng địa chỉ đã lưu.
4. Đăng ký → xác minh email → đăng nhập → quên/đặt lại mật khẩu → đăng xuất.
5. Guest tra cứu đơn → xem một hoặc nhiều phiếu giao theo kho.
6. Admin tạo sản phẩm/variant → nhập tồn → chuyển/kiểm kê → publish.
7. Checkout đơn nhiều kho → hệ thống tự tạo fulfillment theo kho → nhân viên nhập tracking → shipped → delivered.
8. Admin lọc sáu phân khúc → mở Customer 360° → thay đổi trạng thái có audit.
9. Quản lý hỏi Copilot về tồn/đơn/doanh thu/promotion → kiểm tra nguồn dữ liệu → tự quyết định hành động.

## 6. Kế hoạch nghiên cứu tối thiểu

- 5–7 phỏng vấn khách mục tiêu trước khi chốt IA/wireframe.
- Usability test prototype với ít nhất 5 người mỗi vòng, 2 vòng.
- Card sorting nhẹ cho category/filter nếu catalog đa dạng.
- Test size guide và cách diễn đạt policy bằng comprehension task.
- Sau launch: funnel analysis, search terms, session replay có consent và survey CSAT.

Các hoạt động trên là kế hoạch đề xuất, chưa được coi là đã thực hiện. Trong phạm vi nghiệm thu đồ án, nhóm dùng dữ liệu test và kịch bản task để đánh giá tính đúng của giao diện; không suy rộng thành kết luận về người dùng thật.

## 7. Liên hệ với phân khúc vận hành

Proto-persona mô tả mục tiêu và ngữ cảnh sử dụng; sáu phân khúc trong backoffice mô tả hành vi giao dịch quan sát được. Một người như Linh hoặc Mai có thể lần lượt chuyển từ `prospect` sang `new`, `potential`, `loyal` hoặc `vip`; nếu quá 90 ngày chưa mua lại sau khi từng thanh toán, luật ưu tiên đưa họ vào `at_risk`. Không suy đoán tuổi, giới tính hoặc sở thích nhạy cảm từ mã phân khúc.
