"""Presentation-only Vietnamese wording for the student survey report.

The raw survey fixtures and all numeric results remain unchanged.  Source paths,
record IDs and figure file names remain stable so the report stays reproducible.
"""
import re


def section(text, start, end, replacement):
    a, b = text.index(start), text.index(end)
    return text[:a] + replacement.strip() + "\n\n" + text[b:]


GLOSSARY = """# CHƯƠNG 2. GIẢI THÍCH TỪ NGỮ

Các từ dưới đây được dùng trong báo cáo. Mã viết tắt chỉ dùng để đối chiếu với bảng yêu cầu, sơ đồ và dữ liệu kèm theo.

<!-- widths: 1.45, 3.35, 1.7 -->
| Thuật ngữ | Giải thích đơn giản | Ví dụ hoặc lưu ý |
|---|---|---|
| Sản phẩm | Một mẫu quần áo được giới thiệu trên website | Một mẫu áo sơ mi |
| Biến thể, mã hàng (SKU) | Một lựa chọn cụ thể về cỡ và màu của sản phẩm | Áo sơ mi trắng, cỡ M |
| Giỏ hàng | Danh sách hàng khách chọn trước khi đặt đơn | Thêm vào giỏ chưa giữ hàng |
| Mã giảm giá | Mã giúp giảm tiền nếu đơn đáp ứng điều kiện | Giảm 50.000đ cho đơn đủ mức tiền |
| Đơn hàng | Lưu hàng đã mua, số lượng, giá và địa chỉ nhận | Một đơn có thể giao nhiều kiện |
| Dữ liệu lúc đặt đơn | Thông tin được lưu tại thời điểm khách đặt hàng | Giá cũ không đổi khi sửa giá sản phẩm |
| Tồn thực tế | Số hàng đang được ghi nhận trong kho | Chưa trừ hàng giữ cho các đơn |
| Hàng giữ chỗ | Hàng dành cho đơn đã đặt nhưng chưa xuất kho | Được trả lại khi hủy hợp lệ |
| Hàng còn để cấp | Tồn thực tế trừ hàng đang giữ chỗ | Dùng khi tạo đơn hiện tại |
| Tồn dự phòng | Lượng hàng muốn để lại để phòng thiếu hàng | Chưa dùng để chặn đặt đơn |
| Số sẵn bán (ATP) | Hàng còn để cấp trừ tồn dự phòng; nhỏ hơn 0 thì lấy 0 | Hiển thị trên trang quản lý kho |
| Phiếu giữ chỗ | Ghi mã hàng, kho, số lượng và thời hạn giữ | Gắn với hàng trong đơn |
| Kiện giao hàng | Phần hàng được giao từ một kho | Hiện mỗi kho tạo một kiện/đơn |
| Mã vận đơn | Mã dùng để theo dõi giao hàng | Nhân viên đang nhập bằng tay |
| COD | Thanh toán khi nhận hàng | Chỉ ghi đã trả khi mọi kiện đã giao |
| Chống xử lý trùng | Gửi lại cùng yêu cầu không tạo thêm giao dịch | Bấm hai lần không tạo hai đơn |
| Phân quyền | Mỗi vai trò chỉ được làm việc được phép | Khách, nhân viên, quản lý, quản trị |
| Yêu cầu chức năng (FR) | Việc website cần làm được | Đăng nhập, đặt hàng, nhập kho |
| Yêu cầu phi chức năng (NFR) | Yêu cầu về tốc độ, an toàn và cách sử dụng | Không để khách xem đơn của người khác |
| Sơ đồ chức năng (BFD) | Chia các chức năng thành nhóm | Cho biết website có những việc gì |
| Sơ đồ hoạt động | Mô tả các bước và các trường hợp xử lý | Đặt hàng thành công hoặc hết hàng |
| Sơ đồ dữ liệu (ERD) | Mô tả dữ liệu và quan hệ giữa chúng | Một đơn có nhiều dòng hàng |

## Cách dùng mã trong báo cáo

P1-FR và P1-NFR là mã yêu cầu của báo cáo. “Cần có” là phần chính của bài; “Nên có” là phần có thể làm sau. “Đã có” nghĩa là đã thấy trong mã nguồn, không có nghĩa là người dùng thật đã kiểm tra và đồng ý. Các nhãn SYS, SYN, PLAN và FIELD lần lượt chỉ mã nguồn, dữ liệu giả lập, kế hoạch và khảo sát thật.

"""


REQUIREMENTS = """# CHƯƠNG 6. YÊU CẦU CHỨC NĂNG VÀ PHI CHỨC NĂNG

## 6.1 Yêu cầu chức năng

Yêu cầu chức năng cho biết ai sử dụng và website cần làm được việc gì. Bảng dưới đây có 24 yêu cầu. Mỗi yêu cầu có mã riêng để đối chiếu với sơ đồ và bài kiểm tra. Cột cuối ghi tình trạng trong mã nguồn hiện tại, không phải kết quả thử với người dùng thật.

<!-- widths: 0.85, 1.1, 2.85, 1.7 -->
| Mã / mức cần | Người dùng | Việc cần làm được | Tình trạng hiện tại |
|---|---|---|---|
| P1-FR-01 Cần có | Khách | Tìm, lọc và sắp xếp sản phẩm; chỉ hiện hàng được phép bán | Đã có |
| P1-FR-02 Cần có | Khách | Xem ảnh, mô tả, cỡ, màu và giá; không mua vượt số hàng còn lại | Đã có; cần thử với người dùng |
| P1-FR-03 Cần có | Khách, thành viên | Đăng ký, xác minh, đăng nhập, gia hạn phiên, đăng xuất và đặt lại mật khẩu; từ chối mã xác thực sai | Đã có; chưa gửi thư xác minh thật |
| P1-FR-04 Nên có | Thành viên | Sửa hồ sơ, quản lý địa chỉ, lưu hàng yêu thích; chỉ xem dữ liệu của mình | Đã có |
| P1-FR-05 Cần có | Khách | Thêm, đổi số lượng và xóa hàng trong giỏ; máy chủ tính lại tổng tiền | Đã có |
| P1-FR-06 Cần có | Khách | Áp hoặc bỏ mã giảm giá; kiểm tra hạn dùng, mức tiền tối thiểu, số lượt và kiểu giảm | Đã có |
| P1-FR-07 Cần có | Khách | Đặt đơn với địa chỉ hợp lệ; lưu đủ đơn, dòng hàng, giữ chỗ, kiện giao và khoản thanh toán | Đã có cách xử lý chính |
| P1-FR-08 Cần có | Khách | Chọn trả khi nhận hàng hoặc trả trực tuyến giả lập; không coi việc quay lại website là đã trả tiền | Đã có trong bản chạy thử |
| P1-FR-09 Cần có | Hệ thống | Kiểm tra chữ ký thông báo thanh toán, không xử lý trùng và không đổi sai đơn đã kết thúc | Còn lỗi KD-PAY-01 |
| P1-FR-10 Cần có | Khách | Xem đơn và từng kiện; mã truy cập của khách chưa đăng nhập phải gửi đúng nơi và còn hạn | Còn lỗi ở trang trả trực tuyến của khách chưa đăng nhập |
| P1-FR-11 Cần có | Nhân viên | Tra đơn, đổi trạng thái và hủy đúng điều kiện; không hủy trực tiếp đơn đã trả tiền hoặc đã được chấp thuận thanh toán | Đã có kiểm tra chính |
| P1-FR-12 Cần có | Nhân viên kho | Xem tồn thực tế, hàng giữ chỗ, hàng còn để cấp và số sẵn bán theo mã hàng, kho | Đã có; hai số cuối dùng công thức khác nhau |
| P1-FR-13 Cần có | Hệ thống | Giữ, xuất và trả lại phần hàng giữ chỗ đúng đơn, đúng kiện; khi hết hạn phải khớp cả thanh toán | Còn lỗi KD-INV-01/02 |
| P1-FR-14 Cần có | Nhân viên kho | Nhập kho một dòng hàng mỗi lần; gửi lại cùng yêu cầu không ghi tăng kho hai lần | Đã có; nhập nhiều dòng là phần mở rộng |
| P1-FR-15 Cần có | Nhân viên kho | Chuyển kho khi nguồn đủ hàng; ghi cả trừ kho nguồn và cộng kho đích, không chỉ ghi một bên | Đã có |
| P1-FR-16 Cần có | Quản lý, kho | Kiểm kê, điều chỉnh đúng quyền, có lý do và chứng từ; khóa dữ liệu khi cập nhật | Đã có; chưa đối chiếu phiên bản do trình duyệt gửi |
| P1-FR-17 Cần có | Hệ thống, nhân viên | Tạo kiện theo kho; xem hàng và lịch sử riêng của từng kiện | Đã có |
| P1-FR-18 Cần có | Nhân viên | Nhập hãng giao, mã vận đơn, thời gian dự kiến; phải có mã vận đơn trước khi ghi đã gửi | Đã có; nhập bằng tay |
| P1-FR-19 Cần có | Kho, chăm sóc khách | Ghi giao lỗi, hoàn hàng hoặc hủy kèm lý do; hàng hoàn không tự cộng lại vào kho | Đã có cho kiện giao; hoàn tiền chưa đầy đủ |
| P1-FR-20 Nên có | Nhân viên, quản lý | Tìm khách, xem hồ sơ và các đơn; quản trị viên kiểm soát trạng thái tài khoản | Đã có |
| P1-FR-21 Nên có | Quản lý | Xem sáu nhóm khách, tính từ đơn đã thanh toán theo thứ tự ưu tiên | Đã có theo quy tắc định sẵn |
| P1-FR-22 Cần có | Nhân viên, quản lý | Quản lý sản phẩm, cỡ, màu, ảnh và giảm giá theo quyền | Có xem, tạo và thêm ảnh; chưa đủ sửa, xóa |
| P1-FR-23 Nên có | Quản lý | Xem số liệu, báo cáo và sổ thanh toán theo kỳ, biết dữ liệu lấy từ đâu | Đã có; cần kiểm tra các lỗi còn lại |
| P1-FR-24 Nên có | Quản lý | Trợ lý quản lý tóm tắt số liệu, nêu nguồn và thời điểm; không tự sửa dữ liệu | Đã có theo quy tắc; chưa dùng mô hình AI bên ngoài |

## 6.2 Yêu cầu phi chức năng

Yêu cầu phi chức năng nói về chất lượng của website, như tốc độ, bảo mật và khả năng khôi phục dữ liệu. Các mức dưới đây là mục tiêu để kiểm tra, chưa phải kết quả đã đo. Khi thử cần ghi cấu hình máy, lượng dữ liệu và cách đo.

<!-- widths: 0.9, 1.15, 2.85, 1.6 -->
| Mã | Nhóm | Mục tiêu cần kiểm tra | Cách kiểm tra |
|---|---|---|---|
| P1-NFR-01 | Tốc độ | Khi có 100 yêu cầu/giây, ít nhất 95% yêu cầu đọc sản phẩm và giỏ được trả lời trong 500 ms trên cấu hình đã ghi | Tạo nhiều yêu cầu cùng lúc và đo thời gian |
| P1-NFR-02 | Dễ dùng | Chọn cỡ, dùng giỏ và đặt đơn trên màn hình rộng từ 360 px mà không phải cuộn ngang | Thử trên thiết bị và nhờ người dùng làm thử |
| P1-NFR-03 | Dễ tiếp cận | Dùng bàn phím được ở các bước chính; ô nhập có nhãn, vị trí chọn rõ; lỗi có chỉ dẫn sửa | Thử bằng tay và công cụ kiểm tra |
| P1-NFR-04 | Bảo mật | Không lưu mật khẩu dạng đọc được; mã truy cập có hạn và có thể thu hồi; không để mã của khách trong đường dẫn hoặc nhật ký | Xem mã nguồn và thử mã sai, mã hết hạn |
| P1-NFR-05 | Phân quyền | Chặn người không có quyền và không cho xem, sửa dữ liệu của người khác | Thử từng vai trò với từng chức năng |
| P1-NFR-06 | Đúng dữ liệu | Đặt đơn và cập nhật kho phải hoàn tất toàn bộ hoặc không ghi gì; gửi lại không tạo đơn, thay đổi kho, thông báo trùng | Thử gây lỗi và gửi cùng yêu cầu nhiều lần |
| P1-NFR-07 | Cùng thao tác | Nhiều người đặt, sửa cùng lúc không làm vượt tồn; phát hiện dữ liệu đã đổi trước khi ghi đè | Cho nhiều yêu cầu chạy cùng lúc |
| P1-NFR-08 | Riêng tư | Chỉ thu thông tin cần thiết; báo cáo có phân quyền; dữ liệu khảo sát không gắn danh tính | Kiểm tra dữ liệu lưu và quyền truy cập |
| P1-NFR-09 | Khôi phục | Với PostgreSQL, mục tiêu mất tối đa 24 giờ dữ liệu và khôi phục trong 4 giờ nếu có sự cố | Sao lưu, phục hồi thử và ghi kết quả |
| P1-NFR-10 | Dễ sửa | Chia mã theo chức năng; không sửa tệp thay đổi cơ sở dữ liệu đã chạy; có bài kiểm tra quy tắc quan trọng | Kiểm tra mã, tệp dữ liệu và bài kiểm tra tự động |
| P1-NFR-11 | Dễ chạy | Có hướng dẫn chạy bằng Docker, cấu hình mẫu, kiểm tra dịch vụ và thông báo lỗi rõ | Nhờ người khác chạy theo hướng dẫn |
| P1-NFR-12 | Theo dõi lỗi | Giao dịch quan trọng có mã để tra và lịch sử thao tác; trợ lý nêu thời điểm dữ liệu, không tự ghi thay đổi | Đối chiếu nhật ký với dữ liệu và màn hình |

## 6.3 Cách xác nhận yêu cầu

Một yêu cầu cần có nguồn, người sử dụng, điều kiện trước và sau khi làm, ít nhất một trường hợp lỗi và cách kiểm tra. Trưởng nhóm ghi phần thống nhất; người làm giao diện và hai người làm máy chủ kiểm tra khả năng thực hiện. Giảng viên hoặc người vận hành xác nhận nghiệp vụ khi có điều kiện. Phần chưa hỏi người thật vẫn ghi “chờ xác nhận”.

"""


