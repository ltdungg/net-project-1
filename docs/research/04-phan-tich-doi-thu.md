# Phân tích đối thủ, kênh thay thế và khoảng trống

**Trạng thái:** benchmark minh họa cho đồ án; chưa audit thương hiệu cụ thể  

> Điểm số trong tài liệu là archetype mô phỏng. Không được diễn giải rằng một sàn, mạng xã hội hay website cụ thể đạt/thua nếu chưa có URL, ngày đo, thiết bị, ảnh chụp và kết quả task.

## 1. Mục tiêu và phạm vi

Phân tích không nhằm “copy feature”, mà xác định kỳ vọng tối thiểu, lợi thế kênh và khoảng trống có thể sở hữu. Do chưa có danh sách thương hiệu cạnh tranh cụ thể, báo cáo dùng bốn archetype; PM cần thay bằng 5–8 đối thủ thật trước khi duyệt design.

## 2. Nhóm thay thế

| Nhóm | Job khách thuê kênh | Điểm mạnh | Điểm yếu/cơ hội cho website |
|---|---|---|---|
| Marketplace lớn | So sánh nhiều shop, voucher, logistics/payment quen thuộc | Traffic, trust platform, price discovery | Trải nghiệm brand hạn chế, cạnh tranh giá, dữ liệu khách hạn chế |
| Social/chat | Khám phá theo content/creator và hỏi nhanh | Reach, tương tác, visual storytelling | Order thủ công, thông tin không cấu trúc, tracking/đối soát yếu |
| Livestream/video commerce | Giải trí + social proof + deal thời gian thực | Urgency, demo sản phẩm, creator trust | Khó tìm lại/so sánh, dễ impulse/return, phụ thuộc lịch/platform |
| Website thương hiệu | Trải nghiệm, catalog, trust và retention sở hữu riêng | Data, brand control, SEO, margin/channel | Phải tự tạo traffic/trust/logistics; UX kém sẽ conversion thấp |

## 3. Khung đánh giá thực địa

Mỗi competitor được test cùng 8 task trên mobile, không đăng nhập trước:

1. Tìm sản phẩm bằng category/search.
2. Lọc size/màu/giá và quay lại kết quả.
3. Hiểu ảnh, chất liệu, phom và size.
4. Biết variant còn hàng.
5. Biết phí/ETA và return trước checkout.
6. Guest checkout hoặc biết khi nào phải đăng ký.
7. Chọn COD/online payment và xử lý lỗi.
8. Tra cứu order/return/help.

Chấm 0 Không có; 1 Có nhưng khó/thiếu; 2 Đạt kỳ vọng; 3 Nổi bật. Lưu screenshot/date/device, không chỉ cảm nhận.

## 4. Ma trận archetype minh họa

| Tiêu chí | Marketplace | Social/chat | Livestream | Brand site tốt | Mục tiêu MVP |
|---|---:|---:|---:|---:|---:|
| Search/filter | 3 | 0 | 0 | 2–3 | 2 |
| Brand storytelling | 1 | 2 | 3 | 3 | 2 |
| Size/fit content | 1–2 | 2 qua hỏi | 2 qua demo | 2–3 | 3 |
| Variant stock | 2–3 | 0–1 | 1 | 2–3 | 3 |
| Total transparency | 2 | 0–1 | 1–2 | 2–3 | 3 |
| Guest checkout | Platform account | Không chuẩn | Platform account | 1–3 | 3 |
| Tracking | 3 | 0–1 | 2–3 | 2–3 | 2 |
| Data ownership của brand | 1 | 1 | 1 | 3 | 3 |
| Price/promotion power | 3 | 2 | 3 | 1–3 | 2 |

Điểm là minh họa archetype, không phải audit đối thủ cụ thể.

## 5. Khoảng trống chiến lược

### 5.1 “Fit confidence” thay vì chỉ nhiều ảnh

Kết hợp size chart theo sản phẩm, hướng dẫn đo, thông tin model/phom/chất liệu và policy đổi size. Đây là cầu nối trực tiếp từ pain point sang khác biệt.

### 5.2 “Transparent transaction”

Hiển thị availability theo variant, estimate phí/ETA sớm, tổng tiền server-side và trạng thái pending/success trung thực. Không cạnh tranh chỉ bằng voucher.

