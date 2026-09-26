# Hồ sơ định tính và nghiệp vụ mô phỏng — Project 1

> **SYN — DỮ LIỆU GIẢ LẬP CÓ CHỦ ĐÍCH.** Toàn bộ nhân vật, phát hiện, lời trích, giao dịch, SKU, kho, carrier, tracking và số dư trong bộ này do tác giả tạo giả lập cho học tập. Không có phỏng vấn thực địa, đơn thật, thu/hoàn tiền thật, ghi âm, chữ ký hoặc consent của người thật. Chỉ minh họa quy trình phân tích yêu cầu; không suy ra tỷ lệ thực tế.

Phiên bản 1.0 · Mã bộ SYN-P1-QUAL-2026.1 · Ngày tạo tài liệu 2026-09-03 (không phải ngày khảo sát).

## 1. Quy ước, nguồn và phạm vi

docs/project-1/bao-cao-khao-sat-va-mo-hinh-he-thong.md; docs/ba/01-brd-srs.md; AdminFulfillmentService.reconcileOrder; InventoryService; mốc đối chiếu workspace 03/09/2026.

Mỗi đơn/chứng từ là một snapshot kịch bản độc lập, không phải chuỗi inventory ledger liên tục. Các dòng trong cùng đơn/chứng từ nhất quán nội bộ. Reference receipt hàng hoàn chỉ minh họa truy vết, không nối toàn bộ số dư giữa các mẫu.

N4–N7 chỉ là mốc mô phỏng trong kế hoạch; không phải ngày phỏng vấn/quan sát thực địa.

Tiền là số nguyên VND, không phải schema price_cents; subtotal = tổng quantity × unitPriceVnd; total = subtotal - discount + shipping. Coupon/ship giả định riêng cho bộ mẫu. Tổng tiền các mẫu không phải doanh thu.

Lấy mẫu có chủ đích để bao phủ tình huống; không phải mẫu xác suất. 20 đơn gồm 10 COD/10 online, 10 một kho/10 hai kho; 10 chứng từ gồm 3 receipt/3 transfer/2 stocktake/2 adjustment.

Ký hiệu hiện trạng: `CURRENT` = baseline có/được mô tả, chưa là nghiệm thu; `PROPOSED` = mong muốn/mở rộng; `KNOWN_DEFECT` = còn sai lệch từ đối chiếu code. Không biến tần suất 48 nhận định hoặc 30 hồ sơ thành tỷ lệ khách hàng/giao dịch thật.

## 2. Danh mục 12 biên bản mô phỏng

| Mã SYN | Mốc giả lập | Vai trò giả định | Nhóm |
|---|---|---|---|
| SYN-PV-KH-01 | N4 | Khách mua thường xuyên | Người mua |
| SYN-PV-KH-02 | N4 | Khách mua thường xuyên | Người mua |
| SYN-PV-KH-03 | N5 | Khách mua thường xuyên | Người mua |
| SYN-PV-KH-04 | N5 | Khách mua tần suất trung bình | Người mua |
| SYN-PV-KH-05 | N5 | Khách mua tần suất trung bình | Người mua |
| SYN-PV-KH-06 | N6 | Khách mua tần suất trung bình | Người mua |
| SYN-PV-KH-07 | N6 | Khách mua ít/từng bỏ mua | Người mua |
| SYN-PV-KH-08 | N6 | Khách mua ít/từng bỏ mua | Người mua |
| SYN-PV-VH-01 | N4 | Quản lý cửa hàng giả định | Vận hành |
| SYN-PV-VH-02 | N5 | Nhân viên kho giả định | Vận hành |
| SYN-PV-VH-03 | N6 | Nhân viên xử lý đơn/CS giả định | Vận hành |
| SYN-PV-VH-04 | N7 | Người phụ trách thanh toán giả định | Vận hành |

Mỗi biên bản bên dưới là kịch bản đã soạn đủ nội dung, không phải bản ghi âm/chuyển lời của một cuộc trao đổi. Không có tên, người ký hoặc consent giả.

### SYN-PV-KH-01 — Khách mua thường xuyên

Mốc: **N4 mô phỏng**. Bối cảnh: Nhân vật giả định 18–24 tuổi; mua 2–3 lần/tháng bằng điện thoại, ngân sách thường 300.000–499.000đ.

**Kịch bản giao dịch:** Tìm áo thun đen size M, so sánh số đo và thử mã giảm trước khi đặt đơn COD một kho.

**Phát hiện giả định:**

- **SYN-PV-KH-01-F1 · SIZE_INFO · Must · CURRENT.** Nhãn M chưa đủ để nhân vật quyết định; cần số đo, chất liệu và phom được đặt gần bộ chọn biến thể.

  Lời giả định SYN: “Tôi muốn xem số đo áo ngay khi chọn size, vì chữ M mỗi mẫu có thể khác nhau.”

  Truy vết: P1-FR-02.

- **SYN-PV-KH-01-F2 · VARIANT_AVAILABILITY · Must · CURRENT.** Nhân vật giả định đổi màu để tìm size còn hàng; trạng thái hết hàng phải gắn đúng tổ hợp màu–size.

  Lời giả định SYN: “Nếu màu đen hết size M thì hãy báo ở đúng ô đó, đừng chỉ ghi sản phẩm còn hàng.”

  Truy vết: P1-FR-02, P1-FR-12.

- **SYN-PV-KH-01-F3 · FILTER_CONTEXT · Must · CURRENT.** Bộ lọc giá, danh mục và sắp xếp giúp thu hẹp lựa chọn; kết quả rỗng cần cho biết bộ lọc đang áp dụng.

  Lời giả định SYN: “Tôi cần thấy mình đang lọc gì để bỏ bớt điều kiện khi không tìm thấy áo.”

  Truy vết: P1-FR-01.

- **SYN-PV-KH-01-F4 · VOUCHER_THRESHOLD · Must · PROPOSED.** Nhân vật có thể hiểu nhầm giá sau mã với giá niêm yết; giao diện cần nêu ngưỡng và tổng được tính lại.

  Lời giả định SYN: “Mã chưa đủ mức mua thì hãy cho biết còn thiếu bao nhiêu, đừng chỉ ghi không dùng được.”

  Truy vết: P1-FR-05, P1-FR-06.

**Kết luận SYN:** Ưu tiên thông tin SKU và giải thích giá; gợi ý số tiền còn thiếu cho voucher là cải tiến UX cần xác nhận, không khẳng định đã có.

### SYN-PV-KH-02 — Khách mua thường xuyên

Mốc: **N4 mô phỏng**. Bối cảnh: Nhân vật giả định 25–34 tuổi; mua từ hai lần/tháng, quen COD, thường mua cả bộ.

**Kịch bản giao dịch:** Đặt áo và quần được phân bổ từ hai kho; một kiện đã giao trong khi kiện còn lại đang vận chuyển.

**Phát hiện giả định:**

- **SYN-PV-KH-02-F1 · PARCEL_VISIBILITY · Must · CURRENT.** Nhân vật cần danh sách hàng bên trong từng kiện và trạng thái riêng để không tưởng đơn bị thiếu.

  Lời giả định SYN: “Tôi đã nhận áo nhưng chưa có quần; trang đơn cần cho biết quần thuộc kiện nào.”

  Truy vết: P1-FR-10, P1-FR-17, P1-FR-18.

- **SYN-PV-KH-02-F2 · AGGREGATE_LABEL · Must · CURRENT.** Một kiện delivered không làm toàn đơn thành delivered; thông báo cần phân biệt hoàn tất từng kiện và toàn đơn.

  Lời giả định SYN: “Nhận một kiện chưa có nghĩa tôi đã nhận đủ đơn.”

  Truy vết: P1-FR-17, P1-FR-18.

- **SYN-PV-KH-02-F3 · COD_SCOPE · Must · PROPOSED.** Nhân vật hỏi số tiền thu theo từng kiện. Code chỉ ghi COD paid khi mọi kiện delivered, chưa có sổ thu tiền phân bổ từng kiện.

  Lời giả định SYN: “Nếu giao hai lần thì ai thu bao nhiêu ở mỗi lần? Tôi muốn biết trước khi nhận.”

  Truy vết: P1-FR-08, P1-FR-18, P1-FR-23.

- **SYN-PV-KH-02-F4 · SPLIT_SHIPPING_COST · Must · CURRENT.** Nhân vật mong giá cuối không tự phát sinh phí khi hệ thống chia kho; cần giữ snapshot đã xác nhận và giải thích chính sách.

  Lời giả định SYN: “Shop chia hai kho thì đừng làm tổng tiền đã chốt tự tăng lên.”

  Truy vết: P1-FR-05, P1-FR-07.

**Kết luận SYN:** Theo dõi đa kiện thuộc phạm vi hiện tại; thu COD chi tiết theo từng kiện là yêu cầu mở rộng, không mô tả như chức năng đang có.

### SYN-PV-KH-03 — Khách mua thường xuyên

Mốc: **N5 mô phỏng**. Bối cảnh: Nhân vật giả định 25–34 tuổi; mua hằng tuần, ưu tiên tài khoản và thanh toán trước mô phỏng.

**Kịch bản giao dịch:** Đăng nhập thành viên, chọn địa chỉ đã lưu, xem wishlist và đặt lại một mẫu từ lịch sử bằng thao tác tìm sản phẩm.

**Phát hiện giả định:**

