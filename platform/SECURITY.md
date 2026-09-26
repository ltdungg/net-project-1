# Chính sách bảo mật

## Kiểm soát đã áp dụng

- Xác thực email/password do Spring Security xử lý; access JWT ngắn hạn và
  refresh token opaque được xoay vòng. Authorization RBAC luôn kiểm tra phía
  server.
- Cookie xác thực dùng `HttpOnly`, `SameSite=Strict`; cookie giỏ hàng dùng
  `HttpOnly`, `SameSite=Lax`; tất cả bật `Secure` trên HTTPS.
- Request thay đổi dữ liệu qua BFF phải có `Origin`/`Referer` thuộc public
  origin. Vì vậy lệnh `curl` đăng nhập/ghi dữ liệu không có Origin hợp lệ nhận
  `ORIGIN_FORBIDDEN`; đây là kiểm soát chủ động, không phải lỗi kết nối.
- Đăng ký dùng trạng thái `pending` cho tới khi token xác minh một lần hợp lệ.
  Login/forgot/resend được giới hạn tần suất bằng Redis; refresh token được băm,
  xoay vòng và có thể thu hồi khi logout.
- Mã truy cập đơn của khách vãng lai được ký, giới hạn bảy ngày, giữ trong
  `sessionStorage` và truyền bằng header `X-Guest-Order-Token`, không đặt trong
  URL/query để tránh rò qua lịch sử trình duyệt và access log. Đây là contract
  chuẩn; riêng client online-payment hiện còn vi phạm contract này
  (`KD-GUEST-01`) và phải được sửa trước khi phát hành.
- Upload giới hạn 8 MB và chỉ nhận JPEG, PNG, WebP, AVIF; object được phát với `nosniff`.
- Webhook thanh toán xác minh HMAC SHA-256, so sánh constant-time và chống duplicate.
- Không lưu dữ liệu thẻ. Checkout online chỉ lưu payment reference của provider.
- Jakarta Validation giới hạn độ dài, định dạng và số lượng tại Java API; kiểm
  tra phía frontend chỉ hỗ trợ trải nghiệm và không thay thế validation server.
- Audit log chứa correlation ID; không ghi secret hoặc payload PII không cần thiết.
- Tất cả nghiệp vụ kho có idempotency key; trigger dữ liệu ngăn âm tồn và reserved vượt on-hand.
- Cập nhật fulfillment yêu cầu `expectedVersion`; carrier/tracking phải có trước
  `shipped`, tracking duy nhất theo carrier và các state lỗi/hủy/hoàn bắt buộc có
  lý do. API công khai chỉ trả phần tracking cần thiết.
- Customer segment là read model từ đơn đã thanh toán; chỉ Admin đổi được trạng
  thái tài khoản. Copilot chỉ đọc dữ liệu tổng hợp, không gọi LLM ngoài và không
  tự thực thi action.
- Runtime Docker chạy non-root, bật `no-new-privileges`, giới hạn log và dùng volume riêng cho trạng thái local.
- Endpoint mô phỏng thanh toán bị khóa cứng ngoài `APP_ENV=local`.

## Quản lý secret

Thiết lập `ADMIN_EMAILS`, `MANAGER_EMAILS`, `PAYMENT_WEBHOOK_SECRET` và origin public qua môi trường của nền tảng. Không commit `.env`.

Secret mẫu chỉ dùng local. Production cần secret manager, rotation, phân tách
theo môi trường và quy trình thu hồi; không dùng lại giá trị trong `.env.example`.

## Giới hạn và việc phải làm trước production

- Sửa `KD-GUEST-01`: bỏ guest token khỏi query ở trang online-payment, gửi bằng
  `X-Guest-Order-Token`, đồng thời scrub log và bổ sung test contract.
- Sửa `KD-PAY-01`: webhook thành công đến sau khi order đã hủy phải bị từ chối
  hoặc được reconcile theo chính sách rõ ràng; không cho hai aggregate lệch nhau.
- Payment mock chỉ được bật ở `APP_ENV=local`; chưa có đánh giá PCI/provider thật.
- Token xác minh/đặt lại được trả trực tiếp chỉ trong local; production phải gửi
  qua email service có chống abuse và không lộ token trong response/log.
- Upload dùng volume local và kiểm tra type/size, chưa có malware scan, object
  storage policy hoặc content moderation.
- Chưa có WAF, SIEM, CSP/reporting tập trung, database row-level security, secret
  manager, external pentest hoặc quy trình vulnerability SLA production.
- Auth rate limiter hiện fail-open khi Redis không khả dụng để tránh làm sập
  luồng local; production phải quyết định fail-closed/fallback phù hợp và cảnh
  báo ngay khi Redis rate-limit mất tác dụng.
- Docker log/healthcheck và audit không thay thế metrics/alert tập trung. Outbox
  chưa có dispatcher nên không được coi là cơ chế notification hoàn chỉnh.
- 69 backend tests và 12 frontend tests là baseline regression của đồ án, không
  phải chứng nhận bảo mật hay bằng chứng kiểm thử tải/DR production.

## Báo cáo lỗ hổng

Không công bố lỗ hổng trong issue công khai. Gửi mô tả, tác động, bước tái hiện và bằng chứng tới đầu mối Security của dự án.
