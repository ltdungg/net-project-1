# WBS và kế hoạch công việc

## 1. Cơ cấu phân rã công việc

| WBS | Gói công việc | Công việc chính | Người chịu trách nhiệm | Người hỗ trợ/rá soát | Sản phẩm bàn giao |
|---|---|---|---|---|---|
| 1.0 | Quản trị dự án | Tuyên bố dự án, trạng thái, RAID, quyết định/thay đổi, các bên liên quan | PM | Cả đội cung cấp trạng thái | Phạm vi cơ sở và báo cáo được duyệt |
| 2.0 | Sản phẩm và phân tích nghiệp vụ | Phạm vi, luồng, quy tắc, nghiệm thu, danh sách yêu cầu, RTM | PM | FE, BE1, BE2 rà soát | Danh sách yêu cầu sẵn sàng/được nghiệm thu |
| 3.0 | UI/UX và Frontend | Giao diện đáp ứng cho storefront/account/admin, khả năng tiếp cận và BFF integration | FE | PM nghiệm thu; BE1/BE2 hỗ trợ API | Giao diện web khách hàng/quản trị |
| 4.0 | Backend thương mại | Auth, catalog, khách hàng/segments, cart/pricing, order, report và Copilot theo luật | BE1 | BE2 rà soát mã; DO rà soát bảo mật | Java commerce API |
| 5.0 | Backend giao dịch | Inventory operations, payment mock/webhook và fulfillment thủ công đa kho | BE2 | BE1 rà soát mã; DO rà soát tích hợp | Java transaction API |
| 6.0 | Nền tảng và vận hành | Docker, CI, config/secret, healthcheck, log, migration và recovery design | DO | BE1/BE2 cung cấp đầu vào ứng dụng | Môi trường local/test và runbook |
| 7.0 | Chất lượng và UAT | Thiết kế kiểm thử, tự động hóa, rà soát chéo, UAT, phân loại lỗi | PM | FE/BE1/BE2/DO thực hiện | Bằng chứng chất lượng và biên bản duyệt |
| 8.0 | Nghiệm thu/bàn giao | Dữ liệu demo, hướng dẫn, release candidate, rollback/roll-forward và giới hạn | PM | DO đóng gói; cả đội hỗ trợ | Bản đồ án chạy Docker và evidence pack |

## 2. Danh sách công việc có thể thực hiện

