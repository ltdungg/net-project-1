# PRD — Tài liệu yêu cầu sản phẩm

**Phiên bản:** 1.0  
**Trạng thái:** BASELINE ĐỒ ÁN  
**Người phụ trách:** PM kiêm Chủ sản phẩm

> PRD này mô tả phạm vi đã chọn cho đồ án 02 tháng của nhóm 05 người. “Đã xây dựng” nghĩa là có mã nguồn/luồng demo trong repository; không đồng nghĩa hệ thống đã được vận hành thương mại hoặc đã có số liệu người dùng thật.

## 1. Mục tiêu

Xây dựng một hệ thống thương mại điện tử thời trang B2C hoàn chỉnh ở mức đồ án: khách có thể duyệt 22 sản phẩm/58 biến thể, đăng ký hoặc mua với tư cách khách, áp dụng voucher, đặt và theo dõi đơn; đội nội bộ có thể quản lý catalog, tồn kho đa kho, khách hàng, phân khúc và fulfillment. Sản phẩm phải minh họa đúng các bất biến giao dịch, phân quyền và cách triển khai bằng Docker.

## 2. Kết quả mong muốn và giả thuyết

| Mã | Giả thuyết | Tín hiệu kiểm chứng |
|---|---|---|
| H-01 | Search/filter theo size, màu, giá giúp khách đến PDP phù hợp nhanh hơn. | PLP→PDP CTR, search exit rate. |
| H-02 | Size guide và trạng thái tồn kho theo variant tăng add-to-cart. | PDP→ATC rate, return reason “sai size”. |
| H-03 | Guest checkout và hiển thị tổng phí sớm giảm drop-off. | checkout start→purchase rate. |
| H-04 | Tracking timeline giảm câu hỏi “đơn của tôi ở đâu”. | WISMO contacts/order. |
| H-05 | Back-office tập trung giảm thời gian xử lý đơn. | median order-to-ready-to-ship. |
| H-06 | Phân khúc tự động giúp quản lý ưu tiên chăm sóc mà không gắn nhãn thủ công. | số khách/doanh thu theo 6 nhóm; tính nhất quán rule version. |
| H-07 | Tách fulfillment theo kho giúp theo dõi và cập nhật tồn chính xác cho đơn nhiều kho. | số fulfillment/order bằng số kho tham gia; không consume nhầm reservation. |
| H-08 | Copilot rule-based giúp đọc nhanh tình trạng vận hành nhưng vẫn kiểm soát được rủi ro. | câu trả lời có dữ liệu, thời điểm và cảnh báo; không có mutation ngoài ý muốn. |

Các giả thuyết H-01 đến H-05 bắt nguồn từ nghiên cứu mô phỏng và cần kiểm chứng thực địa. H-06 đến H-08 được đánh giá trước hết bằng tính đúng của luật, hợp đồng API và kịch bản kiểm thử trong đồ án.

## 3. Phạm vi tính năng

| Nhóm chức năng | Khả năng | Mức ưu tiên |
|---|---|---|
| E01 Discovery | Home, navigation, PLP, search, filter, sort | Must |
| E02 Product | PDP, gallery, variant, size guide, stock status | Must |
| E03 Cart | Add/update/remove, pricing, coupon | Must |
| E04 Checkout | Guest/member, address, shipping, review | Must |
| E05 Payment | COD, online payment, callback/idempotency | Must |
| E06 Order | Confirmation, lookup, account history, status | Must |
| E07 Account | Register/verify/login/refresh/logout/reset/profile/address | Must |
| E08 Admin Catalog | Product/variant/category/media/price | Must |
| E09 Admin Order | Order queue, status, notes, cancel/refund recording | Must |
| E10 Inventory | Stock adjustment, reservation, audit | Must |
| E11 Promotion | Coupon: fixed/percent, date, minimum spend | Should |
| E12 Content/SEO | Banner/basic content, metadata, sitemap | Should |
| E13 Analytics | Ecommerce funnel and operational events | Must |
| E14 Auth Lifecycle | Xác minh email, refresh rotation, logout/revoke, forgot/reset password, RBAC | Must |
| E15 Customer 360° | Danh sách, chi tiết, trạng thái, địa chỉ, lịch sử đơn, dashboard 6 phân khúc | Must |
| E16 Fulfillment | Tự tạo theo kho, tracking, state machine, event log, đồng bộ order/inventory | Must |
| E17 Admin Copilot | Hỏi đáp rule-based về tồn, đơn, doanh thu và promotion; chỉ đọc | Should |
| E18 Delivery Platform | PostgreSQL, Redis, hai Docker Compose stack, healthcheck và smoke test | Must |

### 3.1 Baseline kỹ thuật

