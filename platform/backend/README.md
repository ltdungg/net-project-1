# NÉT Commerce API — Java Spring Boot

Backend modular monolith cho storefront và backoffice NÉT, dùng Java 21, Spring Boot, PostgreSQL, Redis, Flyway và JWT cookie/bearer.

## Chạy nhanh bằng Docker

Yêu cầu Docker Desktop đang chạy ở chế độ Linux containers.

```powershell
Set-Location platform/backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build -d
docker compose ps
curl.exe http://localhost:8080/actuator/health
```

Flyway tự tạo schema và seed catalog khi API khởi động. API chạy tại `http://localhost:8080`; PostgreSQL và Redis chỉ nằm trong network nội bộ của Compose.

Schema hiện tại ở Flyway V7. Migration đã chạy là bất biến; không chỉnh sửa V7
trên môi trường có dữ liệu, mà tạo V8 trở lên cho thay đổi tiếp theo.

Nếu Docker báo lỗi context `desktop-linux`, socket/pipe không tồn tại hoặc không kết nối được daemon, kiểm tra context rồi chạy trực tiếp bằng context `default`:

```powershell
docker context ls
docker --context default compose up --build -d
docker --context default compose ps
```

Docker Desktop vẫn phải đang chạy. Có thể dùng `docker context use default` nếu muốn đặt `default` làm context cho các lệnh tiếp theo.

Nếu Docker báo `unable to prepare context ... path not found` trong khi mã nguồn nằm ở đường dẫn OneDrive có dấu, tạo một junction ASCII rồi chạy Compose tại đó:

```powershell
$BackendPath = (Get-Location).Path
$DockerPath = Join-Path $env:LOCALAPPDATA 'Temp\net-commerce-backend-docker'
if (-not (Test-Path -LiteralPath $DockerPath)) {
    New-Item -ItemType Junction -Path $DockerPath -Target $BackendPath | Out-Null
}
Set-Location $DockerPath
docker --context default compose --env-file .env up --build -d
```

Junction chỉ là đường dẫn trỏ tới cùng thư mục backend, không sao chép hoặc thay đổi mã nguồn.

`.env.example` đặt `LOCAL_AUTH_BYPASS=false` để local chạy đúng luồng đăng ký,
xác minh và đăng nhập. Đăng ký `owner@example.com` để bootstrap tài khoản admin.

```powershell
# Xem log
docker compose logs -f api

# Chạy lại test trong image build
docker compose build --no-cache api

# Dừng nhưng giữ dữ liệu
docker compose down
```

Chỉ dùng `docker compose down -v` khi chủ động muốn xóa toàn bộ PostgreSQL, Redis và ảnh đã upload.

## Healthcheck và smoke test

Sau khi cả ba service có trạng thái `healthy`, chạy các kiểm tra chỉ đọc sau:

```powershell
$ApiBase = 'http://localhost:8080'
curl.exe -fsS "$ApiBase/actuator/health"
curl.exe -fsS "$ApiBase/api/health"
curl.exe -fsS "$ApiBase/api/products"
```

Các endpoint admin yêu cầu cookie/bearer của tài khoản manager hoặc admin; giao
diện tại cổng 8787 cung cấp đầy đủ luồng đăng ký và đăng nhập.

Để chẩn đoán khi healthcheck thất bại:

```powershell
docker compose ps
docker compose logs --tail 200 api postgres redis
```

## Chạy bằng Maven

Yêu cầu JDK 21, Maven 3.9+, PostgreSQL và Redis đang chạy.

```powershell
Set-Location platform/backend
$env:DATABASE_URL='jdbc:postgresql://localhost:5432/net_commerce'
$env:DATABASE_USER='net'
$env:DATABASE_PASSWORD='net_local_password'
$env:REDIS_HOST='localhost'
$env:REDIS_PORT='6379'
$env:APP_ENV='local'
$env:PUBLIC_ORIGIN='http://localhost:8787'
$env:JWT_SECRET='local-development-jwt-secret-change-before-production-2026'
$env:PAYMENT_WEBHOOK_SECRET='local-development-webhook-secret-change-me'
$env:LOCAL_AUTH_BYPASS='false'
mvn spring-boot:run
```

Kiểm tra chất lượng:

```powershell
mvn clean test
mvn clean package
```

