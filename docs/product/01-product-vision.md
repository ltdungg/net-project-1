# Tầm nhìn và chiến lược sản phẩm NÉT Fashion

**Phiên bản:** 1.0  
**Trạng thái:** Baseline đồ án đã hiện thực  
**Thời gian thực hiện:** 02 tháng (08 tuần)  
**Nhóm thực hiện:** 05 thành viên — PM, Frontend, Backend 1, Backend 2, DevOps

> Tài liệu này mô tả định hướng sản phẩm của đồ án và đối chiếu với hệ thống đã xây dựng. Các số liệu hành vi người dùng được dẫn từ bộ khảo sát **mô phỏng**; không được trình bày như kết quả khảo sát thực địa.

## 1. Tuyên bố tầm nhìn

Cho người mua thời trang trực tuyến tại Việt Nam cần một quy trình mua hàng rõ ràng và đáng tin cậy, **NÉT Fashion** là website thương mại điện tử ưu tiên thiết bị di động, giúp khám phá sản phẩm, chọn đúng biến thể, áp dụng voucher, đặt hàng và theo dõi giao nhận. Hệ thống đồng thời cung cấp backoffice để nhóm vận hành quản lý catalog, khách hàng, tồn kho đa kho, đơn hàng và từng phiếu giao hàng trên một nguồn dữ liệu thống nhất.

## 2. Nguyên tắc sản phẩm

1. **Fit confidence:** thông tin size, chất liệu, màu và hướng dẫn đo phải giúp giảm bất định.
2. **Fast path to purchase:** mọi bước từ PDP đến đặt hàng đều ngắn, rõ và không ép tạo tài khoản.
3. **Trust by design:** tổng tiền, phí giao hàng, chính sách và trạng thái phải minh bạch.
4. **Mobile first:** ưu tiên thao tác một tay, hiệu năng mạng di động và ảnh được tối ưu.
5. **Operationally realistic:** mọi trải nghiệm khách hàng phải có quy trình vận hành tương ứng.
6. **Measurable:** mỗi giả thuyết sản phẩm phải có sự kiện và chỉ số để kiểm chứng.
7. **Safe assistance:** chức năng AI quản trị chỉ tổng hợp và gợi ý từ dữ liệu có cấu trúc; không tự ý thay đổi dữ liệu nghiệp vụ.

## 3. Baseline hệ thống của đồ án

| Thành phần | Baseline đã xây dựng |
|---|---|
| Storefront và Admin | React 19, Vinext, TypeScript; giao diện responsive cho người mua và backoffice. |
| Backend | Java 21, Spring Boot 4.1.1, Spring Security, JDBC và Flyway theo kiến trúc modular monolith. |
| Dữ liệu và hạ tầng | PostgreSQL 17 là nguồn sự thật; Redis 7 phục vụ cache/rate limit; chạy bằng hai Docker Compose stack frontend và backend/data. |
| Catalog mẫu | 22 sản phẩm và 58 biến thể size/màu để minh họa tìm kiếm, lọc, giỏ hàng và tồn kho. |
| Tài khoản | Đăng ký, xác minh email, đăng nhập, refresh token xoay vòng, quên/đặt lại mật khẩu, đăng xuất và RBAC. |
| Giao dịch | Giỏ hàng, voucher, checkout, COD/thanh toán mô phỏng, reservation tồn và lịch sử đơn. |
| Vận hành | Nhập/chuyển/kiểm kê/điều chỉnh tồn đa kho; một fulfillment tự tạo cho mỗi kho tham gia đơn hàng. |
| Khách hàng | Customer 360° và sáu phân khúc hành vi được tính tự động từ tài khoản và đơn đã thanh toán. |
| Hỗ trợ quản trị | NÉT AI Copilot dạng rule-based, đọc snapshot vận hành và đưa khuyến nghị; không phải mô hình sinh nội dung và không có quyền mutation. |

## 4. Các vấn đề cần giải quyết

| Mã | Vấn đề | Tác động |
|---|---|---|
| P-01 | Khách khó biết size/màu còn hàng và có phù hợp hay không. | Bỏ giỏ, hoàn đổi cao. |
| P-02 | Mua qua chat cần nhân viên xác nhận thủ công. | Chậm, dễ sai giá/địa chỉ/tồn kho. |
| P-03 | Chi phí cuối cùng và trạng thái giao hàng thiếu minh bạch. | Mất niềm tin, tăng liên hệ CS. |
| P-04 | Doanh nghiệp thiếu dữ liệu funnel và hiệu quả campaign. | Quyết định marketing dựa trên cảm tính. |
| P-05 | Catalog/tồn kho/đơn nằm rải rác. | Oversell, đối soát và vận hành khó. |
| P-06 | Đơn nhiều kho không có hồ sơ giao nhận độc lập. | Khó theo dõi kiện, dễ trừ/nhả tồn sai kho. |
| P-07 | Danh sách khách hàng chưa phản ánh giá trị và mức độ quay lại. | Chăm sóc dàn trải, khó ưu tiên khách cần giữ chân. |

## 5. Nhóm người dùng và nhu cầu cần hoàn thành

