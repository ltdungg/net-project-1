# Bối cảnh, giả định và phạm vi đồ án

Phần lý do đầu tư, số liệu thị trường, khảo sát, phân tích phương án và Business Case được trình bày tại [Báo cáo tiền dự án](research/00-bao-cao-tien-du-an.md).

## 1. Bối cảnh

Đồ án xây dựng một website B2C bán quần áo trực tuyến tại Việt Nam, phục vụ cả
khách mua hàng và người dùng back-office. Bài toán được chọn vì đủ rộng để minh
họa phân tích nghiệp vụ, thiết kế dữ liệu, bảo mật, giao dịch tồn kho và vận
chuyển, nhưng vẫn có thể đóng gói thành một hệ thống chạy local trong 8 tuần.

Sản phẩm giúp khách khám phá sản phẩm theo kích cỡ/màu sắc, mua hàng và theo dõi
từng kiện; đồng thời giúp quản trị catalog, tồn kho đa kho, đơn hàng, khách hàng,
phân khúc và vận chuyển. Đây là bản đồ án có dữ liệu demo, không phải tuyên bố hệ
thống đã sẵn sàng kinh doanh production.

## 2. Mục tiêu kinh doanh sơ bộ

- Hoàn thành MVP có thể trình diễn xuyên suốt trong 8 tuần sau khi kick-off.
- Tạo kênh bán hàng sở hữu riêng, giảm phụ thuộc vào social commerce/marketplace.
- Tạo dữ liệu nhất quán cho order/payment/inventory/fulfillment và báo cáo quản
  trị; session-level analytics funnel là hạng mục mở rộng.
- Giảm thao tác thủ công khi xác nhận đơn và cập nhật tồn kho.
- Thiết lập nền tảng có thể mở rộng sang loyalty, personalization và omnichannel.

## 3. Giả định baseline

| Mã | Giả định |
|---|---|
| ASM-01 | Thị trường đầu tiên là Việt Nam; ngôn ngữ tiếng Việt; tiền tệ VND. |
| ASM-02 | Website responsive cho mobile/tablet/desktop; chưa có native app trong MVP. |
| ASM-03 | Một thương hiệu/một merchant; có nhiều kho và tự tạo một fulfillment cho mỗi kho tham gia đơn. |
| ASM-04 | Cho phép guest checkout và tài khoản khách hàng. |
| ASM-05 | COD hoạt động theo vòng đời đơn; thanh toán online dùng adapter/mock và webhook HMAC để minh họa, chưa kết nối cổng thật. |
| ASM-06 | Vận chuyển được điều phối thủ công trong back-office; chưa gọi API hoặc nhận webhook hãng vận chuyển. |
| ASM-07 | Giá đã bao gồm thuế áp dụng; hóa đơn điện tử là tích hợp ngoài phạm vi MVP. |
| ASM-08 | Fulfillment có trạng thái hoàn; hàng đã xuất kho không tự cộng lại tồn trước khi kho kiểm định. Refund/self-service return đầy đủ ở giai đoạn sau. |
| ASM-09 | Ảnh và nội dung sản phẩm do doanh nghiệp cung cấp đúng lịch content freeze. |
| ASM-10 | Chính sách bảo mật, điều khoản, giao nhận và đổi trả được Legal duyệt trước UAT. |

## 4. Phạm vi MVP

### Trong phạm vi

- Storefront: trang chủ, danh mục, tìm kiếm, lọc/sắp xếp, chi tiết sản phẩm/biến thể.
- Giỏ hàng, mã giảm giá, guest/member checkout.
- Địa chỉ nhận hàng, phí vận chuyển, COD và luồng thanh toán online mô phỏng.
- Xác nhận đơn; thành viên xem lịch sử; khách vãng lai theo dõi bằng token ký số
  truyền qua header và hết hạn sau 7 ngày.
- Tài khoản: đăng ký, xác minh email một lần, đăng nhập, refresh-token rotation,
  đăng xuất, quên/đặt lại mật khẩu, hồ sơ, sổ địa chỉ, lịch sử đơn và yêu thích.
- Back-office: catalog/variant/media, promotion, đơn hàng, khách hàng 360°, sáu
  phân khúc tự động, báo cáo, tài chính và Copilot hỗ trợ đọc dữ liệu.
- Tồn kho đa kho: nhập, chuyển, kiểm kê, điều chỉnh, export CSV, reservation,
  movement ledger và tác vụ giải phóng giữ chỗ hết hạn; tác vụ expiry hiện đạt
  một phần vì chưa bao phủ COD và chưa đồng bộ đầy đủ payment aggregate.
- Fulfillment: tự sinh một kiện cho mỗi kho, tracking thủ công, ETA/chi phí,
  optimistic locking, lịch sử trạng thái và liên kết xuất/nhả tồn.
- Docker, healthcheck xuyên frontend–backend, Flyway, audit/outbox và kiểm thử tự
  động ở mức phù hợp với đồ án.

### Ngoài phạm vi MVP

- Native mobile app; marketplace đa nhà bán; đa tiền tệ/đa ngôn ngữ.
- Loyalty/điểm thưởng, gift card, subscription, social login.
- AI stylist, recommendation cá nhân hóa, LLM bên ngoài và thao tác nghiệp vụ tự
  động từ Copilot; Copilot hiện tại là bộ phân loại câu hỏi và tổng hợp theo luật.
