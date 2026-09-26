# Hướng dẫn phỏng vấn nghiên cứu

**Trạng thái:** kịch bản nghiên cứu đề xuất, chưa có biên bản phỏng vấn thực địa  

> Mọi “theme phỏng vấn” đang xuất hiện trong bộ hồ sơ là mô phỏng để minh họa cách tổng hợp. Chỉ được chuyển trạng thái thành evidence thật khi có consent, participant ID, note/recording và synthesis log.

## 1. Mục tiêu

- Hiểu bối cảnh và quá trình ra quyết định khi mua quần áo online.
- Làm rõ nguyên nhân phía sau pain point định lượng.
- Quan sát cách khách hiểu size, giá, phí, đổi trả, payment và tracking.
- Map quy trình as-is của Marketing, Kho, CS, Finance và Owner.
- Đánh giá khả năng hiểu và vận hành các module đã xây trong đồ án: auth, voucher, inventory đa kho, Customer 360°, fulfillment và Copilot rule-based.

## 2. Kế hoạch mẫu

| Nhóm | Số người | Tiêu chí |
|---|---:|---|
| Mua thường xuyên | 3–4 | ≥2 lần/tháng |
| Mua vừa | 3–4 | Khoảng tháng/lần |
| Mua ít/đã bỏ mua | 2–4 | ≤1 lần/2–3 tháng hoặc từng abandon |
| Internal stakeholders | 5 | Owner, Marketing, Operations, CS, Finance |

Một buổi người mua 45–60 phút; nội bộ 60–90 phút. Có consent ghi âm riêng và phương án note-only.

## 3. Interview người mua

### Mở đầu — 5 phút

- Giới thiệu mục đích, không bán hàng, không có đáp án đúng.
- Xin phép ghi âm/chụp màn hình; xác nhận có thể dừng bất cứ lúc nào.
- Không yêu cầu mở thông tin tài khoản/payment thật.

### Hành vi gần nhất — 10 phút

1. Kể lại lần gần nhất bạn mua quần áo online từ lúc phát sinh nhu cầu đến khi nhận hàng.
2. Bạn bắt đầu ở kênh nào? Vì sao?
3. Bạn đã so sánh những gì và với ai/kênh nào?
4. Có lúc nào bạn định bỏ? Điều gì xảy ra?

### Đánh giá sản phẩm/size — 10 phút

1. Bạn quyết định size như thế nào? Thông tin nào thiếu?
2. Cho xem stimulus PDP: “Hãy nghĩ thành tiếng và chọn size.”
3. Điều gì làm bạn tin/không tin ảnh, chất liệu và phom?
4. Nếu hai brand ghi cùng size M nhưng khác số đo, bạn xử lý thế nào?

### Checkout/payment/return — 10 phút

1. Bạn muốn biết phí ship khi nào?
2. Vì sao chọn COD/online payment trong từng tình huống?
3. Bạn có tạo account trước lần mua đầu không? Vì sao?
4. Chính sách đổi trả nào làm bạn thấy an toàn? Hãy giải thích bằng lời của bạn.

### Sau mua — 5 phút

1. Bạn theo dõi đơn thế nào? Khi nào phải hỏi shop?
2. Điều gì khiến bạn quay lại hoặc không quay lại?
3. Nếu website chỉ sửa một vấn đề, bạn chọn gì?

## 4. Contextual usability tasks

Không dẫn cách làm. Giao nhiệm vụ:

1. “Tìm một áo đen size M trong ngân sách 700.000 và cho biết khi nào nhận được.”
2. “Xác định size phù hợp dựa trên số đo giả định.”
3. “Thêm giỏ, tìm tổng tiền và chính sách đổi size.”
4. “Checkout guest bằng dữ liệu test, chọn COD.”
5. “Tìm trạng thái đơn test.”
6. “Đăng ký tài khoản test, xác minh email, đăng nhập rồi yêu cầu đặt lại mật khẩu.”
7. “Với đơn có hai kiện, cho biết kiện nào đã giao và kiện nào còn xử lý.”

Đo: task success, thời gian, critical error, backtrack, SEQ 1–7 và quote/observation.

## 5. Phỏng vấn nội bộ

### Owner/PM

- Mục tiêu doanh thu/biên lợi nhuận/kênh; hurdle rate; phạm vi quyết định.
- Đơn/kênh/category nào quan trọng? Rủi ro chấp nhận được?

