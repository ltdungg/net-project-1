# Đồ án website cửa hàng thời trang trực tuyến

Bộ hồ sơ đồ án kết hợp ba góc nhìn Product Owner, Business Analyst và Project
Manager với một sản phẩm chạy được. Baseline kỹ thuật hiện tại gồm frontend
React 19/Vinext, BFF cùng origin, backend Java 21/Spring Boot, PostgreSQL 17,
Redis 7 và hai Docker Compose stack.

Phạm vi đã hiện thực gồm storefront, xác thực và tài khoản, giỏ hàng/voucher,
checkout khách hoặc thành viên, quản trị catalog, tồn kho đa kho, đơn hàng, khách
hàng và sáu phân khúc tự động, fulfillment thủ công theo từng kho, báo cáo/tài
chính, gợi ý sản phẩm tự động, trợ lý tư vấn mua sắm và Copilot quản trị hỗ trợ
tạo/lưu dashboard. Mô hình AI bên ngoài được bật tùy chọn bằng API key backend,
có chế độ dự phòng theo luật. Thanh toán thật, API hãng vận chuyển và email
production chưa thuộc bản đồ án này.

## Hồ sơ Word đã đóng gói

- [Báo cáo đồ án đầy đủ](deliverables/Bao-cao-do-an-website-ban-quan-ao-truc-tuyen.docx)
- [SRS — yêu cầu chức năng và phi chức năng](deliverables/Tai-lieu-yeu-cau-chuc-nang-va-phi-chuc-nang-NET.docx)
- [Báo cáo tổng hợp để đọc nhanh](deliverables/Bao-cao-tong-hop-du-an-cua-hang-thoi-trang-truc-tuyen.docx)

Ba tệp trên được sinh từ cùng một nguồn nội dung và đã cập nhật mục lục, kiểm
tra trực quan theo từng trang, kiểm tra heading, alt text và header bảng.

### Báo cáo khảo sát học phần Project 1

- [Bản 1.2 — báo cáo khảo sát giả lập, tiếng Việt dễ hiểu](deliverables/Project-1-Bao-cao-khao-sat-GIA-LAP-NET.docx)
- [Excel dữ liệu giả lập và công thức phân tích](outputs/01a050e8-3467-7f72-a82d-b7b9f935219a/Project-1-Du-lieu-khao-sat-gia-lap-NET.xlsx)
- [Nguồn nội dung bản 1.2](docs/project-1/bao-cao-khao-sat-gia-lap.md)
- [Bản Word theo yêu cầu trên slide](deliverables/Project-1-Bao-cao-khao-sat-va-mo-hinh-he-thong-NET.docx)
- [Nguồn nội dung và biểu mẫu khảo sát](docs/project-1/bao-cao-khao-sat-va-mo-hinh-he-thong.md)

Báo cáo riêng cho giai đoạn khảo sát 02 tuần: kế hoạch 05 người, phỏng vấn,
phiếu hỏi, lấy mẫu, FR/NFR, BFD, Activity Diagram và ERD khái niệm. Chưa có
bằng chứng thực địa; số liệu mô phỏng được gắn nhãn và không thay thế khảo sát thật.

Bản 1.2 dùng từ tiếng Việt đơn giản như báo cáo bài tập trong cả Word, sơ đồ
và Excel; giữ nguyên số liệu của bản 1.1. Nguồn SYN được lưu riêng:
144 phiếu gốc → 120 hợp lệ, 10 tình huống thử phiếu,
12 phỏng vấn giả định, 20 đơn và 10 chứng từ kho. Bộ mới không gộp bảng n=200
cũ. Dữ liệu chi tiết nằm trong `docs/project-1/synthetic/`; generator có seed
cố định tại `tools/generate_project1_survey.mjs`. Tái tạo nguồn Word bằng
`tools/compose_project1_synthetic_report.py`, sau đó chạy
`tools/build_project1_report.py --synthetic` và
`tools/export_project1_report.ps1 -Synthetic` để cập nhật mục lục bằng Word.
Không nhập dữ liệu SYN vào ứng dụng, không dùng như bằng chứng thực địa.

## Mục lục

### Tổng quan

- [Bối cảnh, giả định và phạm vi](docs/00-overview.md)
- [Thuật ngữ](docs/01-glossary.md)

### Nghiên cứu và lý do thực hiện dự án

- [Báo cáo tiền dự án — tại sao nên thực hiện](docs/research/00-bao-cao-tien-du-an.md)
- [Báo cáo khảo sát người mua](docs/research/01-bao-cao-khao-sat.md)
- [Bộ hồ sơ nghiên cứu và Business Case](docs/research/README.md)

### Chủ sản phẩm

- [Tầm nhìn và chiến lược sản phẩm](docs/product/01-product-vision.md)
- [PRD — Tài liệu yêu cầu sản phẩm](docs/product/02-prd.md)
- [Chân dung khách hàng và hành trình khách hàng](docs/product/03-personas-journeys.md)
- [Lộ trình, KPI và phân tích sản phẩm](docs/product/04-roadmap-kpi.md)
- [Danh sách yêu cầu sản phẩm và câu chuyện người dùng](docs/product/05-product-backlog.md)

