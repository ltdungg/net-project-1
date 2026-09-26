# Runbook vận hành

## SLO đề xuất

Các chỉ số dưới đây là mục tiêu thiết kế. Trước production cần bổ sung metrics,
dashboard và alert để đo được đúng cửa sổ thời gian.

- Availability storefront: 99,9%/tháng.
- API read p95 ≤ 500 ms; write p95 ≤ 900 ms.
- Tỷ lệ order create thành công ≥ 99,5%, không tính lỗi người dùng/provider.
- Payment webhook xử lý trong 60 giây, duplicate không tạo side effect.

## Kiểm tra nhanh

1. Gọi `http://localhost:8080/actuator/health`,
   `http://localhost:8080/api/health` và `http://localhost:8787/api/health`; cả
   ba phải trả trạng thái khỏe. Actuator kiểm tra PostgreSQL/Redis; health nghiệp
   vụ hiện kiểm tra PostgreSQL, chưa có storage write/read probe.
2. Kiểm tra lỗi 5xx theo correlation ID.
3. Kiểm tra PostgreSQL, Redis, Flyway và volume upload bằng `docker compose ps`.
4. Theo dõi backlog `outbox_events` ở trạng thái `pending`. Phiên bản hiện tại
   mới ghi transactional outbox, chưa có dispatcher để xử lý/retry sự kiện.
5. Đối chiếu `customer_orders`, `payments`, `payment_events` theo order ID.
6. Nếu nghi race tồn kho, đối chiếu `inventory_items`, `inventory_reservations`, `inventory_movements`.
7. Đối chiếu phiếu nghiệp vụ trong `inventory_operations` và các dòng SKU trong `inventory_operation_items`.
8. Với đơn nhiều kho, đối chiếu `fulfillments`, `fulfillment_items` và
   `fulfillment_events`; số kiện kỳ vọng bằng số warehouse khác nhau trong các
   reservation của đơn.

## Kiểm tra sau triển khai

```bash
npm run test:smoke
```

Smoke test phải trả PASS cho storefront, health tích hợp, Java health qua BFF và
catalog qua BFF. Script này chỉ kiểm tra endpoint công khai; nó chưa chứng minh
auth, customer segments hoặc fulfillment admin hoạt động.

Sau đó chạy smoke đọc có xác thực bằng tài khoản admin đã đăng ký/xác minh. Lệnh
login tạo/refresh session nhưng không thay đổi dữ liệu nghiệp vụ:

```powershell
$Origin = 'http://localhost:8787'
$Credential = Get-Credential -Message 'Tài khoản admin local đã xác minh'
$Headers = @{ Origin = $Origin; Referer = "$Origin/dang-nhap" }
$Body = @{
  email = $Credential.UserName
  password = $Credential.GetNetworkCredential().Password
} | ConvertTo-Json

$Login = Invoke-WebRequest -UseBasicParsing `
  -Uri "$Origin/api/commerce/auth/login" -Method Post -Headers $Headers `
  -ContentType 'application/json' -Body $Body -SessionVariable Session
$Segments = Invoke-WebRequest -UseBasicParsing `
  -Uri "$Origin/api/commerce/admin/customers/segments" `
  -Headers $Headers -WebSession $Session
$Shipments = Invoke-WebRequest -UseBasicParsing `
  -Uri "$Origin/api/commerce/admin/fulfillments?limit=1&offset=0" `
  -Headers $Headers -WebSession $Session

$Login.StatusCode
$Segments.StatusCode
$Shipments.StatusCode
```

Ba status phải là `200`. Request thay đổi dữ liệu qua BFF thiếu Origin hợp lệ sẽ
nhận `ORIGIN_FORBIDDEN`; không tắt kiểm soát này để làm cho script chạy.

## Sự cố tồn kho

- Không sửa `inventory_items` trực tiếp nếu sự cố còn có thể xử lý bằng phiếu điều chỉnh.
- Tìm theo operation number/idempotency key; xác nhận operation, item, movement và audit log khớp nhau.
- Khi order bị kẹt, kiểm tra reservation `active` đã hết hạn. Chỉ nhả reservation sau khi xác nhận payment/order không còn tiếp tục.
- Các lỗi `INVALID_BALANCE`, `BELOW_RESERVED`, `INSUFFICIENT_STOCK`,
  `INVENTORY_CONFLICT` hoặc `INVENTORY_CHANGED` cho biết số dư không hợp lệ hay
  tồn đã thay đổi đồng thời; làm mới dữ liệu trước khi thao tác lại.