- **SYN-PV-KH-03-F1 · ACCOUNT_VALUE · Should · CURRENT.** Nhân vật thấy tài khoản hữu ích khi có địa chỉ, wishlist và lịch sử; lời mời đăng ký nên nêu lợi ích cụ thể.

  Lời giả định SYN: “Tôi đăng ký để khỏi nhập lại địa chỉ và xem các đơn trước, không chỉ để nhận quảng cáo.”

  Truy vết: P1-FR-03, P1-FR-04.

- **SYN-PV-KH-03-F2 · OWNERSHIP · Must · CURRENT.** Dữ liệu tài khoản và đơn cần giới hạn chủ sở hữu; đổi tài khoản không được tiếp tục thấy đơn của phiên trước.

  Lời giả định SYN: “Khi tôi đăng xuất, người tiếp theo dùng máy không được xem đơn của tôi.”

  Truy vết: P1-FR-03, P1-FR-04, P1-FR-10.

- **SYN-PV-KH-03-F3 · SAVED_ADDRESS_REVIEW · Must · CURRENT.** Địa chỉ lưu sẵn vẫn cần bước kiểm tra; snapshot đơn không thay đổi theo việc sửa hồ sơ sau đó.

  Lời giả định SYN: “Tôi sửa sổ địa chỉ sau khi mua thì đơn cũ vẫn phải giữ nơi giao đã chốt.”

  Truy vết: P1-FR-04, P1-FR-07.

- **SYN-PV-KH-03-F4 · REORDER_BOUNDARY · Should · PROPOSED.** Nhân vật mong nút mua lại nhưng giá/tồn phải kiểm tra lại. Nút mua lại một chạm chưa được xác nhận trong baseline.

  Lời giả định SYN: “Nếu mua lại, hãy báo giá và size còn hiện tại, đừng tự chép giá của đơn cũ.”

  Truy vết: P1-FR-01, P1-FR-04, P1-FR-05.

**Kết luận SYN:** Tài khoản hỗ trợ phục vụ khách quay lại; một chạm mua lại là ứng viên phát triển, không thuộc kết luận đã hiện thực.

### SYN-PV-KH-04 — Khách mua tần suất trung bình

Mốc: **N5 mô phỏng**. Bối cảnh: Nhân vật giả định 25–34 tuổi; khoảng một đơn/tháng, thường mua guest.

**Kịch bản giao dịch:** Giỏ có hai SKU; mã SYN-GIAM50 yêu cầu subtotal từ 500.000đ, một lần thử chưa đạt ngưỡng rồi bổ sung hàng.

**Phát hiện giả định:**

- **SYN-PV-KH-04-F1 · TRANSPARENT_TOTAL · Must · CURRENT.** Nhân vật phân biệt subtotal, giảm giá và phí giao khi chúng nằm cùng một khối trước nút đặt.

  Lời giả định SYN: “Tôi cần biết số phải trả, không muốn tự cộng tiền hàng rồi đoán phí ship.”

  Truy vết: P1-FR-05, P1-FR-06, P1-FR-07.

- **SYN-PV-KH-04-F2 · VOUCHER_RECHECK · Must · CURRENT.** Nhân vật xóa một dòng sau khi áp mã; tổng phải tính lại và nêu mã không còn hợp lệ.

  Lời giả định SYN: “Tôi bỏ bớt hàng thì đừng giữ mức giảm cũ nếu đơn không còn đủ điều kiện.”

  Truy vết: P1-FR-05, P1-FR-06.

- **SYN-PV-KH-04-F3 · GUEST_CHOICE · Must · CURRENT.** Nhân vật muốn hoàn tất đơn trước khi quyết định có tạo tài khoản; guest vẫn cần cách tra cứu an toàn.

  Lời giả định SYN: “Lần đầu tôi muốn mua thử, nhưng vẫn cần đường xem lại đơn của mình.”

  Truy vết: P1-FR-07, P1-FR-10.

- **SYN-PV-KH-04-F4 · ACTIONABLE_ERRORS · Must · PROPOSED.** Thông báo lỗi cần nêu trường cần sửa và giữ dữ liệu hợp lệ, tránh khiến người dùng nhập lại toàn bộ.

  Lời giả định SYN: “Sai số điện thoại thì chỉ giúp tôi sửa chỗ đó, đừng xóa cả giỏ và địa chỉ.”

  Truy vết: P1-FR-05, P1-FR-07.

**Kết luận SYN:** Minh bạch tổng tiền và guest checkout là ưu tiên; các chi tiết wording/giữ form cần usability test chứ chưa phải nghiệm thu.

### SYN-PV-KH-05 — Khách mua tần suất trung bình

Mốc: **N5 mô phỏng**. Bối cảnh: Nhân vật giả định 35–44 tuổi; mua mỗi tháng, thận trọng với thanh toán trước.

**Kịch bản giao dịch:** Đăng ký tài khoản test, thử quên mật khẩu rồi xem luồng online payment mô phỏng cho một đơn guest khác.

**Phát hiện giả định:**

- **SYN-PV-KH-05-F1 · PAYMENT_TRUTH · Must · CURRENT.** Nhân vật cần phân biệt màn hình quay lại website với thanh toán được backend xác nhận; không coi redirect là đã trả tiền.

  Lời giả định SYN: “Quay về trang shop chưa đủ, tôi cần trạng thái thanh toán được xác nhận rõ.”

  Truy vết: P1-FR-08, P1-FR-09.

- **SYN-PV-KH-05-F2 · MOCK_DISCLOSURE · Must · CURRENT.** Trong đồ án, nút thanh toán phải được giải thích là mô phỏng và không thu tiền thật.

  Lời giả định SYN: “Nếu đây là bản thử thì hãy nói rõ, tôi không muốn nhập thông tin ngân hàng thật.”

  Truy vết: P1-FR-08.

- **SYN-PV-KH-05-F3 · AUTH_RECOVERY · Must · CURRENT.** Nhân vật cần thông báo hợp lý khi token reset hết hạn và thao tác yêu cầu lại, không lộ có hay không một email.

  Lời giả định SYN: “Liên kết hết hạn thì hướng dẫn tôi xin liên kết mới thay vì báo lỗi khó hiểu.”

  Truy vết: P1-FR-03.

- **SYN-PV-KH-05-F4 · GUEST_HEADER_CONTRACT · Must · KNOWN_DEFECT.** Trang payment guest hiện lệch contract token query/header theo KD-GUEST-01; đây là sai lệch code, không phải lỗi được người thật quan sát.

  Lời giả định SYN: “Với tình huống giả định này, tôi mong chỉ xem được đơn được cấp quyền mà không thấy mã bảo mật trên URL.”

  Truy vết: P1-FR-10.

**Kết luận SYN:** Biên bản dùng kỳ vọng giả định để giải thích yêu cầu; KD-GUEST-01 được lấy từ đối chiếu code và không gán thành phát hiện thực địa.

### SYN-PV-KH-06 — Khách mua tần suất trung bình

Mốc: **N6 mô phỏng**. Bối cảnh: Nhân vật giả định 18–24 tuổi; khoảng một đơn/tháng, ngân sách dưới 500.000đ, thường dùng màn hình nhỏ.

**Kịch bản giao dịch:** Lọc quần theo giá, chuyển màu/size và kiểm tra tổng tiền trên màn hình rộng 360 px.

**Phát hiện giả định:**

- **SYN-PV-KH-06-F1 · MOBILE_SELECTION · Must · PROPOSED.** Bộ chọn size, số lượng và nút thêm giỏ cần nhìn được trên màn hình hẹp; lỗi không nằm ngoài vùng thấy.

  Lời giả định SYN: “Tôi muốn chọn size mà không phải kéo ngang hoặc đoán nút đang chọn.”

  Truy vết: P1-FR-01, P1-FR-02, P1-FR-05.

- **SYN-PV-KH-06-F2 · IMAGE_DETAIL · Must · CURRENT.** Nhân vật cần ảnh đủ rõ để xem chất liệu và màu; ảnh là thông tin mô tả chứ không cam kết màu tuyệt đối.

  Lời giả định SYN: “Có ảnh cận chất vải thì tôi dễ quyết định hơn một ảnh chụp xa.”

  Truy vết: P1-FR-02.

- **SYN-PV-KH-06-F3 · NO_STOCK_PROMISE · Must · CURRENT.** Giỏ chưa giữ tồn; nhân vật cần được báo khi SKU hết hàng lúc checkout và có hướng chọn khác.

  Lời giả định SYN: “Tôi hiểu giỏ chưa chắc giữ hàng, nhưng lúc hết size phải báo rõ để tôi đổi.”

  Truy vết: P1-FR-02, P1-FR-07, P1-FR-13.

- **SYN-PV-KH-06-F4 · SHIPPING_DISCOUNT_LABEL · Must · CURRENT.** Nếu có ưu đãi vận chuyển, nhãn giảm phí và giảm hàng cần tách để giải thích tổng; thử nghiệm diễn giải cần xác nhận.

  Lời giả định SYN: “Miễn phí ship khác giảm tiền hàng, tôi muốn thấy từng khoản rõ ràng.”

  Truy vết: P1-FR-05, P1-FR-06.

**Kết luận SYN:** Tính dễ dùng trên mobile là mục tiêu cần kiểm chứng; không dùng tình huống SYN để khẳng định đã đạt WCAG hoặc task success.

### SYN-PV-KH-07 — Khách mua ít/từng bỏ mua

Mốc: **N6 mô phỏng**. Bối cảnh: Nhân vật giả định 35–44 tuổi; một đơn mỗi 2–3 tháng, từng lo ngại đổi size.