| Mã công việc | Công việc | Người thực hiện | Người rà soát/hỗ trợ | Công việc trước | Thời hạn | Bằng chứng hoàn thành |
|---|---|---|---|---|---|---|
| PM-001 | Xác nhận người phê duyệt, đúng 5 thành viên, thời lượng và quyền quyết định | PM | Cả đội | — | Tuần 1 | Tuyên bố dự án được duyệt |
| PM-002 | Chốt hạng mục Bắt buộc, phần loại trừ, hành trình và điều kiện nghiệm thu cơ sở | PM | FE, BE1, BE2 | PM-001 | Tuần 1 | Phạm vi và danh sách yêu cầu sẵn sàng |
| PM-003 | Chốt payment mock/webhook HMAC, fulfillment thủ công và giới hạn notification của đồ án | PM | BE2, DO | PM-001 | Tuần 1–2 | Decision record và danh sách ngoài phạm vi |
| PM-004 | Hoàn thiện quy tắc nghiệp vụ, sơ đồ trạng thái, RTM và kế hoạch UAT | PM | BE1, BE2, FE | PM-002 | Tuần 1–2 | Đặc tả và bộ UAT đã rà soát |
| FE-001 | Dựng kiến trúc thông tin, bộ UI và nguyên mẫu 6 luồng trọng tâm | FE | PM | PM-002 | Tuần 1 | Nguyên mẫu được nghiệm thu |
| FE-002 | Xây khung ứng dụng, định tuyến, bố cục đáp ứng và giao diện xác thực | FE | BE1 | FE-001 | Tuần 1–2 | Nền tảng UI trên môi trường kiểm thử |
| FE-003 | Xây Trang chủ/PLP/tìm kiếm/bộ lọc/PDP/giao diện biến thể | FE | BE1 | FE-001, BE1-003 | Tuần 2–4 | Luồng duyệt hàng được nghiệm thu |
| FE-004 | Xây giao diện giỏ hàng, mã giảm giá, thanh toán, địa chỉ và vận chuyển | FE | BE1, BE2 | FE-003, BE1-004 | Tuần 3–6 | Luồng thanh toán E2E |
| FE-005 | Xây kết quả thanh toán, tracking nhiều kiện, account/address/order history/wishlist | FE | BE1, BE2 | FE-004, BE2-003 | Tuần 5–6 | Giao diện giao dịch E2E |
| FE-006 | Xây admin catalog, inventory operations, order, promotion, report và finance | FE | BE1, BE2 | FE-002, BE1-003 | Tuần 3–7 | Luồng quản trị cốt lõi |
| FE-007 | Xây admin customer 360°/segments, fulfillment detail/control và Copilot | FE | BE1, BE2 | FE-006, BE1-007, BE2-005 | Tuần 5–7 | Luồng khách hàng/vận chuyển/AI |
| FE-008 | Sửa accessibility, responsive, loading/error state và chạy unit/build/smoke | FE | DO, PM | FE-003–007 | Tuần 7–8 | 12 test frontend, typecheck/build/smoke đạt |
| BE1-001 | Chốt kiến trúc, quy ước API và lược đồ logic cùng DO/BE2 | BE1 | DO, BE2 | PM-002 | Tuần 1 | Cơ sở ADR/API/lược đồ |
| BE1-002 | Xây đăng ký/xác minh/login/refresh/logout/reset, account/address/wishlist và RBAC | BE1 | BE2, DO | BE1-001 | Tuần 1–3 | Kiểm thử vòng đời auth và quyền |
| BE1-003 | Xây API danh mục/sản phẩm/biến thể/media/tìm kiếm và nhập dữ liệu | BE1 | BE2 | BE1-001 | Tuần 1–3 | API danh mục và kiểm thử |
| BE1-004 | Xây giỏ hàng, tính giá và mã giảm giá tối thiểu | BE1 | BE2 | BE1-003, BE2-001 | Tuần 3–4 | Ma trận giá đạt |
| BE1-005 | Xây order orchestration, snapshot, idempotent checkout và lịch sử | BE1 | BE2, DO | BE1-004, BE2-001 | Tuần 4–6 | Kiểm thử API đơn hàng/đồng thời |
| BE1-006 | Xây API quản trị đơn, promotion, report/finance và audit | BE1 | BE2 | BE1-005 | Tuần 5–7 | Kiểm thử trạng thái/phân quyền |
| BE1-007 | Xây customer 360°, sáu segment read model và Copilot tổng hợp theo luật | BE1 | BE2, PM | BE1-002, BE1-005 | Tuần 5–7 | API, rule tests và giải thích giới hạn AI |
| BE1-008 | Kiểm thử hồi quy backend, migration và sửa lỗi | BE1 | DO, PM | BE1-002–007 | Tuần 7–8 | Bộ 69 test backend đạt |
| BE2-001 | Xây số dư, biến động, giữ/hết hạn/tiêu thụ tồn kho | BE2 | BE1, DO | BE1-001, PM-004 | Tuần 2–4 | Kiểm thử sổ tồn kho/đồng thời |
| BE2-002 | Xây snapshot địa chỉ/phí, schema fulfillment và phương án tracking thủ công | BE2 | DO, PM | PM-003, BE2-001 | Tuần 3–5 | Migration và API contract |
| BE2-003 | Xây COD, payment mock, webhook HMAC và chống xử lý trùng | BE2 | BE1, DO | PM-003, BE1-005 | Tuần 4–6 | Kiểm thử hợp đồng/phát lại thanh toán |
| BE2-004 | Xây đối soát trạng thái payment, expiry và webhook full-refund nhận vào; không có command refund | BE2 | BE1, DO | BE2-003 | Tuần 5–6 | Kiểm thử duplicate/thất bại/giới hạn |
| BE2-005 | Tự tạo một fulfillment/kho; tracking, state machine, version, tồn và COD lifecycle | BE2 | BE1, PM | BE1-005, BE2-002 | Tuần 5–7 | Kiểm thử giao hàng đa kho |
| BE2-006 | Kiểm thử integration PostgreSQL, concurrent inventory và failure transitions | BE2 | DO, PM | BE2-001–005 | Tuần 7–8 | Evidence tích hợp trong bộ 69 test |
| DO-001 | Dựng hai Docker Compose stack, config/secret local và frontend CI | DO | BE1, BE2 | BE1-001 | Tuần 1–2 | Container non-root và CI chạy được |
| DO-002 | Dựng PostgreSQL/Redis/upload volume, Flyway và healthcheck xuyên stack | DO | BE1 | DO-001 | Tuần 1–3 | Health/migration evidence |
| DO-003 | Dựng correlation/audit, Docker log và mô tả khoảng trống metrics/alert | DO | BE1, BE2 | DO-001 | Tuần 2–6 | Runbook quan sát local |
| DO-004 | Dependency audit, secret/origin/rate-limit review và Docker hardening | DO | BE1, BE2 | DO-001 | Tuần 2–7 | Security checklist; production gaps ghi rõ |
| DO-005 | Chạy frontend smoke, Maven/Testcontainers và kiểm thử cạnh tranh quan trọng | DO | FE, BE1, BE2 | Giao dịch E2E | Tuần 6–8 | 69 backend + 12 frontend tests và smoke |
| DO-006 | Viết runbook, backup/restore design, forward-only migration và rollback/roll-forward | DO | PM, BE1, BE2 | DO-002–004 | Tuần 7–8 | Tài liệu; không tuyên bố DR production đã diễn tập |
| DO-007 | Đóng gói release candidate Docker và hỗ trợ buổi nghiệm thu | DO | Cả đội | PM-008 | Tuần 8 | Image/build log và health evidence |
| PM-005 | Quản lý sprint, RAID, quyết định, phụ thuộc và phạm vi hằng ngày | PM | Cả đội | PM-001 | Tuần 1–8 | Báo cáo tuần và nhật ký cập nhật |
| PM-006 | Chuẩn bị dữ liệu demo, hướng dẫn, người dùng/kịch bản UAT và lịch nghiệm thu | PM | FE, BE1, BE2, DO | PM-004 | Tuần 5–7 | Bộ UAT/nghiệm thu |
| PM-007 | Điều phối UAT, phân loại lỗi và ký nghiệm thu | PM | Cả đội | E2E đạt, PM-006 | Tuần 8 | UAT đã ký và trạng thái lỗi |
| PM-008 | Điều phối quyết định nghiệm thu, checklist và đóng gói release candidate | PM | DO, FE, BE1, BE2 | PM-007, DO-006 | Cuối tuần 8 | Biên bản Đạt/Không đạt |
| PM-009 | Tổng hợp evidence, bài học, bàn giao và kết thúc đồ án | PM | Cả đội | PM-008 | Cuối tuần 8 | Báo cáo kết thúc/bàn giao |

