# NÉT Commerce Platform

Dự án đồ án website bán quần áo online gồm storefront, tài khoản khách hàng,
checkout, quản trị, phân khúc khách hàng, tồn kho đa kho, vận chuyển và Copilot
quản trị theo luật.

Baseline kế hoạch là 8 tuần (4 sprint × 2 tuần) với đúng 5 người: PM kiêm
PO/BA/UAT, một Frontend, hai Backend và một DevOps. Backend 1 chủ trì auth,
catalog/customer/order/report; Backend 2 chủ trì inventory/payment/fulfillment;
DevOps chủ trì Docker/CI/health/runbook. Chi tiết nằm trong
[`docs/pm`](../docs/pm/01-project-charter.md).

## Kiến trúc đang sử dụng

```text
Trình duyệt :8787
  └─ Vinext/React + BFF /api/commerce/**
       └─ Java 21 / Spring Boot :8080
            ├─ PostgreSQL 17 (nghiệp vụ + Flyway)
            ├─ Redis 7 (cache + rate limit)
            └─ Volume uploads
```

Frontend chỉ gọi API cùng origin qua `/api/commerce/**`. BFF chuyển cookie,
correlation ID, idempotency key và webhook signature sang Spring Boot; đồng thời
kiểm tra Origin cho request thay đổi dữ liệu. PostgreSQL là nguồn dữ liệu nghiệp
vụ chính. Các route D1 cũ còn trong mã nguồn chỉ phục vụ tương thích với prototype
và không còn được giao diện hiện tại sử dụng.

## Chức năng chính

- 22 sản phẩm, 58 biến thể; lọc/tìm kiếm, chi tiết, yêu thích và ảnh media.
- Đăng ký email/password, xác minh email một lần, đăng nhập, refresh-token
  rotation, đăng xuất, quên/đặt lại mật khẩu và giới hạn tần suất.
- Hồ sơ thành viên, sổ địa chỉ, tự điền địa chỉ checkout và lịch sử đơn hàng.
- Khách vãng lai theo dõi đơn trong đúng phiên checkout bằng token ký số có hạn
  bảy ngày; token được gửi qua header thay vì URL.
- Giỏ hàng khách/thành viên, voucher, COD/online, idempotent checkout và giữ tồn.
- Quản trị khách hàng 360°: tìm kiếm, trạng thái tài khoản, địa chỉ, lịch sử mua
  hàng và sáu phân khúc tự động `new`, `potential`, `loyal`, `vip`, `at_risk`,
  `prospect` dựa trên dữ liệu đơn đã thanh toán.
- Vận chuyển đa kho: mỗi đơn tự sinh một kiện cho từng kho xuất hàng; quản lý
  hãng vận chuyển, mã vận đơn, ETA, chi phí, lịch sử trạng thái và khóa phiên bản
  để tránh hai nhân viên ghi đè nhau.
- Admin/manager: catalog, đơn hàng, khách hàng, vận chuyển, promotion, báo cáo,
  tài chính, inventory đa kho, upload và Copilot quản trị. Copilot hiện là bộ
  phân loại câu hỏi/tổng hợp dữ liệu theo luật, không gọi LLM bên ngoài và không
  tự thay đổi dữ liệu.
- Docker multi-stage, non-root runtime, healthcheck xuyên frontend–backend,
  Flyway, persistent volumes và smoke test.

Luồng tồn kho và vận chuyển được nối liền: checkout giữ tồn, chuyển kiện sang
`shipped` mới xuất kho, hủy trước khi giao sẽ nhả phần giữ tồn tương ứng. Đơn COD
chỉ được ghi nhận thanh toán khi tất cả kiện đã giao. Hàng hoàn không tự cộng lại
tồn bán được; nhân viên kho phải kiểm định rồi lập phiếu nhập/điều chỉnh.

## How to run bằng Docker

Yêu cầu: Docker Desktop đang chạy với Linux containers. Luôn khởi động backend
trước frontend.

### 1. Backend Java

Mở PowerShell tại thư mục `platform`:

```powershell
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker --context default compose --env-file .env up --build -d --force-recreate
docker --context default compose ps
curl.exe -fsS http://localhost:8080/actuator/health
curl.exe -fsS http://localhost:8080/api/health
Set-Location ..
```

Flyway tự áp dụng migration khi API khởi động. Database hiện ở V7, gồm phân
khúc khách hàng và fulfillment đa kho. Không sửa file migration đã chạy; mọi
thay đổi schema tiếp theo phải tạo migration tiến mới, bắt đầu từ V8.

Nếu Docker không đọc được đường dẫn OneDrive có dấu, dùng junction ASCII trỏ
tới đúng thư mục (không sao chép dữ liệu):

```powershell
$BackendSource = (Resolve-Path .\backend).Path
$BackendDocker = Join-Path $env:LOCALAPPDATA 'Temp\net-commerce-backend-docker'
if (-not (Test-Path -LiteralPath $BackendDocker)) {
  New-Item -ItemType Junction -Path $BackendDocker -Target $BackendSource | Out-Null
}
Set-Location $BackendDocker
docker --context default compose --env-file .env up --build -d --force-recreate
```

Frontend cũng có thể chạy qua junction ASCII. Thực hiện khi Docker báo không tìm
thấy build context vì đường dẫn OneDrive có dấu:

```powershell
$FrontendSource = (Resolve-Path .).Path
$FrontendDocker = 'C:\docker-work\net-commerce-platform'
if (-not (Test-Path -LiteralPath (Split-Path $FrontendDocker))) {
  New-Item -ItemType Directory -Path (Split-Path $FrontendDocker) | Out-Null
}
if (-not (Test-Path -LiteralPath $FrontendDocker)) {
  New-Item -ItemType Junction -Path $FrontendDocker -Target $FrontendSource | Out-Null
}
Set-Location $FrontendDocker
```

Compose đã cố định tên project `net-commerce`, nên chạy từ đường dẫn thật hay
junction vẫn quản lý cùng một container/volume.

### 2. Frontend/BFF

Trở lại thư mục `platform`:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker --context default compose up --build -d --force-recreate
docker --context default compose ps
npm run test:smoke
```

Trong Docker, `COMMERCE_API_URL=http://host.docker.internal:8080` để BFF gọi API
Java trên máy host. Khi chạy frontend trực tiếp ngoài Docker, đổi giá trị này
thành `http://127.0.0.1:8080`.

### 3. Truy cập

- Storefront: http://localhost:8787
- Đăng ký: http://localhost:8787/dang-ky
- Đăng nhập: http://localhost:8787/dang-nhap
- Tài khoản: http://localhost:8787/tai-khoan
- Admin: http://localhost:8787/admin
- Phân khúc khách hàng: http://localhost:8787/admin/khach-hang
- Quản lý tồn kho: http://localhost:8787/admin/ton-kho
- Quản lý vận chuyển: http://localhost:8787/admin/van-chuyen
- Copilot quản trị: http://localhost:8787/admin/ai
- Health tích hợp: http://localhost:8787/api/health
- API Java: http://localhost:8080/api/health

## Tạo tài khoản và quyền admin local

`LOCAL_AUTH_BYPASS=false` theo mặc định, vì vậy local kiểm thử đúng luồng thật:

1. Mở `/dang-ky`, nhập email và mật khẩu (ít nhất 8 ký tự, có chữ hoa, chữ
   thường và số), rồi đồng ý điều khoản.
2. Môi trường `APP_ENV=local` trả development token an toàn cho trang xác minh;
   nhấn **Xác minh email**. Token dùng một lần và hết hạn sau 24 giờ.
3. Đăng nhập tại `/dang-nhap`.

Để bootstrap quản trị, đăng ký chính xác `owner@example.com`. Email này nằm trong
`ADMIN_EMAILS` nên sau khi xác minh sẽ có các role `customer`, `staff`, `manager`,
`admin`. `manager@example.com` nhận role manager theo `MANAGER_EMAILS`.

