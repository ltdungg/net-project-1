# Bộ phân tích hệ thống NÉT theo Project 1 - Bài 3

Bản hoàn thiện ngày 14/09/2026. Báo cáo áp dụng cho website NÉT trong dự án hiện hữu, dựa trên yêu cầu tại trang 90 của PDF người dùng cung cấp. Trang 91 của nguồn là lời cảm ơn.

## Các tệp

- `Phan-tich-he-thong-NET-theo-Bai-3.pdf`: 46 trang, có mục lục liên kết và dấu trang; phân tích nguồn, phạm vi NÉT, 6 bảng đặc tả trọng tâm theo slide 49-50, 17 biểu đồ, kiến trúc/công nghệ, truy vết và kế hoạch 2 tuần.
- `Phan-tich-he-thong-NET-theo-Bai-3.md`: nội dung có thể sửa, tham chiếu hình SVG ở thư mục cạnh tệp.
- `net-uml/*.svg`: 17 hình vector có thể phóng lớn/chỉnh trong phần mềm hỗ trợ SVG.
- `net-uml/*.png`: 17 ảnh, cạnh dài 2.500 pixel, dùng chèn Word/slide.
- `net-uml/*.json`: tên, chú thích và nguồn tham chiếu của từng hình.

Trang nội dung là A4 dọc; 15 trang hình là A4 ngang; CL-02 và CL-03 dùng A3 ngang để giữ rõ chữ. Khi in cần chọn khổ theo trang hoặc Fit. Hình SVG không bị mờ khi phóng lớn; font sử dụng Arial.

Các bảng tại mục 4.2-4.7 dùng đúng 5 trường của mẫu slide 49-50: Tên ca sử dụng, Tác nhân, Điều kiện đầu vào, Các luồng sự kiện, Kết quả trả về. Luồng phụ được ghi Luồng 1, Luồng 2... và dẫn chiếu từ luồng chính. Mỗi bảng nằm trọn trên một trang.

Bài giảng không đặc tả NÉT. Các ví dụ ATM/vay vốn được giải thích ở phần lý thuyết; mô hình bán hàng là phần áp dụng từ hồ sơ và mã nguồn. Tên lớp Việt hóa là mô hình phân tích, không khẳng định là tên Java nguyên dạng. AD-03 là phương án nghiệp vụ minh họa song song, có ghi nhãn đề xuất.

## Danh mục hình

| Mã | Nội dung | Trang báo cáo |
|---|---|---|
| AD-01 | Activity: Mua hàng và đặt hàng COD | 34 |
| AD-02 | Activity: Xử lý đơn, giao nhiều kiện và COD | 35 |
| AD-03 | Activity: Mẫu chuẩn bị kiện song song | 36 |
| CL-01 | Biểu đồ lớp: danh mục, tài khoản và giỏ hàng | 30 |
| CL-02 | Biểu đồ lớp: đơn hàng, tồn kho và vận chuyển | 31 |
| CL-03 | Biểu đồ lớp thiết kế theo boundary - control - entity | 32 |
| CP-01 | Biểu đồ thành phần của NÉT Commerce | 38 |
| DP-01 | Biểu đồ triển khai local bằng Docker Compose | 39 |
| PK-01 | Biểu đồ gói: mô hình phân tích và các package mã nguồn | 40 |
| SQ-01 | Sequence: UC03 Đăng nhập | 24 |
| SQ-02 | Sequence: UC06 Đặt hàng COD thành công | 25 |
| SQ-02B | Sequence: UC06 Điều kiện lỗi và giao dịch | 26 |
| SQ-03 | Sequence: UC11 Hủy đơn trước khi giao | 27 |
| SQ-04 | Sequence: UC12–UC13 Giao hàng và ghi nhận COD | 28 |
| UC-D01 | Use case phía người mua | 14 |
| UC-D02 | Use case phía cửa hàng | 15 |
| UC-D03 | Use case chi tiết: Đặt hàng và áp mã | 16 |

## Phạm vi kiểm tra

Đã đọc tài liệu nguồn, đối chiếu quy tắc quan trọng với hồ sơ/mã hiện có, rà chéo nội dung và render kiểm tra các trang. Không chạy lại ứng dụng hoặc sửa mã sản phẩm trong công việc này. Các tình huống kiểm thử trong báo cáo là tiêu chí đề xuất; các sai lệch hiện trạng được nêu riêng.

Khi sửa một quy tắc, kiểm lại các hình liên quan trong ma trận truy vết. Giữ nhất quán: guest không bắt buộc đăng nhập; checkout giữ hàng; shipped mới xuất; hủy trước xuất chỉ nhả giữ; COD hoàn tất khi mọi kiện delivered.