- Payment provider thật, shipping API/webhook, email/SMS production, hóa đơn
  điện tử, POS/ERP và đối soát tự động.
- Tối ưu phân bổ kho, chia nhiều kiện trong cùng một kho, giao/hoàn một phần có
  đối soát tài chính đầy đủ và self-service return/refund.
- Dispatcher/consumer cho transactional outbox, hạ tầng cloud production,
  metrics/alert tập trung và diễn tập DR production.

## 5. Stakeholders

Đây là stakeholder map đầy đủ. Đội delivery thực tế chỉ có 5 người: PM, Frontend, Backend 1, Backend 2 và DevOps; các trách nhiệm PO/BA/UX/QA được kiêm nhiệm theo Project Charter.

| Nhóm | Trách nhiệm/quan tâm chính |
|---|---|
| Giảng viên/Sponsor giả định | Mục tiêu, quyết định phạm vi và nghiệm thu. |
| Product Owner | Giá trị sản phẩm, ưu tiên backlog, nghiệm thu business. |
| Sales/Marketing | Campaign, merchandising, SEO, conversion, nội dung. |
| Operations/Warehouse | Tồn kho, xử lý đơn, đóng gói, giao nhận, hoàn đổi. |
| Customer Service | Hỗ trợ khách, tra cứu đơn, xử lý ngoại lệ. |
| Finance | Đối soát, thanh toán, refund, doanh thu. |
| Legal/Privacy | Chính sách, consent, dữ liệu cá nhân, điều khoản. |
| UX/UI | Research, information architecture, interaction và visual design. |
| Engineering/DevOps | Kiến trúc, phát triển, tích hợp, bảo mật và vận hành. |
| QA | Chiến lược test, traceability, chất lượng release. |

## 6. Ràng buộc

- Timeline mục tiêu 8 tuần với đội 5 người; chỉ Must-have nằm trong baseline cam kết, Should/Could triển khai khi còn capacity.
- Bản 8 tuần ưu tiên adapter/mock và thao tác vận hành thủ công; tích hợp bên thứ
  ba cần tài khoản merchant, sandbox và phê duyệt ở giai đoạn tiếp theo.
- Dữ liệu cá nhân và thanh toán phải tuân thủ quy định hiện hành; Legal xác nhận trước triển khai.
- Tồn kho phải nhất quán khi nhiều người đồng thời checkout.
- Không lưu dữ liệu thẻ. Bản đồ án không có form thẻ thật; khi tích hợp provider
  ở phase sau phải chuyển việc nhập thẻ sang trang/SDK đạt yêu cầu của provider.

## 7. Tiêu chí thành công cấp dự án

- 100% Must-have có acceptance sign-off; không còn lỗi Sev-1/Sev-2 trước buổi
  nghiệm thu đồ án.
- Checkout thành công trên các trình duyệt/thiết bị mục tiêu.
- Đơn hàng, payment và inventory có audit trail; không oversell trong test tải mục tiêu.
- 69 kiểm thử backend và 12 kiểm thử frontend vượt qua; typecheck/build và smoke
  test Docker đạt.
- Runbook, quy tắc migration forward-only và giới hạn triển khai được bàn giao rõ.

## 8. Quyết định baseline và hạng mục còn mở

| Mã | Quyết định baseline | Trạng thái | Hạng mục mở rộng |
|---|---|---|---|
| DEC-01 | React/Vinext + BFF; Java 21/Spring Boot; PostgreSQL/Redis; Docker | Đã chốt | Cloud/CDN và kiến trúc production |
| DEC-02 | COD + payment mock/webhook HMAC | Đã chốt cho đồ án | Chọn và tích hợp provider thật |
| DEC-03 | Fulfillment thủ công, một kiện cho mỗi kho | Đã chốt cho đồ án | API/webhook hãng vận chuyển |
| DEC-04 | Hai Docker Compose stack chạy local | Đã chốt cho đồ án | Hosting, secret manager, metrics/alert tập trung |
| DEC-05 | Giữ tồn khi tạo đơn; consume khi kiện shipped; release khi hủy trước ship/hết hạn | Đã chốt | Chính sách phân bổ/tách kiện nâng cao |
| DEC-06 | Hàng returned chờ kiểm định, không tự restock; đơn paid/authorized không hủy trực tiếp | Đã chốt an toàn | Refund/return/reconciliation đầy đủ |

## 9. Sai lệch đã biết của baseline code

| Mã | Hiện trạng | Ảnh hưởng |
|---|---|---|
| KD-GUEST-01 | Client online-payment của guest gắn token vào query thay vì gửi `X-Guest-Order-Token`. | Có thể nhận 400 và làm token xuất hiện trong URL/access log. |
| KD-PAY-01 | Webhook thành công muộn chưa reconcile với order đã `cancelled`. | Payment có thể `succeeded/paid` trong khi order vẫn `cancelled`. |
| KD-INV-01 | Job expiry cập nhật order nhưng chưa cập nhật dòng `payments` pending tương ứng. | Hai aggregate order/payment có thể không nhất quán. |
| KD-INV-02 | Job expiry chỉ chọn order `pending_payment`; COD ở `confirmed`. | Reservation COD hết hạn có thể vẫn giữ tồn. |

Bốn mục này được ghi nhận là defect hiện hữu, không phải chức năng đã nghiệm thu.
Chi tiết truy vết nằm tại [ma trận yêu cầu](ba/06-traceability.md).