## 3. Phân bổ khối lượng theo sprint

| Thành viên | Sprint 1 — W1–2 | Sprint 2 — W3–4 | Sprint 3 — W5–6 | Sprint 4 — W7–8 |
|---|---|---|---|---|
| PM | Scope/rules/AC/decision mock-manual | Nghiệm thu, RAID, RTM | UAT data, customer/ship rules | UAT, evidence và kết thúc |
| FE | UI shell, responsive, auth | Browse/account/cart/admin core | Checkout/tracking/customer/ship | Admin AI/report, accessibility, test |
| BE1 | Architecture/auth/catalog | Cart/pricing/account/order | Admin order/customer/segments/report | Copilot rule, 69-test regression, fix |
| BE2 | Inventory schema/reservation | Operations/payment mock | Fulfillment đa kho/COD/return guard | Integration/concurrency/fix |
| DO | Docker/Flyway/CI/config | Health/log/security baseline | Smoke/Testcontainers/runbook | Build, recovery design, nghiệm thu |

## 4. Khuyến nghị cấu trúc công việc trên Jira

- Sáng kiến: chủ đề chiến lược hoặc kết quả lớn.
- Nhóm chức năng: E01–E13 theo PRD.
- Câu chuyện người dùng: giá trị xuyên suốt cho khách hàng/quản trị, có điều kiện nghiệm thu.
- Công việc/công việc con: thiết kế, API, dữ liệu, kiểm thử hoặc vận hành để hoàn tất câu chuyện.
- Lỗi: mức độ, môi trường, bản dựng, cách tái hiện, kết quả mong đợi/thực tế và bằng chứng.
- Công việc nghiên cứu: giới hạn thời gian, có câu hỏi, đầu ra/quyết định và điều kiện kết thúc.

## 5. Ước lượng và năng lực đội

- Đội ước lượng điểm công việc theo độ phức tạp tương đối; không quy đổi cứng điểm thành giờ.
- PM dùng vận tốc sau 2–3 sprint cùng phạm vi còn lại để dự báo.
- Sprint 4 giữ tối thiểu 50% năng lực kỹ thuật cho lỗi, tích hợp, yêu cầu phi chức năng và phát hành; không nhận tính năng mới sau khi khóa mã đầu tuần 7 nếu chưa được cấp có thẩm quyền phê duyệt.
- Công việc phụ thuộc/mở rộng bên ngoài được theo dõi bằng ngày và người phụ
  trách, không “ẩn” trong điểm công việc.
- PM quản lý số việc đang làm chặt: mỗi kỹ sư tối đa một công việc chính; ưu tiên hoàn tất lát cắt xuyên suốt trước khi mở thêm việc.

## 6. Ảnh chụp trạng thái baseline 02/09/2026

| Nhóm kết quả | Trạng thái | Bằng chứng/giới hạn |
|---|---|---|
| Frontend storefront/account/admin | Đã hiện thực | Typecheck/build đạt; 12 unit tests; mọi thay đổi source phải rebuild container trước smoke/UAT. |
| Java API và PostgreSQL/Flyway V7 | Đã hiện thực | 69 tests; migration forward-only; PostgreSQL Testcontainers cho integration. |
| Inventory đa kho và fulfillment | Đã hiện thực ở mức đồ án | Một fulfillment/kho, tracking thủ công; không có provider API hoặc split cùng kho. |
| Auth và guest tracking | Đã hiện thực | Refresh rotation; guest token header 7 ngày; chưa có email delivery, local trả development token. |
| Customer segments và Copilot | Đã hiện thực | Segment là read model; Copilot là rule engine đọc dữ liệu, không phải LLM. |
| Production readiness | Chưa thuộc baseline | Chưa có cloud/CDN, centralized metrics/alert, secret manager, email/provider thật, outbox worker hoặc DR rehearsal production. |