### Chuyên viên phân tích nghiệp vụ

- [BRD/SRS — Yêu cầu nghiệp vụ và hệ thống](docs/ba/01-brd-srs.md)
- [Đặc tả trường hợp sử dụng](docs/ba/02-use-cases.md)
- [Quy tắc nghiệp vụ và quy tắc nghiệm thu](docs/ba/03-business-rules.md)
- [Sơ đồ trường hợp sử dụng, tuần tự và trạng thái](docs/ba/04-diagrams.md)
- [ERD chi tiết và từ điển dữ liệu](docs/ba/05-data-model.md)
- [Phân tích riêng 33 bảng và một view nghiệp vụ](docs/ba/data-dictionary/README.md)
- [Thiết kế vật lý, transaction, CRUD, migration và kiểm thử dữ liệu](docs/ba/database-design/01-trang-thai-va-chuyen-doi.md)
- [Ma trận truy vết yêu cầu](docs/ba/06-traceability.md)

### Quản lý dự án

- [Tuyên bố khởi tạo dự án](docs/pm/01-project-charter.md)
- [Kế hoạch triển khai, tiến độ và cột mốc](docs/pm/02-plan-timeline.md)
- [WBS và kế hoạch công việc](docs/pm/03-wbs-task-plan.md)
- [RACI và kế hoạch truyền thông](docs/pm/04-raci-communication.md)
- [Quản lý RAID, thay đổi và quyết định](docs/pm/05-raid-change.md)
- [Kế hoạch chất lượng, UAT, đóng gói và nghiệm thu](docs/pm/06-quality-release.md)

## Cách sử dụng

### Chạy ứng dụng và nạp dữ liệu mẫu bằng Docker

Từ thư mục gốc, với Docker Compose v2 và Node.js 22 trở lên:

```bash
docker compose up --build -d --wait --wait-timeout 240
node platform/backend/scripts/seed-demo.mjs --project net-commerce-demo
```

Mở **http://localhost:8787**. Admin: `demo.admin@example.test`, khách hàng:
`customer01@example.test`; mật khẩu chung: `NetDemo2026!`.
Không cần tạo `.env` cho cấu hình local này.

Xem [hướng dẫn Docker, tài khoản và kiểm tra dữ liệu](docs/chay-docker.md).

1. Sponsor/PO duyệt Vision, phạm vi MVP, KPI và các quyết định còn mở.
2. BA tổ chức workshop để xác thực nghiệp vụ, use case, business rules và mô hình dữ liệu.
3. Frontend tạo prototype/UI dựa trên journey, use case và acceptance criteria.
4. Backend 1 chủ trì kiến trúc/API/data; Backend 2 chủ trì inventory/payment/shipping/fulfillment.
5. DevOps thiết lập CI/CD, môi trường, security, observability và quality gates.
6. PM kiêm PO/BA/UAT coordinator: baseline backlog/timeline, quản lý thay đổi và acceptance.

## Baseline triển khai

- Thời lượng: 8 tuần, 4 sprint × 2 tuần; không tính thêm một tuần thứ 9 vào
  baseline đồ án.
- Đội delivery: đúng 5 người — PM, Frontend, Backend 1, Backend 2 và DevOps.
- Schema runtime: 34 bảng PostgreSQL và view đọc
  `admin_customer_segments`; Flyway hiện ở V9.
- Kiểm thử hiện tại: 125 bài kiểm thử backend và 15 bài kiểm thử frontend, cùng
  build/typecheck và smoke test Docker.
- Chạy dự án và xem kiến trúc tại [Platform README](platform/README.md) và
  [Architecture](platform/ARCHITECTURE.md).

## Các lỗi local đã sửa ngày 14/11/2026

- `KD-PAY-01`: webhook thành công/thất bại đến sau khi đơn đã hủy trả 409,
  không đổi trạng thái thanh toán. Hoàn tiền cho đơn đã thanh toán vẫn được phép.
- `KD-INV-01`: hết hạn giữ hàng cập nhật đồng bộ đơn, payment, fulfillment và tồn.
- `KD-INV-02`: COD quá 30 ngày được hủy và nhả tồn nếu chưa xuất kho; không hủy
  đơn đã thanh toán hoặc có kiện đã xuất kho.
- Nhân viên truy cập KPI không đủ quyền nhận 403 `FORBIDDEN` thay vì lỗi 500.

Các tình huống được kiểm thử bằng PostgreSQL Testcontainers trong
`PostgresReservationExpiryIntegrationTest` và `PaymentStatePolicyTest`.
Xem [ma trận yêu cầu](docs/ba/06-traceability.md).

## Quy ước trạng thái yêu cầu

- `DRAFT`: đang soạn hoặc cần xác nhận.
- `PROPOSED`: đã đủ thông tin để review.
- `APPROVED`: stakeholder có thẩm quyền đã duyệt.
- `DEFERRED`: hoãn khỏi release hiện tại.
- `REJECTED`: không thực hiện.

Phiên bản bộ hồ sơ hiện tại là baseline đồ án `v5.0 — DRAFT` ngày 02/09/2026.
Các số liệu khảo sát được ghi rõ là mô phỏng; không được trình bày như kết quả
khảo sát thực địa.
