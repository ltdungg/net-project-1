# Dữ liệu mẫu NÉT Fashion

Bộ dữ liệu được nạp vào [website local](http://localhost:8788) ngày 29/10/2026, dùng PostgreSQL của Compose project `net-pj1-java`. Dữ liệu khách hàng, địa chỉ, giao dịch và vận đơn trong bộ này đều là giả lập.

## Tài khoản đăng nhập

Các tài khoản dưới đây đã xác minh email, có thể đăng nhập ngay tại [trang đăng nhập](http://localhost:8788/dang-nhap).

**Mật khẩu dùng chung cho tài khoản mẫu: `NetDemo2026!`**

| Vai trò | Email | Sử dụng |
| --- | --- | --- |
| Admin | `demo.admin@example.test` | Toàn bộ quản trị, báo cáo và dashboard |
| Quản lý | `demo.manager@example.test` | Sản phẩm, khuyến mãi, báo cáo và vận hành |
| Nhân viên | `demo.staff@example.test` | Đơn hàng, khách hàng, tồn kho và vận chuyển |
| Khách hàng | `customer01@example.test` | Đơn hàng cá nhân, địa chỉ, yêu thích và tư vấn mua sắm |

Có thể đăng nhập các khách hàng từ `customer01@example.test` đến `customer24@example.test` bằng cùng mật khẩu. Tài khoản `owner@example.com` đã có trước khi nạp dữ liệu; mật khẩu, quyền và thông tin của tài khoản này được giữ nguyên.

Đây là mật khẩu công khai dành riêng cho dữ liệu local. Script từ chối chạy nếu môi trường API khác `APP_ENV=local`.

## Nội dung dữ liệu

| Hạng mục | Số lượng | Nội dung |
| --- | ---: | --- |
| Sản phẩm có sẵn | 22 | Dùng catalog hiện tại cùng ảnh, danh mục và giá bán |
| Biến thể có sẵn | 58 | Size, màu sắc và SKU |
| Khách hàng mới | 24 | Tên tiếng Việt, email giả lập, địa chỉ và lịch sử mua hàng |
| Tài khoản nhân sự mới | 3 | Admin, quản lý, nhân viên |
| Đơn hàng mới | 72 | Lịch sử trong khoảng 120 ngày gần nhất, có đơn đang xử lý |
| Thanh toán | 72 | COD và giao dịch online giả lập, gồm thành công, chờ, thất bại, hủy, hoàn tiền |
| Phiếu vận chuyển | 72 | Hàng hóa, địa chỉ, mã vận đơn giả lập và lịch sử trạng thái |
| Sản phẩm yêu thích | 72 lượt | Mỗi khách hàng có 3 sản phẩm |
| Chương trình khuyến mãi mới | 4 | Ba chương trình đang hoạt động và một chương trình hết hạn |
| Kho mẫu | 1 | `HCM-DEMO`, có 58 bản ghi tồn kho và lịch sử nhập/xuất/kiểm kê |
| Tình huống tồn kho thấp | 6 | Có giữ hàng, số tồn khả dụng thấp và hết tồn khả dụng tại kho mẫu |
| Dashboard lưu sẵn | 4 | Mỗi tài khoản admin mẫu và quản lý mẫu có 2 dashboard riêng |

Sáu phân khúc khách hàng đều có dữ liệu: VIP (5), thân thiết (3), tiềm năng (4), có nguy cơ rời bỏ (4), mới (4), chưa mua (4). Số lượng và phân khúc sẽ thay đổi khi tiếp tục sử dụng website.

Đơn hàng lúc khởi tạo: 50 đã giao, 2 đã xác nhận, 6 đang xử lý, 2 sẵn sàng giao, 2 đang giao, 2 chờ thanh toán, 4 đã hủy, 2 hoàn hàng và 2 hoàn tiền. Hai phiếu vận chuyển có tình huống giao thất bại để thử điều phối lại.

Kho mẫu tách biệt với hai kho có sẵn. Số lượng giữ hàng khớp reservation, hàng đã xuất có bút toán giảm tồn, hàng hoàn sau xuất kho chưa tự động nhập lại. Các khoản tiền dùng VND nguyên theo quy ước của dự án.

## Các màn hình nên thử

1. [Tổng quan quản trị](http://localhost:8788/admin): doanh thu, đơn hàng và cảnh báo tồn kho.
2. [Đơn hàng](http://localhost:8788/admin/don-hang): tìm `NET-DEMO-`, lọc trạng thái và mở chi tiết.
3. [Khách hàng](http://localhost:8788/admin/khach-hang): lọc sáu phân khúc và xem lịch sử mua.
4. [Vận chuyển](http://localhost:8788/admin/van-chuyen): thử các phiếu đang xử lý hoặc sẵn sàng giao.
5. [Tồn kho](http://localhost:8788/admin/ton-kho): xem kho `HCM-DEMO`, cảnh báo nhập hàng và lịch sử biến động.
6. [Trợ lý cửa hàng](http://localhost:8788/admin/ai): hỏi “Tóm tắt doanh thu và đơn hàng”, “SKU nào sắp hết hàng?”; mở dashboard **Kinh doanh 30 ngày** hoặc **Bán chạy và nhập hàng** bằng tài khoản mẫu tương ứng.
7. Đăng nhập khách hàng để xem đơn, địa chỉ, yêu thích và thử tư vấn sản phẩm. Giỏ hàng được tạo khi thêm sản phẩm trong phiên trình duyệt.

Mã giảm giá để thử:

| Mã | Điều kiện |
| --- | --- |
| `DEMO10` | Giảm 10%, tối đa 150.000đ, đơn từ 500.000đ |
| `DEMO100` | Giảm 100.000đ, đơn từ 999.000đ |
| `DEMOSHIP` | Miễn phí vận chuyển |
| `DEMOHE` | Đã hết hạn, dùng kiểm tra thông báo từ chối mã |

Đơn chờ thanh toán có thời hạn giữ hàng 2 giờ, sẽ hết hạn theo tác vụ nền của ứng dụng. Dashboard 7/30/90 ngày tính theo thời điểm mở nên số liệu thay đổi theo thời gian.

## Chạy lại và kiểm tra

Yêu cầu Node.js 18 trở lên, Docker, backend đã chạy các migration và có catalog.

Từ thư mục gốc repository:

```powershell
node platform/backend/scripts/seed-demo.mjs --project net-pj1-java --context default
```

Script yêu cầu chỉ định Compose project, kiểm tra môi trường local và tự sao lưu PostgreSQL vào `platform/work/demo-data/before-demo-<timestamp>.sql` trước lần nạp đầu tiên. Thư mục này được Git bỏ qua. Bản sao lưu chứa toàn bộ database trước khi nạp.

Toàn bộ dữ liệu mẫu được ghi trong một transaction. Các ID bắt đầu bằng `demo-v1-`; khóa giao dịch và dấu mốc `demo-v1-seeded` ngăn nạp trùng, kể cả hai lần chạy đồng thời. Nếu dữ liệu đã tồn tại, script chỉ kiểm tra, không đặt lại mật khẩu, ngày tháng hoặc thay đổi người dùng đã thao tác trên dữ liệu mẫu.

Chỉ kiểm tra tính nhất quán:

```powershell
node platform/backend/scripts/seed-demo.mjs --project net-pj1-java --context default --verify
```

Script không nằm trong Flyway và không tự chạy khi khởi động ứng dụng. Không cần rebuild frontend/backend để thấy dữ liệu; tải lại trang là đủ.

## Kết quả kiểm tra ngày 29/10/2026

- Kiểm tra dữ liệu: đạt; tổng đơn, thanh toán, chiết khấu, tồn kho, giữ hàng và chi tiết vận chuyển khớp nhau.
- Chạy script lần hai: không tạo thêm dữ liệu hoặc đổi mật khẩu.
- Đăng nhập thành công cả bốn vai trò; các API quản trị, hồ sơ khách hàng, đơn cá nhân, yêu thích, tư vấn và dashboard có dữ liệu.
- Năm trang quản trị trả HTTP 200. Tổng cộng 34 kiểm tra API/trang: 33 đúng kỳ vọng, 1 lỗi có sẵn ở phản hồi từ chối quyền.
- Tài khoản nhân viên gọi `/api/commerce/admin/metrics` bị chặn nhưng nhận HTTP 500 thay vì 403: `AuthorizationDeniedException` đang bị xử lý bởi nhánh lỗi tổng quát. Không có dữ liệu KPI trả về. Việc nạp dữ liệu không sửa mã xử lý lỗi này.
- Báo cáo 30 ngày tại thời điểm kiểm tra: 43 đơn, 25 đơn được tính doanh thu, doanh thu 43.690.000đ, 42 sản phẩm bán ra. Đây là số liệu giả lập, không có chuyển tiền hoặc liên hệ đơn vị vận chuyển.

Bằng chứng kiểm tra local nằm trong `platform/work/demo-data/api-check-results.json`.