| Lớp | Công nghệ và vai trò |
|---|---|
| Frontend/BFF | React 19, Vinext, TypeScript; storefront và backoffice gọi API Java qua BFF cùng origin. |
| Backend | Java 21, Spring Boot 4.1.1, Spring Security, JDBC, Flyway; modular monolith. |
| Data | PostgreSQL 17 lưu dữ liệu nghiệp vụ; Redis 7 dùng cho cache catalog và giới hạn tần suất xác thực. |
| Triển khai | Hai Docker Compose stack, image multi-stage, healthcheck frontend–backend và volume upload. |

## 4. Yêu cầu chức năng sản phẩm

| Mã | Yêu cầu | Mức ưu tiên | Tóm tắt điều kiện nghiệm thu |
|---|---|---|---|
| PRD-001 | Khách duyệt catalog theo category và collection. | Must | Chỉ sản phẩm published được hiển thị; pagination hoạt động. |
| PRD-002 | Khách tìm kiếm theo tên, SKU/từ khóa liên quan. | Must | Kết quả, empty state và debounce/submit rõ ràng. |
| PRD-003 | Khách lọc theo category, size, màu, khoảng giá và sort. | Must | Filter có thể kết hợp, xóa từng/all, URL có thể chia sẻ. |
| PRD-004 | PDP hiển thị ảnh, mô tả, giá, variant, size guide, tồn kho. | Must | Không thể thêm variant hết hàng/không chọn đủ thuộc tính. |
| PRD-005 | Giỏ lưu item theo variant và cập nhật tổng tiền. | Must | Kiểm tra tồn/giá lại khi thay đổi số lượng và checkout. |
| PRD-006 | Hỗ trợ coupon hợp lệ và giải thích lỗi cụ thể. | Should | Không stack nếu promotion không cho phép; tính lại server-side. |
| PRD-007 | Guest checkout không bắt buộc đăng ký. | Must | Email/phone + địa chỉ đủ để tạo đơn. |
| PRD-008 | Khách chọn phương thức giao và thấy phí, ETA trước khi đặt. | Must | Tổng thanh toán cập nhật và được snapshot vào order. |
| PRD-009 | Khách chọn COD hoặc payment online. | Must | Kết quả payment được xác minh server-to-server; chống callback lặp. |
| PRD-010 | Hệ thống tạo mã đơn duy nhất và confirmation. | Must | Chỉ tạo/commit một đơn cho mỗi attempt hợp lệ. |
| PRD-011 | Khách xem trạng thái bằng account hoặc mã đơn + thông tin xác minh. | Must | Không lộ dữ liệu đơn của khách khác. |
| PRD-012 | Member quản lý hồ sơ, địa chỉ và lịch sử đơn. | Should | Có authorization và validation. |
| PRD-013 | Admin quản lý catalog và publish/unpublish. | Must | Variant/SKU duy nhất; thay đổi có audit. |
| PRD-014 | Admin quản lý tồn kho và xem lịch sử điều chỉnh. | Must | Không cho ATP âm; ghi actor/reason/timestamp. |
| PRD-015 | Admin xử lý đơn theo state transition hợp lệ. | Must | Transition bị giới hạn theo role và trạng thái hiện tại. |
| PRD-016 | Hệ thống gửi email xác nhận và cập nhật quan trọng. | Must | Retry có giới hạn; lỗi gửi không rollback đơn. |
| PRD-017 | Hệ thống phát sự kiện analytics chuẩn ecommerce. | Must | Không chứa dữ liệu thanh toán nhạy cảm/PII ngoài policy. |
| PRD-018 | Admin xem dashboard vận hành cơ bản. | Could | Đơn theo trạng thái, doanh thu, sản phẩm sắp hết. |
| PRD-019 | Người dùng hoàn tất vòng đời đăng ký và xác thực tài khoản. | Must | Email unique; mật khẩu băm; token xác minh có hạn; đăng nhập bị chặn trước khi xác minh. |
| PRD-020 | Hệ thống xoay vòng refresh token và thu hồi phiên khi đăng xuất/đặt lại mật khẩu. | Must | Token cũ không tái sử dụng; cookie HttpOnly/SameSite; lỗi không làm lộ tài khoản. |
| PRD-021 | Admin xem Customer 360° và lọc theo 6 phân khúc hành vi. | Must | Chỉ tài khoản customer; số liệu lấy từ đơn hợp lệ; mỗi khách có đúng một `segment_code`. |
| PRD-022 | Admin thay đổi trạng thái khách hàng theo quyền và có audit. | Must | Không tự vô hiệu hóa; vô hiệu hóa cần lý do; không sửa tài khoản đã xóa. |
| PRD-023 | Checkout tự tạo đúng một fulfillment cho mỗi kho tham gia đơn. | Must | Dòng hàng/reservation gắn đúng kho; idempotency không tạo phiếu trùng. |
| PRD-024 | Nhân viên cập nhật carrier, tracking và vòng đời fulfillment. | Must | Dùng state machine, `expectedVersion`, event log; ship mới consume reservation tương ứng. |
| PRD-025 | Admin dùng Copilot rule-based để đọc snapshot vận hành. | Should | Trả kết quả theo nhóm intent, nêu thời điểm; không gọi mô hình ngoài và không ghi dữ liệu. |
| PRD-026 | Hệ thống chạy được bằng Docker với PostgreSQL 17 và Redis 7. | Must | Hai stack Compose healthy; migration Flyway hoàn tất; smoke test luồng công khai/quản trị cốt lõi. |