- Chuyển kho phải có đủ hai movement `transfer_out` và `transfer_in` dùng chung reference ID.
- Job hết hạn reservation chạy mỗi 60 giây; nếu backlog tăng, kiểm tra log API,
  clock hệ thống và lock PostgreSQL trước khi nhả tồn thủ công.
- Bản hiện tại có hai sai lệch expiry đã biết. `KD-INV-01`: order có thể chuyển
  `cancelled` nhưng dòng `payments` vẫn `pending`. `KD-INV-02`: order COD ở
  `confirmed` không nằm trong truy vấn expiry dù reservation có TTL. Khi đối soát,
  luôn kiểm tra đồng thời order, payment và reservation; không sửa trực tiếp dữ
  liệu nếu chưa ghi nhận incident và phương án bù trừ.

## Sự cố thanh toán

- Không tự đánh dấu paid từ redirect phía client.
- Xác minh provider reference, amount, currency, chữ ký và event ID.
- Khi provider gửi lại webhook, giữ nguyên event ID để cơ chế idempotency loại bỏ
  duplicate; không tạo event ID mới để ép trạng thái.
- `KD-PAY-01`: webhook thành công đến sau khi order đã `cancelled` hiện có thể
  làm payment thành `succeeded/paid` mà không mở lại order. Trước khi sửa code,
  cô lập case, đối chiếu event/order/payment và không tiếp tục fulfillment.
- Phiên bản hiện tại nhận trạng thái hoàn tiền toàn phần từ webhook, chưa cung
  cấp command refund hay quy trình đối soát tự động trong trang Finance.
- `POST /api/payments/mock/confirm` chỉ dùng local. Nếu endpoint hoạt động ngoài
  `APP_ENV=local`, dừng phát hành và kiểm tra cấu hình ngay.

## Sự cố xác thực và tài khoản

- User mới ở `pending` cho tới khi xác minh email. Không đổi thủ công sang active
  để che lỗi token/email; kiểm tra `auth_tokens`, expiry, consumed timestamp và
  audit trước.
- Login/forgot/resend bị rate-limit qua Redis. Khi Redis lỗi, kiểm tra health và
  log trước khi retry; implementation hiện fail-open nên phải coi đây là sự cố
  bảo mật, không chỉ lỗi cache. Không bật bypass trên môi trường không phải local.
- Chỉ Admin được khóa/kích hoạt tài khoản. Ghi nhận lý do vận hành ngoài hệ thống
  nếu chính sách yêu cầu; không sửa trực tiếp bảng `users`.
- Guest order token hết hạn sau 7 ngày và phải ở header
  `X-Guest-Order-Token`. Không đưa token vào query, ticket hoặc log.
- `KD-GUEST-01`: client online-payment của guest hiện còn đưa token vào query.
  Không dùng nhánh này ngoài local; xóa token khỏi log nếu incident đã phát sinh.

## Vận hành giao hàng

1. Khi checkout thành công, hệ thống tự tạo một fulfillment cho mỗi kho tham gia
   xuất hàng. Không tạo thủ công thêm kiện hoặc sửa trực tiếp trong PostgreSQL.
2. Tại `/admin/van-chuyen`, lọc kiện đang chờ, mở chi tiết và đi theo thứ tự
   `pending` → `processing` → `ready_to_ship`.
3. Trước khi chọn `shipped`, nhập hãng vận chuyển, mã vận đơn, dịch vụ, ETA và
   chi phí nếu có. Mã vận đơn phải duy nhất trong phạm vi hãng vận chuyển.
4. Mỗi lệnh gửi `expectedVersion`. Nếu API trả `FULFILLMENT_VERSION_CONFLICT`,
   tải lại trang, đọc event mới nhất rồi mới thao tác lại; không lặp lệnh mù.
5. `shipped` tiêu thụ đúng reservation của kiện. `cancelled` trước khi xuất kho
   nhả reservation đó. Không chạy SQL sửa tồn để "đồng bộ" trạng thái.
6. Với COD, chỉ khi mọi kiện của đơn đều `delivered` thì payment mới thành
   `paid`. Nếu có kiện lỗi, giữ đơn ở trạng thái đang xử lý và điều phối giao lại.
7. Hủy đơn đã thanh toán/authorized bị chặn bằng `REFUND_REQUIRED`; cần xác minh
   và hoàn tiền theo provider trước. Hủy từng phần cũng bị chặn nếu một kiện khác
   đã ra khỏi kho.
8. Hàng `returned` sau khi đã ship là hàng chờ kiểm định. Sau khi nhận và phân
   loại, tạo phiếu nhập hoặc điều chỉnh tồn; hệ thống không tự cộng lại hàng bán
   được để tránh bán nhầm hàng hỏng.