RULES = """## 5.2 Các quy tắc cần tuân theo

- BR-P1-01: Máy chủ phải tính lại giá và tổng tiền. Không dùng thẳng số tiền trình duyệt gửi lên.
- BR-P1-02: Khi đặt đơn, hàng còn để cấp = tồn thực tế − hàng giữ chỗ. Trang quản lý còn trừ tồn dự phòng để hiện số sẵn bán; hiện chưa dùng số này để chặn đặt hàng.
- BR-P1-03: Mỗi kho cấp hàng tạo một kiện cho đơn. Một đơn có thể có nhiều kiện và nhiều mã vận đơn.
- BR-P1-04: Khi gửi một kiện, chỉ trừ hàng trong kho và phần giữ chỗ của kiện đó, đồng thời ghi lịch sử xuất kho. Nếu hủy hợp lệ trước khi gửi, trả lại phần hàng đang giữ.
- BR-P1-05: Đơn trả khi nhận hàng chỉ được ghi đã thanh toán khi mọi kiện đã giao. Mã vận đơn nhập tay chưa chứng minh hãng giao đã xác nhận.
- BR-P1-06: Hàng hoàn sau khi gửi không tự tăng tồn. Kho phải kiểm tra hàng rồi lập phiếu nhập hoặc điều chỉnh hợp lệ.
- BR-P1-07: Thành viên chỉ xem đơn của mình. Khách chưa đăng nhập dùng mã truy cập có hạn, gửi trong phần đầu yêu cầu, không đưa vào đường dẫn.
- BR-P1-08: Gửi lại yêu cầu quan trọng không được xử lý hai lần. Khi sửa kiện giao, phải kiểm tra phiên bản dữ liệu để tránh ghi đè thay đổi của người khác.

## 5.3 Các lỗi hiện tại cần xử lý

<!-- widths: 1.05, 3.3, 2.15 -->
| Mã | Vấn đề trong mã nguồn | Việc cần làm |
|---|---|---|
| KD-GUEST-01 | Trang trả trực tuyến của khách chưa đăng nhập gửi mã trong đường dẫn, nhưng máy chủ đọc ở phần đầu yêu cầu | Thống nhất cách gửi; kiểm tra đường dẫn không lộ mã |
| KD-PAY-01 | Thông báo trả tiền thành công đến muộn có thể làm đơn đã hủy bị ghi thành đã trả | Kiểm tra trạng thái đơn; từ chối hoặc đưa vào đối chiếu |
| KD-INV-01 | Tác vụ hết hạn đã hủy đơn nhưng chưa cập nhật khoản thanh toán đang chờ | Cập nhật đơn và thanh toán cùng lần; kiểm tra lại |
| KD-INV-02 | Hàng giữ cho đơn COD có hạn 30 ngày, nhưng tác vụ hết hạn chỉ quét đơn chờ trả trực tuyến | Thống nhất cách xử lý COD hết hạn và bổ sung tác vụ |

Các lỗi này được nhận ra từ mã nguồn, không phải từ khảo sát giả lập. Nhiệm vụ sửa báo cáo chưa sửa các lỗi trên. Sơ đồ trình bày cách xử lý cần có; những phần còn thiếu được ghi riêng để tránh hiểu là hệ thống đã hoàn thiện.

"""


