# Danh sách yêu cầu sản phẩm và câu chuyện người dùng

**Phiên bản:** 1.0 — baseline đồ án  
**Khung thời gian:** 08 tuần  
**Nguồn lực:** PM, Frontend, Backend 1, Backend 2, DevOps

> Trạng thái “baseline” thể hiện phạm vi mục tiêu và mã nguồn hiện tại của đồ án, không phải cam kết go-live thương mại. Điểm ước lượng dùng cho lập kế hoạch tương đối của nhóm năm người.

## 1. Điều kiện sẵn sàng triển khai

Story chỉ được đưa vào sprint khi có: mục tiêu/value; acceptance criteria testable; thiết kế hoặc flow cần thiết; dependency rõ; data/API impact; analytics requirement; estimate; không còn câu hỏi blocker.

## 2. Điều kiện hoàn thành

- Code review, unit/integration test pass; acceptance criteria được QA xác minh.
- Responsive, accessibility và browser scope được kiểm tra tương ứng.
- Security/privacy/logging/analytics áp dụng khi liên quan.
- Tài liệu/API/runbook cập nhật; migration forward-only có kế hoạch phục hồi/backup phù hợp.
- PO chấp nhận trên môi trường staging; không còn lỗi vượt ngưỡng DoD.

## 3. Danh sách yêu cầu MVP đã ưu tiên

| Mã | Nhóm chức năng | Câu chuyện người dùng rút gọn | Mức ưu tiên | Điểm ước lượng gợi ý | Phụ thuộc |
|---|---|---|---|---:|---|
| US-001 | Discovery | Là khách, tôi muốn duyệt category để khám phá sản phẩm. | Must | 5 | Catalog model |
| US-002 | Discovery | Tôi muốn search và xem empty state hữu ích. | Must | 5 | Search approach |
| US-003 | Discovery | Tôi muốn filter/sort và chia sẻ URL kết quả. | Must | 8 | Attribute taxonomy |
| US-004 | Product | Tôi muốn xem PDP đầy đủ ảnh, giá, mô tả, size guide. | Must | 8 | Content/design |
| US-005 | Product | Tôi muốn chọn variant và biết tồn kho. | Must | 5 | Inventory API |
| US-006 | Cart | Tôi muốn thêm/cập nhật/xóa item trong cart. | Must | 8 | Pricing/inventory |
| US-007 | Cart | Tôi muốn áp dụng coupon và hiểu lỗi. | Should | 8 | Promotion rules |
| US-008 | Checkout | Tôi muốn checkout không cần tài khoản. | Must | 8 | Address rules |
| US-009 | Checkout | Tôi muốn chọn giao hàng và thấy phí/ETA. | Must | 8 | Shipping provider |
| US-010 | Payment | Tôi muốn thanh toán COD. | Must | 3 | Order service |
| US-011 | Payment | Tôi muốn thanh toán online an toàn. | Must | 13 | Provider/merchant |
| US-012 | Order | Tôi muốn nhận xác nhận và mã đơn duy nhất. | Must | 5 | Email service |
| US-013 | Order | Tôi muốn tra cứu và xem timeline đơn. | Must | 8 | Auth/lookup rules |
| US-014 | Account | Tôi muốn đăng ký/đăng nhập/reset password. | Should | 8 | Email service |
| US-015 | Account | Tôi muốn quản lý địa chỉ/lịch sử đơn. | Should | 8 | US-014 |
| US-016 | Admin | Là admin, tôi muốn CRUD/publish product và variants. | Must | 13 | RBAC/media |
| US-017 | Inventory | Tôi muốn điều chỉnh tồn với reason/audit. | Must | 8 | Inventory model |
| US-018 | Order Admin | Tôi muốn lọc queue và chuyển trạng thái hợp lệ. | Must | 13 | State machine/RBAC |
| US-019 | Notification | Khách nhận email khi tạo/giao/hủy đơn. | Must | 5 | Email templates |
| US-020 | Analytics | PO muốn đo funnel ecommerce không trùng event. | Must | 8 | Analytics stack |
| US-021 | SEO | Marketing muốn metadata, sitemap, canonical. | Should | 5 | Rendering strategy |
| US-022 | Platform | Team muốn logging, monitoring, backup, alert. | Must | 13 | Hosting |
| US-023 | Security | Admin cần RBAC và bảo vệ endpoint. | Must | 8 | Auth architecture |
| US-024 | Content | Marketing muốn quản lý banner/content cơ bản. | Could | 8 | CMS decision |
| US-025 | Auth | Người dùng muốn xác minh email, làm mới phiên, đăng xuất và đặt lại mật khẩu an toàn. | Must | 13 | Email/token policy |
| US-026 | Wishlist | Member muốn lưu và xóa sản phẩm yêu thích. | Should | 5 | Auth + catalog |
| US-027 | Inventory | Nhân viên muốn nhập kho và có phiếu/movement/audit nguyên tử. | Must | 8 | PostgreSQL transaction |
| US-028 | Inventory | Nhân viên muốn chuyển kho mà không mất hoặc tạo thêm tồn. | Must | 13 | Multi-warehouse locking |
| US-029 | Inventory | Nhân viên muốn kiểm kê/điều chỉnh có reason và giới hạn quyền. | Must | 8 | RBAC + reserved invariant |
| US-030 | Customer | Nhân viên muốn tìm/lọc và xem Customer 360° theo đúng quyền. | Must | 8 | Auth + order history |
| US-031 | Segmentation | Quản lý muốn xem sáu phân khúc tự tính từ giao dịch. | Must | 8 | `admin_customer_segments` |
| US-032 | Customer | Quản lý muốn kích hoạt/vô hiệu hóa khách có lý do và audit. | Must | 5 | Admin customer policy |
| US-033 | Fulfillment | Hệ thống muốn tạo một phiếu giao cho mỗi kho sau checkout. | Must | 13 | Reservation + order |
| US-034 | Fulfillment | Nhân viên muốn nhập tracking và chuyển trạng thái phiếu giao an toàn. | Must | 13 | State machine + version |
| US-035 | Fulfillment | Khách muốn thấy tiến độ giao nhận của từng kiện trong đơn. | Must | 8 | Public order access |
| US-036 | Admin AI | Quản lý muốn hỏi tình trạng tồn, đơn, doanh thu và promotion bằng câu tự nhiên. | Should | 8 | Snapshot/report services |
| US-037 | DevOps | Nhóm muốn chạy toàn bộ hệ thống bằng Docker Compose. | Must | 8 | JDK/image/Postgres/Redis |