Khi một kiện bị kẹt, tra theo shipment number hoặc order number rồi kiểm tra đồng
thời status/version trong `fulfillments`, event cuối trong `fulfillment_events`,
reservation/movement của các item và outbox liên quan. Mọi thao tác quản trị đều
có audit; dùng actor và correlation ID để xác định thay đổi phát sinh từ đâu.

## Vận hành phân khúc khách hàng

- Dashboard `/admin/khach-hang` lấy phân khúc từ read model
  `admin_customer_segments`; không gắn nhãn VIP thủ công.
- Rule được xét theo thứ tự `at_risk → vip → loyal → new → potential → prospect`;
  mỗi khách chỉ thuộc một nhóm tại một thời điểm.
- `new`: tài khoản tạo trong 30 ngày và tối đa một đơn đã thanh toán;
  `potential`: đúng một đơn đã thanh toán nhưng không còn thuộc `new`; `loyal`:
  ít nhất hai đơn đã thanh toán và lần mua đã thu gần nhất trong 90 ngày;
  `vip`: doanh thu từ 5.000.000đ hoặc ít nhất năm đơn; `at_risk`: từng mua nhưng
  không có đơn đã thanh toán trong hơn 90 ngày; còn lại là `prospect`.
- Nếu số liệu phân khúc bất thường, đối chiếu `payment_status`, `placed_at`,
  `grand_total_cents` và timezone trước khi can thiệp. View sẽ tự tính lại từ dữ
  liệu nguồn, không cần job đồng bộ nhãn.

## Vận hành Copilot quản trị

- Copilot là rule engine read-only trên snapshot report/order/inventory/promotion,
  không gọi LLM bên ngoài và không tự tạo/chuyển trạng thái nghiệp vụ.
- Mọi đề xuất phải được người có quyền mở màn hình đích, kiểm tra dữ liệu rồi tự
  thực hiện. Không diễn giải câu trả lời Copilot như phê duyệt của hệ thống.
- Nếu câu trả lời sai, lưu prompt không chứa PII, correlation ID, thời điểm và
  số liệu nguồn để tái hiện. Kiểm tra rule classification trước khi sửa dữ liệu.

## Rollback

- Rollback frontend và backend độc lập bằng phiên bản deploy trước, nhưng phải
  giữ tương thích API/schema giữa hai phiên bản.
- Migration chỉ forward; sửa dữ liệu bằng migration bù, không xóa lịch sử.
- Nếu cần dừng checkout online, thực hiện ở provider/gateway hoặc triển khai cờ
  cấu hình trước; phiên bản hiện tại chưa có feature flag điều khiển checkout.

## Backup và phục hồi

- Kiểm tra backup PostgreSQL và snapshot volume upload định kỳ; Redis không phải
  nguồn dữ liệu nghiệp vụ lâu dài.
- Mỗi quý chạy diễn tập restore ở môi trường tách biệt.
- Sau restore kiểm tra `flyway_schema_history`, order total, payment status,
  inventory balance, media upload và khóa idempotency của outbox.
- Baseline local chưa kèm job backup tự động hoặc bằng chứng DR production. Trước
  khi dùng thật phải chốt RPO/RTO, mã hóa, retention, off-site copy và diễn tập
  restore có biên bản.

## Lệnh Docker thường dùng

Frontend chạy từ thư mục `platform`; backend chạy từ `platform/backend`.

```powershell
# Frontend/BFF
docker --context default compose ps
docker --context default compose logs -f commerce

# Java/PostgreSQL/Redis (chạy tại platform/backend)
docker --context default compose ps
docker --context default compose logs -f api postgres redis
```

Để dừng toàn bộ mà giữ volume, chạy `docker compose down` một lần tại `platform`
cho frontend và một lần tại `platform/backend` cho API/PostgreSQL/Redis. Không
chỉ dừng frontend rồi kết luận toàn bộ hệ thống đã dừng.

Backend phải khỏe trước khi khởi động frontend. Nếu Redis tạm mất, kiểm tra rate
limit và catalog cache sau khi service phục hồi. Theo dõi dung lượng/quyền ghi của
volume `uploads_data`; Docker health hiện không thay thế kiểm tra upload thực tế.

Không dùng `docker compose down -v` trừ khi đã chủ động chấp nhận xóa dữ liệu
local. Quy trình khởi động đầy đủ nằm trong `README.md` ở thư mục gốc dự án.

Baseline kỹ thuật đã xác minh gồm 69 backend tests và 12 frontend tests. Con số
này phải được cập nhật cùng test report khi test suite thay đổi; không dùng như
SLO hoặc chứng nhận production.
