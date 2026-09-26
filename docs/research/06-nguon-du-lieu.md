# Danh mục nguồn và quy tắc sử dụng số liệu

Tài liệu phân biệt ba lớp bằng chứng: nguồn bên ngoài (`EXT`), dữ liệu mô phỏng (`SYN`) và bằng chứng hệ thống của đồ án (`SYS`). `SYS` chứng minh phạm vi kỹ thuật đã được xây dựng, nhưng không chứng minh nhu cầu thị trường hoặc hiệu quả kinh doanh.

## 1. Nguồn bên ngoài

| Mã | Nguồn | Dữ liệu sử dụng | Phạm vi/giới hạn |
|---|---|---|---|
| EXT-01 | [Báo Điện tử Chính phủ — quy mô bán lẻ/TMĐT 2025](https://baochinhphu.vn/quy-mo-thi-truong-ban-le-viet-nam-dat-khoang-269-ty-usd-102251230111145424.htm) | TMĐT 32 tỷ USD, gần 12% retail, tăng >20% | Bài dẫn báo cáo; cần lấy báo cáo gốc nếu dùng trong hồ sơ đầu tư chính thức |
| EXT-02 | [Google–Temasek–Bain — Vietnam e-Conomy SEA 2024](https://services.google.com/fh/files/misc/vietnam_e_conomy_sea_2024_report.pdf) | Digital economy 36B GMV, e-commerce 22B | Estimate theo methodology của report, không đồng nghĩa doanh thu B2C chính thức |
| EXT-03 | [Temasek — e-Conomy SEA 2024 release](https://www.temasek.com.sg/en/news-and-resources/news-room/news/2024/-e-conomy-sea-2024-report--profitability-push-in-southeast-asia-) | SEA e-commerce 159B, video commerce 20% | Regional 6 markets; không áp tỷ lệ thẳng cho Việt Nam/shop |
| EXT-04 | [Báo Điện tử Chính phủ — Luật TMĐT](https://baochinhphu.vn/luat-thuong-mai-dien-tu-lap-day-khoang-trong-phap-ly-cho-kinh-te-so-bao-ve-nguoi-tieu-dung-102260106142452861.htm) | Luật thông qua 10/12/2025, hiệu lực 01/07/2026 | Tham khảo bối cảnh; Legal phải review văn bản pháp luật chính thức |
| EXT-05 | [Báo Điện tử Chính phủ — thị trường 25 tỷ USD 2024](https://baochinhphu.vn/thi-truong-25-ty-usd-va-bai-toan-nhan-luc-cho-thuong-mai-dien-tu-viet-nam-102250516134749253.htm) | 2024 >25B, +20%, ~9% retail; nhân lực | Phạm vi có thể khác e-Conomy SEA, không trộn series |

## 2. Dữ liệu mô phỏng

| Mã | Tập dữ liệu | Trạng thái | Được dùng để | Không được dùng để |
|---|---|---|---|---|
| SYN-01 | Survey n=200 | Synthetic | Thiết kế report, questionnaire, hypothesis | Claim đã khảo sát thị trường |
| SYN-02 | Interview users n=12 | Synthetic themes | Thiết kế guide/journey | Trích dẫn như người thật |
| SYN-03 | Stakeholder interviews n=5 | Synthetic themes | Chuẩn bị workshop | Claim quy trình doanh nghiệp thật |
| SYN-04 | Financial model | Assumptions | Sensitivity, input checklist | Approve budget/payback cuối |
| SYN-05 | Competitor archetype scores | Illustrative | Thiết kế field audit | Claim thương hiệu cụ thể đạt/thua |

## 3. Bằng chứng hệ thống đồ án

| Mã | Nguồn trong repository | Tuyên bố được hỗ trợ | Không được suy rộng thành |
|---|---|---|---|
| SYS-01 | `platform/package.json`, mã `platform/app` | Frontend dùng React 19/Vinext/TypeScript; có storefront và admin | Chứng nhận tương thích mọi trình duyệt/thiết bị |
| SYS-02 | `platform/backend/pom.xml` | Backend dùng Java 21/Spring Boot 4.1.1 và các starter Security/JDBC/Redis/Flyway | SLA hoặc tải production đã đạt |
| SYS-03 | Hai Docker Compose stack, Dockerfile và healthcheck trong `platform` | Có thể đóng gói frontend/backend/PostgreSQL 17/Redis 7 cho môi trường đồ án | Kiến trúc HA/DR production |
| SYS-04 | Seed catalog và kiểm đếm dữ liệu | Dataset demo có 22 sản phẩm/58 biến thể | Quy mô catalog thật hoặc nhu cầu thị trường |
| SYS-05 | Module auth và migration `auth_tokens` | Có đăng ký, xác minh email, login/refresh/logout/forgot/reset và RBAC | Đã audit bảo mật độc lập |
| SYS-06 | Module inventory + migration Flyway | Có đa kho, reservation, receipt/transfer/stocktake/adjustment, movement/audit | Đã đối soát với kho doanh nghiệp thật |
| SYS-07 | View `admin_customer_segments`, module `admincustomer` | Có Customer 360° và 06 phân khúc theo luật `RFM-2026.1` | Dự đoán ML hoặc hiệu quả retention |
| SYS-08 | Migration V7 và module `fulfillment` | Checkout tạo một fulfillment theo mỗi kho; có item/event/tracking/state/version | Đã tích hợp hãng vận chuyển thật |
| SYS-09 | `AdminPromptEngine` và UI NÉT AI Copilot | Copilot rule-based, đọc snapshot và không mutation | Hệ thống dùng LLM/ML hoặc trả lời đúng ngoài intent hỗ trợ |

Khi trích `SYS`, ghi rõ file/migration/test và thời điểm commit được kiểm tra. Nếu mã nguồn thay đổi, tài liệu phải được đối chiếu lại trước khi xuất Word/PDF.

## 4. Dữ liệu thực địa cần thu nếu triển khai thật

| Nhóm | Trường tối thiểu | Khoảng thời gian | Owner |
|---|---|---|---|
| Orders | ID, date, channel, items, value, status, cancel/return reason | 6–12 tháng | Operations/Finance |
| Traffic/campaign | Sessions, source/medium/campaign, click/lead | 3–6 tháng | Marketing |
| Marketplace economics | GMV, fee, voucher subsidy, ads, refund | 6 tháng | Finance/Marketing |
| Inventory | SKU, on-hand, adjustment, stockout/cancel | 3–6 tháng | Warehouse |
| CS | Contact reason, timestamps, resolution | 1–3 tháng | CS |
| Process time | Touch/queue time/order step | Sample 30–50 orders | Operations/PM |

Trước phân tích phải có data sharing purpose, owner, field classification, retention và de-identification.

## 5. Quy tắc trích dẫn

- Ghi rõ năm, đơn vị, geography, definition và methodology khi có.
- Không so sánh trực tiếp “market size”, “GMV”, “B2C revenue” nếu định nghĩa khác.
- Không kéo tỷ lệ SEA xuống Việt Nam/shop mà không có bằng chứng.
- Số liệu biến động phải có “as of date”; cập nhật trước steering/investment decision.
- Primary/official source ưu tiên; bài báo chỉ dùng khi báo cáo gốc không truy cập được và phải ghi hạn chế.
- Với `SYS`, không dùng từ “người dùng cho biết”, “doanh thu tăng” hoặc “đã vận hành ổn định”; chỉ mô tả artifact và kết quả kiểm thử tương ứng.
- Với `SYN`, nhãn “mô phỏng” phải xuất hiện ngay tại bảng/biểu, không chỉ ở lời mở đầu tài liệu.

## 6. Versioning

Mọi bảng/biểu trong báo cáo đồ án gắn `source_id`, `data_version`, `extracted_at`, `analyst` và transformation note. Khi thay SYN bằng dữ liệu thật, giữ bảng cũ trong archive và cập nhật decision log. Khi baseline hệ thống thay đổi, cập nhật `SYS` cùng version migration, commit hoặc release tag.
