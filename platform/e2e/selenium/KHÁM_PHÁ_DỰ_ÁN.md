# Khám phá dự án trước khi viết Selenium

Khảo sát ngày 22/10/2026. Không thay đổi source nghiệp vụ.

## Kiến trúc và cách chạy

- Frontend: TypeScript, React 19, Vinext/Vite, Tailwind, Base UI. `platform/package.json` quy định Node >=22.13.0.
- BFF: `app/api/commerce/[...path]/route.ts`, chuyển tiếp tới Java; các API D1 cũ không phải backend chính của UI hiện tại.
- Backend: Java 21, Spring Boot, Maven, PostgreSQL 17/Flyway V1–V7, Redis 7.4.
- Local thông thường: frontend `8787`, Java `8080`. Docker frontend đọc `.env`; chạy trực tiếp cần API URL `127.0.0.1` thay vì `host.docker.internal`.
- E2E đã có: Compose project `net-commerce-e2e`, frontend `18787`, API `18080`, PostgreSQL `55432`, DB `net_commerce_e2e`. Selenium bổ sung port Redis `56379` chỉ trên loopback để quản lý cache catalog của fixture.
- Unit frontend: Vitest trong `platform/tests`; browser E2E: Playwright trong `platform/e2e`; backend test trong `backend/src/test`. Không có cấu hình Python/Poetry/Pipenv để chuyển đổi.
- Quyết định: tái sử dụng TypeScript, Vitest, thư mục E2E và helper DB đã có; thêm Selenium 4 dưới `e2e/selenium`. Không thay thế Playwright, không tạo framework Python thứ hai.

## Các route thực tế

| Nhóm | Route | Chức năng |
| --- | --- | --- |
| Storefront | `/`, `/san-pham`, `/san-pham/[slug]` | Catalog, tìm tên/chất liệu, danh mục, giá, size, mới/ưu đãi, sắp xếp, tồn kho |
| Nội dung | `/cau-chuyen`, `/huong-dan-chon-size` | Nội dung giới thiệu và size |
| Danh sách | `/yeu-thich`, `/gio-hang` | Yêu thích khách/member; giỏ, số lượng, tổng tiền, voucher |
| Auth | `/dang-ky`, `/xac-minh-email`, `/dang-nhap`, `/quen-mat-khau`, `/dat-lai-mat-khau` | Vòng đời tài khoản email/password |
| Thành viên | `/tai-khoan`, `/tai-khoan/ho-so`, `/tai-khoan/dia-chi`, `/tai-khoan/don-hang` | Hồ sơ, địa chỉ, lịch sử |
| Checkout | `/thanh-toan`, `/thanh-toan/[id]`, `/don-hang/[id]` | COD, online mock local, theo dõi đơn có kiểm tra quyền |
| Admin | `/admin`, `/admin/san-pham`, `/admin/san-pham/moi` | Dashboard, danh mục, tạo sản phẩm |
| Vận hành | `/admin/don-hang`, `/admin/don-hang/[id]`, `/admin/ton-kho`, `/admin/van-chuyen`, `/admin/van-chuyen/[id]` | Trạng thái đơn, nhập/chuyển/kiểm kê/điều chỉnh kho, vận chuyển |
| CRM và quản trị | `/admin/khach-hang`, `/admin/khach-hang/[id]`, `/admin/khuyen-mai`, `/admin/bao-cao`, `/admin/tai-chinh`, `/admin/cai-dat`, `/admin/ai` | Khách hàng/phân khúc, promotion, báo cáo, tài chính, cài đặt, Copilot theo luật |
| Alias | `/quan-ly` | Điểm vào quản trị |

## Quy tắc lấy từ source

