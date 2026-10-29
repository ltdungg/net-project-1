# NÉT Commerce Platform

Dự án đồ án website bán quần áo online gồm storefront, tài khoản khách hàng,
checkout, quản trị, phân khúc khách hàng, tồn kho đa kho, vận chuyển và Copilot
quản trị, tư vấn mua sắm và tạo dashboard bằng AI tùy chọn.

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
  tài chính, inventory đa kho, upload và Copilot quản trị. AI có thể giải thích
  số liệu tổng hợp và tạo bố cục dashboard; chỉ lưu dashboard khi người dùng bấm Lưu.
- Gợi ý sản phẩm tự động ở trang chủ, chi tiết và giỏ hàng, dựa trên sản phẩm
  đã xem trong phiên, yêu thích, giỏ hàng và lịch sử mua của chính tài khoản.
  Trợ lý mua sắm hỗ trợ hội thoại, lọc loại sản phẩm, ngân sách và size còn hàng.
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

Flyway tự áp dụng migration khi API khởi động. Database hiện ở V9, gồm dashboard
AI theo tài khoản và metadata SePay Sandbox. Không sửa file migration đã chạy;
mọi thay đổi schema tiếp theo phải tạo migration tiến mới, bắt đầu từ V10.

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

## AI cho khách hàng và admin

- Khách hàng: nút **Tư vấn cùng NÉT** trên storefront; gợi ý tự động xuất hiện
  ở trang chủ, trang sản phẩm và giỏ hàng. Lịch sử xem tối đa 20 sản phẩm nằm
  trong `sessionStorage`; hội thoại chỉ nằm trong bộ nhớ của trang và được xóa
  khi đổi tài khoản. Khi bật mô hình, câu hỏi và tối đa 6 câu trước đó được gửi
  đến Gemini cùng các sản phẩm công khai phù hợp; không gửi hồ sơ hay đơn hàng.
- Admin/manager: `/admin/ai` → **Tạo dashboard**, nhập yêu cầu (ví dụ “doanh thu
  và sản phẩm bán chạy 7 ngày”), chỉnh tên/chỉ số rồi lưu. Tối đa 10 dashboard
  riêng cho mỗi tài khoản; mở lại luôn truy vấn số liệu mới. Staff chỉ có phần
  tư vấn vận hành, không được truy cập API dashboard.
- Recommendation là bộ xếp hạng cục bộ, không cần API key: dùng các tín hiệu
  sở thích, loại thiết kế và tầm giá; loại sản phẩm hết hàng và đã có trong giỏ.
  Lọc giá/size trên cùng biến thể còn hàng; dữ liệu tồn kho được đọc không qua
  cache catalog. Giá và tồn vẫn được kiểm tra lại lúc checkout.
- Để bật Gemini, đặt `GEMINI_API_KEY` và `GEMINI_MODEL=gemini-3.8-flash` trong `backend/.env`,
  sau đó chạy lại `docker compose --env-file .env up --build -d api` ở backend.
  Không đặt key trong frontend hoặc biến `NEXT_PUBLIC_*`. Không có key vẫn dùng
  được gợi ý, tư vấn cơ bản và dashboard theo từ khóa; giao diện ghi rõ chế độ.
- Frontend chat và `/admin/ai` đọc `/api/commerce/ai/status` để hiển thị cấu hình
  Gemini; trạng thái này không xác nhận key hợp lệ. Câu trả lời ghi rõ Gemini hay
  chế độ dự phòng. Browser chỉ gọi BFF, không gọi Google hoặc giữ API key.
- Dùng [Gemini generateContent với Structured Outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output),
  xác thực bằng header `x-goog-api-key`, timeout 15 giây, tối đa 4 cuộc gọi đồng thời. Mỗi tài khoản/IP
  tối đa 12 yêu cầu/phút; provider tối đa 300 cuộc gọi/giờ qua Redis. Hết hạn,
  lỗi API, đầu ra sai hoặc chạm hạn provider chuyển sang luật. Khi Redis không
  khả dụng, endpoint dùng mô hình trả lỗi tạm thời để tránh bỏ qua giới hạn.
  Sau proxy, khách vãng lai có thể chia sẻ hạn mức theo địa chỉ mạng của proxy.
- Dashboard chỉ nhận 7 ID widget đã định nghĩa, không chạy SQL/HTML/JS từ mô hình.
  Số liệu lấy từ báo cáo thật, theo `Asia/Ho_Chi_Minh`, khoảng 1–90 ngày.
  AI chỉ nhận câu hỏi và dữ liệu tổng hợp khi tư vấn admin; bố cục dashboard
  không cần gửi số liệu kinh doanh. API cá nhân hóa và dashboard trả `no-store`.

## Thanh toán giả lập trên frontend

- Chạy backend với `APP_ENV=local`. Checkout hiển thị **Thanh toán giả lập** khi
  `/api/commerce/payments/config` trả `mockEnabled=true`; ngoài local nút mock bị ẩn.