SP là seed estimate để lập kế hoạch ban đầu, không thay thế planning poker của delivery team.

### 3.1 Phân công backlog theo 04 sprint

| Sprint | PM | Frontend | Backend 1 | Backend 2 | DevOps |
|---|---|---|---|---|---|
| 1 — Tuần 1–2 | Baseline scope, RTM, acceptance | Design system, route shell | Kiến trúc, catalog/auth skeleton | Schema inventory/order/fulfillment | Compose, PostgreSQL, Redis, healthcheck |
| 2 — Tuần 3–4 | Refinement và review demo | Catalog/PDP/cart/auth UI | Catalog, auth lifecycle, cart/voucher | Inventory read/operation APIs | CI và cấu hình môi trường |
| 3 — Tuần 5–6 | UAT giao dịch | Checkout, account, admin inventory | Order/payment/customer API | Reservation, inventory ops, fulfillment theo kho | Migration/test container/logging |
| 4 — Tuần 7–8 | Nghiệm thu, báo cáo, traceability | Customer/fulfillment/Copilot UI, accessibility | Customer segmentation/RBAC hardening | Fulfillment state/inventory reconciliation/Copilot rules | Build images, smoke, runbook, recovery drill |

Mỗi đầu việc có một người chủ trì; cross-review không làm thay đổi ownership. PM chịu trách nhiệm điều phối và nghiệm thu, không được tính như một lập trình viên dự phòng toàn thời gian.

## 4. Điều kiện nghiệm thu mẫu

### US-005 — Chọn variant và kiểm tra tồn

```gherkin
Scenario: Thêm variant còn hàng vào giỏ
  Given sản phẩm đã published và variant Size M/Màu Đen có ATP lớn hơn 0
  When khách chọn đầy đủ Size M, Màu Đen và bấm "Thêm vào giỏ"
  Then server xác minh variant còn bán và còn tồn
  And cart chứa đúng variant, số lượng và giá hiện hành
  And sự kiện add_to_cart chỉ được phát sau khi server xác nhận

Scenario: Variant hết hàng
  Given variant đã hết ATP
  When khách chọn variant đó
  Then CTA thêm giỏ bị vô hiệu hóa
  And giao diện hiển thị trạng thái hết hàng
```