# Rewrite long, abstract paragraphs as complete sentences before replacing terms.
PARAGRAPHS = {
    "Báo cáo phục vụ phần khảo sát": "Báo cáo này trình bày việc khảo sát và tìm hiểu yêu cầu cho website bán quần áo NÉT Commerce trong học phần Project 1. Bản 1.2 giữ nguyên số liệu của bản 1.1 và sửa cách viết để dễ đọc hơn.",
    "> DỮ LIỆU GIẢ LẬP": "> DỮ LIỆU GIẢ LẬP. Toàn bộ phiếu trả lời, phỏng vấn, đơn hàng và số liệu kho do nhóm tạo để làm bài tập. Không có người thật tham gia, không đi khảo sát cửa hàng và không phát sinh giao dịch thật. Nếu học phần yêu cầu khảo sát thật, cần hỏi giảng viên trước khi dùng bộ dữ liệu này thay thế.",
    "Mua quần áo online đòi hỏi": "Khi mua quần áo trên mạng, khách không thể thử trực tiếp nên dễ chọn sai cỡ hoặc màu. Cửa hàng cũng cần theo dõi hàng còn trong kho, tiền thanh toán và tình trạng giao hàng. Nếu các thông tin này không khớp, khách và nhân viên sẽ khó xử lý đơn.",
    "Đề tài phù hợp Project 1 vì": "Nhóm chọn đề tài này vì có các bước quen thuộc: tìm sản phẩm → chọn cỡ, màu → thêm vào giỏ → đặt đơn → giữ hàng → thanh toán → giao hàng. Qua đó, nhóm thực hành viết yêu cầu, tìm các trường hợp lỗi và vẽ sơ đồ dữ liệu. Số liệu giả lập chỉ dùng để minh họa, không dùng để kết luận việc kinh doanh sẽ thành công.",
    "Tạo bộ yêu cầu truy vết": "Bài làm gồm kế hoạch khảo sát 02 tuần, phiếu hỏi và dữ liệu giả lập, kết quả theo từng nghiệp vụ, yêu cầu chức năng và phi chức năng, sơ đồ chức năng, sơ đồ hoạt động và sơ đồ dữ liệu. Mỗi yêu cầu có nguồn và cách kiểm tra.",
    "Storefront, tài khoản": "Website gồm trang mua hàng, tài khoản, giỏ hàng, mã giảm giá, đặt đơn khi có hoặc chưa có tài khoản, trả khi nhận hàng, trả trực tuyến giả lập và theo dõi đơn. Trang quản lý có sản phẩm, khách hàng, nhóm khách, nhiều kho, giao hàng, báo cáo và trợ lý chỉ đọc số liệu.",
    "Chưa khẳng định có cổng thanh toán": "Hệ thống chưa kết nối thanh toán thật, hãng vận chuyển, dịch vụ gửi thư thật hoặc mô hình AI bên ngoài. Chức năng tự yêu cầu hoàn tiền cũng chưa hoàn chỉnh. Đây là các phần có thể làm tiếp.",
    "Đợt SYN được dựng theo đúng": "Bài khảo sát giả lập dùng ba cách theo yêu cầu học phần: phiếu hỏi người mua, phỏng vấn có câu hỏi chuẩn bị trước và xem mẫu đơn hàng, chứng từ. Bộ phiếu được tạo theo Q01–Q17, có mã SYN-PH-P1-120-v1. Phỏng vấn và hồ sơ có mã SYN-P1-QUAL-2026.1. Không lấy bảng 200 mẫu cũ để tạo câu trả lời cho bộ mới.",
    "Seed 20260903 và thuật toán": "Chương trình tạo dữ liệu dùng số khởi tạo 20260903 và cách tính mulberry32 để có thể tạo lại đúng bộ phiếu. Số phiếu theo ba nhóm tuổi được đặt trước là 42, 48 và 30. Nhóm cũng đặt một số tình huống hợp lý: người lo tổng tiền hoặc hết hàng có thể bỏ dở đơn; người lo trả trước có thể chọn trả khi nhận hàng. Đây là giả định để làm bài, không phải điều đã quan sát ở khách thật.",
    "N4–N7 là ngày tương đối": "N4–N7 chỉ là ngày trong kịch bản. Dữ liệu được soạn ngày 03/09/2026; kế hoạch khảo sát dự kiến từ 07–18/09/2026. Không coi các mốc này là ngày đã đi khảo sát. Câu trả lời đồng ý tham gia cũng chỉ dùng để thử bước lọc phiếu.",
    "Kết quả Word là bản diễn giải": "Bản Word trình bày và giải thích kết quả. Bản Excel giữ từng phiếu và công thức tính; các tệp JSON giúp tạo lại bộ dữ liệu. Không đưa các dữ liệu giả này vào ứng dụng để tạo thanh toán hoặc vận đơn thật.",
    "Quy tắc làm sạch: loại theo thứ tự": "Phiếu được loại theo thứ tự: không đủ điều kiện → thiếu câu bắt buộc → bản trùng do chương trình tạo. Mỗi phiếu có một lý do loại chính. Hai người chọn giống nhau chưa đủ để kết luận phiếu trùng. Ô không được hỏi để trống, không đổi thành câu trả lời “Không”.",
    "10 ca pilot SYN đã mô tả": "Phụ lục D.1 có 10 tình huống thử phiếu: dừng khi không đồng ý, sai nhóm tuổi hoặc chưa mua gần đây; kiểm tra chọn “không gặp vấn đề”; kiểm tra Q09 thuộc Q08, nhánh Q11, tối đa 3 lựa chọn ở Q12 và cách tính tỷ lệ. Đây là thử cách hoạt động của phiếu, không phải thử với 10 người thật.",
    "Phân bổ tuổi đúng quota": "Số phiếu theo tuổi khớp kế hoạch vì đã được đặt trước. Bộ mẫu chỉ gồm người giả định 18–44 tuổi đã mua quần áo trên mạng trong 06 tháng. Không dùng bộ này để đại diện cho mọi người mua hàng.",
    "Q14: muốn mua guest": "Q14: muốn mua không cần đăng nhập 47/120 (39,2%); muốn đăng ký ngay 19/120 (15,8%); tùy lợi ích 48/120 (40,0%); không chắc 6/120 (5,0%). Vì vậy bài thiết kế giữ cả hai cách đặt hàng và giải thích lợi ích của tài khoản như lưu địa chỉ, xem đơn cũ. Đây là lựa chọn giả lập, không phải kết quả mua hàng thực tế.",
    "Nhóm thích guest có": "Trong nhóm thích mua không cần đăng nhập, có 34/47 (72,3%) từng bỏ dở đơn theo kịch bản. Nhóm muốn đăng ký ngay có 5/19 (26,3%). Không thể kết luận việc bắt đăng ký gây bỏ dở: mối liên hệ này đã được đặt khi tạo dữ liệu và còn nhiều lý do khác chưa xét. Nhóm không chắc chỉ có 6 phiếu.",
    "Giới hạn chung: mẫu thuận tiện": "Hạn chế của bài: số phiếu theo nhóm tuổi được đặt trước; câu trả lời và thời gian do chương trình tạo; chưa có giao dịch hay ý kiến của người thật. Vì vậy chỉ mô tả bộ dữ liệu này, không dùng phép kiểm định để kết luận cho thị trường. Nếu khảo sát thật, lưu thành bộ riêng và tính lại toàn bộ kết quả, không trộn với dữ liệu giả lập.",
    "Bộ định tính có": "Có 08 nhân vật người mua và 04 vai trò làm việc tại cửa hàng: quản lý, kho, xử lý đơn và thanh toán. Mỗi biên bản có hoàn cảnh, tình huống, 04 nhận xét và yêu cầu liên quan. Tổng cộng 48 nhận xét không phải 48 người. Phụ lục D.2 ghi từng biên bản; tất cả đều là giả lập.",
    "Cách mã hóa: từng phát hiện": "Mỗi nhận xét được ghi chủ đề, mức ưu tiên và tình trạng hệ thống. Ba mã trong dữ liệu gốc là CURRENT (đã có cơ sở trong mã nguồn), PROPOSED (đề xuất thêm), KNOWN_DEFECT (lỗi đã biết). Nhân vật do nhóm tạo nên ý kiến của họ không thay cho xác nhận của khách thật. Không lấy tỷ lệ từ 12 biên bản để kết luận cho nhiều người khác.",
    "Lấy mẫu hồ sơ là một kỹ thuật": "Với cách xem mẫu hồ sơ, nhóm kiểm tra thông tin trong đơn, quan hệ giữa chứng từ và các trường hợp lỗi. Bộ giả lập gồm 20 đơn và 10 chứng từ được chọn để có nhiều tình huống khác nhau. Đây không phải dữ liệu lấy từ ứng dụng đang chạy và không dùng để tính tỷ lệ giao lỗi thực tế.",
    "Mỗi hồ sơ là một snapshot": "Mỗi hồ sơ ghi một tình huống độc lập; số dư kho của hồ sơ này không nối tiếp hồ sơ khác. Tiền hàng = tổng số lượng × đơn giá. Tổng phải trả = tiền hàng − giảm giá + phí giao. Đơn vị là đồng, không có phần lẻ. Mã SYN-GIAM50 là mã giả định giảm 50.000đ khi tiền hàng từ 500.000đ; không khẳng định mã này có sẵn trong ứng dụng.",
    "Kết quả phân tích: cần lưu snapshot": "Qua các hồ sơ, đơn cần giữ thông tin lúc đặt và tách trạng thái đơn, thanh toán, kiện giao. Hàng được giữ theo mã hàng và kho; chỉ xuất phần thuộc kiện đã gửi. Đơn trả khi nhận hàng chỉ ghi đã thanh toán khi mọi kiện đã giao. Hàng hoàn không tự nhập lại kho. Phụ lục D.3–D.5 có bảng mẫu và ví dụ để kiểm tra từng nhận xét.",
    "Nguồn SYS vẫn cần thiết": "Vẫn cần đọc mã nguồn để biết ứng dụng đang làm gì. Các mẫu giả lập không chứng minh bốn lỗi ở mục 5.3 đã được sửa, nhất là thông báo thanh toán đến muộn và xử lý hết hạn giữ hàng. Viết quy trình trong báo cáo cũng không có nghĩa là đã làm xong hoàn tiền hoặc đối chiếu với hãng vận chuyển thật.",
    "Tổng hợp kết hợp thống kê SYN": "Nhóm đối chiếu số liệu giả lập, tình huống phỏng vấn, hồ sơ mẫu và mã nguồn để viết yêu cầu. Mức ưu tiên dựa cả vào việc tránh sai tiền, sai tồn kho và phần việc của đồ án, không chỉ dựa vào số phiếu chọn. Dữ liệu do nhóm tạo không phải bằng chứng độc lập rằng thiết kế đã đúng với khách thật.",
    "BFD dưới đây mô tả": "Sơ đồ chức năng dưới đây chia website thành sáu nhóm F1–F6. Các đường nối cho biết chức năng thuộc nhóm nào, không biểu diễn thứ tự thực hiện. Mã nhóm được dùng để đối chiếu với yêu cầu chức năng.",
    "Luồng chuẩn của P1-FR-03": "Theo P1-FR-03, tài khoản mới phải chờ xác minh. Chỉ kích hoạt khi mã xác minh còn hạn và chưa dùng. Bản chạy thử cung cấp mã minh họa, chưa gửi thư xác minh thật. Nhập sai mã không được kích hoạt tài khoản hoặc làm mất hiệu lực mã đúng khác.",
    "Luồng A2 liên quan": "Sơ đồ A2 gắn với P1-FR-05–09, 12/13/17. Nếu địa chỉ không hợp lệ hoặc thiếu hàng, website phải báo để khách sửa. Nếu có lỗi khi lưu, không được để lại đơn hoặc phần giữ hàng dở dang. Thanh toán trực tuyến vẫn là giả lập; lỗi truy cập của khách chưa đăng nhập và thông báo đến muộn được nêu ở mục 5.3.",
    "Lệnh được kiểm tra quyền": "Trước khi nhập hoặc chuyển kho, hệ thống kiểm tra quyền, kho, mã hàng, số lượng, hàng còn lại và việc gửi trùng. Chuyển kho phải cùng lúc trừ nguồn và cộng đích; lỗi ở một bên thì bỏ toàn bộ thay đổi. Kiểm kê, điều chỉnh cần thêm số đếm, lý do và quyền phù hợp. Hiện mỗi yêu cầu chỉ xử lý một dòng và ghi nhận ngay, chưa có bước lưu nháp rồi duyệt.",
    "Luồng chuẩn đi từ pending": "Các bước chính là: chờ xử lý → đang chuẩn bị → sẵn sàng giao → đã gửi → đã giao. Khi giao lỗi, nhân viên có thể sắp xếp giao lại theo các bước được phép. Hàng bị trả về không tự tăng tồn; kho phải kiểm tra rồi nhập lại. Đơn trả khi nhận hàng chỉ ghi đã thanh toán khi mọi kiện đã giao. Hệ thống chưa tự gọi hãng vận chuyển.",
    "ERD khái niệm tập trung": "Sơ đồ dữ liệu ở mức khái niệm chỉ thể hiện đối tượng và quan hệ. Ký hiệu 1 là đúng một; 0..1 là không có hoặc một; 0..N là không có hoặc nhiều; 1..N là ít nhất một. Số ghi gần đầu nào nói về đối tượng ở đầu đó. Phần này không liệt kê toàn bộ 33 bảng hay kiểu dữ liệu chi tiết; một đối tượng có thể được lưu bằng nhiều bảng.",
    "Khách vãng lai giải thích quan hệ": "Khách có thể đặt đơn không cần tài khoản, nên phía tài khoản có số 0..1. Mỗi dòng đơn lưu thông tin lúc đặt và chọn một cỡ, màu cụ thể. Liên kết với biến thể cũ có thể trống nếu biến thể bị xóa. Một đơn có ít nhất một dòng, dùng tối đa một mã giảm giá và hiện tạo một khoản thanh toán khi đặt. Mô hình vẫn cho phép nhiều khoản thanh toán cho một đơn. Ô vàng là đối tượng được nhắc lại để đường nối dễ nhìn.",
    "Tồn kho là khái niệm kết hợp": "Tồn kho được theo dõi cho từng cặp kho và biến thể. Phiếu giữ chỗ nối hàng trong đơn với đúng kho. Mỗi phiếu giao thuộc một đơn và một kho; từng dòng phiếu giao gắn với hàng trong đơn và phần giữ chỗ tương ứng. Dữ liệu cũ có thể thiếu liên kết giữ chỗ nên quan hệ cho phép 0..1. Mỗi đơn chỉ tạo tối đa một phiếu giao tại mỗi kho.",
    "Các thực thể tài khoản, địa chỉ": "Tài khoản, địa chỉ, vai trò, danh mục, hàng yêu thích, chứng từ kho và lịch sử thao tác còn được mô tả trong phần thiết kế dữ liệu chi tiết. Các sơ đồ ở đây chỉ chọn quan hệ cần để giải thích bài toán, không có nghĩa là các phần khác không tồn tại.",
    "Bản 1.1 đã hoàn thành": "Báo cáo đã có 144 phiếu giả lập, trong đó 120 hợp lệ; 10 tình huống thử phiếu; 12 biên bản phỏng vấn; 20 đơn và 10 chứng từ kho. Bài làm còn có kết quả tổng hợp, yêu cầu chức năng, yêu cầu phi chức năng và các sơ đồ. Các kết quả chỉ dùng để học cách khảo sát và phân tích website NÉT Commerce.",
    "Trước khi nộp, bổ sung": "Trước khi nộp, cần điền tên trường, lớp, giảng viên, thành viên và mã sinh viên; hỏi giảng viên về việc dùng dữ liệu giả lập. Nếu phải khảo sát thật, nhóm cần thu phiếu và phỏng vấn thật rồi lưu riêng, tính lại tỷ lệ và xem lại phần ưu tiên. Không đổi nhãn của dữ liệu giả lập thành khảo sát thật.",
    "10 ca sau là kịch bản": "10 tình huống dưới đây dùng để kiểm tra phiếu hỏi, không phải 10 buổi thử với người thật. Không có điểm hài lòng, thời gian quan sát hay chữ ký xác nhận thật. Các tình huống này không nằm trong 144 phiếu gốc hoặc 120 phiếu hợp lệ.",
    "Các mã PILOT ở bảng": "Các mã PILOT trong bảng có mã đầy đủ bắt đầu bằng SYN-PILOT trong dữ liệu gốc. Đây là ghi chép về cách thiết kế phiếu, không phải kết quả người dùng thật đã thử và xác nhận.",
    "Tất cả mã rút gọn DH": "Mã DH trong bảng có mã đầy đủ bắt đầu bằng SYN-HS-DH. Mỗi dòng là tình huống giả lập tại một thời điểm; trả trực tuyến cũng là giả lập. Tổng tiền các đơn mẫu không phải doanh thu thực tế.",
    "Mã rút gọn KHO mang": "Mã KHO có mã đầy đủ bắt đầu bằng SYN-HS-KHO. Mỗi mẫu có lý do, mã hàng, vai trò thao tác, mã chống xử lý trùng và các lần tăng, giảm kho. Chuyển kho ghi hai lần thay đổi; nhập, kiểm kê và điều chỉnh ghi một lần cho mỗi mẫu.",
    "Số lượng của receipt/transfer": "Ở phiếu nhập và chuyển, số lượng là lượng hàng luân chuyển. Ở phiếu kiểm kê, đó là số đếm thực tế giả định. Ở phiếu điều chỉnh, số âm là giảm, số dương là tăng. Không cộng các cột khác nghĩa này thành một tổng. Kiểm tra: tồn sau = tồn trước + thay đổi; hàng còn để cấp = tồn thực tế − giữ chỗ; số sẵn bán = hàng còn để cấp − dự phòng, nếu âm thì lấy 0.",
    "Excel gồm hướng dẫn, 144 phiếu raw": "Excel có hướng dẫn, 144 phiếu gốc, kết quả bằng công thức, bảng giải thích mã, phỏng vấn, đơn hàng, dòng hàng và chứng từ kho. Chỉ phiếu có status=valid (hợp lệ) được tính; excluded là phiếu bị loại, có lý do và mã bản gốc nếu trùng. Khi sửa dữ liệu, cần kiểm tra công thức và xuất lại Word vì Word không tự cập nhật theo Excel.",
}