### 5.3 Social-to-owned journey

Deep link từ video/social vào đúng PDP/variant/campaign; giữ attribution; website hoàn thành giao dịch và thu consent hợp lệ. Social vẫn là acquisition/content engine.

### 5.4 Operational trust

Tracking, email, cancellation/return entry point và CS có cùng order view. Customer promise phải nối với process nội bộ.

### 5.5 Customer intelligence có thể giải thích

Backoffice nên tổng hợp khách theo luật hành vi minh bạch, cho phép mở hồ sơ 360° và audit thay đổi trạng thái. Đây là năng lực vận hành nội bộ; không nên biến thành chấm điểm bí mật hoặc suy luận đặc tính nhạy cảm.

### 5.6 Hỗ trợ quyết định an toàn

Admin assistant tạo giá trị khi rút ngắn thời gian đọc dữ liệu nhưng vẫn cho người dùng kiểm tra nguồn, thời điểm và giới hạn. Baseline đồ án chọn rule-based/read-only để minh họa kiểm soát, thay vì tuyên bố dùng AI sinh nội dung tự động.

## 6. Benchmark cần thu thập

| Nhóm | Chỉ số/quan sát | Cách thu |
|---|---|---|
| Hiệu năng | LCP/INP/CLS mobile, image weight | Lighthouse/WebPageTest 3 lần |
| Khám phá | Clicks/time để tìm SKU | Task benchmark |
| PDP | Số trường fit/material/return/stock | Content audit |
| Checkout | Số bước/field, guest/account, fee timing | Walkthrough với test data |
| Trust | Company/contact/policy/review/payment cues | Heuristic audit |
| Accessibility | Keyboard, label, contrast, focus | Automated + manual sample |
| SEO | Metadata, schema, canonical, indexability | Technical audit |

## 7. Quyết định build/parity/differentiate

| Capability | Chiến lược |
|---|---|
| Search/filter/cart/payment/tracking | Đạt parity tối thiểu; không phải differentiator đầu tiên |
| Size/fit/return clarity | Differentiate và test với user |
| Video/social content | Tích hợp/deep-link, không tự xây platform video MVP |
| Voucher phức tạp/loyalty | Defer; chỉ coupon cơ bản MVP |
| Logistics/payment core | Mua/tích hợp provider, không tự xây rail |
| Catalog/order/inventory data | Sở hữu model và audit đủ để tránh lock-in nghiệp vụ |

## 8. Đối chiếu khoảng trống với hệ thống đồ án

| Năng lực | Baseline NÉT Fashion | Mức đánh giá trong đồ án | Hạn chế còn lại |
|---|---|---|---|
| Catalog/variant | 22 sản phẩm, 58 biến thể; search/filter/PDP | Có thể kiểm thử trên dataset tái tạo | Quy mô nhỏ, chưa benchmark search lớn |
| Trust giao dịch | Cart, voucher, tổng tiền server-side, guest/member checkout | Kiểm thử công thức và lỗi voucher | Chưa đo conversion thật |
| Auth | Verify email, login, refresh rotation, logout, forgot/reset | Kiểm thử vòng đời và negative authorization | Email production/MFA ngoài baseline |
| Inventory | Nhiều kho, reservation, receipt/transfer/stocktake/adjustment, movement/audit | Kiểm thử bất biến transaction | Chưa đồng bộ ERP/POS |
| Customer intelligence | Customer 360° và 06 nhóm `RFM-2026.1` | Luật có thể giải thích và kiểm thử | Chưa có campaign effectiveness |
| Fulfillment | Một phiếu giao cho mỗi kho; tracking/state/event; đồng bộ tồn và order | Test đơn một/nhiều kho, concurrency | Carrier webhook/chia kiện cùng kho ngoài phạm vi |
| Admin assistant | Copilot rule-based chỉ đọc | Đối chiếu câu trả lời với snapshot | Không phải ML/LLM; chưa có nghiên cứu với quản lý thật |
| Delivery | React/Vinext + Java/Spring Boot + PostgreSQL/Redis qua Docker | How-to-run, healthcheck và smoke test | Chưa chứng minh production scale/SLA |

Bảng này là self-assessment đối chiếu mã nguồn, không phải so sánh thị phần hay hiệu quả với đối thủ.