### US-011 — Thanh toán online

```gherkin
Scenario: Provider xác nhận thanh toán thành công
  Given order đang chờ thanh toán và payment attempt còn hiệu lực
  When hệ thống nhận callback hợp lệ đã xác minh chữ ký
  Then payment chuyển sang `succeeded` đúng một lần
  And order chuyển sang `confirmed` theo rule
  And callback lặp lại không tạo thêm order, payment hoặc inventory movement

Scenario: Khách quay lại trước callback
  Given provider chưa gửi kết quả cuối cùng
  When khách quay về website
  Then hệ thống hiển thị trạng thái đang xử lý
  And client không tự đánh dấu thanh toán thành công
```

### US-018 — Chuyển trạng thái đơn

```gherkin
Scenario: Chuyển đơn đã xác nhận sang đang chuẩn bị
  Given nhân viên có quyền order_fulfill
  And order đang ở `confirmed`
  When nhân viên chuyển sang `processing`
  Then transition được chấp nhận
  And audit log ghi actor, thời gian, trạng thái cũ/mới và ghi chú

Scenario: Transition không hợp lệ
  Given order đang ở `cancelled`
  When nhân viên cố chuyển sang `shipped`
  Then hệ thống từ chối và không thay đổi dữ liệu
```

### US-031 — Phân khúc khách hàng tự động

```gherkin
Scenario: Một khách chỉ thuộc một phân khúc
  Given khách có 5 đơn đã thanh toán và đơn gần nhất cách hiện tại 10 ngày
  When quản lý mở dashboard khách hàng
  Then khách thuộc phân khúc VIP theo bộ quy tắc RFM-2026.1
  And khách không đồng thời xuất hiện ở Trung thành hoặc Tiềm năng

Scenario: Khách đã mua lâu ngày cần chăm sóc
  Given khách có ít nhất một đơn đã thanh toán
  And lần thanh toán gần nhất quá 90 ngày
  When hệ thống tính lại read model
  Then phân khúc ưu tiên là at_risk
```

### US-033/034 — Fulfillment theo kho

```gherkin
Scenario: Checkout tạo phiếu giao theo warehouse
  Given đơn có reservation hợp lệ tại hai kho khác nhau
  When giao dịch tạo đơn commit thành công
  Then hệ thống tạo đúng hai fulfillment
  And mỗi order item và reservation được liên kết với đúng fulfillment của kho

Scenario: Bàn giao một kiện
  Given fulfillment đang ready_to_ship và có carrier/tracking hợp lệ
  When nhân viên chuyển sang shipped với expectedVersion hiện tại
  Then chỉ reservation của fulfillment đó được consume một lần
  And fulfillment event, inventory movement, audit và trạng thái tổng hợp được ghi nhất quán
```

### US-036 — Copilot rule-based chỉ đọc

```gherkin
Scenario: Hỏi về tồn kho thấp
  Given snapshot quản trị có danh sách SKU dưới reorder point
  When quản lý hỏi “SKU nào cần nhập thêm?”
  Then Copilot trả kết quả từ dữ liệu snapshot và thời điểm tính
  And câu trả lời không tự tạo phiếu nhập, điều chỉnh tồn hoặc promotion
  And giao diện nhắc người dùng kiểm tra dữ liệu trước khi quyết định
```

## 5. Lịch rà soát và làm rõ yêu cầu

- Refinement 1–2 lần/tuần; chuẩn bị tối thiểu 1.5–2 sprint Ready.
- PO quyết định priority; team quyết định estimate và cách triển khai.
- BA giữ traceability; UX/Tech/QA tham gia story có dependency tương ứng.
- Mọi split story vẫn phải tạo vertical value testable, tránh tách đơn thuần theo layer.

## 6. Quy ước trạng thái khi viết báo cáo

| Trạng thái | Ý nghĩa | Evidence tối thiểu |
|---|---|---|
| Đã hiện thực | Có UI/API/schema và chạy được trong baseline Docker | Commit/file + test/smoke hoặc ảnh demo |
| Một phần | Có một số lớp nhưng chưa đủ luồng đầu-cuối | Ghi rõ lớp đã có và phần còn thiếu |
| Thiết kế | Có yêu cầu/sơ đồ nhưng chưa có mã chạy | Không dùng từ “đã hoàn thành” |
| Ngoài phạm vi | Không thuộc nghiệm thu 08 tuần | Đưa vào roadmap, không tính completion |
