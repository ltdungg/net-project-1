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

Schema hiện tại ở Flyway V9, gồm dashboard AI riêng theo tài khoản và metadata
đối soát SePay Sandbox. Migration đã chạy là bất biến; thay đổi tiếp theo tạo V10 trở lên.

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

Baseline hiện tại có **117 kiểm thử backend**. Nhóm integration dùng PostgreSQL
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
| Cấu hình thanh toán | `GET /api/payments/config` | Công khai | `mockEnabled` chỉ bật trong local; `sepaySandboxEnabled` khi đã cấu hình |
| SePay Sandbox | `GET /api/payments/sepay-sandbox/{orderId}`, `POST /api/payments/sepay-sandbox/{orderId}/check` | Chủ đơn, token guest hoặc nhân viên | Lấy thông tin chuyển khoản/QR và đối soát qua API v2 |
| Thanh toán | `POST /api/payments/mock/confirm`, `POST /api/payments/webhook` | Chủ đơn, token guest hoặc nhân viên (mock); chữ ký HMAC (webhook) | Mock body: `orderId`, `guestAccessToken?`, `outcome: succeeded\|failed` (mặc định succeeded); chỉ local |
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
| Gợi ý tự động | `POST /api/ai/recommendations` | Công khai, cá nhân hóa theo phiên/tài khoản | Body: `currentSlug`, `recentIds`, `favoriteIds` tùy chọn |
| Tư vấn mua sắm | `POST /api/ai/chat` | Công khai | `message` bắt buộc; `previousQuestions` tối đa 6, mỗi câu tối đa 1.000 ký tự |
| Cấu hình AI | `GET /api/ai/status` | Công khai | `provider: gemini`, `configured` cho frontend; không trả API key |
| Tạo bản xem trước | `POST /api/admin/ai/dashboard` | Manager/Admin | `prompt`, `days` (1–90); mô hình chọn widget, backend tính số liệu |
| Dashboard đã lưu | `GET/POST /api/admin/ai/dashboards` | Manager/Admin | Mỗi user tối đa 10 bản; POST: `title`, `days`, `widgets` |
| Mở/xóa dashboard | `GET/DELETE /api/admin/ai/dashboards/{id}` | Chính chủ Manager/Admin | ID của người khác trả 404; mở lại truy vấn số liệu mới |
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

- `KD-PAY-01`: webhook payment thành công đến muộn có thể cập nhật payment trong
  khi order đã `cancelled`; chưa có bước reject/reconcile trạng thái terminal.
- `KD-INV-01`: expiry job chưa đồng bộ `payments.status` khi hủy order do hết hạn.
- `KD-INV-02`: expiry job chỉ chọn order `pending_payment`, nên reservation COD
  của order `confirmed` không được giải phóng theo TTL hiện tại.
- Payment online hỗ trợ mock confirm/webhook HMAC và SePay Sandbox API v2.
  SePay đối soát khi người dùng mở trang thanh toán; chưa có webhook/background
  reconciliation SePay, kết nối Live hoặc command refund đầy đủ.
- Fulfillment được tạo tự động theo kho nhưng tracking/state do nhân viên cập
  nhật; chưa có carrier API/webhook và chưa split nhiều kiện trong cùng một kho.
- Outbox được ghi transactional nhưng chưa có dispatcher/consumer; email/SMS
  production chưa được nối.
- Copilot dùng `AdminPromptEngine` làm dự phòng; khi có `GEMINI_API_KEY`, gọi
  Gemini generateContent bằng key backend, đầu ra có cấu trúc. Model mặc định
  `gemini-3.8-flash`, đổi qua `GEMINI_MODEL`. Không tự thay đổi nghiệp vụ.
- Upload dùng volume local; cloud object storage/CDN, malware scan, centralized
  observability, secret manager và DR production nằm ngoài baseline.
- V1–V9 là migration đã baseline và phải bất biến. Thay đổi schema tiếp theo bắt
  đầu bằng V10, kèm test migration/upgrade.

## SePay Sandbox

Trong `.env` của backend (Git bỏ qua), cấu hình:

```dotenv
SEPAY_SANDBOX_ENABLED=true
SEPAY_SANDBOX_API_KEY=<API token trong Test mode>
SEPAY_SANDBOX_BANK_ACCOUNT_ID=<UUID tài khoản ngân hàng thử nghiệm>
```

Chạy lại `docker compose up --build -d api` để nạp cấu hình và Flyway V9.
Nếu chạy Java/Maven trực tiếp, cần đặt ba biến môi trường này vào tiến trình;
Spring không tự đọc `.env`. Không dùng biến frontend hoặc `NEXT_PUBLIC_*` cho key.
Adapter chỉ gọi `https://userapi-sandbox.sepay.vn/v2/`, gửi Bearer token từ backend.

1. Checkout chọn **SePay Sandbox**, đặt đơn rồi mở trang thanh toán.
2. Trong dashboard SePay, chuyển sang **Test mode → Mô phỏng giao dịch**.
   Chọn đúng tài khoản hiển thị trên checkout, loại tiền **vào**, số tiền VND
   và nội dung `NET...` đầy đủ. QR là tài khoản thử; không chuyển tiền thật.
3. Trang thanh toán tự kiểm tra mỗi 15 giây khi tab đang hiển thị, hoặc bấm
   **Kiểm tra thanh toán**. Không cần webhook hoặc public tunnel cho luồng này.
   Đóng trang sẽ ngừng kiểm tra; mở lại trong thời gian giữ hàng để đối soát.

Backend kiểm tra UUID giao dịch, tài khoản, chiều tiền, số tiền chính xác, toàn
bộ mã tham chiếu và thời gian từ lúc tạo payment đến khi hết hạn giữ hàng (2 giờ).
Các trường `*_cents` hiện lưu **VND nguyên**, không chia 100 khi gửi SePay.
Tài khoản và nội dung được chụp lại theo đơn. Khóa database và unique event ngăn
ghi nhận lặp; đơn đã hủy/hết hạn/nhả tồn không được xác nhận lại. Không trừ tồn
lần nữa lúc thanh toán. Lỗi provider giữ đơn chờ và cho phép kiểm tra lại.
Mỗi đơn có cooldown 10 giây, mỗi tiến trình backend tối đa 2 yêu cầu SePay/giây;
nhiều replica chung IP cần giới hạn phân tán trước khi mở rộng.

API v2 công khai dùng để đọc/đối soát; không giả định có API tạo chuyển khoản.
Tài liệu: [truy cập API Test mode](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/api-access),
[mô phỏng giao dịch](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-giao-dich),
[danh sách giao dịch v2](https://developer.sepay.vn/vi/sepay-api/v2/giao-dich/danh-sach).

## Lưu ý production

- Đặt `APP_ENV=production`, `LOCAL_AUTH_BYPASS=false`.
- Dùng HTTPS cho `PUBLIC_ORIGIN` và secret ngẫu nhiên đủ mạnh.
- Không đưa PostgreSQL/Redis ra public network.
- Mount vùng upload hoặc thay `MediaStorageService` bằng object storage.
- Webhook phải ký HMAC-SHA256 trên raw body bằng `PAYMENT_WEBHOOK_SECRET`.