- Auth: password 8–72 ký tự, có hoa/thường/số; backend giới hạn thêm 72 byte. Họ tên 2–100 ký tự. Điện thoại theo `^(0|\+84)[0-9]{9,10}$`. Phải chấp nhận điều khoản.
- Đăng ký tạo trạng thái pending; token xác minh có hạn 24 giờ, reset 30 phút, dùng một lần. Local trả token development; không cần dịch vụ email thật. Có rate limit Redis.
- Sai password: `Email hoặc mật khẩu không đúng.`; email trùng: `Email đã được sử dụng.`; xác nhận password sai: `Mật khẩu xác nhận chưa khớp.`
- Catalog tìm trên tên, subtitle, material, category; trim và chuyển chữ thường tiếng Việt. Material có thể không xuất hiện trên card, nên test đối chiếu metadata DB thay vì đoán từ tên hiển thị.
- Catalog giá: dưới 800000; 800000–1200000 gồm hai biên; trên 1200000. Size lọc theo biến thể còn tồn. Sort theo giá tăng/giảm, đánh giá hoặc nổi bật.
- Số lượng cart 1–10; kiểm tra tồn backend. Ship 35000 nếu subtotal <799000; từ đúng 799000 miễn ship.
- Voucher có thời hạn, trạng thái, mức đơn tối thiểu, hạn mức sử dụng, mức giảm tối đa. `CHAONET`: 10%, đơn từ 599000, trần 150000. `NET20`: 20%, từ 1500000, trần 300000. `FREESHIP`: từ 399000.
- Checkout có idempotency key, giữ tồn; mỗi kho sinh một fulfillment. Shipped mới trừ on_hand, delivered tất cả kiện mới đánh dấu COD paid.
- Theo dõi khách cần token trong đúng phiên checkout. Backend nhận `X-Guest-Order-Token`; online mock chỉ dành cho local.
- Admin layout cần staff/manager/admin. Khách chưa đăng nhập về login; customer về tài khoản. Điều chỉnh tồn cần lý do; giao hàng cần carrier và tracking.
- Copilot là rule engine chỉ đọc. Câu ngoài chủ đề hiện trả tổng quan, không trả thông báo unsupported.

## Seed và dữ liệu độc lập

Migration V2/V6 tạo catalog (README mô tả 22 sản phẩm, 58 biến thể), hai kho, roles và voucher; không có mật khẩu tài khoản seed dùng chung đáng tin cậy. Admin local thông thường có thể bootstrap qua email trong ADMIN_EMAILS. Bộ Selenium không dùng tài khoản đó.

Mỗi test có namespace `sel<UUID>`, email `@example.test`, mật khẩu ngẫu nhiên hoặc biến môi trường. Account tạo qua API thật; fixture đánh dấu verified bằng DB cho các test không kiểm thử xác minh; test xác minh vẫn đi UI thật. Admin fixture gán role trong DB E2E riêng. Sản phẩm có ba size, tồn S=12/M=1/L=0; giá và voucher nằm trong `data/scenarios.json`. Voucher riêng có hạn tương đối theo đồng hồ DB nên không phụ thuộc ngày seed.

Teardown xóa theo UUID/email/cart token sở hữu, đúng thứ tự FK, gồm đơn/payment/fulfillment/reservation/movement/cart/user/product/promotion/audit/outbox. Không TRUNCATE, không hoàn lại tồn seed và không dùng tài khoản chung. Chỉ xóa cache `catalog::active`, không FLUSHDB và không vô hiệu hóa rate limit.

## Phạm vi 70 test

| Nhóm | Số ca | Trọng tâm |
| --- | ---: | --- |
| Auth | 15 | Happy path, email/password sai, terms, token một lần, redirect |
| Catalog/chi tiết | 10 | Search/filter/sort, empty, 404, tồn và số lượng 1/10 |
| Cart/voucher | 13 | CRUD, tổng/ship, mã sai/hết hạn/tối thiểu/trần |
| Checkout/đơn | 10 | COD, member, online khách/member, validation, thiếu tồn, quyền xem |
| Hồ sơ/địa chỉ/lịch sử trống | 7 | Lưu/sửa/xóa/hủy, validation, tự điền |
| Yêu thích | 3 | Khách/member, persist, empty, remove |
| Admin | 12 | Quyền, sản phẩm active/draft/giá sai, tồn kho, Copilot, fulfillment COD |

Chưa bao phủ đầy đủ quản trị promotion, phân khúc, báo cáo/tài chính, upload, chuyển kho/kiểm kê/nhập kho, mọi chuyển trạng thái fulfillment và biến thể đa kho. Không có test merchant, hãng giao hàng hay email provider thật vì dự án chưa tích hợp chúng. Không tính unit/API test cũ vào số Selenium trên.

Locator và danh sách đề xuất data-testid nằm trong HƯỚNG_DẪN_CHẠY_TEST.md. Bảng ca cụ thể và kết quả chạy nằm trong TEST_CASES.md.
