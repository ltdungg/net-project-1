# Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| Product | Mẫu quần áo ở cấp chung, ví dụ “Áo sơ mi Oxford”. |
| Variant/SKU | Biến thể bán được theo màu, size; có SKU và tồn kho riêng. |
| PDP | Product Detail Page — trang chi tiết sản phẩm. |
| PLP | Product Listing Page — trang danh sách/danh mục. |
| Cart | Giỏ hàng chưa tạo đơn. |
| Checkout | Luồng nhập thông tin, chọn vận chuyển/thanh toán và xác nhận mua. |
| Order | Bản ghi giao dịch được tạo với snapshot giá/sản phẩm tại thời điểm mua. |
| Payment | Giao dịch thu/hoàn tiền gắn với order. |
| Fulfillment | Quá trình chuẩn bị, bàn giao và giao hàng. |
| Shipment number | Mã kiện nội bộ dạng `SHP-...`, duy nhất trong hệ thống. |
| Tracking number | Mã vận đơn do hãng vận chuyển cấp; duy nhất trong phạm vi một hãng. |
| Manual fulfillment | Nhân viên nhập hãng/mã vận đơn và chuyển trạng thái kiện trong back-office; chưa đồng bộ API hãng vận chuyển. |
| Warehouse | Kho giữ số dư tồn; một đơn có thể lấy hàng từ nhiều kho. |
| Inventory item | Số dư của một SKU tại một kho, gồm `on_hand` và `reserved`. |
| On-hand | Số lượng vật lý hệ thống đang ghi nhận tại kho. |
| Reserved | Phần on-hand đã giữ cho các đơn đang xử lý. |
| Available/ATP | `on_hand - reserved`; số lượng có thể hứa bán tại thời điểm đọc. |
| Inventory reservation | Bản ghi giữ SKU/kho cho một dòng đơn, có trạng thái và thời điểm hết hạn. |
| Inventory movement | Dòng sổ biến động tồn bất biến, nêu loại, số lượng và chứng từ tham chiếu. |
| Inventory operation | Chứng từ nhập, chuyển, kiểm kê hoặc điều chỉnh kho, có idempotency key. |
| Promotion | Cơ chế khuyến mãi có điều kiện và benefit. |
| Coupon | Mã khách nhập để kích hoạt promotion. |
| ATP | Available to Promise — số lượng có thể bán. |
| GMV | Tổng giá trị hàng hóa giao dịch trước hoàn/hủy. |
| Conversion rate | Tỷ lệ session/visitor hoàn tất đơn theo quy ước analytics. |
| AOV | Average Order Value — giá trị đơn trung bình. |
| UAT | User Acceptance Testing — kiểm thử chấp nhận người dùng. |
| MVP | Phiên bản tối thiểu có thể tạo giá trị và giao dịch thực tế. |
| DoR | Definition of Ready — điều kiện story đủ sẵn sàng để vào sprint. |
| DoD | Definition of Done — điều kiện story/release được coi là hoàn tất. |
| RTM | Requirements Traceability Matrix — ma trận truy vết yêu cầu. |
| RAID | Risks, Assumptions, Issues, Dependencies. |
| BFF | Backend for Frontend — lớp `/api/commerce/**` cùng origin với giao diện, chuyển tiếp cookie/header đến Java API. |
| RBAC | Role-Based Access Control — phân quyền theo `customer`, `staff`, `manager`, `admin`. |
| JWT access token | Token truy cập ngắn hạn 15 phút; lưu trong cookie HttpOnly hoặc dùng bearer khi phù hợp. |
| Refresh token | Token phiên opaque được băm trong PostgreSQL và xoay vòng, tối đa 30 ngày. |
| Guest order token | Token HMAC giới hạn đúng đơn/email, hiệu lực 7 ngày và truyền bằng `X-Guest-Order-Token`. |
| Idempotency key | Khóa giúp cùng một lệnh được gửi lại mà không tạo side effect trùng. |
| Correlation ID | Mã nối request, audit và log để truy vết một thao tác xuyên các lớp. |
| Optimistic locking | Kiểm tra `expectedVersion` trước khi cập nhật fulfillment để phát hiện ghi đè đồng thời. |
| Outbox | Bảng sự kiện ghi cùng transaction nghiệp vụ; bản hiện tại chưa có dispatcher/consumer. |
| Customer segment | Phân khúc đọc tự động từ tài khoản và đơn đã thanh toán; không phải nhãn nhập tay. |
| `new` | Tài khoản tạo trong 30 ngày và có tối đa một đơn đã thanh toán. |
| `potential` | Có đúng một đơn đã thanh toán nhưng không còn thuộc `new`. |
| `loyal` | Có ít nhất hai đơn đã thanh toán và lần mua đã thu gần nhất trong 90 ngày. |
| `vip` | Có ít nhất năm đơn đã thanh toán hoặc doanh thu tích lũy từ 5.000.000 VND. |
| `at_risk` | Từng có đơn đã thanh toán nhưng lần mua đã thu gần nhất cách hơn 90 ngày. |
| `prospect` | Tài khoản còn lại chưa thỏa các nhóm ưu tiên cao hơn. |
| Copilot quản trị | Trợ lý theo luật đọc snapshot tổng hợp và đề xuất liên kết thao tác; không gọi LLM ngoài và không tự ghi dữ liệu. |
