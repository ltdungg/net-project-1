# Project 1 — kiểm tra bản bàn giao

Ngày đối chiếu: 03/09/2026.

- Tệp: `deliverables/Project-1-Bao-cao-khao-sat-va-mo-hinh-he-thong-NET.docx`.
- 32 trang; 8 chương, 3 phụ lục; 24 FR, 12 NFR; 18 bảng, 9 hình nhúng.
- Đã đối chiếu với slide, tài liệu nghiên cứu có sẵn và mã nguồn hiện tại.
- Chưa có bằng chứng thực địa. SYS, SYN, PLAN và FIELD được phân biệt; không tạo lời phỏng vấn, danh tính hoặc chữ ký giả.
- Render chuẩn `render_docx.py` không chạy được do môi trường thiếu LibreOffice. Đã dùng Microsoft Word COM để cập nhật mục lục/field và xuất PDF nội bộ, sau đó Poppler raster ở 115 DPI.
- Đã kiểm tra trực quan toàn bộ 32 trang ở bản trước tinh chỉnh khoảng cách. Bản bàn giao có 26 ảnh trang giống hệt theo SHA-256; 6 trang thay đổi (8, 11, 13, 15, 27, 31) đã được mở và kiểm tra lại.
- Không có trang trắng ngoài ý muốn, hình bị cắt hoặc đường nối ERD chồng chéo. Các hình có caption và phần giải thích.
- ZIP integrity đạt; tất cả 18 bảng có grid tổng 9.360 twip (6,5 inch). 9 hình được nhúng trong DOCX.
- Accessibility audit: 0 high, 0 medium, 0 low. Đã kiểm tra header bảng, alt text, bookmark/PAGEREF và danh sách đánh số độc lập.
- Tệp PDF/PNG trong `artifacts/qa/` chỉ phục vụ QA; bản bàn giao cho người học là DOCX.

Các mục người học cần bổ sung trước khi nộp: trường/khoa/lớp, giảng viên, tên/MSSV của 05 thành viên, lịch/địa điểm được xác nhận và bằng chứng khảo sát thật (hoặc chấp thuận dùng mô phỏng của giảng viên).