### Marketing

- Campaign flow, UTM/coupon, content workflow, reporting và attribution hiện tại.
- Ai sở hữu ảnh, size chart, SEO, banner, content freeze?

### Operations/Kho

- Vẽ quy trình order→pick→pack→ship→exception.
- Nguồn tồn kho, tần suất lệch, adjustment reason, cutoff/SLA, last-item scenario.
- Thực hiện trên dữ liệu test: nhận hàng, chuyển kho, kiểm kê và giải thích movement/reservation tương ứng.
- Xử lý một đơn hai kho; xác nhận hệ thống tạo một fulfillment cho mỗi kho và không trừ tồn của kiện còn lại khi chỉ ship một kiện.

### Customer Service

- Top contact reasons, WISMO, cancellation/return/refund, permission và escalation.
- Mẫu thông tin cần xem, trường nào phải masking/audit?
- Dùng Customer 360° để tìm khách, giải thích lịch sử đơn và kiểm tra việc thay đổi trạng thái tài khoản cần lý do.

### Quản lý/Admin

- So sánh sáu phân khúc `at_risk`, `vip`, `loyal`, `new`, `potential`, `prospect`; hỏi người dùng hiểu sai nhãn nào và cần giải thích gì.
- Đưa ba tình huống biên để kiểm tra thứ tự ưu tiên của `RFM-2026.1`, ví dụ khách VIP nhưng hơn 90 ngày chưa mua lại.
- Yêu cầu hỏi Copilot về tồn thấp, backlog đơn, doanh thu và promotion; quan sát liệu người dùng có kiểm tra thời điểm/số liệu trước khi hành động hay không.
- Xác nhận kỳ vọng đúng: Copilot là rule-based, chỉ đọc, không tự tạo phiếu kho, voucher hoặc thay đổi khách hàng.

### Finance

- Payment methods, settlement, fee, COD reconciliation, refund approval, tax/invoice và report.

## 6. Ghi chép và tổng hợp

| Trường note | Nội dung |
|---|---|
| Participant ID | Không dùng tên thật trong synthesis rộng |
| Context | Segment, tần suất, kênh; tối thiểu hóa PII |
| Observation | Hành vi quan sát được |
| Quote | Trích ngắn có consent; không chứa PII |
| Interpretation | Giả thuyết của researcher, tách khỏi observation |
| Evidence strength | 1 người / lặp lại / triangulated bằng data |
| Opportunity | Vấn đề và outcome |
| Requirement impact | PRD/story/rule liên quan |

Affinity map theo theme, không đếm quote như khảo sát định lượng. Negative cases được giữ lại thay vì loại vì không khớp giả thuyết.

## 7. Tiêu chí dừng

- Đạt minimum sample và ít nhất 2 người/segment chính.
- Hai buổi liên tiếp không xuất hiện theme critical mới là tín hiệu saturation, không phải bằng chứng tuyệt đối.
- Có đủ evidence để quyết định Must/Should hoặc xác định experiment tiếp theo.

## 8. Ma trận task cho nghiệm thu đồ án

| Vai trò | Task | Kết quả tối thiểu | Dữ liệu không được dùng |
|---|---|---|---|
| Khách | Browse→variant→voucher→checkout | Hoàn thành trên dataset 22 sản phẩm/58 biến thể | Thông tin thanh toán/thông tin cá nhân thật |
| Thành viên | Verify→login→profile→order history | Phân quyền và vòng đời token đúng | Mật khẩu dùng ngoài môi trường test |
| Nhân viên kho | Receipt/transfer/stocktake | Balance, operation, movement và audit khớp | Tồn kho doanh nghiệp thật nếu chưa được phép |
| Nhân viên giao nhận | Update tracking/status | State machine và `expectedVersion` chặn lỗi | Tracking thật của khách |
| Quản lý | Segment dashboard/Customer 360° | Một khách đúng một nhóm; PII theo quyền | Suy luận thuộc tính nhạy cảm |
| Quản lý | Copilot question | Câu trả lời khớp snapshot, không mutation | Prompt có PII không cần thiết |

Task success của nhóm nội bộ dùng để đánh giá khả năng sử dụng prototype, không chứng minh giảm chi phí hay tăng doanh thu nếu chưa có đo lường trước/sau trong môi trường thật.