PARAGRAPHS.update({
    "Người trả lời phiếu chính dự kiến": "Người trả lời dự kiến từ 18–44 tuổi, đã mua quần áo trực tuyến trong 06 tháng và đồng ý tham gia. Nhóm đặt số mẫu theo tuổi là 42 người 18–24, 48 người 25–34 và 30 người 35–44. Dữ liệu giả lập được tạo đúng các số này. Đây không phải số người đã hỏi thật và không đại diện cho toàn bộ người mua hàng Việt Nam.",
    "Phiếu thiếu điều kiện tham gia": "Phiếu không đủ điều kiện hoặc bị trùng phải ghi rõ lý do loại. Thời gian trả lời khác thường chỉ là dấu hiệu cần xem lại, không tự động loại. Nếu sửa câu hỏi sau khi thử, không gộp phiếu thử vào bộ chính. Khi khảo sát thật mà thiếu mẫu, phải báo số thực thu, không lấy dữ liệu giả để bù.",
    "Quy định dưới đây dành cho đợt FIELD": "Các quy định sau dùng nếu nhóm đi khảo sát thật. Bộ giả lập không có dữ liệu cá nhân hay ghi âm thật. Lịch dự kiến có 10 người thử phiếu; phần giả lập chỉ có 10 tình huống kiểm tra, không thay cho 10 người.",
    "Bộ SYN-PH-P1-120-v1 được sinh": "Bộ SYN-PH-P1-120-v1 dựa trên phiếu PH-P1-v1. Mã câu trả lời được giải thích trong Excel và dữ liệu gốc. Q09a ghi vấn đề chính, Q09b ghi mô tả; Q13_reason ghi lý do chọn cách trả tiền. Quá trình lọc là 160 → 144 → 128 → 124 → 120, hoàn toàn giả lập. Ô trống có thể do chưa được hỏi, bỏ qua theo nhánh hoặc không trả lời câu mở, không có nghĩa là chọn “Không”. Q13_reason và Q17 không bắt buộc. Khi phân tích câu mở, phải ghi số câu có trả lời và dùng số đó làm mẫu số. Khảo sát thật cần ghi riêng số phiếu và lý do thiếu dữ liệu.",
    "Kết quả phân tích: cần lưu": "Qua các hồ sơ, đơn cần giữ thông tin lúc đặt và tách trạng thái đơn, thanh toán, kiện giao. Hàng được giữ theo mã hàng và kho; chỉ xuất phần thuộc kiện đã gửi. Đơn trả khi nhận hàng chỉ ghi đã thanh toán khi mọi kiện đã giao. Hàng hoàn không tự nhập lại kho. Phụ lục D.3–D.5 có bảng mẫu và ví dụ để kiểm tra từng nhận xét.",
    "Trong bảng: PV, DH và KHO": "Trong bảng, PV là phỏng vấn, DH là đơn hàng, KHO là chứng từ kho giả lập; mã đầy đủ nằm ở Phụ lục D. FR là mã P1-FR. Các phần như đánh giá sản phẩm, tự dự báo ngày giao, duyệt chứng từ nhiều cấp hoặc tự hoàn tiền chỉ làm khi được bổ sung vào yêu cầu.",
    "Các nguồn mã nguồn được đối chiếu": "Nhóm đối chiếu các tệp của dự án ngày 03/09/2026. Khi mã nguồn hoặc dữ liệu thay đổi, cần sửa báo cáo và ghi lại phần đã thay đổi trước khi dùng tiếp.",
})

SYNTHESIS = [
    ("D1 — Sản phẩm và tài khoản", "Hiện rõ cỡ, màu, chất liệu và số hàng còn. Tài khoản giúp lưu địa chỉ, hàng yêu thích và đơn cũ; phải bảo vệ dữ liệu riêng và có cách lấy lại tài khoản."),
    ("D2 — Giỏ, mã giảm giá và đặt đơn", "Hiện riêng tiền hàng, giảm giá, phí giao và tổng phải trả. Kiểm tra lại mã khi giỏ đổi. Gửi lại cùng yêu cầu không tạo đơn mới; thêm vào giỏ chưa giữ hàng."),
    ("D3 — Thanh toán", "Trả trực tuyến chỉ được xác nhận từ thông báo hợp lệ. Trả khi nhận hàng chỉ ghi đã trả khi mọi kiện đã giao. Hoàn hàng khác hoàn tiền. Mẫu hoàn toàn bộ tiền là thông báo giả lập, chưa có nút quản trị để yêu cầu hoàn."),
    ("D4 — Kho và chứng từ", "Phân biệt tồn thực tế, giữ chỗ, hàng còn để cấp và số sẵn bán sau dự phòng. Chuyển kho phải trừ nguồn và cộng đích cùng lần. Phiếu nhập, kiểm kê, điều chỉnh hiện xử lý một dòng và ghi nhận ngay."),
    ("D5 — Giao hàng và xử lý lỗi", "Mỗi kho tạo một kiện; mã vận đơn nhập tay. Gửi kiện nào thì trừ hàng của kiện đó. Giao lỗi phải có lý do và lịch sử; trạng thái chung của đơn cần được đọc cùng trạng thái từng kiện."),
    ("D6 — Quản lý và nhóm khách", "Xếp nhóm khách theo quy tắc và giao dịch hợp lệ, không dùng tuổi trong dữ liệu khảo sát giả. Trợ lý chỉ đọc số liệu và nêu rõ nguồn, thời điểm; người quản lý tự quyết định thay đổi."),
]