**Kịch bản giao dịch:** Xem điều kiện đổi trả trước mua, sau đó diễn tập một đơn COD đã xuất kho bị hoàn toàn bộ.

**Phát hiện giả định:**

- **SYN-PV-KH-07-F1 · RETURN_POLICY · Must · PROPOSED.** Nhân vật cần biết điều kiện, thời hạn và kênh liên hệ trước khi mua; nội dung policy không đồng nghĩa có workflow tự động.

  Lời giả định SYN: “Tôi muốn đọc điều kiện đổi size trước khi trả tiền, không phải chờ có vấn đề mới hỏi.”

  Truy vết: P1-FR-02, P1-FR-19.

- **SYN-PV-KH-07-F2 · RETURN_NOT_REFUND · Must · CURRENT.** Nhân vật dễ hiểu returned là đã hoàn tiền; hệ thống cần tách trạng thái giao nhận và thanh toán.

  Lời giả định SYN: “Hàng đã quay lại shop không tự có nghĩa tiền đã được trả lại cho tôi.”

  Truy vết: P1-FR-09, P1-FR-19, P1-FR-23.

- **SYN-PV-KH-07-F3 · INSPECTION_SEPARATE · Must · PROPOSED.** Trong kịch bản, hàng hoàn cần kiểm định trước khi nhập lại tồn; tài liệu kiểm định hiện quản lý ngoài hệ thống.

  Lời giả định SYN: “Tôi muốn shop xác nhận đã nhận hàng và đang kiểm tra, thay vì chỉ ghi đơn đóng.”

  Truy vết: P1-FR-14, P1-FR-19.

- **SYN-PV-KH-07-F4 · NO_SELF_SERVICE_REFUND · Should · PROPOSED.** Nhân vật mong gửi yêu cầu hoàn tiền trực tuyến; baseline chưa có refund command hoặc bảng refunds.

  Lời giả định SYN: “Có nơi gửi yêu cầu và theo dõi hoàn tiền sẽ dễ hơn việc phải nhắn nhiều lần.”

  Truy vết: P1-FR-19, P1-FR-23.

**Kết luận SYN:** Nhu cầu đổi/hoàn được giữ như phát hiện SYN, nhưng return case, kiểm định và hoàn tiền tự phục vụ là ngoài phạm vi hiện tại.

### SYN-PV-KH-08 — Khách mua ít/từng bỏ mua

Mốc: **N6 mô phỏng**. Bối cảnh: Nhân vật giả định 25–34 tuổi; mua ít hơn mỗi tháng, từng dừng khi kết nối không ổn định.

**Kịch bản giao dịch:** Gửi lại yêu cầu checkout sau timeout mô phỏng, rồi xem lý do một kiện giao thất bại.

**Phát hiện giả định:**

- **SYN-PV-KH-08-F1 · RETRY_SAFETY · Must · CURRENT.** Nhân vật bấm lại khi không thấy phản hồi; cùng idempotency key phải nhận lại đơn cũ, không tạo đơn thứ hai.

  Lời giả định SYN: “Mạng chậm thì tôi có thể bấm lại; tôi không muốn nhận hai đơn giống nhau.”

  Truy vết: P1-FR-07.

- **SYN-PV-KH-08-F2 · STABLE_FEEDBACK · Must · PROPOSED.** Trạng thái đang xử lý cần rõ; chỉ có phản hồi server mới kết luận đã tạo đơn. Việc hiển thị cụ thể cần kiểm tra UX.

  Lời giả định SYN: “Nếu chưa biết thành công hay chưa, hãy cho tôi cách kiểm tra thay vì bắt đoán.”

  Truy vết: P1-FR-07, P1-FR-10.

- **SYN-PV-KH-08-F3 · DELIVERY_FAILURE_REASON · Must · CURRENT.** Giao thất bại phải có lý do và hướng liên hệ; số lần giao là dữ liệu mô phỏng/thao tác nhân viên, chưa đồng bộ hãng thật.

  Lời giả định SYN: “Đơn giao không thành công cần nói vì sao và tôi nên làm gì tiếp theo.”

  Truy vết: P1-FR-18, P1-FR-19.

- **SYN-PV-KH-08-F4 · MINIMUM_DISCLOSURE · Must · CURRENT.** Tra cứu/CS chỉ nên hiển thị dữ liệu cần thiết và không lộ đơn người khác khi nhập sai mã.

  Lời giả định SYN: “Tôi muốn tra đúng đơn của mình mà không nhìn thấy thông tin của khách khác.”

  Truy vết: P1-FR-10, P1-FR-20.

**Kết luận SYN:** Chống lặp và tra cứu có quyền là yêu cầu kỹ thuật hiện tại; biên bản không khẳng định đã quan sát lỗi mạng hay giao lỗi thực tế.

### SYN-PV-VH-01 — Quản lý cửa hàng giả định

Mốc: **N4 mô phỏng**. Bối cảnh: Vai trò vận hành mô phỏng do PM dùng để khai thác yêu cầu; không đại diện doanh nghiệp cụ thể.

**Kịch bản giao dịch:** Đọc dashboard, xem khách theo sáu phân khúc, hỏi Copilot về tồn thấp và thử lập quyết định khuyến mãi.

**Phát hiện giả định:**

- **SYN-PV-VH-01-F1 · SEGMENT_EXPLANATION · Should · CURRENT.** Quản lý cần giải thích ruleVersion và thứ tự phân khúc; không tự gán nhóm từ tuổi/giới tính hoặc sửa nhãn tay.

  Lời giả định SYN: “Tôi muốn biết vì sao khách ở nhóm có nguy cơ rời bỏ, không chỉ nhìn một màu nhãn.”

  Truy vết: P1-FR-20, P1-FR-21.

- **SYN-PV-VH-01-F2 · COPILOT_READ_ONLY · Should · CURRENT.** Copilot hiện theo luật đọc snapshot; quản lý cần nhìn thời điểm và số liệu gốc, tự quyết định thao tác ở màn hình có quyền.

  Lời giả định SYN: “Trợ lý nên giúp tôi đọc số liệu, còn quyết định đổi tồn hoặc giảm giá phải do người có quyền làm.”

  Truy vết: P1-FR-23, P1-FR-24.

- **SYN-PV-VH-01-F3 · CATALOG_CRUD_GAP · Must · PROPOSED.** Nhu cầu quản lý gồm sửa/ngừng bán, trong khi FR-22 hiện chỉ một phần xem/tạo/media; không đánh dấu đủ CRUD.

  Lời giả định SYN: “Tôi còn cần sửa thông tin và ngừng bán mẫu cũ, không chỉ thêm sản phẩm mới.”

  Truy vết: P1-FR-22.

- **SYN-PV-VH-01-F4 · AUDIT_ACCOUNT_ACTION · Must · CURRENT.** Khóa khách cần đúng quyền Admin, lý do và audit; Manager không được mặc nhiên thay trạng thái tài khoản.

  Lời giả định SYN: “Ai khóa tài khoản và vì sao phải tra lại được, không chỉ thấy nút biến mất.”

  Truy vết: P1-FR-20.

**Kết luận SYN:** Các gợi ý hỗ trợ quyết định không tự thay dữ liệu. Nhu cầu CRUD catalog hoàn chỉnh là khoảng trống, không phải bằng chứng đã triển khai.

### SYN-PV-VH-02 — Nhân viên kho giả định

Mốc: **N5 mô phỏng**. Bối cảnh: Vai trò vận hành mô phỏng khảo sát bởi Backend 2; thao tác bằng hồ sơ và số dư giả lập.

**Kịch bản giao dịch:** Nhận hàng, chuyển một SKU giữa hai kho, kiểm kê lệch và đối chiếu giữ chỗ của một đơn đa kho.

**Phát hiện giả định:**

- **SYN-PV-VH-02-F1 · BALANCE_MEANING · Must · CURRENT.** Kho cần thấy on-hand, reserved, available và ATP; checkout dùng available chứ chưa dùng safety stock làm ngưỡng chặn bán.

  Lời giả định SYN: “Có 10 chiếc nhưng 7 chiếc đã giữ cho đơn thì tôi chỉ còn 3 chiếc tự do.”

  Truy vết: P1-FR-12, P1-FR-13.

- **SYN-PV-VH-02-F2 · TRANSFER_ATOMIC · Must · CURRENT.** Chuyển kho phải ghi đủ cặp transfer_out/in cùng reference và không làm nguồn thấp hơn reserved.

  Lời giả định SYN: “Nếu đã trừ kho nguồn mà cộng kho đích lỗi, tôi cần cả hai cùng quay lại.”

  Truy vết: P1-FR-15.

- **SYN-PV-VH-02-F3 · SINGLE_LINE_POSTED · Should · PROPOSED.** Chứng từ hiện một dòng mỗi command và posted ngay; quy trình nháp–phê duyệt nhiều dòng là yêu cầu mở rộng.

  Lời giả định SYN: “Một phiếu nhiều SKU và bước duyệt sẽ tiện, nhưng tôi hiểu bản này đang ghi từng dòng.”

  Truy vết: P1-FR-14, P1-FR-16.

- **SYN-PV-VH-02-F4 · RESERVATION_EXPIRY · Must · KNOWN_DEFECT.** Kho muốn reservation quá hạn được xử lý và payment khớp order; KD-INV-01/02 đang khiến kỳ vọng này chưa đầy đủ.

  Lời giả định SYN: “Đơn không còn hiệu lực thì hàng giữ chỗ phải được giải thích rõ để kho biết có thể bán hay chưa.”

  Truy vết: P1-FR-13.