| Segment | Job-to-be-done |
|---|---|
| Người mua mobile 18–35 | “Khi thấy một món đồ hợp gu, tôi muốn kiểm tra nhanh size/màu và đặt hàng trong vài phút.” |
| Người mua cân nhắc kỹ | “Tôi muốn đủ ảnh, chất liệu, số đo và chính sách đổi trả để tự tin chọn.” |
| Khách quay lại | “Tôi muốn mua lại nhanh, dùng địa chỉ cũ và theo dõi mọi đơn trong một nơi.” |
| Nhân viên vận hành | “Tôi muốn biết đơn nào cần xử lý và tồn kho nào cần cập nhật mà không dùng nhiều bảng thủ công.” |
| Quản lý cửa hàng | “Tôi muốn biết nhóm khách nào tạo doanh thu, nhóm nào có nguy cơ rời bỏ và việc vận hành nào cần ưu tiên.” |

### 5.1 Sáu phân khúc khách hàng trong hệ thống

Đây là phân khúc vận hành được tính từ dữ liệu giao dịch, khác với nhóm tuổi/giới tính trong khảo sát mô phỏng. Mỗi khách chỉ thuộc một nhóm theo thứ tự ưu tiên của bộ quy tắc `RFM-2026.1`.

| Mã | Nhãn hiển thị | Quy tắc baseline |
|---|---|---|
| `at_risk` | Cần chăm sóc | Đã có đơn thanh toán nhưng hơn 90 ngày chưa quay lại. |
| `vip` | VIP | Có từ 5 đơn đã thu hoặc doanh thu tích lũy từ 5.000.000 đồng. |
| `loyal` | Trung thành | Có từ 2 đơn đã thu và có giao dịch trong 90 ngày gần nhất. |
| `new` | Khách mới | Tạo tài khoản trong 30 ngày và có tối đa 1 đơn đã thu. |
| `potential` | Tiềm năng | Có đúng 1 đơn đã thanh toán. |
| `prospect` | Chưa chuyển đổi | Chưa có đơn được thanh toán. |

## 6. Đề xuất giá trị

- Khám phá nhanh bằng category, search, filter size/màu/giá.
- Tăng tự tin bằng ảnh, size guide, thông tin model/chất liệu và chính sách rõ.
- Checkout ít ma sát bằng guest checkout, địa chỉ đơn giản, COD/payment online.
- Theo dõi đáng tin cậy bằng timeline trạng thái và thông báo giao dịch.
- Vận hành nhất quán bằng một backoffice, sổ cái tồn kho, fulfillment theo kho và audit trail.
- Ưu tiên chăm sóc khách bằng Customer 360° và phân khúc tự động có phiên bản quy tắc.
- Hỗ trợ quyết định bằng Copilot rule-based có dẫn liệu, cảnh báo giới hạn và không tự ghi dữ liệu.

## 7. Các chủ đề chiến lược

| Theme | Kết quả mong muốn |
|---|---|
| Discoverability | Khách tìm được sản phẩm phù hợp nhanh hơn. |
| Conversion & Trust | Tăng add-to-cart và checkout completion. |
| Fulfillment Excellence | Giảm thời gian xử lý, hủy do hết hàng và liên hệ hỏi trạng thái. |
| Retention | Tăng tỷ lệ khách quay lại và mua lần hai. |
| Data Foundation | Có funnel, cohort và dữ liệu sản phẩm/đơn đáng tin cậy. |
| Customer Intelligence | Nhìn được sáu phân khúc và lịch sử giao dịch mà không gắn nhãn thủ công. |
| Assisted Operations | Tóm tắt tồn kho, đơn, doanh thu và khuyến mãi bằng luật minh bạch. |

## 8. Chỉ số trọng tâm và chỉ số bảo vệ

**North Star Metric:** số đơn giao thành công mỗi tháng từ khách hàng có trải nghiệm không cần hỗ trợ thủ công.

**Supporting metrics:** conversion rate, checkout completion, AOV, repeat purchase rate, tỷ trọng VIP/trung thành, fulfillment lead time và delivery success rate.

**Guardrails:** cancellation rate, return rate, payment failure rate, oversell count, page performance, CS contacts/order và complaint rate.

Trong phạm vi đồ án, các chỉ số trên là định nghĩa đo lường và dữ liệu demo; chưa phải kết quả kinh doanh thực tế.

## 9. Mô hình ưu tiên

Áp dụng RICE ở cấp initiative và MoSCoW ở cấp release. Công thức:

`RICE = Reach × Impact × Confidence / Effort`

Must-have phải trực tiếp phục vụ giao dịch end-to-end, tuân thủ, an toàn hoặc vận hành tối thiểu. Mọi yêu cầu mới sau scope baseline phải đổi bằng một hạng mục tương đương hoặc đi qua Change Control.

## 10. Giới hạn của tầm nhìn hiện tại

- Chưa tích hợp hãng vận chuyển hai chiều; nhân viên nhập carrier/tracking và cập nhật trạng thái thủ công.
- Thanh toán ngoài hệ thống được mô phỏng hoặc dùng sandbox; không tuyên bố sẵn sàng xử lý tiền thật.
- Copilot hiện là bộ máy luật có thể giải thích, không phải mô hình học máy/LLM và không cá nhân hóa tự động.
- Phân khúc là read model từ giao dịch, không phải dự đoán xác suất mua và không dùng thuộc tính nhạy cảm.
- Mọi kết luận về nhu cầu thị trường phải được kiểm chứng lại bằng khảo sát/phỏng vấn thật.