# Four findings per interview; codes and fit labels are retained by the caller.
INTERVIEWS = {
    "KH-01": ([
        "Chỉ ghi cỡ M chưa đủ; cần có số đo, chất liệu và dáng áo gần chỗ chọn cỡ.",
        "Khi đổi màu để tìm hàng còn, thông báo hết hàng phải đúng cặp màu và cỡ đang chọn.",
        "Lọc theo giá, danh mục và sắp xếp giúp tìm hàng. Nếu không có kết quả, cần cho biết bộ lọc nào đang dùng.",
        "Cần phân biệt giá niêm yết với giá sau giảm; giải thích điều kiện dùng mã và tính lại tổng tiền.",
    ], "Ưu tiên thông tin từng mã hàng và giá rõ ràng. Gợi ý số tiền còn thiếu để dùng mã là phần đề xuất, chưa khẳng định đã có."),
    "KH-02": ([
        "Cần thấy hàng và trạng thái của từng kiện để không hiểu nhầm đơn bị thiếu.",
        "Một kiện đã giao chưa có nghĩa là cả đơn đã giao; màn hình phải phân biệt hai mức này.",
        "Khách giả định muốn biết tiền thu từng kiện. Hệ thống chỉ ghi đơn COD đã trả khi mọi kiện đã giao, chưa có sổ thu riêng từng kiện.",
        "Chia hàng sang nhiều kho không nên làm khách bất ngờ vì phí mới; cần giữ tổng đã xác nhận và nêu rõ chính sách.",
    ], "Đã có theo dõi nhiều kiện. Ghi chi tiết tiền COD từng kiện là phần cần làm thêm."),
    "KH-03": ([
        "Lưu địa chỉ, hàng yêu thích và đơn cũ giúp tài khoản có ích; lời mời đăng ký nên nói rõ các lợi ích này.",
        "Chỉ chủ tài khoản được xem dữ liệu của mình. Sau khi đổi tài khoản, không được còn thấy đơn của người trước.",
        "Khách cần kiểm tra lại địa chỉ đã lưu. Sửa hồ sơ sau này không được đổi địa chỉ đã ghi trong đơn cũ.",
        "Nếu có nút mua lại, vẫn phải kiểm tra giá và tồn mới. Nút mua lại một chạm chưa được xác nhận là đã có.",
    ], "Tài khoản hỗ trợ khách quay lại. Nút mua lại một chạm là đề xuất cho phần phát triển tiếp."),
    "KH-04": ([
        "Tiền hàng, giảm giá và phí giao nên đặt cạnh nhau, trước nút đặt đơn.",
        "Khi xóa hàng sau khi áp mã, phải tính lại tổng và báo nếu mã không còn dùng được.",
        "Khách có thể muốn mua trước, tạo tài khoản sau; vẫn cần cách xem đơn an toàn khi chưa đăng nhập.",
        "Khi có lỗi, chỉ rõ ô cần sửa và giữ phần đã nhập đúng để khách không phải nhập lại hết.",
    ], "Ưu tiên tổng tiền rõ và mua không cần đăng nhập. Cách báo lỗi, giữ nội dung đã nhập vẫn cần thử với người dùng thật."),
    "KH-05": ([
        "Quay lại website sau bước trả tiền chưa có nghĩa là đã trả; cần chờ máy chủ xác nhận.",
        "Nút trả tiền trong đồ án phải ghi rõ là giả lập và không thu tiền thật.",
        "Khi mã đặt lại mật khẩu hết hạn, cần hướng dẫn xin mã mới; không tiết lộ địa chỉ thư có tài khoản hay chưa.",
        "Trang trả tiền của khách chưa đăng nhập gửi mã chưa đúng nơi theo KD-GUEST-01. Đây là lỗi từ việc đọc mã nguồn, không phải người thật đã gặp.",
    ], "Kỳ vọng giả định giúp giải thích yêu cầu. Lỗi KD-GUEST-01 được ghi từ mã nguồn, không gọi là phát hiện khảo sát thật."),
    "KH-06": ([
        "Chỗ chọn cỡ, số lượng và nút thêm giỏ phải nhìn được trên màn hình nhỏ; thông báo lỗi không nằm khuất.",
        "Ảnh cần rõ để xem chất liệu và màu, nhưng không cam kết màu trên mọi màn hình giống hoàn toàn hàng thật.",
        "Thêm vào giỏ chưa giữ hàng. Nếu hết mã hàng khi đặt, cần báo và hướng dẫn chọn lại.",
        "Giảm phí giao và giảm tiền hàng phải có nhãn riêng. Cách giải thích cần được người dùng kiểm tra lại.",
    ], "Cần thử mức dễ dùng trên điện thoại. Tình huống giả lập chưa chứng minh đã đạt tiêu chí dễ tiếp cận hoặc người dùng làm xong các bước."),
    "KH-07": ([
        "Trước khi mua, khách cần biết điều kiện, thời hạn và nơi liên hệ đổi trả. Có chính sách chưa có nghĩa là đã tự động xử lý đổi trả.",
        "Hoàn hàng không có nghĩa là đã hoàn tiền; cần tách trạng thái giao hàng và thanh toán.",
        "Hàng hoàn phải được kiểm tra trước khi nhập lại. Hồ sơ kiểm tra hiện được quản lý ngoài ứng dụng.",
        "Khách giả định muốn gửi yêu cầu hoàn tiền trên website, nhưng bản hiện tại chưa có chức năng và bảng dữ liệu riêng cho yêu cầu này.",
    ], "Giữ nhu cầu đổi, hoàn để tham khảo. Hồ sơ đổi trả, kiểm tra hàng và tự yêu cầu hoàn tiền là phần chưa làm đầy đủ."),
    "KH-08": ([
        "Nếu bấm lại khi mạng chậm, cùng mã yêu cầu phải trả về đơn cũ, không tạo đơn thứ hai.",
        "Cần báo đang xử lý rõ ràng. Chỉ xác nhận đã tạo đơn khi máy chủ trả kết quả; cách hiển thị vẫn cần thử thêm.",
        "Giao thất bại phải có lý do và cách liên hệ. Số lần giao hiện do mô phỏng hoặc nhân viên ghi, chưa lấy từ hãng thật.",
        "Trang tra cứu và chăm sóc khách chỉ hiện thông tin cần thiết, không lộ đơn người khác khi nhập sai mã.",
    ], "Chống tạo trùng và kiểm tra quyền là yêu cầu hiện tại. Biên bản không chứng minh đã quan sát lỗi mạng hay giao lỗi thật."),
    "VH-01": ([
        "Cần giải thích phiên bản quy tắc và thứ tự xếp nhóm khách; không gán nhóm từ tuổi, giới tính hoặc sửa nhãn bằng tay.",
        "Trợ lý đọc số liệu theo quy tắc có sẵn. Quản lý cần thấy nguồn và thời điểm rồi tự thao tác tại màn hình được phép.",
        "Quản lý cần sửa hoặc ngừng bán sản phẩm. FR-22 hiện mới có một phần xem, tạo và thêm ảnh, chưa đủ các thao tác quản lý.",
        "Chỉ quản trị viên có quyền phù hợp mới khóa tài khoản khách, kèm lý do và lịch sử. Người quản lý không tự có quyền này.",
    ], "Trợ lý chỉ gợi ý, không tự sửa dữ liệu. Quản lý sản phẩm đầy đủ vẫn là phần cần bổ sung."),
    "VH-02": ([
        "Kho cần phân biệt tồn thực tế, giữ chỗ, hàng còn để cấp và số sẵn bán sau dự phòng. Đặt đơn hiện chưa trừ tồn dự phòng để chặn bán.",
        "Chuyển kho phải ghi đủ giảm kho nguồn và tăng kho nhận cùng mã tham chiếu; không làm tồn nguồn thấp hơn lượng đã giữ.",
        "Mỗi yêu cầu chứng từ hiện có một dòng và ghi nhận ngay. Nhiều dòng, lưu nháp rồi duyệt là phần mở rộng.",
        "Hết hạn giữ hàng phải được xử lý và khớp cả đơn lẫn thanh toán; hai lỗi KD-INV-01/02 khiến việc này chưa đầy đủ.",
    ], "Tồn thực tế không được nhỏ hơn lượng giữ chỗ. Thay đổi kho phải ghi đủ, không dở dang. Chưa có bước duyệt chứng từ và còn lỗi xử lý hết hạn."),
    "VH-03": ([
        "Mỗi kho cấp hàng tạo một kiện. Nhân viên phải thấy đúng hàng và phần giữ chỗ của kiện đang xử lý.",
        "Trước khi gửi phải có hãng giao và mã vận đơn. Kiểm tra phiên bản dữ liệu để phát hiện hai người cùng sửa.",
        "Hàng hoàn sau khi gửi vẫn ghi phần giữ chỗ đã dùng để xuất, không tự tăng tồn. Kho kiểm tra rồi lập phiếu nhập riêng có mã tham chiếu.",
        "Bản hiện tại chặn trường hợp một kiện đã giao còn kiện khác đã hoàn trong cùng đơn. Muốn hỗ trợ cần thiết kế cách đối chiếu tiền và hàng riêng.",
    ], "Hãng giao và mã vận đơn được nhập tay, chưa kết nối hãng thật. Chưa coi giao một phần, hoàn một phần là trường hợp đã hỗ trợ."),
    "VH-04": ([
        "Thông báo trả tiền phải có chữ ký hợp lệ, có mã chống trùng và cập nhật cả khoản thanh toán lẫn đơn trong cùng lần lưu.",
        "Lỗi KD-PAY-01 khiến thông báo thành công đến muộn có thể ghi đã trả cho đơn đã hủy. Cần quy định từ chối hoặc đối chiếu lại.",
        "COD chỉ ghi đã trả khi tất cả kiện đã giao. Nếu tất cả hoàn về, khoản thu COD bị hủy, còn đơn ghi đã hoàn hàng. Chưa có sổ thu từng kiện hoặc đối chiếu hãng thật.",
        "Thông báo giả lập có thể ghi hoàn toàn bộ tiền, nhưng chưa có thao tác quản trị để yêu cầu hoàn. Đơn đã trả cần hoàn tiền trước khi hủy, không sửa trực tiếp ô trạng thái.",
    ], "Không có thanh toán hay đối chiếu tiền thật. Xử lý thông báo đến muộn vẫn là phần cần sửa, chưa được coi là đã đáp ứng."),
}

ORDER_REASONS = [
    "COD một kho đã giao xong; hai chiếc cùng mã hàng nằm trên một dòng.",
    "Trả trước giả lập, dùng mã giảm số tiền cố định và đã giao đủ.",
    "COD hai kho, cả hai kiện đã giao thành công.",
    "Trả trước, hai kiện đã giao đủ; tổng tiền giữ như lúc đặt.",
    "COD vừa đặt, chưa đóng gói; hàng mới được giữ chỗ.",
    "Đơn chờ trả trực tuyến, chưa hết thời hạn giữ hàng hai giờ.",
    "Hai kho đang chuẩn bị hàng; chưa kiện nào xuất kho.",
    "Đã thanh toán, mọi kiện sẵn sàng giao cho đơn vị vận chuyển.",
    "COD đã xuất một kiện, kiện còn lại đang chuẩn bị.",
    "COD đã giao một kiện; kiện thứ hai đang vận chuyển.",
    "Trả trực tuyến, hai kiện đã xuất kho nhưng chưa giao xong.",
    "Hủy cả đơn COD trước khi xuất kho.",
    "Hủy đơn chưa trả trực tuyến theo yêu cầu; không phải hủy tự động do hết hạn.",
    "Đã trả tiền; nhận thông báo hoàn toàn bộ tiền giả lập rồi mới hủy hai kiện.",
    "COD giao lỗi sau xuất kho, đang sắp xếp giao lại.",
    "Đã trả trước, giao thất bại sau khi xuất kho.",
    "COD đã gửi nhưng hàng hoàn toàn bộ, chưa thu tiền.",
    "Hàng đã hoàn về; hoàn toàn bộ tiền giả lập đã được xác nhận.",
    "COD có hai kiện đều hoàn về; không có kiện đã giao thành công trong đơn này.",
    "Hai kiện đã hoàn về nhưng chưa có thông báo hoàn tiền.",
]

PILOT_ROWS = [
    ("Q01 chọn Không đồng ý.", "Kết thúc ngay; không hỏi Q02–Q17."),
    ("Dưới 18, trên 44 hoặc không trả lời tuổi ở Q02.", "Chỉ cho ba nhóm 18–24, 25–34, 35–44 tiếp tục; không hỏi ngày sinh."),
    ("Q03 chọn không mua trong 06 tháng.", "Nêu rõ 06 tháng gần đây; dừng phiếu nếu chọn Không."),
    ("Q08 cùng chọn Không gặp vấn đề và một khó khăn.", "Không cho chọn đồng thời; yêu cầu chọn lại."),
    ("Q08 chọn cỡ hoặc ảnh, nhưng Q09a chọn khó theo dõi đơn.", "Q09a chỉ chọn trong các vấn đề đã chọn ở Q08; sửa Q08 thì kiểm tra lại Q09a."),
    ("Q10 chọn Không hoặc Không nhớ.", "Bỏ qua Q11, chuyển Q12; không ghi các ô bỏ qua thành câu trả lời Không."),
    ("Chọn bốn thông tin ở Q12.", "Giới hạn ba lựa chọn, kiểm tra cả trên phiếu và lúc xử lý dữ liệu."),
    ("Tỷ lệ Q11 dùng sai mẫu số.", "Chỉ chia cho số phiếu hợp lệ có Q10=Có; ghi riêng số không được hỏi."),
    ("Đã trả lời câu bắt buộc nhưng bỏ Q17 hoặc lý do Q13.", "Đây là câu không bắt buộc. Giữ ô trống và không loại cả phiếu chỉ vì thiếu câu mở."),
    ("Q06 chưa mua ở website thương hiệu nhưng Q16 rất sẵn sàng.", "Giữ hai câu riêng: Q06 hỏi việc đã làm, Q16 hỏi mong muốn."),
]


