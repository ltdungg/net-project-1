# Tuyên bố khởi tạo dự án

**Dự án:** Đồ án MVP cửa hàng thời trang trực tuyến  
**Người phê duyệt:** Giảng viên/hội đồng hoặc Sponsor giả định của tình huống  
**Chủ sản phẩm và BA:** PM kiêm nhiệm trong đội triển khai  
**Quản lý dự án:** Thành viên PM trong đội 5 người; tên cụ thể điền khi thành lập nhóm  
**Thời lượng mục tiêu:** 8 tuần từ khi khởi động  
**Trạng thái:** BASELINE ĐỒ ÁN — cập nhật theo sản phẩm hiện có ngày 02/09/2026

## 1. Mục đích

Thiết kế, phát triển và trình diễn một website bán quần áo B2C có luồng giao dịch
xuyên suốt, quản lý catalog–tồn kho đa kho–đơn hàng–khách hàng–fulfillment và có
đủ tài liệu PO/BA/PM để bảo vệ quyết định thiết kế.

Baseline là hệ thống local bằng React/Vinext, BFF, Java 21/Spring Boot,
PostgreSQL 17, Redis 7 và Docker. Payment online dùng mock/webhook HMAC; vận
chuyển dùng tracking thủ công. Vì vậy “hoàn thành đồ án” không đồng nghĩa “đã sẵn
sàng xử lý giao dịch production”.

Lý do đầu tư, nghiên cứu người dùng, phương án và mô hình lợi ích–chi phí được dẫn chiếu từ [Báo cáo tiền dự án](../research/00-bao-cao-tien-du-an.md). Các số liệu mô phỏng phải được thay bằng dữ liệu thật trước phê duyệt ngân sách cuối.

## 2. Mục tiêu đo lường được

- Hoàn thành bản release candidate chạy Docker trong 8 tuần.
- Hoàn thành 100% Must-have đã baseline và UAT sign-off.
- 0 lỗi Sev-1/Sev-2, 0 security Critical/High chưa xử lý hoặc chưa được risk-accept.
- Có 69 kiểm thử backend và 12 kiểm thử frontend vượt qua, cùng typecheck/build
  và smoke test xuyên BFF–Java API.
- Có runbook, hướng dẫn chạy, giới hạn MVP và bằng chứng nghiệm thu để bàn giao.

## 3. Phạm vi cơ sở

Scope đã được baseline tại [Bối cảnh và phạm vi](../00-overview.md) và
[PRD](../product/02-prd.md). Mọi chênh lệch phát hiện sau rà soát phải cập nhật
RTM/backlog hoặc đi qua change control; Phase 2/3 không thuộc cam kết 8 tuần.

## 4. Sản phẩm bàn giao

- Product/BA/PM baseline và decision log.
- UX research, IA, wireframe, design system subset, responsive UI và prototype.
- Storefront, wishlist, vòng đời account, cart/voucher, guest/member checkout và
  theo dõi một hoặc nhiều kiện.
- Admin catalog/media, inventory operations, order, customer 360°/segments,
  fulfillment, promotion, report, finance và Copilot theo luật.
- Java API, PostgreSQL/Flyway, Redis, BFF, Docker, bảo mật nền tảng, audit/outbox
  và healthcheck.
- Test strategy/cases/results, UAT sign-off, release package, runbook/training.

Ngoài baseline: payment/shipping provider thật, email production, LLM bên ngoài,
outbox dispatcher, cloud production/DR, refund/return đối soát đầy đủ và chia
nhiều kiện trong cùng một kho.

## 5. Cơ chế quản trị và ngưỡng sai lệch

| Quyết định | Thẩm quyền |
|---|---|
| Product priority và acceptance | PO |
| Scope/date/chi phí vượt tolerance | Người phê duyệt đồ án |
| Technical architecture và engineering quality | BE1, với DevOps và BE2 đồng review; stack đã baseline trong tài liệu kiến trúc |
| Release recommendation | PM + FE + BE1 + BE2 + DevOps |
| Đạt/Không đạt nghiệm thu | Giảng viên/hội đồng hoặc Sponsor giả định, dựa trên evidence pack |

