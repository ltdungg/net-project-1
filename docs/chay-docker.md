# Chạy NÉT Fashion bằng Docker

## Yêu cầu

- Docker Engine hoặc Docker Desktop đang chạy, có Docker Compose v2.
- Node.js 22 trở lên để chạy script seed và smoke test.
- Cổng 8787 (website) và 8080 (API) còn trống.
- Chạy các lệnh bên dưới tại thư mục gốc repository, nơi có `compose.yaml`.

## Khởi động lần đầu

```bash
docker compose up --build -d --wait --wait-timeout 240
node platform/backend/scripts/seed-demo.mjs --project net-commerce-demo --context default
docker compose ps
```

Lần đầu cần mạng để tải image và dependency. Build chạy kiểm tra frontend và
backend trước khi tạo image. Bốn service gồm `commerce`, `api`, `postgres`,
`redis`. API tự chạy Flyway; seed chạy riêng sau khi API sẵn sàng.

Cấu hình này dùng project `net-commerce-demo`, giao tiếp nội bộ qua `http://api:8080`
nên chạy được cả Linux và Docker Desktop, không phụ thuộc `host.docker.internal`.
Không cần sao chép `.env`. Cấu hình frontend local ở
`platform/ops/docker-demo.env`; cấu hình backend kế thừa
`platform/backend/docker-compose.yml`. Không chạy đồng thời các stack Compose
cũ trong `platform/` hoặc `platform/backend/` nếu chúng sử dụng cùng cổng.

Nếu dùng Docker context khác `default`, dùng cùng context cho cả `docker --context
<context> compose ...` và tham số `--context <context>` của script seed.

## Truy cập và đăng nhập

- Website: http://localhost:8787
- Đăng nhập: http://localhost:8787/dang-nhap
- Quản trị: http://localhost:8787/admin
- Kiểm tra API: http://localhost:8080/actuator/health

Mật khẩu chung: **`NetDemo2026!`**.

| Vai trò | Email |
| --- | --- |
| Quản trị | `demo.admin@example.test` |
| Quản lý | `demo.manager@example.test` |
| Nhân viên | `demo.staff@example.test` |
| Khách hàng | `customer01@example.test` đến `customer96@example.test` |

## Dữ liệu mẫu

Bộ seed mới có 96 khách hàng tên tiếng Việt, 3 nhân sự, 279 đơn hàng,
279 phiếu vận chuyển và 284 lượt yêu thích, dùng catalog hiện có.
Dữ liệu hoàn toàn giả lập, email dùng miền `example.test`, vận đơn không gọi
đến hãng vận chuyển và không phát sinh giao dịch tiền thật.

Khách có tần suất mua khác nhau, từ chưa mua, một lần đến quay lại nhiều lần;
đơn trải trong khoảng 5 tháng trước thời điểm nạp. Việc chọn hàng có ưu tiên
size, số món khác nhau, ghi chú nhận hàng và số lượt yêu thích khác nhau.
Lịch sử giao hàng kéo dài khoảng 2–3 ngày, có giao lại, hủy, trả hàng và hoàn tiền.
Có COD, thanh toán online giả lập, voucher, 6 tình huống tồn kho thấp và 4
dashboard lưu sẵn. Các tình huống đơn đang xử lý giúp thử thao tác vận hành.

Mở trang quản trị để xem báo cáo, khách hàng, đơn hàng, vận chuyển và kho
`HCM-DEMO`. Mã thử: `DEMO10`, `DEMO100`, `DEMOSHIP`; `DEMOHE` đã hết hạn.
Giỏ hàng được tạo khi người dùng thêm sản phẩm trong trình duyệt.

Script sao lưu database trước lần nạp vào `platform/work/demo-data/` rồi ghi
trong một transaction. Chạy lại không tạo trùng, không đặt lại mật khẩu hoặc
ghi đè thay đổi của người dùng. Database đã có bộ seed cũ sẽ được giữ nguyên,
không tự chuyển thành bộ 96 khách. Ngày đơn hàng không tự dịch chuyển khi
khởi động lại; các đơn chờ thanh toán hết hạn theo tác vụ nền.

## Kiểm tra

```bash
node platform/backend/scripts/seed-demo.mjs --project net-commerce-demo --verify
node platform/ops/smoke-test.mjs
docker compose ps
```

Seed kiểm tra tổng tiền đơn, thanh toán, chiết khấu, tồn kho, giữ hàng, liên kết
vận chuyển và thứ tự thời gian trước khi commit. `--verify` kiểm tra dữ liệu
hiện tại; dữ liệu đã thao tác có thể khác fixture ban đầu.

Kết quả chạy ngày 14/11/2026:

- Cả 4 container healthy; 4 smoke test website/BFF/catalog đạt.
- 22 kiểm tra đăng nhập, API và trang quản trị đạt cho cả 4 vai trò.
- Seed và chạy lại seed đều đạt kiểm tra nhất quán, không tạo trùng.
- Frontend: typecheck, lint, 15 test và build đạt.
- Backend build thành công: 94 test chạy đạt, 23 test bị skip trong Docker
  build (không có Docker socket cho Testcontainers). Đây không phải kết quả
  đã chạy đầy đủ nhóm integration; kiểm tra seed và API ở trên chạy trực tiếp
  với PostgreSQL/Redis của stack đang hoạt động.
- Báo cáo 30 ngày tại thời điểm kiểm tra: 73 đơn, 55 đơn tính doanh thu,
  doanh thu giả lập 90.088.000đ và 88 sản phẩm bán ra.

Bằng chứng API local: `platform/work/demo-data/api-check-results.json`.

## Chạy lại, xem log và dừng

```bash
# Khởi động lại với image đã build
docker compose up -d --wait

# Xem log gần nhất
docker compose logs --tail 100 api commerce

# Theo dõi log liên tục; Ctrl+C để thoát
docker compose logs -f api commerce

# Dừng, giữ nguyên database và ảnh upload
docker compose down
```

Sau khi sửa mã nguồn, chạy lại lệnh `docker compose up --build -d --wait`.
Không dùng `down -v` khi muốn giữ dữ liệu: tùy chọn này xóa các volume của stack.
Nếu không kết nối được daemon, khởi động Docker và kiểm tra `docker context ls`.
Nếu service chưa healthy, xem log trước khi chạy seed.