**Kết luận SYN:** Điểm mấu chốt là bất biến on_hand≥reserved và chứng từ nguyên tử. Chưa có approval workflow; expiry còn hai known defects.

### SYN-PV-VH-03 — Nhân viên xử lý đơn/CS giả định

Mốc: **N6 mô phỏng**. Bối cảnh: Vai trò vận hành mô phỏng khảo sát bởi Backend 1/2; không có nhà vận chuyển thực tham gia.

**Kịch bản giao dịch:** Gán carrier/tracking giả, chuyển kiện sang shipped, xử lý failed và nhận returned sau xuất kho.

**Phát hiện giả định:**

- **SYN-PV-VH-03-F1 · WAREHOUSE_FULFILLMENT · Must · CURRENT.** Một đơn nhiều kho có một fulfillment mỗi kho; nhân viên cần đúng danh sách item và reservation của kiện đang xử lý.

  Lời giả định SYN: “Tôi bàn giao kiện kho Hà Nội thì chỉ hàng ở kiện đó được xuất, không phải cả đơn.”

  Truy vết: P1-FR-13, P1-FR-17, P1-FR-18.

- **SYN-PV-VH-03-F2 · TRACKING_VERSION · Must · CURRENT.** Trước shipped phải có carrier/tracking; expectedVersion phát hiện hai người cập nhật đồng thời.

  Lời giả định SYN: “Nếu đồng nghiệp vừa sửa mã vận đơn, thao tác của tôi cần báo xung đột chứ không đè mất.”

  Truy vết: P1-FR-18.

- **SYN-PV-VH-03-F3 · RETURN_INSPECTION · Must · CURRENT.** Returned sau ship giữ reservation consumed và không tự cộng tồn. Kho kiểm định ngoài hệ thống rồi lập receipt có reference.

  Lời giả định SYN: “Hàng quay lại chưa chắc bán được ngay; phải kiểm tra rồi mới nhập lại tồn.”

  Truy vết: P1-FR-14, P1-FR-19.

- **SYN-PV-VH-03-F4 · MIXED_OUTCOME_LIMIT · Should · PROPOSED.** Baseline chặn kết quả delivered/returned trộn giữa sibling; xử lý giao một phần–hoàn một phần cần thiết kế đối soát riêng.

  Lời giả định SYN: “Nếu một kiện khách giữ còn kiện khác trả, tôi cần quy trình rõ thay vì tự sửa trạng thái.”

  Truy vết: P1-FR-18, P1-FR-19, P1-FR-23.

**Kết luận SYN:** Carrier/tracking được nhập tay, không phải API ship. Không mô tả tình huống delivered/returned hỗn hợp như luồng được hỗ trợ.

### SYN-PV-VH-04 — Người phụ trách thanh toán giả định

Mốc: **N7 mô phỏng**. Bối cảnh: Vai trò vận hành mô phỏng khảo sát bởi Backend 1; tất cả payment là giả lập, không thu tiền thật.

**Kịch bản giao dịch:** Đối chiếu order/payment, nhận webhook trùng và muộn, xem COD hai kiện và một khoản refund mô phỏng.

**Phát hiện giả định:**

- **SYN-PV-VH-04-F1 · PAYMENT_EVENT_IDEMPOTENT · Must · CURRENT.** Webhook cần chữ ký hợp lệ, event identity chống lặp và cùng transaction cập nhật payment/order.

  Lời giả định SYN: “Một thông báo gửi hai lần không được làm số thu tăng hai lần.”

  Truy vết: P1-FR-09, P1-FR-23.

- **SYN-PV-VH-04-F2 · LATE_SUCCESS_RECONCILE · Must · KNOWN_DEFECT.** KD-PAY-01 cho phép success muộn làm paid/succeeded trên order đã cancelled; cần chính sách từ chối hoặc đối soát rõ.

  Lời giả định SYN: “Đơn đã hủy mà tiền báo về sau thì phải vào bước xử lý ngoại lệ, không tự coi đơn vẫn bình thường.”

  Truy vết: P1-FR-09, P1-FR-11, P1-FR-23.

- **SYN-PV-VH-04-F3 · COD_AGGREGATE · Must · CURRENT.** COD chỉ paid khi tất cả kiện delivered; nếu tất cả returned thì cancelled. Chưa có ledger thu tiền theo kiện hay đối soát hãng thật.

  Lời giả định SYN: “Tôi chỉ chốt COD toàn đơn khi đủ điều kiện; số thu thực ở từng kiện cần một sổ khác nếu triển khai thật.”

  Truy vết: P1-FR-08, P1-FR-18, P1-FR-23.

- **SYN-PV-VH-04-F4 · REFUND_BOUNDARY · Must · CURRENT.** Webhook mô phỏng có thể ghi full refund; chưa có command refund trong admin. Hủy paid cần hoàn tiền trước, không sửa cột trực tiếp.

  Lời giả định SYN: “Đổi trạng thái thành hoàn tiền không tự chuyển tiền; cần chứng cứ và quy trình được phép.”

  Truy vết: P1-FR-09, P1-FR-11, P1-FR-19, P1-FR-23.

**Kết luận SYN:** Không có thanh toán hoặc đối soát tiền thật. Kịch bản mong muốn xử lý late success phải ghi như đề xuất chưa được code bảo đảm.

## 3. Danh mục 20 hồ sơ đơn hàng mô phỏng

| Mã SYN | Thanh toán | Số kho | Order / fulfillment tổng hợp | Payment của order / row | Tổng snapshot |
|---|---|---:|---|---|---:|
| SYN-HS-DH-01 | cod | 1 | delivered / fulfilled | paid / succeeded | 530.000đ |
| SYN-HS-DH-02 | online | 1 | delivered / fulfilled | paid / succeeded | 630.000đ |
| SYN-HS-DH-03 | cod | 2 | delivered / fulfilled | paid / succeeded | 690.000đ |
| SYN-HS-DH-04 | online | 2 | delivered / fulfilled | paid / succeeded | 840.000đ |
| SYN-HS-DH-05 | cod | 1 | confirmed / reserved | cod_pending / pending | 350.000đ |
| SYN-HS-DH-06 | online | 1 | pending_payment / reserved | pending / pending | 630.000đ |
| SYN-HS-DH-07 | cod | 2 | processing / reserved | cod_pending / pending | 940.000đ |
| SYN-HS-DH-08 | online | 2 | ready_to_ship / reserved | paid / succeeded | 1.040.000đ |
| SYN-HS-DH-09 | cod | 2 | shipped / partially_fulfilled | cod_pending / pending | 690.000đ |
| SYN-HS-DH-10 | cod | 2 | shipped / shipped | cod_pending / pending | 840.000đ |
| SYN-HS-DH-11 | online | 2 | shipped / shipped | paid / succeeded | 1.090.000đ |
| SYN-HS-DH-12 | cod | 1 | cancelled / cancelled | cancelled / cancelled | 280.000đ |
| SYN-HS-DH-13 | online | 1 | cancelled / cancelled | cancelled / cancelled | 630.000đ |
| SYN-HS-DH-14 | online | 2 | cancelled / cancelled | refunded / refunded | 840.000đ |
| SYN-HS-DH-15 | cod | 1 | processing / reserved | cod_pending / pending | 350.000đ |
| SYN-HS-DH-16 | online | 1 | processing / reserved | paid / succeeded | 760.000đ |
| SYN-HS-DH-17 | cod | 1 | returned / returned | cancelled / cancelled | 280.000đ |
| SYN-HS-DH-18 | online | 1 | returned / returned | refunded / refunded | 630.000đ |
| SYN-HS-DH-19 | cod | 2 | returned / returned | cancelled / cancelled | 840.000đ |
| SYN-HS-DH-20 | online | 2 | returned / returned | paid / succeeded | 940.000đ |

Đơn cancelled/returned vẫn giữ snapshot tiền gốc; không cộng tất cả các mẫu để công bố doanh thu. Mỗi kho chỉ có một fulfillment trong một đơn. Carrier/tracking dùng mã SYN, không có nhãn vận đơn thật.

### SYN-HS-DH-01 — Luồng COD một kho hoàn tất; hai chiếc cùng SKU chỉ có một dòng.

Mốc **N4 mô phỏng**. Phương thức: **cod**. Trạng thái: order `delivered`; fulfillment tổng hợp `fulfilled`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 2 | 250.000đ | 500.000đ |

**Snapshot tiền:** 500.000đ − 0đ + 30.000đ = **530.000đ**.

Không áp voucher trong snapshot này.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-01-F1 | SYN-KHO-HN | delivered | SYN-TEE-BLK-M ×2: consumed | SYN-CARRIER / SYN-HS-DH-01-TRACK1 | Không áp dụng |

**Diễn giải/ràng buộc:** Mọi kiện delivered nên COD được ghi succeeded/paid.

**Truy vết:** P1-FR-07, P1-FR-08, P1-FR-18.

### SYN-HS-DH-02 — Thanh toán trước mô phỏng, áp mã cố định và giao đủ.

Mốc **N4 mô phỏng**. Phương thức: **online**. Trạng thái: order `delivered`; fulfillment tổng hợp `fulfilled`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-DRESS-BLU-S | SYN-KHO-HCM | 1 | 650.000đ | 650.000đ |

