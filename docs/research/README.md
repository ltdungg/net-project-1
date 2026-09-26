# Bộ hồ sơ nghiên cứu phục vụ đồ án

Bộ tài liệu này giải thích lý do chọn đề tài, cách hình thành yêu cầu và phương pháp kiểm chứng cho website NÉT Fashion. Hồ sơ được viết theo hướng báo cáo đồ án, không phải hồ sơ xin đầu tư của một doanh nghiệp cụ thể.

## Baseline đồ án được đối chiếu

- Thời gian 02 tháng (08 tuần), nhóm 05 người: PM, Frontend, Backend 1, Backend 2 và DevOps.
- Frontend React 19/Vinext/TypeScript; backend Java 21/Spring Boot 4.1.1.
- PostgreSQL 17, Redis 7 và hai Docker Compose stack cho frontend và backend/data.
- Dataset demo 22 sản phẩm/58 biến thể; auth đầy đủ, voucher và inventory đa kho.
- Customer 360° với 06 phân khúc hành vi; fulfillment tự tạo theo từng kho.
- NÉT AI Copilot là bộ máy luật chỉ đọc, không phải ML/LLM và không tự thay đổi dữ liệu.

## Tài liệu chính

- [Báo cáo tổng quan và cơ sở chọn đề tài](00-bao-cao-tien-du-an.md) — lý do chọn, overview, hiện trạng hệ thống, nghiên cứu, mục tiêu và tiêu chí nghiệm thu.
- [Báo cáo khảo sát](01-bao-cao-khao-sat.md) — thiết kế mẫu, kết quả mô phỏng n=200, crosstab và hypothesis decisions.
- [Bảng câu hỏi khảo sát](02-bang-cau-hoi-khao-sat.md) — questionnaire 7–9 phút và codebook rules.
- [Hướng dẫn phỏng vấn](03-huong-dan-phong-van.md) — user/internal interviews và usability tasks.
- [Phân tích đối thủ](04-phan-tich-doi-thu.md) — channel archetypes, scorecard và strategic gaps.
- [Mô hình nguồn lực/tài chính mô phỏng](05-mo-hinh-tai-chinh.md) — bài tập phân tích cost, benefits, payback và sensitivity; không phải ngân sách thật.
- [Nguồn dữ liệu](06-nguon-du-lieu.md) — external sources, synthetic labels và internal data request.

## Quy tắc sử dụng

1. Không xóa nhãn “mô phỏng” cho đến khi có dữ liệu thu thật và cleaning log.
2. PM/BA thay số synthetic bằng dữ liệu thật, giữ cùng định nghĩa/cấu trúc để so sánh.
3. PO cập nhật PRD/backlog/KPI dựa trên insight đã có evidence.
4. Nếu tái sử dụng để lập kế hoạch đầu tư, người có thẩm quyền tài chính chỉ dùng model sau khi thay input thật và rà soát sensitivity.
5. Legal xác minh yêu cầu pháp lý trên văn bản chính thức hiện hành.
6. Không dùng dataset demo trong PostgreSQL như bằng chứng về nhu cầu, doanh thu hoặc hành vi thật.
7. Mọi tuyên bố “đã xây dựng” phải truy được tới mã nguồn, migration, test hoặc ảnh chạy hệ thống.

## Phân loại bằng chứng

| Nhãn | Ý nghĩa | Cách dùng trong báo cáo |
|---|---|---|
| `EXT` | Nguồn bên ngoài có trích dẫn | Dùng cho bối cảnh, ghi rõ năm/phạm vi/phương pháp. |
| `SYN` | Số liệu hoặc theme mô phỏng | Chỉ minh họa phương pháp; luôn gắn nhãn “mô phỏng”. |
| `SYS` | Bằng chứng từ hệ thống đồ án | Dùng mô tả phạm vi đã hiện thực; không suy rộng thành hiệu quả kinh doanh. |