# Long phrases first. This changes prose only; identifiers and paths are protected.
TERMS = {
    "KIỂM SOÁT TÀI LIỆU VÀ PHẠM VI BẰNG CHỨNG": "THÔNG TIN BÁO CÁO VÀ NGUỒN DỮ LIỆU",
    "TỪ BẰNG CHỨNG ĐẾN YÊU CẦU": "TỪ KẾT QUẢ KHẢO SÁT ĐẾN YÊU CẦU",
    "TRUY VẾT, ĐÁNH GIÁ VÀ BÀN GIAO": "ĐỐI CHIẾU VÀ KẾT LUẬN",
    "Mô hình hệ thống": "Mô hình hệ thống",
    "phạm vi hệ thống tham chiếu": "các phần của website",
    "Mục tiêu và sản phẩm đầu ra": "Mục tiêu và kết quả cần làm",
    "Các bên liên quan": "Những người liên quan",
    "Ma trận truy vết rút gọn": "Bảng đối chiếu yêu cầu với sơ đồ và cách kiểm tra",
    "Từ bằng chứng đến yêu cầu": "Từ kết quả khảo sát đến yêu cầu",
    "Ràng buộc cần xác nhận cùng người dùng": "Những điều cần hỏi lại người dùng",
    "Đặc điểm mẫu và hành vi mua giả lập": "Thông tin mẫu và cách mua hàng giả lập",
    "Phân tích chéo và giới hạn diễn giải": "So sánh các nhóm và lưu ý khi đọc kết quả",
    "Chiều phủ nghiệp vụ": "Nhóm tình huống",
    "Miền tổng hợp": "Nhóm nghiệp vụ",
    "Bằng chứng hoàn thành": "Kết quả cần lưu",
    "Tập bằng chứng": "Bộ dữ liệu",
    "Mã/ưu tiên": "Mã / mức cần",
    "phỏng vấn bán cấu trúc": "phỏng vấn theo câu hỏi gợi ý",
    "thuận tiện có quota": "chọn người dễ tiếp cận, chia theo nhóm tuổi",
    "Evidence → insight matrix": "Bảng kết quả và nhận xét",
    "Sample register; rule notes": "Danh sách hồ sơ; ghi chú quy tắc",
    "Review theo rubric và checklist": "Kiểm tra theo yêu cầu và tiêu chí chấm bài",
    "Clean data; cleaning log": "Phiếu hợp lệ; lý do loại phiếu",
    "Raw, codebook, cleaning log": "Phiếu gốc, giải thích mã, lý do loại",
    "Consent, biên bản ẩn danh, theme": "Sự đồng ý, biên bản không ghi tên, chủ đề",
    "Pilot log; công cụ v2": "Ghi chép thử phiếu; bản đã sửa",
    "Sample register": "Danh sách hồ sơ mẫu",
    "response rate đo ngoài thực địa": "tỷ lệ trả lời thu được từ khảo sát thật",
    "guest checkout": "đặt hàng không cần đăng nhập",
    "checkout guest": "đặt hàng không cần đăng nhập",
    "guest + account": "mua không đăng nhập và có tài khoản",
    "guest/thành viên": "khách chưa đăng nhập hoặc thành viên",
    "full refund webhook": "thông báo hoàn toàn bộ tiền",
    "refund command": "chức năng yêu cầu hoàn tiền",
    "command admin": "thao tác của quản trị viên",
    "whole-order workflow": "quy trình hủy cả đơn",
    "sibling delivered/returned": "kiện đã giao với kiện đã hoàn trong cùng đơn",
    "reservation consumed": "giữ chỗ đã dùng để xuất kho",
    "reservation active": "giữ chỗ còn hiệu lực",
    "consume reservation": "trừ phần hàng giữ chỗ",
    "read-only": "chỉ đọc dữ liệu",
    "rule-based": "theo quy tắc định sẵn",
    "known defects": "lỗi đã biết",
    "known defect": "lỗi đã biết",
    "khoảng cách code": "lỗi trong mã nguồn",
    "trải nghiệm storefront/tài khoản": "cách dùng trang mua hàng và tài khoản",
    "khảo sát auth": "khảo sát tài khoản",
    "hồ sơ 360°": "hồ sơ tổng hợp",
    "safety stock": "tồn dự phòng",
    "safety_stock": "tồn dự phòng",
    "on-hand": "tồn thực tế",
    "on_hand": "tồn thực tế",
    "order.payment_status": "trạng thái thanh toán của đơn",
    "payment.status": "trạng thái khoản thanh toán",
    "order.status": "trạng thái đơn",
    "fulfillment_status": "trạng thái giao hàng chung",
    "partially_fulfilled": "mới gửi một phần",
    "pending_payment": "chờ thanh toán",
    "cod_pending": "chờ trả khi nhận hàng",
    "ready_to_ship": "sẵn sàng giao",
    "grand total": "tổng phải trả",
    "late success": "thành công đến muộn",
    "Segment priority": "Thứ tự xếp nhóm khách",
    "online-payment guest": "trả trực tuyến của khách chưa đăng nhập",
    "online-payment": "trả trực tuyến",
    "payment ledger": "sổ thanh toán",
    "usability test": "thử với người dùng",
    "usability": "mức dễ dùng",
    "mã ASCII theo codebook": "mã chữ không dấu theo bảng giải thích",
    "giá trị null": "ô trống",
    "mã hóa theme": "nhóm nhận xét theo chủ đề",
    "phân khúc": "nhóm khách hàng",
    "minh bạch tổng tiền": "hiển thị rõ tổng tiền",
    "nghiệm thu": "kiểm tra và xác nhận",
    "cốt lõi": "chính",
    "truy vết": "đối chiếu nguồn",
    "kiểm chứng": "kiểm tra",
    "ngoại lệ": "trường hợp khác hoặc lỗi",
    "thực địa": "khảo sát thật",
    "bội số": "số lượng trong quan hệ",
    "tác vụ": "công việc",
    "bằng chứng": "nguồn thông tin",
    "đầu ra": "kết quả",
    "định tính": "phỏng vấn và hồ sơ",
    "định lượng": "phiếu hỏi",
    "biến thể/SKU": "biến thể (mã hàng)",
    "storefront": "trang mua hàng",
    "catalog": "sản phẩm",
    "voucher/coupon": "mã giảm giá",
    "voucher": "mã giảm giá",
    "coupon": "mã giảm giá",
    "checkout": "đặt hàng",
    "wishlist": "hàng yêu thích",
    "snapshot": "dữ liệu tại thời điểm ghi nhận",
    "fulfillments": "các kiện giao",
    "fulfillment": "kiện giao",
    "reservations": "các phần giữ hàng",
    "reservation": "phần hàng giữ chỗ",
    "reserved": "hàng giữ chỗ",
    "available": "hàng còn để cấp",
    "consume": "trừ phần giữ chỗ để xuất hàng",
    "consumed": "đã dùng để xuất kho",
    "release": "trả lại phần giữ chỗ",
    "released": "đã trả lại phần giữ chỗ",
    "restock": "nhập lại kho",
    "movements": "các lần tăng, giảm kho",
    "movement": "lần tăng, giảm kho",
    "tracking": "mã vận đơn",
    "dispatch": "gửi hàng",
    "shipped": "đã gửi",
    "delivered": "đã giao",
    "processing": "đang chuẩn bị",
    "failed": "thất bại",
    "returned": "đã hoàn hàng",
    "cancelled": "đã hủy",
    "refunded": "đã hoàn tiền",
    "refund": "hoàn tiền",
    "succeeded": "thành công",
    "paid": "đã thanh toán",
    "pending": "đang chờ",
    "active": "đang hoạt động",
    "subtotal": "tiền hàng",
    "discount": "giảm giá",
    "shipping": "phí giao",
    "total": "tổng phải trả",
    "payment": "thanh toán",
    "payments": "các khoản thanh toán",
    "order": "đơn hàng",
    "receipt": "phiếu nhập",
    "transfer": "phiếu chuyển",
    "stocktake": "phiếu kiểm kê",
    "adjustment": "phiếu điều chỉnh",
    "online": "trực tuyến",
    "guest": "khách chưa đăng nhập",
    "account": "tài khoản",
    "server": "máy chủ",
    "database": "cơ sở dữ liệu",
    "dashboard": "trang tổng hợp",
    "Copilot": "trợ lý quản lý",
    "LLM": "mô hình AI tạo văn bản",
    "admin": "quản trị viên",
    "auth": "tài khoản và đăng nhập",
    "ownership": "quyền sở hữu dữ liệu",
    "promotion": "chương trình giảm giá",
    "KPI": "chỉ số theo dõi",
    "UX": "cách sử dụng",
    "ETA": "thời gian giao dự kiến",
    "CS": "chăm sóc khách hàng",
    "consent": "sự đồng ý tham gia",
    "pilot": "thử phiếu",
    "quota": "số mẫu dự kiến theo nhóm",
    "codebook": "bảng giải thích mã",
    "raw": "gốc",
    "theme": "chủ đề",
    "generator": "chương trình tạo dữ liệu",
    "seed": "dữ liệu khởi tạo",
    "baseline": "bản hiện tại",
    "code": "mã nguồn",
    "valid": "hợp lệ",
    "excluded": "bị loại",
    "replay": "bản lặp",
    "duplicate": "gửi trùng",
    "missing": "thiếu dữ liệu",
    "null": "trống",
    "response": "trả lời",
    "review": "kiểm tra",
    "checklist": "danh sách kiểm tra",
    "log": "nhật ký",
    "rule": "quy tắc",
    "guide": "hướng dẫn",
    "change log": "ghi chép thay đổi",
    "test": "kiểm tra",
    "retry": "gửi lại yêu cầu",
    "race": "nhiều yêu cầu cùng lúc",
    "rollback": "hủy toàn bộ thay đổi",
    "webhook": "thông báo từ hệ thống thanh toán",
    "expiry": "hết hạn giữ hàng",
    "timeout": "hết thời gian chờ",
    "audit": "lịch sử thao tác",
    "item": "dòng hàng",
    "ledger": "sổ theo dõi",
    "idempotency key": "mã chống xử lý trùng",
    "version": "phiên bản dữ liệu",
    "reference": "mã tham chiếu",
    "wording": "cách viết thông báo",
    "form": "biểu mẫu",
    "rule-based": "theo quy tắc",
    "production": "dùng thật",
    "mock": "giả lập",
    "local": "chạy trên máy",
    "social-chat": "mạng xã hội, nhắn tin",
    "livestream": "phát trực tiếp",
    "size": "cỡ",
    "sizes": "các cỡ",
    "BFD, Activity Diagram": "sơ đồ chức năng, sơ đồ hoạt động",
    "BFD, Activity": "sơ đồ chức năng, sơ đồ hoạt động",
    "Activity Diagram": "sơ đồ hoạt động",
    "Activity A": "Sơ đồ hoạt động A",
    "Activity": "sơ đồ hoạt động",
    "FR/NFR": "yêu cầu chức năng/phi chức năng",
    "FR, BFD": "yêu cầu chức năng, sơ đồ chức năng",
    "NFR; ERD": "yêu cầu phi chức năng; ERD",
}