**Snapshot tiền:** 650.000đ − 50.000đ + 30.000đ = **630.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-02-F1 | SYN-KHO-HCM | delivered | SYN-DRESS-BLU-S ×1: consumed | SYN-CARRIER / SYN-HS-DH-02-TRACK1 | Không áp dụng |

**Diễn giải/ràng buộc:** Webhook success giả lập đã xử lý trước khi xuất; không có thanh toán thật.

**Truy vết:** P1-FR-06, P1-FR-09, P1-FR-18.

### SYN-HS-DH-03 — COD hai kho, cả hai kiện giao thành công.

Mốc **N4 mô phỏng**. Phương thức: **cod**. Trạng thái: order `delivered`; fulfillment tổng hợp `fulfilled`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 1 | 250.000đ | 250.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 700.000đ − 50.000đ + 40.000đ = **690.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-03-F1 | SYN-KHO-HN | delivered | SYN-TEE-BLK-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-03-TRACK1 | Không áp dụng |
| SYN-HS-DH-03-F2 | SYN-KHO-HCM | delivered | SYN-PANTS-BEI-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-03-TRACK2 | Không áp dụng |

**Diễn giải/ràng buộc:** Chỉ lần chuyển kiện cuối sang delivered mới chốt COD toàn đơn; chưa có sổ thu COD theo kiện.

**Truy vết:** P1-FR-08, P1-FR-17, P1-FR-18.

### SYN-HS-DH-04 — Online hai kho, hai kiện hoàn tất và vẫn một snapshot tổng tiền.

Mốc **N4 mô phỏng**. Phương thức: **online**. Trạng thái: order `delivered`; fulfillment tổng hợp `fulfilled`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-SHIRT-WHT-L | SYN-KHO-HN | 1 | 400.000đ | 400.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 850.000đ − 50.000đ + 40.000đ = **840.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-04-F1 | SYN-KHO-HN | delivered | SYN-SHIRT-WHT-L ×1: consumed | SYN-CARRIER / SYN-HS-DH-04-TRACK1 | Không áp dụng |
| SYN-HS-DH-04-F2 | SYN-KHO-HCM | delivered | SYN-PANTS-BEI-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-04-TRACK2 | Không áp dụng |

**Diễn giải/ràng buộc:** Payment đã succeeded trước dispatch; giao đủ không ghi nhận thêm payment.

**Truy vết:** P1-FR-07, P1-FR-09, P1-FR-17.

### SYN-HS-DH-05 — COD vừa đặt, chưa đóng gói; tồn chỉ đang giữ chỗ.

Mốc **N4 mô phỏng**. Phương thức: **cod**. Trạng thái: order `confirmed`; fulfillment tổng hợp `reserved`; order.payment_status `cod_pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-POLO-NAV-M | SYN-KHO-HN | 1 | 320.000đ | 320.000đ |

**Snapshot tiền:** 320.000đ − 0đ + 30.000đ = **350.000đ**.

Không áp voucher trong snapshot này.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-05-F1 | SYN-KHO-HN | pending | SYN-POLO-NAV-M ×1: active | Chưa gán / Chưa gán | Không áp dụng |

**Diễn giải/ràng buộc:** Chưa giảm on_hand. TTL COD 30 ngày tồn tại nhưng xử lý expiry còn KD-INV-02.

**Truy vết:** P1-FR-07, P1-FR-12, P1-FR-13.

### SYN-HS-DH-06 — Online chờ thanh toán, snapshot trước hạn giữ chỗ hai giờ.

Mốc **N5 mô phỏng**. Phương thức: **online**. Trạng thái: order `pending_payment`; fulfillment tổng hợp `reserved`; order.payment_status `pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-DRESS-BLU-S | SYN-KHO-HCM | 1 | 650.000đ | 650.000đ |

**Snapshot tiền:** 650.000đ − 50.000đ + 30.000đ = **630.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-06-F1 | SYN-KHO-HCM | pending | SYN-DRESS-BLU-S ×1: active | Chưa gán / Chưa gán | Không áp dụng |

**Diễn giải/ràng buộc:** Chưa đủ điều kiện xử lý giao. Hết hạn cần đồng bộ payment; KD-INV-01 còn mở.

**Truy vết:** P1-FR-08, P1-FR-09, P1-FR-13.

### SYN-HS-DH-07 — Hai kho đang soạn; chưa kiện nào xuất.

Mốc **N5 mô phỏng**. Phương thức: **cod**. Trạng thái: order `processing`; fulfillment tổng hợp `reserved`; order.payment_status `cod_pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 2 | 250.000đ | 500.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 950.000đ − 50.000đ + 40.000đ = **940.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-07-F1 | SYN-KHO-HN | processing | SYN-TEE-BLK-M ×2: active | Chưa gán / Chưa gán | Không áp dụng |
| SYN-HS-DH-07-F2 | SYN-KHO-HCM | processing | SYN-PANTS-BEI-M ×1: active | Chưa gán / Chưa gán | Không áp dụng |

**Diễn giải/ràng buộc:** Mỗi kho có fulfillment riêng; reserve còn active cho cả hai, payment COD chưa thu.

**Truy vết:** P1-FR-12, P1-FR-13, P1-FR-17.

### SYN-HS-DH-08 — Đã thanh toán, mọi kiện sẵn sàng bàn giao.

Mốc **N5 mô phỏng**. Phương thức: **online**. Trạng thái: order `ready_to_ship`; fulfillment tổng hợp `reserved`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-SHIRT-WHT-L | SYN-KHO-HN | 1 | 400.000đ | 400.000đ |
| SYN-DRESS-BLU-S | SYN-KHO-HCM | 1 | 650.000đ | 650.000đ |

**Snapshot tiền:** 1.050.000đ − 50.000đ + 40.000đ = **1.040.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-08-F1 | SYN-KHO-HN | ready_to_ship | SYN-SHIRT-WHT-L ×1: active | SYN-CARRIER / SYN-HS-DH-08-TRACK1 | Không áp dụng |
| SYN-HS-DH-08-F2 | SYN-KHO-HCM | ready_to_ship | SYN-DRESS-BLU-S ×1: active | SYN-CARRIER / SYN-HS-DH-08-TRACK2 | Không áp dụng |

**Diễn giải/ràng buộc:** Carrier/tracking giả đã được nhập tay nhưng chưa đồng nghĩa hãng đã nhận; tồn chưa consume.

**Truy vết:** P1-FR-09, P1-FR-13, P1-FR-18.

### SYN-HS-DH-09 — COD đã xuất một kiện, kiện khác còn soạn.

Mốc **N5 mô phỏng**. Phương thức: **cod**. Trạng thái: order `shipped`; fulfillment tổng hợp `partially_fulfilled`; order.payment_status `cod_pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 1 | 250.000đ | 250.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 700.000đ − 50.000đ + 40.000đ = **690.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-09-F1 | SYN-KHO-HN | shipped | SYN-TEE-BLK-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-09-TRACK1 | Không áp dụng |
| SYN-HS-DH-09-F2 | SYN-KHO-HCM | processing | SYN-PANTS-BEI-M ×1: active | Chưa gán / Chưa gán | Không áp dụng |

**Diễn giải/ràng buộc:** Chỉ SKU của kiện shipped bị giảm on_hand/reserved; trạng thái tổng hợp là partially_fulfilled.

**Truy vết:** P1-FR-13, P1-FR-17, P1-FR-18.

### SYN-HS-DH-10 — COD nhận một kiện; kiện thứ hai còn vận chuyển.

