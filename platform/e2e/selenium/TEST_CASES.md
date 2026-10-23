# Bảng test case Selenium

Chạy lúc 22:51:09 22/10/2026 (Asia/Ho_Chi_Minh). 68 PASS / 2 FAIL / 0 không chọn hoặc bỏ qua. Exit code: 1.

| ID | Tên | Các bước | Kết quả mong đợi | Trạng thái chạy thử |
| --- | --- | --- | --- | --- |
| ACC-001 | Hồ sơ cập nhật và giữ email chỉ đọc | Thành viên mở hồ sơ; đổi tên; lưu; tải lại | Tên mới được lưu; email chỉ đọc và không đổi | PASS |
| ACC-002 | Hồ sơ từ chối tên rỗng | Xóa tên trong hồ sơ; lưu | Chặn tên rỗng, DB giữ tên cũ | PASS |
| ACC-003 | Thêm sửa xóa địa chỉ mặc định | Thêm địa chỉ đầu; sửa đường; xác nhận xóa | Địa chỉ mặc định được tạo, sửa và xóa khỏi DB | PASS |
| ACC-004 | Địa chỉ thiếu thông tin bắt buộc | Thêm địa chỉ; bỏ trống đường; lưu | HTML validation chặn, dialog còn mở | PASS |
| ACC-005 | Hủy xóa giữ nguyên địa chỉ | Thêm địa chỉ; chọn xóa rồi hủy; tải lại | Địa chỉ vẫn tồn tại | PASS |
| ACC-006 | Địa chỉ mặc định tự điền checkout | Lưu địa chỉ mặc định; thêm hàng; mở checkout | Tự điền đường, email, điện thoại và quận | PASS |
| ACC-007 | Lịch sử của thành viên mới trống | Thành viên mới mở lịch sử | Hiện Chưa có đơn hàng | PASS |
| ADM-001 | Admin yêu cầu đăng nhập | Khách chưa đăng nhập mở tồn kho admin | Chuyển đến đăng nhập | PASS |
| ADM-002 | Khách hàng không có quyền quản trị | Khách hàng đăng nhập mở tồn kho admin | Chuyển về tài khoản; không vào admin | PASS |
| ADM-003 | Điều chỉnh tồn kho phản ánh ra storefront | Admin lọc SKU riêng; điều chỉnh +1 có lý do; xem sản phẩm | DB và storefront tăng tồn từ 12 lên 13 | PASS |
| ADM-004 | Điều chỉnh âm vượt tồn kho bị từ chối | Admin điều chỉnh -9999 cho SKU riêng | Báo nghiệp vụ không được ghi nhận; tồn giữ nguyên | PASS |
| ADM-005 | Điều chỉnh không có lý do bị chặn | Admin điều chỉnh +1 nhưng thiếu lý do | HTML validation chặn; tồn giữ nguyên | PASS |
| ADM-006 | Copilot trả lời câu hỏi tồn kho | Admin hỏi Copilot về tồn kho | Trả kết quả tồn kho và liên kết quản lý | PASS |
| ADM-007 | Copilot không gửi câu hỏi chỉ có khoảng trắng | Nhập câu hỏi chỉ có khoảng trắng | Nút gửi bị vô hiệu hóa | PASS |
| ADM-008 | Copilot câu ngoài chủ đề trả tổng quan | Hỏi Copilot về thời tiết | Rule engine trả Tóm tắt điều hành | PASS |
| ADM-009 | Tạo sản phẩm active qua UI | Admin tạo sản phẩm active, SKU và tồn 2 | Storefront hiển thị đúng sản phẩm và tồn | PASS |
| ADM-010 | Tạo sản phẩm với giá âm bị chặn | Admin tạo sản phẩm giá -1 | HTML validation chặn, DB không có sản phẩm | PASS |
| ADM-011 | Tạo bản nháp không xuất hiện storefront | Admin tạo sản phẩm draft; tìm ở storefront | DB lưu draft; storefront không tìm thấy | PASS |
| ADM-012 | Giao hàng cần vận đơn và COD trả tiền khi giao xong | Tạo đơn COD riêng; chuẩn bị; sẵn sàng; giao thiếu vận đơn; bổ sung; giao và hoàn tất | Thiếu vận đơn bị từ chối; giao xong COD paid, tồn giảm 1 và reserved=0 | PASS |
| AUTH-001 | Đăng ký và xác minh qua UI | Đăng ký email riêng; mở liên kết xác minh local; xác minh; mở tài khoản | Tài khoản active, email_verified_at có giá trị và UI đăng nhập | PASS |
| AUTH-002 | Từ chối email đã đăng ký | Tạo tài khoản; đăng ký lại cùng email | Hiện Email đã được sử dụng. | PASS |
| AUTH-003 | Mật khẩu xác nhận không khớp | Nhập mật khẩu và xác nhận khác nhau; gửi | Hiện Mật khẩu xác nhận chưa khớp. | PASS |
| AUTH-004 | Mật khẩu yếu bị HTML validation chặn | Đăng ký với mật khẩu weak | HTML validation chặn, vẫn ở trang đăng ký | PASS |
| AUTH-005 | Chưa đồng ý điều khoản | Điền hợp lệ nhưng bỏ đồng ý điều khoản; gửi | Checkbox thiếu giá trị, không đăng ký | PASS |
| AUTH-006 | Email sai định dạng khi đăng ký | Nhập email sai định dạng; gửi | Email không hợp lệ theo HTML validation | PASS |
| AUTH-007 | Đăng nhập và đăng xuất | Tạo thành viên đã xác minh; đăng nhập; đăng xuất; mở lịch sử | Vào tài khoản; sau logout lịch sử yêu cầu đăng nhập | PASS |
| AUTH-008 | Đăng nhập sai mật khẩu | Đăng nhập tài khoản riêng với mật khẩu sai | Hiện Email hoặc mật khẩu không đúng. | PASS |
| AUTH-009 | Chặn đăng nhập tài khoản chưa xác minh | Tạo thành viên pending; đăng nhập | Yêu cầu xác minh email và có liên kết gửi lại | PASS |
| AUTH-010 | Hiện và ẩn mật khẩu | Nhập mật khẩu; bấm hiện; bấm ẩn | Kiểu input đổi text rồi password | PASS |
| AUTH-011 | Không chuyển hướng ra ngoài từ returnTo | Đăng nhập với returnTo=//example.invalid | Chỉ điều hướng đến tài khoản trong origin local | PASS |
| AUTH-012 | Token xác minh chỉ dùng một lần | Xác minh token; logout; dùng lại token | Lần đầu thành công, lần hai báo token không hợp lệ | PASS |
| AUTH-013 | Quên và đặt lại mật khẩu qua UI | Quên mật khẩu; mở link local; đổi; thử mật khẩu cũ và mới | Mật khẩu cũ bị từ chối, mới đăng nhập được | PASS |
| AUTH-014 | Quên mật khẩu với email chưa tồn tại | Quên mật khẩu bằng email chưa tồn tại | Phản hồi chung, không tiết lộ tài khoản | PASS |
| AUTH-015 | Token reset không hợp lệ | Nhập token reset sai và mật khẩu hợp lệ | Hiện liên kết reset không hợp lệ hoặc hết hạn | PASS |
| CART-001 | Giỏ hàng mới trống | Mở giỏ mới; tiếp tục mua sắm | Giỏ trống và điều hướng tới danh mục | PASS |
| CART-002 | Thêm sản phẩm và lưu giỏ khi tải lại | Thêm sản phẩm 790000; tải lại giỏ | Một sản phẩm, tổng 825000 và giữ giỏ | PASS |
| CART-003 | Tăng giảm số lượng cập nhật tổng và phí ship | Tăng 1 lên 2 rồi giảm về 1 | Tổng 1580000 miễn ship rồi 825000 có ship | PASS |
| CART-004 | Giảm ở số lượng một không xóa sản phẩm | Bấm giảm khi số lượng bằng 1 | Giữ 1, tổng 825000 | PASS |
| CART-005 | Xóa sản phẩm cuối cùng | Xóa sản phẩm cuối | Hiện Giỏ hàng đang trống | PASS |
| CART-006 | Vượt tồn kho phải báo lỗi và giữ số lượng | Tạo SKU tồn 1; thêm 1; tăng thêm | Báo lỗi không đủ tồn, UI và DB giữ số lượng 1 | FAIL |
| CART-007 | Áp voucher phần trăm và gỡ mã | Áp mã phần trăm bằng chữ thường; gỡ | Chuẩn hóa mã, tổng 746000; gỡ về 825000 | PASS |
| CART-008 | Voucher không tồn tại | Áp mã không tồn tại | Báo mã không hợp lệ, tổng không đổi | PASS |
| CART-009 | Voucher chưa đạt đơn tối thiểu | Áp mã yêu cầu đơn từ 1500000 cho giỏ 790000 | Báo chưa đạt tối thiểu, tổng không đổi | PASS |
| CART-010 | Voucher hết hạn | Áp mã đã hết hạn theo đồng hồ database | Báo mã không hợp lệ hoặc hết hạn | PASS |
| CART-011 | Voucher chạm trần giảm giá | Giỏ 1580000; áp mã 10% có trần 150000 | Giảm đúng 150000; tổng 1430000 | PASS |
| CART-012 | Voucher miễn phí giao hàng | Giỏ 790000; áp mã freeship | Miễn phí ship, tổng 790000 | PASS |
| CART-013 | Mốc miễn phí giao hàng đúng 799000 | Tạo sản phẩm giá đúng 799000; thêm giỏ | Tổng 799000, miễn ship ở đúng ngưỡng | PASS |
| CAT-001 | Tìm sản phẩm theo chất liệu | Mở danh mục; tìm linen | Có sản phẩm phù hợp và tiêu đề tìm kiếm | PASS |
| CAT-002 | Từ khóa không có kết quả | Tìm từ khóa không tồn tại; mở tất cả | Empty state rồi danh mục có sản phẩm | PASS |
| CAT-003 | Tìm kiếm bỏ khoảng trắng và không phân biệt hoa thường | Tìm LINEN với khoảng trắng hai đầu | Bỏ khoảng trắng, tìm không phân biệt hoa thường | PASS |
| CAT-004 | Lọc danh mục và giá rồi đặt lại | Chọn Nữ và giá dưới 800000; áp dụng; đặt lại | Sản phẩm đúng khoảng giá; đặt lại bỏ query | PASS |
| CAT-005 | Sắp xếp giá tăng và giảm | Chọn giá tăng rồi giá giảm; đọc giá từng card | Danh sách giá đơn điệu theo chiều chọn | PASS |
| CAT-006 | Chi tiết sản phẩm và size có tồn kho | Mở sản phẩm riêng; chọn S rồi M; kiểm tra L | S còn 12, M còn 1, L hết hàng bị vô hiệu hóa | PASS |
| CAT-007 | Số lượng sản phẩm có biên 1 và 10 | Giảm ở 1; tăng đến 10; tăng thêm; thêm giỏ | Số lượng nằm trong 1..10; giỏ nhận đúng 10 | PASS |
| CAT-008 | Không cho mua sản phẩm hết hàng | Mở sản phẩm có S và L hết hàng | S bị khóa; biến thể mặc định hết hàng không thêm được | PASS |
| CAT-009 | Slug không tồn tại trả trang 404 | Mở slug ngẫu nhiên không tồn tại | Trang 404, không có điều khiển số lượng | PASS |
| CAT-010 | Mua ngay mở checkout đúng sản phẩm | Mở sản phẩm riêng; chọn S; mua ngay | Checkout chứa đúng sản phẩm | PASS |
| ORDER-001 | Khách đặt COD và theo dõi đơn | Khách thêm hàng; điền địa chỉ; COD; theo dõi | Một đơn confirmed/cod_pending tổng 825000; giữ tồn 1 | PASS |
| ORDER-002 | Checkout thành viên hiện trong lịch sử | Thành viên checkout; mở lịch sử | Đơn gắn đúng user_id và có trong lịch sử | PASS |
| ORDER-003 | Checkout thiếu họ tên | Checkout hợp lệ; xóa họ tên; gửi | HTML validation chặn; DB không có đơn | PASS |
| ORDER-004 | Checkout số điện thoại sai định dạng | Checkout với số điện thoại abc123 | API/UI báo dữ liệu không hợp lệ; không tạo đơn | PASS |
| ORDER-005 | Không đặt đơn từ giỏ trống | Mở checkout với giỏ mới trống | Nút đặt hàng bị vô hiệu hóa; không tạo đơn | PASS |
| ORDER-006 | Thanh toán online mô phỏng thành công | Thành viên chọn online; tạo đơn; mô phỏng trả tiền | UI báo thành công; payment_status=paid | PASS |
| ORDER-007 | Phiên mới không xem được đơn khách | Khách tạo đơn; xóa sessionStorage mô phỏng phiên khác; mở đơn | Hiện Không thể mở đơn hàng | PASS |
| ORDER-008 | Hết tồn sau khi mở checkout không tạo đơn | Mở checkout; fixture chuyển tồn riêng về 0; đặt | Báo thiếu tồn khả dụng, DB không tạo đơn | PASS |
| ORDER-009 | Đơn voucher giữ đúng giá trị giảm | Áp voucher 10%; khách checkout COD | DB lưu subtotal 790000, giảm 79000, ship 35000, tổng 746000 | PASS |
| ORDER-010 | Khách có token checkout mở được cổng online | Khách chọn online; giữ token phiên; mở cổng và trả tiền | Khách có quyền thanh toán đơn của mình; DB paid | FAIL |
| WISH-001 | Yêu thích khách lưu qua tải lại và xóa được | Khách thêm yêu thích; mở danh sách; gỡ; tải lại | Lưu qua tải trang, gỡ xong danh sách trống | PASS |
| WISH-002 | Yêu thích thành viên lưu trong database | Thành viên yêu thích sản phẩm; mở danh sách | Có một sản phẩm, wishlist_items gắn đúng user | PASS |
| WISH-003 | Yêu thích mới trống và không có nút bỏ yêu thích | Mở danh sách trong trình duyệt mới | Empty state; không có nút Bỏ yêu thích | PASS |