Tolerance đề xuất: sprint scope do PO cân đối trong release nếu không ảnh hưởng
Must-have/milestone; thay đổi làm tăng >10% effort, đổi ngày nghiệm thu, tăng
chi phí hoặc rủi ro High phải qua Change Control.

## 6. Phương pháp triển khai

- Agile/Scrum, 4 sprint × 2 tuần; discovery, thiết kế và delivery overlap có kiểm soát.
- Một backlog; PO ưu tiên; team estimate; PM quản lý dependency/milestone/risk.
- Môi trường bắt buộc trong đồ án: local Docker và test tự động; staging/cloud
  production là thiết kế mở rộng, không được ngầm coi là đã triển khai.
- CI hiện chạy typecheck, lint, frontend unit test, build và dependency audit;
  backend được chạy bằng Maven/Testcontainers và cần đưa vào CI thống nhất.
- Để bảo vệ mốc 8 tuần, baseline chỉ gồm Must-have; tích hợp provider thật,
  notification production, CMS và các Should/Could được đưa vào backlog sau đồ án.

## 7. Đội triển khai — 5 người

| Mã | Vai trò | Mức tham gia | Trách nhiệm kiêm nhiệm |
|---|---|---:|---|
| PM | Quản lý dự án | 1 người toàn thời gian | Kiêm PO/BA: phạm vi, yêu cầu, danh sách công việc, nghiệm thu, UAT, các bên liên quan và điều phối phát hành. |
| FE | Lập trình viên Frontend | 1 người toàn thời gian | Kiêm thực thi UI/UX: giao diện đáp ứng, khả năng tiếp cận, giao diện khách hàng/quản trị và kiểm thử frontend. |
| BE1 | Lập trình viên Backend 1 | 1 người toàn thời gian | Trưởng kỹ thuật cho auth, catalog, giỏ/tính giá, khách hàng, phân khúc, đơn hàng, report và Copilot theo luật; rà soát API/dữ liệu. |
| BE2 | Lập trình viên Backend 2 | 1 người toàn thời gian | Phụ trách tồn kho, payment mock/webhook, fulfillment đa kho và liên kết vòng đời giao–tồn–COD. |
| DO | Kỹ sư DevOps | 1 người toàn thời gian | Docker, CI, secret/config, healthcheck, bảo mật cơ sở, log, backup/restore design và tự động hóa kiểm thử. |

Không có PO, BA, UX/UI và QA chuyên trách. Vì vậy:

- PM phải có quyền quyết định backlog hằng ngày và có người phê duyệt sẵn sàng
  phản hồi trong tối đa 1 ngày làm việc.
- Mỗi story phải được người không trực tiếp viết phần logic chính review/test; PM điều phối UAT, DevOps giữ quality gates.
- FE dùng design system/template có sẵn, giới hạn research và custom interaction.
- Timeline 8 tuần dựa trên payment mock và vận chuyển thủ công; nếu bắt buộc tích
  hợp provider thật thì phải qua change control thay vì âm thầm giữ nguyên mốc.

## 8. Rủi ro cấp cao

- Scope tăng; content trễ; oversell/payment race; sai liên kết fulfillment–tồn;
  thiếu người nghiệm thu; performance mobile; privacy/legal; migration đã chạy bị
  sửa; nhầm capability demo với production-ready.
- Chi tiết và response plan nằm trong [RAID log](05-raid-change.md).

## 9. Các cổng phê duyệt

1. Charter + scope hypothesis approved.
2. Discovery exit: prototype, kiến trúc Java/BFF, backlog estimate và quyết định
   dùng provider mock/manual cho đồ án.
3. Build scope baseline.
4. UAT entry.
5. Release candidate readiness và quyết định Đạt/Không đạt.
6. Bàn giao/kết thúc trong cuối tuần 8.

## 10. Biên bản phê duyệt

| Vai trò | Họ tên | Quyết định | Ngày | Ghi chú |
|---|---|---|---|---|
| Giảng viên/Sponsor giả định | TBD | Pending | | |
| Product Owner (PM kiêm nhiệm) | TBD | Pending | | |
| Project Manager | TBD | Pending | | |
| Technical Lead (BE1) | TBD | Pending | | |