Mốc **N5 mô phỏng**. Phương thức: **cod**. Trạng thái: order `shipped`; fulfillment tổng hợp `shipped`; order.payment_status `cod_pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-SHIRT-WHT-L | SYN-KHO-HN | 1 | 400.000đ | 400.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 850.000đ − 50.000đ + 40.000đ = **840.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-10-F1 | SYN-KHO-HN | delivered | SYN-SHIRT-WHT-L ×1: consumed | SYN-CARRIER / SYN-HS-DH-10-TRACK1 | Không áp dụng |
| SYN-HS-DH-10-F2 | SYN-KHO-HCM | shipped | SYN-PANTS-BEI-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-10-TRACK2 | Không áp dụng |

**Diễn giải/ràng buộc:** Không ghi paid cho toàn đơn khi mới một kiện delivered; sổ thu thực tế theo kiện ngoài phạm vi.

**Truy vết:** P1-FR-08, P1-FR-17, P1-FR-18.

### SYN-HS-DH-11 — Online hai kiện đã xuất, chưa xác nhận giao.

Mốc **N6 mô phỏng**. Phương thức: **online**. Trạng thái: order `shipped`; fulfillment tổng hợp `shipped`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-POLO-NAV-M | SYN-KHO-HN | 1 | 320.000đ | 320.000đ |
| SYN-JACKET-GRY-L | SYN-KHO-HCM | 1 | 780.000đ | 780.000đ |

**Snapshot tiền:** 1.100.000đ − 50.000đ + 40.000đ = **1.090.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-11-F1 | SYN-KHO-HN | shipped | SYN-POLO-NAV-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-11-TRACK1 | Không áp dụng |
| SYN-HS-DH-11-F2 | SYN-KHO-HCM | shipped | SYN-JACKET-GRY-L ×1: consumed | SYN-CARRIER / SYN-HS-DH-11-TRACK2 | Không áp dụng |

**Diễn giải/ràng buộc:** Cả hai reservation consumed; shipment chưa delivered không làm thay trạng thái payment đã paid.

**Truy vết:** P1-FR-09, P1-FR-13, P1-FR-18.

### SYN-HS-DH-12 — Hủy COD trước xuất kho theo whole-order workflow.

Mốc **N6 mô phỏng**. Phương thức: **cod**. Trạng thái: order `cancelled`; fulfillment tổng hợp `cancelled`; order.payment_status `cancelled`; payments.status `cancelled`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 1 | 250.000đ | 250.000đ |

**Snapshot tiền:** 250.000đ − 0đ + 30.000đ = **280.000đ**.

Không áp voucher trong snapshot này.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-12-F1 | SYN-KHO-HN | cancelled | SYN-TEE-BLK-M ×1: released | Chưa gán / Chưa gán | Khách giả định đổi nhu cầu trước đóng gói. |

**Diễn giải/ràng buộc:** Chỉ nhả reserved, không giảm on_hand; snapshot tiền vẫn lưu lịch sử, không phải số phải thu.

**Truy vết:** P1-FR-11, P1-FR-13, P1-FR-19.

### SYN-HS-DH-13 — Hủy online chưa paid bằng lệnh hủy hợp lệ, không phải expiry job.

Mốc **N6 mô phỏng**. Phương thức: **online**. Trạng thái: order `cancelled`; fulfillment tổng hợp `cancelled`; order.payment_status `cancelled`; payments.status `cancelled`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-DRESS-BLU-S | SYN-KHO-HCM | 1 | 650.000đ | 650.000đ |

**Snapshot tiền:** 650.000đ − 50.000đ + 30.000đ = **630.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-13-F1 | SYN-KHO-HCM | cancelled | SYN-DRESS-BLU-S ×1: released | Chưa gán / Chưa gán | Khách giả định yêu cầu hủy trước thanh toán và trước xuất kho. |

**Diễn giải/ràng buộc:** Cả order payment_status và payments.status cancelled; cố ý không dùng nhánh KD-INV-01 để giả vờ defect đã sửa.

**Truy vết:** P1-FR-09, P1-FR-11, P1-FR-13.

### SYN-HS-DH-14 — Đã paid online; nhận full refund webhook mô phỏng trước khi hủy cả hai kiện.

Mốc **N6 mô phỏng**. Phương thức: **online**. Trạng thái: order `cancelled`; fulfillment tổng hợp `cancelled`; order.payment_status `refunded`; payments.status `refunded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-SHIRT-WHT-L | SYN-KHO-HN | 1 | 400.000đ | 400.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 850.000đ − 50.000đ + 40.000đ = **840.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-14-F1 | SYN-KHO-HN | cancelled | SYN-SHIRT-WHT-L ×1: released | Chưa gán / Chưa gán | Full refund mô phỏng đã ghi nhận; khách yêu cầu hủy toàn đơn trước dispatch. |
| SYN-HS-DH-14-F2 | SYN-KHO-HCM | cancelled | SYN-PANTS-BEI-M ×1: released | Chưa gán / Chưa gán | Full refund mô phỏng đã ghi nhận; khách yêu cầu hủy toàn đơn trước dispatch. |

**Diễn giải/ràng buộc:** Không hủy trực tiếp paid/authorized. Refund command trong admin chưa có; đây là webhook giả lập, không hoàn tiền ngân hàng.

**Truy vết:** P1-FR-09, P1-FR-11, P1-FR-19.

### SYN-HS-DH-15 — COD giao lỗi sau shipped, đang điều phối lại.

Mốc **N6 mô phỏng**. Phương thức: **cod**. Trạng thái: order `processing`; fulfillment tổng hợp `reserved`; order.payment_status `cod_pending`; payments.status `pending`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-POLO-NAV-M | SYN-KHO-HN | 1 | 320.000đ | 320.000đ |

**Snapshot tiền:** 320.000đ − 0đ + 30.000đ = **350.000đ**.

Không áp voucher trong snapshot này.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-15-F1 | SYN-KHO-HN | failed | SYN-POLO-NAV-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-15-TRACK1 | Không liên hệ được người nhận giả định trong lần giao thử. |

**Diễn giải/ràng buộc:** Theo reconcileOrder hiện tại, kiện failed đơn lẻ tổng hợp order=processing/fulfillment_status=reserved; reservation thật vẫn consumed vì đã xuất. Nhãn tổng hợp không được dùng thay trạng thái tồn.

**Truy vết:** P1-FR-13, P1-FR-18, P1-FR-19.

### SYN-HS-DH-16 — Online đã paid, giao lỗi sau xuất kho.

Mốc **N7 mô phỏng**. Phương thức: **online**. Trạng thái: order `processing`; fulfillment tổng hợp `reserved`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-JACKET-GRY-L | SYN-KHO-HCM | 1 | 780.000đ | 780.000đ |

**Snapshot tiền:** 780.000đ − 50.000đ + 30.000đ = **760.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-16-F1 | SYN-KHO-HCM | failed | SYN-JACKET-GRY-L ×1: consumed | SYN-CARRIER / SYN-HS-DH-16-TRACK1 | Điểm giao giả định tạm thời không tiếp nhận, chờ hẹn lại. |

**Diễn giải/ràng buộc:** Code tổng hợp failed thành processing/reserved dù hàng đã consume. Cần đọc reservation và event; giao lỗi không tự refund.

**Truy vết:** P1-FR-09, P1-FR-13, P1-FR-18, P1-FR-19.

### SYN-HS-DH-17 — COD hoàn toàn bộ sau dispatch, chưa thu tiền.

Mốc **N7 mô phỏng**. Phương thức: **cod**. Trạng thái: order `returned`; fulfillment tổng hợp `returned`; order.payment_status `cancelled`; payments.status `cancelled`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 1 | 250.000đ | 250.000đ |

**Snapshot tiền:** 250.000đ − 0đ + 30.000đ = **280.000đ**.

Không áp voucher trong snapshot này.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-17-F1 | SYN-KHO-HN | returned | SYN-TEE-BLK-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-17-TRACK1 | Người nhận giả định từ chối nhận; hàng quay về sau dispatch. |

**Diễn giải/ràng buộc:** Reservation vẫn consumed; receipt SYN-HS-KHO-03 minh họa nhập lại một chiếc sau kiểm định giả định độc lập.

**Truy vết:** P1-FR-13, P1-FR-14, P1-FR-19.

### SYN-HS-DH-18 — Online hàng hoàn và full refund mô phỏng đã hoàn tất.

Mốc **N7 mô phỏng**. Phương thức: **online**. Trạng thái: order `returned`; fulfillment tổng hợp `returned`; order.payment_status `refunded`; payments.status `refunded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-DRESS-BLU-S | SYN-KHO-HCM | 1 | 650.000đ | 650.000đ |

**Snapshot tiền:** 650.000đ − 50.000đ + 30.000đ = **630.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-18-F1 | SYN-KHO-HCM | returned | SYN-DRESS-BLU-S ×1: consumed | SYN-CARRIER / SYN-HS-DH-18-TRACK1 | Hoàn toàn bộ sau giao trong kịch bản; full refund webhook mô phỏng đã xử lý. |

**Diễn giải/ràng buộc:** Returned và refunded là hai luồng riêng. Hàng chưa được chứng từ kho nhập lại; không tự restock.

**Truy vết:** P1-FR-09, P1-FR-19, P1-FR-23.

### SYN-HS-DH-19 — COD hai kiện đều returned; không trộn sibling delivered/returned.

Mốc **N7 mô phỏng**. Phương thức: **cod**. Trạng thái: order `returned`; fulfillment tổng hợp `returned`; order.payment_status `cancelled`; payments.status `cancelled`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-SHIRT-WHT-L | SYN-KHO-HN | 1 | 400.000đ | 400.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 850.000đ − 50.000đ + 40.000đ = **840.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-19-F1 | SYN-KHO-HN | returned | SYN-SHIRT-WHT-L ×1: consumed | SYN-CARRIER / SYN-HS-DH-19-TRACK1 | Người nhận giả định từ chối toàn bộ đơn. |
| SYN-HS-DH-19-F2 | SYN-KHO-HCM | returned | SYN-PANTS-BEI-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-19-TRACK2 | Người nhận giả định từ chối toàn bộ đơn. |

**Diễn giải/ràng buộc:** Toàn bộ terminal returned nên payment cancelled. Không tự cộng lại tồn của cả hai kho.

**Truy vết:** P1-FR-08, P1-FR-13, P1-FR-19.

### SYN-HS-DH-20 — Online hai kiện returned nhưng chưa có refund event.

Mốc **N7 mô phỏng**. Phương thức: **online**. Trạng thái: order `returned`; fulfillment tổng hợp `returned`; order.payment_status `paid`; payments.status `succeeded`.

| SKU giả | Kho giả | Số lượng | Đơn giá VND | Thành tiền VND |
|---|---|---:|---:|---:|
| SYN-TEE-BLK-M | SYN-KHO-HN | 2 | 250.000đ | 500.000đ |
| SYN-PANTS-BEI-M | SYN-KHO-HCM | 1 | 450.000đ | 450.000đ |

**Snapshot tiền:** 950.000đ − 50.000đ + 40.000đ = **940.000đ**.

Voucher SYN-GIAM50: giảm cố định 50.000đ khi subtotal ≥500.000đ; chỉ giả định của hồ sơ, không phải mã seeded trong ứng dụng.

| Phiếu giao giả | Kho | Trạng thái | Reservation | Carrier / tracking | Lý do ngoại lệ |
|---|---|---|---|---|---|
| SYN-HS-DH-20-F1 | SYN-KHO-HN | returned | SYN-TEE-BLK-M ×2: consumed | SYN-CARRIER / SYN-HS-DH-20-TRACK1 | Toàn bộ hàng hoàn, chờ quyết định hoàn tiền theo quy trình ngoài hệ thống. |
| SYN-HS-DH-20-F2 | SYN-KHO-HCM | returned | SYN-PANTS-BEI-M ×1: consumed | SYN-CARRIER / SYN-HS-DH-20-TRACK2 | Toàn bộ hàng hoàn, chờ quyết định hoàn tiền theo quy trình ngoài hệ thống. |

**Diễn giải/ràng buộc:** Order returned/payment paid là hợp lệ khi chưa refund; không được gắn nhãn đã hoàn tiền. Chưa có command tự phục vụ trong baseline.

**Truy vết:** P1-FR-09, P1-FR-19, P1-FR-23.

## 4. Danh mục 10 chứng từ kho mô phỏng

| Mã SYN | Mốc | Loại | SKU | Giá trị quantity | Số movement | Vai trò giả định |
|---|---|---|---|---:|---:|---|
| SYN-HS-KHO-01 | N4 | receipt | SYN-TEE-BLK-M | 30 | 1 | staff |
| SYN-HS-KHO-02 | N4 | receipt | SYN-DRESS-BLU-S | 12 | 1 | staff |
| SYN-HS-KHO-03 | N7 | receipt | SYN-TEE-BLK-M | 1 | 1 | staff |
| SYN-HS-KHO-04 | N5 | transfer | SYN-SHIRT-WHT-L | 6 | 2 | staff |
| SYN-HS-KHO-05 | N5 | transfer | SYN-PANTS-BEI-M | 4 | 2 | staff |
| SYN-HS-KHO-06 | N6 | transfer | SYN-POLO-NAV-M | 3 | 2 | staff |
| SYN-HS-KHO-07 | N6 | stocktake | SYN-TEE-BLK-M | 48 | 1 | staff |
| SYN-HS-KHO-08 | N6 | stocktake | SYN-DRESS-BLU-S | 22 | 1 | staff |
| SYN-HS-KHO-09 | N7 | adjustment | SYN-JACKET-GRY-L | -2 | 1 | manager |
| SYN-HS-KHO-10 | N7 | adjustment | SYN-POLO-NAV-M | 1 | 1 | manager |

Mỗi command giả định một dòng SKU và trạng thái posted. Quantity của stocktake là số đếm, của adjustment là chênh lệch có dấu; không diễn giải chung như một trường số lượng xuất. Mọi số dư dưới đây độc lập giữa các chứng từ.

### SYN-HS-KHO-01 — receipt

Mốc **N4 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-TEE-BLK-M`.