## 5. Yêu cầu trải nghiệm người dùng

- Mobile breakpoint là thiết kế gốc; tap target tối thiểu 44×44px.
- Cart summary và CTA chính rõ ràng; không dùng dark pattern.
- Validation inline, giữ lại dữ liệu hợp lệ khi có lỗi.
- Empty/loading/error/success state được thiết kế cho mọi flow quan trọng.
- Price formatting VND nhất quán; hiển thị giá gốc/giảm đúng quy tắc.
- Accessibility mục tiêu WCAG 2.2 AA cho luồng mua hàng cốt lõi.
- Hình ảnh có alt text; keyboard navigation và focus state đầy đủ.
- Màn hình khách hàng và vận chuyển cho phép tìm kiếm/lọc, có trạng thái rỗng/lỗi và không lộ PII quá quyền.
- Trạng thái đơn tổng hợp và trạng thái từng fulfillment được trình bày tách biệt để tránh gây hiểu nhầm.
- Copilot luôn hiển thị cảnh báo cần kiểm tra dữ liệu trước khi quyết định.

## 6. Tóm tắt yêu cầu phi chức năng

- LCP p75 mobile ≤ 2.5s; INP p75 ≤ 200ms; CLS p75 ≤ 0.1 trên dữ liệu thực tế mục tiêu.
- API đọc phổ biến p95 ≤ 500ms, API ghi cốt lõi p95 ≤ 1s không tính latency provider.
- Availability mục tiêu 99.9%/tháng sau stabilization, loại trừ bảo trì được thông báo.
- TLS khi triển khai ngoài local; RBAC `customer/staff/manager/admin`; access JWT ngắn hạn và refresh token opaque được băm.
- Nếu triển khai ngoài phạm vi đồ án: RPO đề xuất ≤ 24h, RTO ≤ 4h; phải restore thử trước khi phục vụ người dùng thật.
- Log/audit đủ để truy vết order, payment, inventory; không log secret/thẻ/mật khẩu.
- Tất cả lệnh ghi fulfillment dùng optimistic concurrency; checkout/inventory/payment dùng idempotency phù hợp.
- PostgreSQL là nguồn sự thật; Redis không được dùng làm nơi duy nhất lưu trạng thái giao dịch.

## 7. Điều kiện nghiệm thu bản phát hành

- Must-have pass bộ test và kịch bản nghiệm thu đồ án; RTM có evidence từ mã nguồn, API, DB hoặc ảnh giao diện.
- 0 Sev-1/Sev-2 mở; Sev-3 chỉ được chấp nhận bằng risk acceptance.
- Security scan không còn Critical/High chưa xử lý hoặc chưa được chấp thuận.
- Performance, backup/restore, monitoring alert và rollback đã được kiểm chứng.
- Dataset demo chứa đúng 22 sản phẩm/58 biến thể; giá, tồn, voucher và tài khoản mẫu có thể tái tạo bằng migration/seed.
- Hai Docker Compose stack khởi động được frontend, backend, PostgreSQL và Redis; healthcheck/smoke test có kết quả.
- Báo cáo phân biệt rõ tính năng đã hiện thực, tính năng mô phỏng và hạng mục ngoài phạm vi.

## 8. Các phụ thuộc

- JDK 21, Docker Desktop/Engine và Docker Compose trên máy chạy.
- Biến môi trường bảo mật cho JWT, token truy cập đơn khách và tài khoản demo.
- PostgreSQL 17, Redis 7, migration Flyway và volume upload do Docker Compose cấp.
- Dữ liệu catalog/ảnh mẫu dùng cho học tập; nếu triển khai thật phải xác minh quyền sử dụng và thay chính sách thương mại.
- Payment/shipping/email production cần tài khoản provider và cấu hình riêng; không nằm trong baseline local.

## 9. Ngoài phạm vi baseline

- Thanh toán tiền thật, đối soát ngân hàng và webhook production.
- Đồng bộ hai chiều với hãng vận chuyển; chia nhiều kiện trong cùng một kho; hoàn tiền/giao một phần phức tạp.
- ERP/POS, marketplace synchronization, loyalty đầy đủ và recommendation cá nhân hóa.
- AI dùng LLM/ML, tự động tạo promotion hoặc thay đổi tồn/đơn/khách hàng.
- Khẳng định hiệu quả kinh doanh từ khảo sát n=200; tập dữ liệu này chỉ là mô phỏng.