TERMS.update({
    "tracking không rõ": "thông tin theo dõi đơn chưa rõ",
    "migration": "tệp thay đổi cơ sở dữ liệu",
    "inventory": "quản lý kho",
    "insights": "báo cáo và trợ lý quản lý",
    "insight": "báo cáo",
    "module": "phần mã",
    "frontend": "giao diện",
    "backend": "máy chủ",
    "token": "mã truy cập",
    "evidence": "nguồn thông tin",
    "workspace": "thư mục dự án",
    "view": "bảng xem dữ liệu",
    "slide": "trang trình chiếu",
    "miền": "nhóm chức năng",
    "đặc tả": "mô tả chi tiết",
    "hợp chuẩn": "đáp ứng tiêu chuẩn",
    "điều phối nghiên cứu": "sắp xếp việc khảo sát",
    "nhu cầu trải nghiệm": "nhu cầu sử dụng",
    "full refund": "hoàn toàn bộ tiền",
    "chưa paid": "chưa thanh toán",
    "đã paid": "đã thanh toán",
    "chưa có refund event": "chưa có thông báo hoàn tiền",
    "job expiry": "tác vụ xử lý hết hạn",
    "event": "thông báo",
    "Funnel": "Các bước lọc phiếu",
    "ASCII": "chữ không dấu",
    "terminal": "kết thúc",
    "Staff/Manager/Admin": "nhân viên, quản lý và quản trị viên",
    "Backend 1/2": "người làm máy chủ 1 và 2",
    "Backend 1": "người làm máy chủ 1",
    "Backend 2": "người làm máy chủ 2",
    "carrier": "hãng giao hàng",
    "API ship": "kết nối hãng vận chuyển",
    "ship": "gửi hàng",
})

FINAL_EDITS = {
    "Bản 1.2 giữ nguyên số liệu của bản 1.2": "Bản 1.2 giữ nguyên số liệu của bản 1.1",
    "Chương 5 và ma trận Chương 8": "Chương 5 và bảng đối chiếu Chương 8",
    "SYS + SYN đối chiếu nguồn được": "Có nguồn từ mã và dữ liệu giả lập",
    "Mục tiêu kiểm tra; không mặc nhận đã đạt": "Mục tiêu cần thử; chưa kết luận đã đạt",
    "Không tạo sự đồng ý tham gia, chữ ký hoặc chứng cứ khảo sát thật giả": "Không tạo chữ ký hoặc xác nhận tham gia giả",
    "FR, Sơ đồ chức năng, sơ đồ hoạt động": "Yêu cầu chức năng và sơ đồ",
    "NFR; ERD khái niệm": "Yêu cầu phi chức năng; sơ đồ dữ liệu",
    "- Vận hành cần kiểm soát giữ tồn, xuất kho, COD, hủy và hàng hoàn ra sao?": "- Nhân viên giữ hàng, xuất kho, thu tiền, hủy đơn và nhận hàng hoàn như thế nào?",
    "- Quản lý cần báo cáo, nhóm khách hàng và trợ lý chỉ đọc hỗ trợ quyết định nào?": "- Quản lý cần xem số liệu nào, chia nhóm khách ra sao và cần trợ lý giúp việc gì?",
    "Nhân viên bán hàng/Chăm sóc khách hàng": "Nhân viên bán hàng, hỗ trợ khách",
    "Quyền thao tác, Chỉ số theo dõi, ưu tiên chăm sóc khách": "Quyền sử dụng, số liệu cần xem, khách cần chăm sóc",
    "Đối soát thanh toán và đơn hàng": "Đối chiếu tiền trả với đơn hàng",
    "giữ và xuất tồn": "giữ hàng và xuất kho",
    "Thu phiếu chính, phỏng vấn người mua; đóng thu trước bước làm sạch N7": "Thu phiếu, hỏi người mua; ngừng nhận phiếu trước khi lọc ở N7",
    "Mô hình và tiêu chí kiểm tra và xác nhận": "Sơ đồ và tiêu chí kiểm tra",
    "Kiểm tra chéo, xác nhận khoảng trống, đóng báo cáo": "Kiểm tra chéo, ghi phần còn thiếu, hoàn thành báo cáo",
    "tổng hợp nhu cầu cách dùng": "tổng hợp nhu cầu sử dụng",
    "Tính kết quả từ hợp lệ": "Tính từ phiếu hợp lệ",
    "13 dòng lần tăng, giảm kho": "13 bản ghi thay đổi kho",
    "Không phải 10 người dùng hoặc kiểm thử mức dễ dùng thật": "Không phải kết quả thử với 10 người thật",
    "Đối chiếu hiện trạng, không dùng làm FIELD": "Đọc mã để đối chiếu, không thay khảo sát thật",
    "chưa đo hiệu quả Cách sử dụng": "chưa thử với người dùng",
    "Tổng tiền minh bạch, máy chủ tính lại; ngưỡng mã rõ": "Hiện rõ tổng tiền và điều kiện mã; máy chủ tính lại",
    "Giữ mua không đăng nhập và có tài khoản; bảo vệ quyền sở hữu": "Cho mua có hoặc chưa có tài khoản; bảo vệ dữ liệu riêng",
    "Tách trạng thái; COD mọi kiện đã giao; còn lỗi đã biết": "Tách trạng thái; COD chỉ trả khi giao đủ; còn lỗi",
    "Giữ, xuất, nhả theo SKU/kho; chứng từ có lịch sử thao tác": "Giữ, xuất, trả hàng giữ theo kho; có chứng từ và lịch sử",
    "Nhóm khách hàng và Trợ lý quản lý chỉ đọc; không tự gửi chiến dịch": "Xếp nhóm khách; trợ lý chỉ xem số liệu, không tự gửi quảng cáo",
    "Giữ chỗ liên kết": "Phiếu giữ chỗ liên kết",
    "Nhóm khách hàng khách hàng": "Việc chia nhóm khách hàng",
    "Mua khách chưa đăng nhập": "Mua không cần đăng nhập",
    "thường mua khách chưa đăng nhập": "thường mua không đăng nhập",
    "Bối cảnh giả định: Nhân vật giả định": "Tình huống giả định: người mua",
    "Bối cảnh giả định: Vai trò vận hành mô phỏng": "Tình huống giả định: vai trò tại cửa hàng",
    "Mốc kịch bản:": "Mốc trong kịch bản:",
    "; không có sự đồng ý tham gia/ghi âm thực tế.": ". Không có buổi phỏng vấn hay ghi âm thật.",
    "luồng trực tuyến thanh toán mô phỏng": "cách trả trực tuyến giả lập",
    "Gán hãng giao hàng/mã vận đơn giả, chuyển kiện sang đã gửi, xử lý thất bại và nhận đã hoàn hàng sau xuất kho.": "Nhập hãng giao và mã vận đơn giả, ghi đã gửi kiện rồi xử lý giao lỗi hoặc hàng hoàn.",
    "Các nguồn mã nguồn": "Các tệp mã nguồn",
    "khảo sát thật giả": "khảo sát giả",
    "đã đã": "đã",
    "| Miền | Nguồn thông tin SYN + SYS | Quyết định / giới hạn |": "| Nhóm chức năng | Kết quả tham khảo | Yêu cầu rút ra / giới hạn |",
    "| Nhóm chức năng | Nguồn thông tin SYN + SYS | Quyết định / giới hạn |": "| Nhóm chức năng | Kết quả tham khảo | Yêu cầu rút ra / giới hạn |",
    "mới gửi một phần.": "mới gửi một phần.",
    "| Online": "| Trực tuyến",
    "Đã thanh toán trực tuyến; nhận hoàn toàn bộ tiền mô phỏng trước khi hủy cả hai kiện.": "Đã trả trực tuyến; nhận thông báo hoàn toàn bộ tiền giả lập rồi mới hủy hai kiện.",
    "Mã vận đơn không rõ": "Thông tin theo dõi đơn chưa rõ",
    "mã vận đơn không rõ": "thông tin theo dõi đơn chưa rõ",
    "nghiệp vụ; không suy rộng tần suất": "nghiệp vụ; không tính tỷ lệ cho khách thật",
    "Đặt hàng gửi lại yêu cầu": "Gửi lại yêu cầu đặt hàng",
    "cải tiến Cách sử dụng": "cải tiến cách dùng",
    "bị loại là phiếu bị loại": "mã excluded chỉ phiếu bị loại",
    "các phần mã thanh toán, quản lý kho, kiện giao, tài khoản và đăng nhập, admincustomer và báo cáo và trợ lý quản lý": "các phần xử lý thanh toán, kho, giao hàng, tài khoản, khách hàng, báo cáo và trợ lý",
    "| cod /": "| COD /",
    "| trực tuyến /": "| Trả trước /",
    "Quan sát công việc": "Quan sát cách sử dụng",
    "| Nhóm chức năng | Nguồn thông tin SYN + SYS | Quyết định / giới hạn |": "| Nhóm chức năng | Kết quả tham khảo | Yêu cầu rút ra / giới hạn |",
    "dự báo Thời gian giao dự kiến": "ước tính thời gian giao",
    "Thời gian giao dự kiến cần ghi là dự kiến và chỉ hiển thị khi có nguồn; mã vận đơn hiện do nhân viên nhập tay, chưa phải API hãng vận chuyển.": "Ngày giao chỉ là ước tính và chỉ hiển thị khi có thông tin. Mã vận đơn hiện do nhân viên nhập, chưa lấy từ hãng giao hàng.",
    "API": "giao diện kết nối (API)",
    "CHƯƠNG 7. Mô hình hệ thống": "CHƯƠNG 7. MÔ HÌNH HỆ THỐNG",
}

COMPACT_GLOSSARY_EXAMPLES = [
    "Một mẫu áo sơ mi", "Áo trắng, cỡ M", "Chưa giữ hàng", "Giảm 50.000đ có điều kiện",
    "Có thể giao nhiều kiện", "Giá cũ được giữ lại", "Chưa trừ giữ chỗ", "Nhả khi hủy hợp lệ",
    "Dùng khi đặt đơn", "Chưa dùng để chặn bán", "Trên trang quản lý kho", "Gắn với hàng trong đơn",
    "Một kiện/kho/đơn", "Nhân viên nhập tay", "Chỉ trả khi giao đủ", "Không tạo hai đơn",
    "Tùy vai trò", "Đăng nhập, đặt hàng", "Tốc độ, bảo mật", "Nhóm các việc cần làm",
    "Có bước và nhánh lỗi", "Một đơn, nhiều dòng",
]