**Lý do:** Nhập 30 chiếc từ lô nhà cung cấp giả định.

**Tham chiếu:** `SYN-NCC-001`. **Quantity:** 30 — quantity (số lượng dương). **Idempotency:** `syn-p1-01-receipt`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / receipt | +30 | 20 → 50 | 5 → 5 | 45 | 3 | 42 |

**Diễn giải/ràng buộc:** Một command một SKU; posted ngay. On-hand 20→50, reserved giữ 5; không có phê duyệt draft.

**Truy vết:** P1-FR-12, P1-FR-14.

### SYN-HS-KHO-02 — receipt

Mốc **N4 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-DRESS-BLU-S`.

**Lý do:** Nhập bổ sung 12 chiếc cho kho HCM.

**Tham chiếu:** `SYN-NCC-002`. **Quantity:** 12 — quantity (số lượng dương). **Idempotency:** `syn-p1-02-receipt`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HCM / receipt | +12 | 8 → 20 | 3 → 3 | 17 | 2 | 15 |

**Diễn giải/ràng buộc:** Movement receipt +12 và audit cùng transaction; retry cùng idempotency không tăng thêm lần hai.

**Truy vết:** P1-FR-12, P1-FR-14.

### SYN-HS-KHO-03 — receipt

Mốc **N7 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-TEE-BLK-M`.

**Lý do:** Nhập lại một chiếc hoàn từ SYN-HS-DH-17 sau kiểm định giả định đạt.

**Tham chiếu:** `SYN-HS-DH-17-F1`. **Quantity:** 1 — quantity (số lượng dương). **Idempotency:** `syn-p1-03-receipt`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / receipt | +1 | 8 → 9 | 2 → 2 | 7 | 1 | 6 |

**Diễn giải/ràng buộc:** Kiểm định SYN bên ngoài hệ thống, không có chữ ký/chứng cứ thật. Returned không tự restock; receipt là lệnh riêng và lưu reference tới kiện.

**Truy vết:** P1-FR-14, P1-FR-19.

### SYN-HS-KHO-04 — transfer

Mốc **N5 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-SHIRT-WHT-L`.

**Lý do:** Điều chuyển 6 chiếc để cân bằng nhu cầu giả định giữa hai kho.

**Tham chiếu:** `SYN-DIEUCHUYEN-001`. **Quantity:** 6 — quantity (số lượng dương). **Idempotency:** `syn-p1-04-transfer`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / transfer_out | -6 | 30 → 24 | 8 → 8 | 16 | 4 | 12 |
| SYN-KHO-HCM / transfer_in | +6 | 10 → 16 | 2 → 2 | 14 | 2 | 12 |

**Diễn giải/ràng buộc:** Nguồn available 22 đủ chuyển 6; cặp movement chung reference. Tổng on-hand hai kho 40→40.

**Truy vết:** P1-FR-12, P1-FR-15.

### SYN-HS-KHO-05 — transfer

Mốc **N5 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-PANTS-BEI-M`.

**Lý do:** Chuyển 4 chiếc từ HCM về HN cho kế hoạch trưng bày giả định.

**Tham chiếu:** `SYN-DIEUCHUYEN-002`. **Quantity:** 4 — quantity (số lượng dương). **Idempotency:** `syn-p1-05-transfer`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HCM / transfer_out | -4 | 18 → 14 | 7 → 7 | 7 | 3 | 4 |
| SYN-KHO-HN / transfer_in | +4 | 6 → 10 | 1 → 1 | 9 | 1 | 8 |

**Diễn giải/ràng buộc:** Cộng đích và trừ nguồn nguyên tử; nếu một bước lỗi phải rollback cả hai. Tổng on-hand 24 không đổi.

**Truy vết:** P1-FR-12, P1-FR-15.

### SYN-HS-KHO-06 — transfer

Mốc **N6 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-POLO-NAV-M`.

**Lý do:** Chuyển 3 chiếc bằng đúng available kho nguồn.

**Tham chiếu:** `SYN-DIEUCHUYEN-003`. **Quantity:** 3 — quantity (số lượng dương). **Idempotency:** `syn-p1-06-transfer`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / transfer_out | -3 | 10 → 7 | 7 → 7 | 0 | 2 | 0 |
| SYN-KHO-HCM / transfer_in | +3 | 4 → 7 | 0 → 0 | 7 | 1 | 6 |

**Diễn giải/ràng buộc:** Nguồn sau chuyển on-hand=reserved=7, available=0, ATP=0. Safety stock hiện không là ngưỡng chặn lệnh; không mô tả như có protection tự động.

**Truy vết:** P1-FR-12, P1-FR-15.

### SYN-HS-KHO-07 — stocktake

Mốc **N6 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-TEE-BLK-M`.

**Lý do:** Kiểm kê giả định đếm 48 so với sổ 50; chênh lệch thiếu 2.

**Tham chiếu:** `SYN-KIEMKE-001`. **Quantity:** 48 — actualQuantity (số đếm giả định). **Idempotency:** `syn-p1-07-stocktake`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / stocktake | -2 | 50 → 48 | 12 → 12 | 36 | 4 | 32 |

**Diễn giải/ràng buộc:** actualQuantity=48 vẫn ≥reserved=12. quantity là số đếm thực giả định, không phải số giảm; movement delta=-2.

**Truy vết:** P1-FR-12, P1-FR-16.

### SYN-HS-KHO-08 — stocktake

Mốc **N6 mô phỏng** · trạng thái `posted` · vai trò `staff` · SKU `SYN-DRESS-BLU-S`.

**Lý do:** Kiểm kê giả định đếm 22 so với sổ 20; phát hiện ghi nhận thiếu 2.

**Tham chiếu:** `SYN-KIEMKE-002`. **Quantity:** 22 — actualQuantity (số đếm giả định). **Idempotency:** `syn-p1-08-stocktake`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HCM / stocktake | +2 | 20 → 22 | 6 → 6 | 16 | 2 | 14 |

**Diễn giải/ràng buộc:** actualQuantity=22; movement delta=+2. Lý do bắt buộc; chưa có expectedVersion phía client cho chứng từ kho.

**Truy vết:** P1-FR-12, P1-FR-16.

### SYN-HS-KHO-09 — adjustment

Mốc **N7 mô phỏng** · trạng thái `posted` · vai trò `manager` · SKU `SYN-JACKET-GRY-L`.

**Lý do:** Loại hai chiếc hỏng khỏi tồn bán được trong tình huống giả định.

**Tham chiếu:** `SYN-DIEUCHINH-001`. **Quantity:** -2 — quantityDelta (chênh lệch có dấu). **Idempotency:** `syn-p1-09-adjustment`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HCM / manual_adjustment | -2 | 12 → 10 | 3 → 3 | 7 | 2 | 5 |