- Chọn phương thức giả lập và đặt đơn để mở `/thanh-toan/{id}`. Không nhập số thẻ,
  không có giao dịch tiền thật. Có hai nút mô phỏng **thành công** và **thất bại**.
- Thất bại giữ đơn ở `pending_payment`, cập nhật payment thành `failed`; có thể
  thử lại. Thành công đổi đơn sang `confirmed` và payment sang `paid`. Gửi lặp
  không tạo thêm sự kiện thành công, thất bại đến sau không hạ trạng thái đã trả.
- Token khách vãng lai được lưu theo phiên checkout và gửi qua header
  `X-Guest-Order-Token` khi tải đơn, không đưa vào query. Xác nhận chỉ cho chủ đơn,
  khách có token hợp lệ hoặc nhân viên. Backend chặn mô phỏng ngoài local.
- Tồn kho vẫn theo luồng reservation/fulfillment hiện có, không trừ thêm khi
  bấm thanh toán nhiều lần. Đơn đã hủy hoặc hoàn tiền không thể thanh toán lại.

## Thanh toán SePay Sandbox

Checkout có thêm **SePay Sandbox** khi backend bật `SEPAY_SANDBOX_ENABLED` và
có API key, UUID tài khoản thử nghiệm. Key chỉ nằm trong backend `.env` được Git
bỏ qua. Trang `/thanh-toan/{id}` hiển thị QR, tài khoản, số tiền, nội dung riêng
cho đơn và tự kiểm tra giao dịch mỗi 15 giây khi đang mở. Nút **Kiểm tra thanh
toán** gọi backend đối soát; frontend không tự đánh dấu đã trả tiền.

Tạo giao dịch tiền vào trong **SePay Test mode → Mô phỏng giao dịch**, nhập đúng
số tiền và nội dung trên checkout. Không dùng ứng dụng ngân hàng thật để quét QR
test. Cần đăng nhập dashboard SePay để tạo giao dịch; API key chỉ dùng truy vấn.
Xem [cấu hình và quy trình test](backend/README.md#sepay-sandbox).

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

Baseline được xác minh hiện tại gồm **117 kiểm thử backend** và **15 kiểm thử
frontend**. Frontend còn phải đạt typecheck/build; smoke test kiểm tra storefront,
health và catalog xuyên BFF. Các luồng admin có xác thực được kiểm tra trong bộ
test/UAT riêng, không nằm hết trong script smoke công khai.

## Giới hạn của bản đồ án

- Thanh toán online có mock local và SePay Sandbox. Chưa kết nối SePay Live;
  SePay hiện đối soát khi mở trang thanh toán, chưa có webhook/background worker.
  Mock endpoint bị khóa ngoài `APP_ENV=local`.
- Vận chuyển là quy trình thủ công: nhân viên nhập carrier/tracking/ETA/chi phí
  và cập nhật trạng thái. Chưa có API/webhook hãng vận chuyển.
- Một đơn có thể có nhiều kiện theo kho, nhưng mỗi cặp order–warehouse chỉ có
  một fulfillment; chưa chia nhiều kiện trong cùng kho hoặc đối soát giao/hoàn
  một phần phức tạp.
- Hàng returned sau khi ship chờ kho kiểm định; chưa có workflow refund/return
  tự phục vụ hoặc command hoàn tiền đầy đủ.
- Transactional outbox mới được ghi trong cùng transaction; chưa có
  dispatcher/consumer. Email/SMS production chưa được nối.
- AI chỉ tư vấn và chọn bố cục dashboard từ danh sách chỉ số cho phép; không
  thực thi SQL/mã sinh bởi mô hình hoặc tự thay đổi đơn hàng, giá, tồn kho.
- Docker Compose hiện phục vụ local/demo. Cloud/CDN, secret manager, centralized
  metrics/alert, pentest/load dài hạn và DR rehearsal production nằm ngoài scope.

## Vận hành Docker

Quản trị viên (`admin`) có thể mở `/admin/nhat-ky` để xem log backend, lọc mức độ,
tìm nội dung/nguồn/correlation ID và bật cập nhật mỗi 5 giây. API
`GET /api/admin/logs` chỉ cho phép role `ADMIN` và trả `Cache-Control: no-store`.
Lưu tối đa 1.000 bản ghi trong RAM của từng backend, trả tối đa 500 bản ghi mỗi
lần (giao diện lấy 200); lịch sử mất khi backend khởi động lại. Đây là log ứng
dụng trong phiên hiện tại, không phải lịch sử Docker hay kho audit lâu dài.
Request log chỉ ghi method, route template, status và duration; không ghi body,
query hay header. Viewer che các mẫu credential/email và chỉ hiển thị tên lớp
exception, không trả stack trace. Không ghi bí mật hoặc dữ liệu cá nhân vào log
ứng dụng; bộ che mẫu không thay thế nguyên tắc này.

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