def translate_terms(line):
    # Keep image targets, source paths, and data identifiers as actual references.
    protected = []
    pattern = r"(?:\.\./|docs/|platform/|tools/)[^\s;,)]+|\b[A-Za-z0-9_-]+\.(?:json|md|java|sql)\b|\b(?:SYN|SYS|PLAN|FIELD|P1|BR|KD|PH|PV|DH|KHO|Q\d+|FR|NFR|PILOT)[A-Za-z0-9_.-]*\b|\b(?:status=valid|duplicate_of|Q13_reason|CURRENT|PROPOSED|KNOWN_DEFECT)\b"
    def save(match):
        protected.append(match.group())
        return f"\x01{len(protected)-1}\x02"
    line = re.sub(pattern, save, line)
    # Match once; replacements cannot recursively change one another.
    lookup = {k.casefold(): v for k, v in TERMS.items()}
    keys = sorted(TERMS, key=len, reverse=True)
    regex = r"(?<![\w])(?:" + "|".join(re.escape(k) for k in keys) + r")(?![\w])"
    def replace(match):
        result = lookup[match.group().casefold()]
        if match.group()[0].isupper() and not result.isupper():
            result = result[0].upper() + result[1:]
        return result
    line = re.sub(regex, replace, line, flags=re.IGNORECASE)
    return re.sub(r"\x01(\d+)\x02", lambda m: protected[int(m.group(1))], line)


def simplify_report(text):
    text = section(text, "# CHƯƠNG 2.", "# CHƯƠNG 3.", GLOSSARY)
    text = section(text, "## 5.2", "# CHƯƠNG 6.", RULES)
    text = section(text, "# CHƯƠNG 6.", "# CHƯƠNG 7.", REQUIREMENTS)
    lines = []
    current_interview = None
    finding_index = 0
    rewritten_findings = 0
    for line in text.splitlines():
        match = re.match(r"### SYN-PV-((?:KH|VH)-\d+)", line)
        if match:
            current_interview = match.group(1)
            finding_index = 0
        if current_interview and line.startswith("- ") and " → " in line:
            suffix = line.split(" → ", 1)[1]
            line = "- " + INTERVIEWS[current_interview][0][finding_index] + " → " + suffix
            finding_index += 1
            rewritten_findings += 1
        elif current_interview and line.startswith("Kết luận SYN:"):
            line = "Kết luận SYN: " + INTERVIEWS[current_interview][1]
        dm = re.match(r"\| D([1-6]) — ", line)
        if dm:
            cells = line.split("|")
            title, description = SYNTHESIS[int(dm.group(1)) - 1]
            cells[1], cells[2] = " " + title + " ", " " + description + " "
            line = "|".join(cells)
        om = re.match(r"\| DH-(\d{2}) \|", line)
        if om:
            cells = line.split("|")
            cells[3] = " " + ORDER_REASONS[int(om.group(1)) - 1] + " "
            line = "|".join(cells)
        pm = re.match(r"\| PILOT-(\d{2}) \|", line)
        if pm:
            cells = line.split("|")
            scenario, action = PILOT_ROWS[int(pm.group(1)) - 1]
            cells[2], cells[3] = " " + scenario + " ", " " + action + " "
            line = "|".join(cells)
        if line.startswith("order.status="):
            if "partially_fulfilled" in line:
                line = "Đơn ở trạng thái đã gửi, nhưng mới gửi một phần. Thanh toán của đơn là chờ trả khi nhận hàng; khoản thanh toán vẫn đang chờ. Chỉ hàng của kiện đã gửi bị trừ tồn và giữ chỗ; kiện đang chuẩn bị vẫn giữ hàng."
            else:
                line = "Đơn và trạng thái giao hàng chung là đã gửi. Thanh toán của đơn là chờ trả khi nhận hàng; khoản thanh toán vẫn đang chờ. Mới một kiện giao xong nên chưa ghi cả đơn đã thanh toán. Sổ thu tiền thực tế từng kiện chưa nằm trong phạm vi bài."
        if line.startswith("Nhập lại một chiếc hoàn từ SYN-HS-DH-17"):
            line = "Kho nhận lại một chiếc sau khi kiểm tra giả định đạt yêu cầu. Tồn tăng: 8 + 1 = 9; hàng đang giữ cho đơn khác vẫn là 2. Hàng còn để cấp = 9 − 2 = 7; trừ 1 chiếc dự phòng thì số sẵn bán là 6. Đây là phiếu nhập riêng có mã tham chiếu đến kiện; đổi trạng thái hoàn hàng không tự cộng tồn. Việc kiểm tra là giả lập, không có chữ ký hay hồ sơ kiểm tra thật."
        for prefix, replacement in PARAGRAPHS.items():
            if line.startswith(prefix):
                line = replacement
                break
        lines.append(translate_terms(line))
    assert rewritten_findings == 48
    text = "\n".join(lines) + "\n"
    # These are assignments, not a change to the five-person project team.
    text = text.replace("## 3.4 Trách nhiệm của 05 thành viên", "## 3.4 Trách nhiệm của 05 thành viên\n\nNhóm gồm một trưởng nhóm (PM), một người làm giao diện (FE), hai người làm máy chủ (BE1, BE2) và một người phụ trách cài đặt, vận hành (DevOps). Bảng lịch dùng các mã ngắn này để dễ theo dõi.")
    text = text.replace("- PM:", "- Trưởng nhóm (PM):")
    text = text.replace("- Frontend:", "- Người làm giao diện (FE):")
    text = text.replace("- Backend 1:", "- Người làm máy chủ 1 (BE1):")
    text = text.replace("- Backend 2:", "- Người làm máy chủ 2 (BE2):")
    text = text.replace("- DevOps:", "- Người phụ trách cài đặt và vận hành (DevOps):")
    text = text.replace("khảo sát bởi Backend 1", "khảo sát bởi người làm máy chủ 1")
    text = text.replace("Nội dung bản 1.1", "Nội dung báo cáo")
    text = text.replace("bản 1.1", "bản 1.2")
    # Retain genuine source codes but explain them in Vietnamese around their uses.
    text = text.replace("144 bản ghi Q01–Q17; 120 hợp lệ và 24 bị loại", "144 phiếu Q01–Q17; 120 hợp lệ và 24 bị loại")
    for old, new in FINAL_EDITS.items():
        text = text.replace(old, new)
    text = text.replace("Nhóm chọn đề tài này vì có các bước quen thuộc: tìm sản phẩm → chọn cỡ, màu → thêm vào giỏ → đặt đơn → giữ hàng → thanh toán → giao hàng. Qua đó, nhóm thực hành viết yêu cầu, tìm các trường hợp lỗi và vẽ sơ đồ dữ liệu. Số liệu giả lập chỉ dùng để minh họa, không dùng để kết luận việc kinh doanh sẽ thành công.", "Đề tài có các bước quen thuộc: tìm hàng → chọn cỡ, màu → giỏ hàng → đặt đơn → giữ hàng → thanh toán → giao hàng. Nhóm thực hành viết yêu cầu, phân tích lỗi và vẽ sơ đồ. Số liệu giả lập chỉ dùng cho bài tập, không chứng minh việc kinh doanh sẽ thành công.")
    text = text.replace("Bài làm gồm kế hoạch khảo sát 02 tuần, phiếu hỏi và dữ liệu giả lập, kết quả theo từng nghiệp vụ, yêu cầu chức năng và phi chức năng, sơ đồ chức năng, sơ đồ hoạt động và sơ đồ dữ liệu. Mỗi yêu cầu có nguồn và cách kiểm tra.", "Bài làm gồm kế hoạch 02 tuần, phiếu hỏi, dữ liệu giả lập, kết quả khảo sát, yêu cầu và sơ đồ hệ thống. Mỗi yêu cầu có nguồn và cách kiểm tra.")
    # Keep the glossary on one readable page by shortening examples, not font size.
    start, end = text.index("# CHƯƠNG 2."), text.index("# CHƯƠNG 3.")
    glossary = text[start:end]
    glossary = glossary.replace("Các từ dưới đây được dùng trong báo cáo. Mã viết tắt chỉ dùng để đối chiếu với bảng yêu cầu, sơ đồ và dữ liệu kèm theo.", "Các từ và mã dưới đây giúp đọc yêu cầu, sơ đồ và dữ liệu kèm theo.")
    count = 0
    output = []
    for line in glossary.splitlines():
        if line.startswith("| ") and not line.startswith("| Thuật ngữ"):
            cells = line.split("|")
            cells[3] = " " + COMPACT_GLOSSARY_EXAMPLES[count] + " "
            line = "|".join(cells)
            count += 1
        output.append(line)
    assert count == 22
    glossary = "\n".join(output) + "\n\n"
    glossary = glossary[:glossary.index("## Cách dùng mã trong báo cáo")] + "Cần có: phần chính; Nên có: có thể làm sau. Đã có: đã thấy trong mã nguồn, chưa phải người dùng thật xác nhận. SYS: mã nguồn; SYN: giả lập; PLAN: kế hoạch; FIELD: khảo sát thật.\n\n"
    text = text[:start] + glossary + text[end:]
    # Shorten repeated submission notes, which are already explained at the front.
    text = re.sub(r"Trong bảng này FR/NFR[^\n]+", "FR/NFR là mã P1-FR/P1-NFR. Tra mã SYN trong Excel và Phụ lục D. Khảo sát thật phải lưu nguồn riêng, không đổi nhãn dữ liệu giả lập.", text)
    text = re.sub(r"Trước khi nộp, cần điền[^\n]+", "Trước khi nộp, điền thông tin lớp, giảng viên, thành viên và hỏi giảng viên về việc dùng dữ liệu giả lập. Nếu khảo sát thật, phải lưu riêng và tính lại kết quả.", text)
    text = re.sub(r"Bộ SYN đã có đầy đủ mã[^\n]+", "Dữ liệu giả lập nằm trong docs/project-1/synthetic: survey.json, qualitative.json và qualitative.md. Chưa có hồ sơ khảo sát thật.", text)
    text = re.sub(r"Mỗi bản ghi gồm: mã nguồn thông tin[^\n]+", "Nếu khảo sát thật, ghi mã nguồn, ngày, người phụ trách, tệp lưu, quyền sử dụng, số mẫu, việc ẩn danh và yêu cầu liên quan. Mã mẫu: FIELD-PV-[mã], FIELD-PH-[mã], FIELD-HS-[mã]; chưa điền kết quả khi chưa thực hiện.", text)
    text = re.sub(r"Thông tin cần người học bổ sung[^\n]+", "Trước khi nộp, bổ sung trường, lớp, giảng viên, tên và mã sinh viên của 05 thành viên. Nếu đi khảo sát thật, thêm lịch, địa điểm, sự đồng ý, phiếu và hồ sơ đã bỏ thông tin cá nhân. Nếu dùng giả lập, giữ nhãn SYN và hỏi giảng viên trước.", text)
    text = re.sub(r"Các tệp mã nguồn được đối chiếu[^\n]+", "Đã đối chiếu mã nguồn ngày 03/09/2026. Khi mã hoặc dữ liệu đổi, cần sửa báo cáo trước khi dùng tiếp.", text)
    text = re.sub(r"- S0:[^\n]+", "- S0: ảnh yêu cầu học phần Project 1 do người học cung cấp ngày 03/09/2026.", text)
    text = re.sub(r"- S4:[^\n]+", "- S4: docs/project-1/synthetic/survey.json; qualitative.json; qualitative.md — dữ liệu giả lập.", text)
    return text