**Diễn giải/ràng buộc:** Manager/Admin mới được direct adjustment. On-hand 10 sau chỉnh vẫn ≥reserved=3; không tự ghi một kho cách ly vì schema chưa có.

**Truy vết:** P1-FR-12, P1-FR-16.

### SYN-HS-KHO-10 — adjustment

Mốc **N7 mô phỏng** · trạng thái `posted` · vai trò `manager` · SKU `SYN-POLO-NAV-M`.

**Lý do:** Sửa chênh lệch nhập liệu được phát hiện trong đối chiếu giả định.

**Tham chiếu:** `SYN-DIEUCHINH-002`. **Quantity:** 1 — quantityDelta (chênh lệch có dấu). **Idempotency:** `syn-p1-10-adjustment`.

| Kho giả / movement | Delta | On-hand trước → sau | Reserved trước → sau | Available sau | Safety | ATP sau |
|---|---:|---|---|---:|---:|---:|
| SYN-KHO-HN / manual_adjustment | +1 | 18 → 19 | 4 → 4 | 15 | 3 | 12 |

**Diễn giải/ràng buộc:** Điều chỉnh +1 có reason, idempotency và audit. Không gọi việc sinh hồ sơ SYN là người quản lý đã phê duyệt.

**Truy vết:** P1-FR-12, P1-FR-16.

## 5. Tổng hợp theo miền nghiệp vụ

### D1 — Khám phá sản phẩm và tài khoản

**Nguồn SYN:** SYN-PV-KH-01, SYN-PV-KH-03, SYN-PV-KH-05, SYN-PV-KH-06; SYN-HS-DH-01, SYN-HS-DH-02, SYN-HS-DH-05.

- Thông tin size/màu, tồn theo SKU và mô tả chất liệu cần nằm gần thao tác chọn hàng.
- Tài khoản hỗ trợ địa chỉ, wishlist và lịch sử; bảo vệ ownership và recovery là yêu cầu nền.
- UX mobile và nút mua lại một chạm là nhu cầu cần kiểm thử/ưu tiên, không phải kết quả đã nghiệm thu.

**Ưu tiên:** Must/Should theo FR. **Truy vết:** P1-FR-01, P1-FR-02, P1-FR-03, P1-FR-04.

**Giới hạn:** Không có người dùng thật hoặc đo task success; KD-GUEST-01 vẫn là sai lệch từ SYS, không được biên bản SYN xác nhận như thực địa.

### D2 — Giỏ, voucher và đặt đơn

**Nguồn SYN:** SYN-PV-KH-01, SYN-PV-KH-04, SYN-PV-KH-06, SYN-PV-KH-08; SYN-HS-DH-02, SYN-HS-DH-06, SYN-HS-DH-12, SYN-HS-DH-13.

- Hiển thị rõ subtotal, discount, shipping và grand total; kiểm tra lại voucher khi giỏ hoặc checkout thay đổi.
- Checkout retry không tạo bản sao; giỏ không đồng nghĩa giữ tồn.
- Mã SYN-GIAM50 và các mức phí chỉ là tham số minh họa, không khẳng định chính sách cửa hàng hay coupon seed.

**Ưu tiên:** Must. **Truy vết:** P1-FR-05, P1-FR-06, P1-FR-07, P1-FR-10, P1-FR-11.

**Giới hạn:** Các snapshot không đo abandonment hoặc conversion; hủy online trong mẫu13 dùng command hợp lệ, không minh họa expiry như đã sửa.

### D3 — Thanh toán và đối soát

**Nguồn SYN:** SYN-PV-KH-02, SYN-PV-KH-05, SYN-PV-KH-07, SYN-PV-VH-04; SYN-HS-DH-03, SYN-HS-DH-10, SYN-HS-DH-14, SYN-HS-DH-18, SYN-HS-DH-20.

- Online paid chỉ từ event hợp lệ; COD paid khi tất cả kiện delivered, không suy từ một kiện.
- Returned không tự đồng nghĩa refunded; full refund trong mẫu là webhook mô phỏng, chưa có command admin.
- Late success cần policy đối soát do KD-PAY-01; chưa có sổ thu COD theo kiện hoặc đối soát tiền thật.

**Ưu tiên:** Must. **Truy vết:** P1-FR-08, P1-FR-09, P1-FR-11, P1-FR-19, P1-FR-23.

**Giới hạn:** Không có chuyển tiền thật, tài khoản ngân hàng, refund đã thực hiện hoặc đại diện tài chính phê duyệt.

### D4 — Tồn kho và chứng từ

**Nguồn SYN:** SYN-PV-KH-06, SYN-PV-VH-02, SYN-PV-VH-03; SYN-HS-DH-09, SYN-HS-DH-17, SYN-HS-KHO-01, SYN-HS-KHO-03, SYN-HS-KHO-04, SYN-HS-KHO-06, SYN-HS-KHO-07, SYN-HS-KHO-09.

- On-hand, reserved, available và ATP có ý nghĩa khác nhau; safety stock chưa là ngưỡng chặn bán.
- Chuyển kho cần cặp movement nguyên tử; receipt/stocktake/adjustment hiện một dòng, posted ngay.
- Hàng returned không tự restock; chỉ receipt riêng sau kiểm định giả định. Expiry còn KD-INV-01/02.

**Ưu tiên:** Must. **Truy vết:** P1-FR-12, P1-FR-13, P1-FR-14, P1-FR-15, P1-FR-16.

**Giới hạn:** Mười chứng từ là snapshot độc lập, không cộng dồn thành một sổ tồn xuyên mẫu. Không có người kiểm kê thật, chữ ký hoặc kho doanh nghiệp.

### D5 — Giao hàng và ngoại lệ

**Nguồn SYN:** SYN-PV-KH-02, SYN-PV-KH-07, SYN-PV-KH-08, SYN-PV-VH-03; SYN-HS-DH-07, SYN-HS-DH-09, SYN-HS-DH-10, SYN-HS-DH-15, SYN-HS-DH-16, SYN-HS-DH-19, SYN-HS-DH-20.

- Tạo một fulfillment mỗi kho, tracking nhập tay, shipped chỉ consume tồn kiện tương ứng.
- Giao lỗi cần reason và lịch sử; trạng thái aggregate failed có cách diễn giải đặc thù hiện tại.
- Delivered/returned hỗn hợp giữa sibling bị chặn; mẫu chỉ dùng kết quả supported, mở rộng cần quy trình đối soát riêng.

**Ưu tiên:** Must. **Truy vết:** P1-FR-10, P1-FR-17, P1-FR-18, P1-FR-19.

**Giới hạn:** SYN-CARRIER và mọi tracking là mã giả, không tra cứu được. Không có tích hợp hãng ship, ETA thật hoặc tỷ lệ giao thành công thực tế.

### D6 — Quản trị, khách hàng và hỗ trợ quyết định

**Nguồn SYN:** SYN-PV-VH-01, SYN-PV-VH-04; SYN-HS-DH-04, SYN-HS-DH-14, SYN-HS-DH-20, SYN-HS-KHO-09, SYN-HS-KHO-10.

- Phân khúc tính theo rule và giao dịch hợp lệ; không dùng nhân khẩu học SYN để gán nhóm vận hành.
- Copilot đọc snapshot và không tự ghi dữ liệu; thông tin nguồn/thời điểm phải rõ.
- Quyền quản trị, audit và khoảng trống CRUD catalog cần nêu minh bạch; tổng giá trị snapshot không phải doanh thu.

**Ưu tiên:** Must/Should theo FR. **Truy vết:** P1-FR-20, P1-FR-21, P1-FR-22, P1-FR-23, P1-FR-24.

**Giới hạn:** Không chứng minh tăng doanh thu, giữ chân khách hoặc chất lượng quyết định; không có stakeholder thật ký duyệt.

## 6. Checklist kiểm tra dữ liệu

- Đủ 12 biên bản, trong đó 8 khách và 4 vận hành; mỗi bản có 4 phát hiện/lời giả định và FR liên quan.
- Đủ 20 đơn: 10 COD, 10 online; 10 đơn một kho, 10 đơn hai kho.
- Mỗi đơn có ít nhất một dòng; tiền nguyên VND và công thức subtotal − discount + shipping = total; dòng SKU thuộc đúng một kho/kiện.
- Đủ 10 chứng từ: 3 nhập, 3 chuyển, 2 kiểm kê, 2 điều chỉnh; có 13 movement.
- On-hand sau ≥ reserved sau ≥0; available = on-hand − reserved; ATP = max(available − safety, 0); transfer có delta cộng/trừ cân bằng.
- Mẫu returned giữ reservation consumed; nhập lại chỉ qua receipt riêng. COD không paid khi mới giao một phần.
- Không tạo dữ liệu delivered/returned hỗn hợp được baseline chặn. Mẫu failed có chú thích cách aggregate hiện tại.
- Không có PII, mật khẩu, raw token, thông tin ngân hàng, tên/chữ ký/consent giả hoặc mã vận đơn thật.
- Mọi kết luận là giả thuyết thiết kế hoặc minh họa rule; chờ xác nhận học phần và thực địa nếu cần.

Nguồn dữ liệu máy đọc: [qualitative.json](qualitative.json). Báo cáo chính: [Báo cáo Project 1](../bao-cao-khao-sat-va-mo-hinh-he-thong.md).