Không bật `LOCAL_AUTH_BYPASS` ngoài môi trường demo. Production phải nối dịch vụ
email để giao link xác minh/đặt lại mật khẩu; development token chỉ được trả khi
`APP_ENV=local`.

## Voucher demo

- `CHAONET`: giảm 10% cho đơn từ 599.000đ, tối đa 150.000đ.
- `NET20`: giảm 20% cho đơn từ 1.500.000đ, tối đa 300.000đ.
- `FREESHIP`: miễn phí giao hàng cho đơn từ 399.000đ.

## Kiểm thử

Frontend:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:smoke  # cần hai stack đang chạy
```

Backend (JDK 21 + Docker đang chạy để Testcontainers dùng PostgreSQL thật):

```powershell
Set-Location backend
$env:DOCKER_HOST='npipe:////./pipe/docker_engine'
mvn --batch-mode --no-transfer-progress clean verify
```

Nếu máy chưa cài JDK/Maven, có thể chạy toàn bộ test bằng image Maven. Thực hiện
từ thư mục `platform/backend`; `TESTCONTAINERS_HOST_OVERRIDE` giúp PostgreSQL test
kết nối đúng trên Docker Desktop:

```powershell
docker run --rm `
  -e TESTCONTAINERS_RYUK_DISABLED=true `
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v "${PWD}:/workspace" -w /workspace `
  maven:3.9.11-eclipse-temurin-21-alpine `
  mvn --batch-mode --no-transfer-progress clean test
```

Baseline được xác minh hiện tại gồm **69 kiểm thử backend** và **12 kiểm thử
frontend**. Frontend còn phải đạt typecheck/build; smoke test kiểm tra storefront,
health và catalog xuyên BFF. Các luồng admin có xác thực được kiểm tra trong bộ
test/UAT riêng, không nằm hết trong script smoke công khai.

## Giới hạn của bản đồ án

- Thanh toán online dùng mock confirm và webhook HMAC để kiểm thử vòng đời;
  chưa kết nối merchant/provider thật. Mock endpoint bị khóa ngoài `APP_ENV=local`.
- Vận chuyển là quy trình thủ công: nhân viên nhập carrier/tracking/ETA/chi phí
  và cập nhật trạng thái. Chưa có API/webhook hãng vận chuyển.
- Một đơn có thể có nhiều kiện theo kho, nhưng mỗi cặp order–warehouse chỉ có
  một fulfillment; chưa chia nhiều kiện trong cùng kho hoặc đối soát giao/hoàn
  một phần phức tạp.
- Hàng returned sau khi ship chờ kho kiểm định; chưa có workflow refund/return
  tự phục vụ hoặc command hoàn tiền đầy đủ.
- Transactional outbox mới được ghi trong cùng transaction; chưa có
  dispatcher/consumer. Email/SMS production chưa được nối.
- Copilot là rule engine read-only, không phải mô hình AI sinh nội dung và không
  được dùng để tự động phê duyệt/thay đổi nghiệp vụ.
- Docker Compose hiện phục vụ local/demo. Cloud/CDN, secret manager, centralized
  metrics/alert, pentest/load dài hạn và DR rehearsal production nằm ngoài scope.

## Vận hành Docker

```powershell
# Log frontend
docker --context default compose logs -f commerce

# Log backend (chạy trong platform/backend)
docker --context default compose logs -f api postgres redis

# Dừng frontend, không xóa volume
docker --context default compose down

# Dừng backend/PostgreSQL/Redis nhưng giữ volume (chạy tại platform/backend)
Set-Location backend
docker --context default compose down
```

Hai lệnh có cùng cú pháp nhưng phải chạy ở đúng hai thư mục. Chỉ dùng
`docker compose down -v` khi chủ động muốn xóa dữ liệu local của stack tương ứng.

## Tài liệu kỹ thuật

- [Backend README](./backend/README.md)
- [Kiến trúc](./ARCHITECTURE.md)
- [Bảo mật](./SECURITY.md)
- [Runbook](./ops/runbook.md)