Baseline hiện tại có **69 kiểm thử backend**. Nhóm integration dùng PostgreSQL
Testcontainers; nếu build image không truy cập Docker socket, các test này có
thể bị skip theo điều kiện môi trường nên phải kiểm tra test summary, không chỉ
nhìn exit code của bước compile/package.

Nếu máy không có JDK/Maven, chạy từ `platform/backend` bằng Maven container:

```powershell
docker run --rm `
  -e TESTCONTAINERS_RYUK_DISABLED=true `
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v "${PWD}:/workspace" -w /workspace `
  maven:3.9.11-eclipse-temurin-21-alpine `
  mvn --batch-mode --no-transfer-progress clean test
```

## Endpoint chính

| Nhóm | Endpoint | Quyền chính | Mục đích |
| --- | --- | --- | --- |
| Storefront | `GET /api/products`, `GET /api/products/{slug}` | Công khai | Danh sách và chi tiết sản phẩm đang bán |
| Giỏ hàng | `/api/cart`, `/api/vouchers` | Khách hoặc thành viên | Cập nhật giỏ và áp/gỡ voucher |
| Đơn hàng | `GET/POST /api/orders`, `GET /api/orders/{id}` | Thành viên; tạo đơn hỗ trợ khách | Checkout và theo dõi đơn |
| Đơn khách vãng lai | `GET /api/orders/{id}/guest` + `X-Guest-Order-Token` | Token ký số, hạn bảy ngày | Theo dõi đơn mà không đưa token vào URL |
| Xác thực | `/api/auth/register`, `/verify-email`, `/resend-verification`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/me` | Tùy thao tác | Vòng đời email/password, JWT access và refresh rotation |
| Tài khoản | `/api/account/profile`, `/api/account/addresses` | Thành viên | Hồ sơ và sổ địa chỉ |
| Yêu thích | `GET/POST /api/account/wishlist`, `DELETE /api/account/wishlist/{productId}` | Thành viên | Xem, thêm và bỏ sản phẩm yêu thích |
| Thanh toán | `POST /api/payments/mock/confirm`, `POST /api/payments/webhook` | Theo chữ ký/quy trình thanh toán | Xác nhận giả lập và nhận webhook HMAC |
| Catalog admin | `GET/POST /api/admin/products`, `POST /api/admin/products/{id}/media` | Manager/Admin khi ghi | Quản lý sản phẩm và media |
| Product options | `GET /api/admin/products/options` | Manager/Admin | Lấy category, warehouse và các lựa chọn cho form sản phẩm |
| Upload | `POST /api/admin/uploads`, `GET /api/assets/**` | Manager/Admin khi tải lên | Lưu và phục vụ media |
| Đơn admin | `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH /api/admin/orders/{id}/status` | Staff/Manager/Admin | Tra cứu và chuyển trạng thái đơn |
| Khách hàng admin | `GET /api/admin/customers`, `GET /api/admin/customers/{id}` | Staff/Manager/Admin | Search/filter/pagination và hồ sơ 360° gồm địa chỉ/lịch sử/KPI |
| Phân khúc khách hàng | `GET /api/admin/customers/segments` | Staff/Manager/Admin | KPI sáu phân khúc tự động từ hành vi mua |
| Trạng thái khách hàng | `PATCH /api/admin/customers/{id}/status` | Admin | Khóa hoặc kích hoạt tài khoản, có audit |
| Vận chuyển admin | `GET /api/admin/fulfillments`, `GET /api/admin/fulfillments/{id}` | Staff/Manager/Admin | Tra cứu kiện, hàng hóa, địa chỉ và timeline |
| Tracking vận chuyển | `PATCH /api/admin/fulfillments/{id}/tracking` | Staff/Manager/Admin | Cập nhật hãng, vận đơn, ETA, chi phí với optimistic version |
| Trạng thái vận chuyển | `PATCH /api/admin/fulfillments/{id}/status` | Staff/Manager/Admin | Điều phối đóng gói, xuất kho, giao, lỗi, hoàn và hủy |
| Inventory | `/api/admin/inventory/*` | Staff/Manager/Admin tùy thao tác | Tồn kho, nhập/chuyển/kiểm kê/điều chỉnh và CSV |
| Promotion | `POST /api/admin/promotions` | Manager/Admin | Tạo chương trình và mã voucher |
| Dashboard | `GET /api/admin/metrics` | Manager/Admin | KPI vận hành 30 ngày |
| Báo cáo | `GET /api/admin/reports/overview` | Manager/Admin | Doanh thu thuần, AOV, đơn, top sản phẩm và doanh số ngày |
| Tài chính | `GET /api/admin/finance` | Manager/Admin | Tổng hợp thanh toán và payment ledger phân trang |
| Copilot quản trị | `POST /api/admin/ai` | Staff/Manager/Admin | Phân tích dữ liệu tổng hợp, không tự thay đổi nghiệp vụ |
| Sức khỏe | `GET /actuator/health`, `GET /api/health` | Công khai | Kiểm tra runtime và kết nối PostgreSQL |

`GET /api/admin/reports/overview` nhận `from`, `to` theo `yyyy-MM-dd`. Mặc định là 30 ngày gần nhất, tối đa 366 ngày, không trước `2000-01-01`, không vượt ngày hiện tại và dùng múi giờ `Asia/Ho_Chi_Minh`. `GET /api/admin/finance` nhận thêm `page` từ 1 và `size` từ 1 đến 100. Ledger không trả email, số điện thoại, địa chỉ, idempotency key, mã giao dịch nhà cung cấp, lỗi chi tiết hoặc payload webhook.

Mọi response JSON nghiệp vụ dùng envelope `{ "data": ..., "error": null }`; lỗi dùng `{ "data": null, "error": { "code", "message", "details" } }`.

Checkout tự nhóm reservation theo warehouse và tạo một fulfillment cho mỗi kho.
Luồng chuẩn là `pending → processing → ready_to_ship → shipped → delivered`;
nhánh lỗi/hủy/hoàn được kiểm soát bởi state machine. Chuyển `shipped` yêu cầu
tracking và mới tiêu thụ tồn. COD chỉ được capture khi tất cả kiện đã giao. Hàng
`returned` sau xuất kho chờ kho kiểm định, không tự động quay lại `on_hand`.

Customer segment là read model từ dữ liệu paid, theo thứ tự ưu tiên
`at_risk → vip → loyal → new → potential → prospect`. `loyal` nghĩa là có ít
nhất hai đơn paid và lần mua paid gần nhất trong 90 ngày, không nhất thiết cả hai
đơn đều phát sinh trong 90 ngày.

## Giới hạn backend hiện tại

- `KD-GUEST-01`: client online-payment của guest chưa gọi đúng contract header
  `X-Guest-Order-Token`; backend không hỗ trợ token trong query.
- `KD-PAY-01`: webhook payment thành công đến muộn có thể cập nhật payment trong
  khi order đã `cancelled`; chưa có bước reject/reconcile trạng thái terminal.
- `KD-INV-01`: expiry job chưa đồng bộ `payments.status` khi hủy order do hết hạn.
- `KD-INV-02`: expiry job chỉ chọn order `pending_payment`, nên reservation COD
  của order `confirmed` không được giải phóng theo TTL hiện tại.
- Payment online dùng mock confirm/webhook HMAC; chưa có SDK/provider merchant
  thật hoặc command refund đầy đủ.
- Fulfillment được tạo tự động theo kho nhưng tracking/state do nhân viên cập
  nhật; chưa có carrier API/webhook và chưa split nhiều kiện trong cùng một kho.
- Outbox được ghi transactional nhưng chưa có dispatcher/consumer; email/SMS
  production chưa được nối.
- Copilot là `AdminPromptEngine` theo luật, read-only; không gọi LLM và không tự
  mutation.
- Upload dùng volume local; cloud object storage/CDN, malware scan, centralized
  observability, secret manager và DR production nằm ngoài baseline.
- V1–V7 là migration đã baseline và phải bất biến. Thay đổi schema tiếp theo bắt
  đầu bằng V8, kèm test migration/upgrade.

## Lưu ý production

- Đặt `APP_ENV=production`, `LOCAL_AUTH_BYPASS=false`.
- Dùng HTTPS cho `PUBLIC_ORIGIN` và secret ngẫu nhiên đủ mạnh.
- Không đưa PostgreSQL/Redis ra public network.
- Mount vùng upload hoặc thay `MediaStorageService` bằng object storage.
- Webhook phải ký HMAC-SHA256 trên raw body bằng `PAYMENT_WEBHOOK_SECRET`.
