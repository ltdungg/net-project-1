"""Compose the explicitly synthetic survey edition from reproducible fixtures.

The baseline report is preserved. No application data or survey FIELD evidence
is created. Every percentage in the generated quantitative sections is counted
from valid records and checked against the generator's summary.
"""
import json
from pathlib import Path
from collections import Counter
from project1_plain_vietnamese import simplify_report

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs/project-1"
SURVEY = json.loads((DIR / "synthetic/survey.json").read_text(encoding="utf-8"))
QUAL = json.loads((DIR / "synthetic/qualitative.json").read_text(encoding="utf-8"))
VALID = SURVEY["valid"]
SUMMARY = SURVEY["summary"]
N = len(VALID)
assert N == 120 and len(SURVEY["raw"]) == 144
assert SURVEY["quality_checks"]["passed"]
assert len(QUAL["interviews"]) == 12 and len(QUAL["orders"]) == 20
assert len(QUAL["inventoryDocuments"]) == 10


def pct(n, d):
    return f"{100*n/d:.1f}%".replace(".", ",") if d else "Không áp dụng"


def money(n):
    return f"{n:,}".replace(",", ".") + "đ"


def tab(headers, rows, widths):
    assert abs(sum(widths) - 6.5) < 0.001
    clean = lambda v: str(v).replace("|", "/").replace("\n", " ")
    lines = ["<!-- widths: " + ", ".join(str(x) for x in widths) + " -->",
             "| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    lines += ["| " + " | ".join(clean(v) for v in row) + " |" for row in rows]
    return "\n".join(lines) + "\n\n"


def stat_table(key, nonzero=True):
    data = SUMMARY[key] if isinstance(key, str) else key
    q, d = data["question"], data["denominator"]
    counts = Counter()
    for record in VALID:
        value = record["answers"].get(q)
        if isinstance(value, list):
            counts.update(value)
        elif value is not None:
            counts[value] += 1
    rows = []
    for row in data["rows"]:
        assert row["count"] == counts[row["code"]], (q, row)
        if row["count"] or not nonzero:
            rows.append((row["label"], f'{row["count"]}/{d}', pct(row["count"], d)))
    return tab([f"Lựa chọn {q} — SYN", "Số chọn / mẫu số", "Tỷ lệ người chọn"], rows, [3.5, 1.5, 1.5])


def replace_section(text, start, end, replacement):
    assert text.count(start) == 1 and text.count(end) == 1
    a, b = text.index(start), text.index(end)
    assert a < b
    return text[:a] + replacement.rstrip() + "\n\n" + text[b:]


def exact(text, old, new):
    assert old in text, old[:100]
    return text.replace(old, new)


def page(title):
    return "\n<!-- pagebreak -->\n\n## " + title + "\n\n"


CONTROL = """# KIỂM SOÁT TÀI LIỆU VÀ PHẠM VI BẰNG CHỨNG

Báo cáo phục vụ phần khảo sát và phân tích yêu cầu học phần Project 1 cho website bán quần áo trực tuyến NÉT Commerce. Bản 1.1 bổ sung một đợt khảo sát giả lập hoàn chỉnh vào cấu trúc kế hoạch, tổng hợp nghiệp vụ và mô hình hệ thống của bản 1.0.

> DỮ LIỆU GIẢ LẬP — SYN. Không có người thật tham gia và không có khảo sát tại cửa hàng. Mọi câu trả lời, lời phỏng vấn, đơn hàng, số dư kho và mốc N1–N10 là kịch bản học tập. Không dùng các số liệu này để khẳng định nhu cầu thị trường hay đã hoàn thành thực địa. Cần giảng viên chấp thuận nếu dùng mô phỏng thay thực địa.

""" + tab(["Nguồn", "Nội dung bản 1.1", "Giới hạn"], [
    ("SYS — hệ thống", "Mã nguồn, migration, đặc tả và kiểm thử hiện có", "Mô tả hệ thống; không phải khảo sát người dùng"),
    ("SYN — giả lập", "144 phiếu gốc, 120 hợp lệ; 12 phỏng vấn; 20 đơn và 10 chứng từ", "Có bản ghi chi tiết và công thức; không có người/giao dịch thật"),
    ("PLAN — kế hoạch", "02 tuần, 05 thành viên; công cụ phỏng vấn, bảng hỏi, lấy mẫu", "Lịch dự kiến, địa điểm chưa xác nhận"),
    ("FIELD — thực địa", "Chưa có", "Không tạo consent, chữ ký hoặc chứng cứ thực địa giả"),
], [1.25, 2.85, 2.4]) + """## Đối chiếu với yêu cầu học phần

""" + tab(["Nội dung yêu cầu", "Phần đáp ứng", "Trạng thái"], [
    ("Kế hoạch: thời gian, địa điểm, phương pháp, nhân sự", "Chương 3", "PLAN 02 tuần / 05 người"),
    ("Tiến hành khảo sát", "Chương 4; phụ lục D; Excel dữ liệu", "Đã mô phỏng; không phải FIELD"),
    ("Giới thiệu bài toán, thuật ngữ", "Chương 1–2", "Đã biên soạn"),
    ("Phỏng vấn, phiếu hỏi, lấy mẫu", "Chương 4; phụ lục A–D", "Có dữ liệu SYN từng bản ghi"),
    ("Tổng hợp theo nghiệp vụ", "Chương 5 và ma trận Chương 8", "SYS + SYN truy vết được"),
    ("FR, BFD, Activity Diagram", "Chương 6–7", "Đặc tả và sơ đồ"),
    ("NFR; ERD khái niệm", "Chương 6–7", "Mục tiêu kiểm chứng; không mặc nhận đã đạt"),
], [2.25, 2.3, 1.95])


CH4 = """# CHƯƠNG 4. THỰC HIỆN KHẢO SÁT GIẢ LẬP VÀ PHÂN TÍCH

## 4.1 Thiết kế đợt mô phỏng và nguồn dữ liệu

Đợt SYN được dựng theo đúng ba phương pháp trên slide: bảng hỏi người mua, phỏng vấn bán cấu trúc và lấy mẫu hồ sơ nghiệp vụ. Dữ liệu phiếu được sinh mới từ Q01–Q17, không chuyển bảng tổng hợp 200 mẫu cũ thành câu trả lời cá nhân. Mã bộ phiếu là SYN-PH-P1-120-v1; bộ định tính là SYN-P1-QUAL-2026.1.

Seed 20260903 và thuật toán mulberry32 giúp tái tạo bộ phiếu. Quota tuổi 42/48/30 và một số quan hệ hành vi được đặt trước: khó khăn về tổng tiền/tồn kho có thể đi cùng bỏ dở; lo thanh toán có thể đi cùng COD. Các quan hệ này tạo tình huống hợp lý để luyện phân tích, không phải phát hiện về khách hàng thật.

N4–N7 là ngày tương đối trong kịch bản, không phải ngày đã đi khảo sát. Dữ liệu được soạn ngày 03/09/2026, trước lịch PLAN 07–18/09/2026. Không ghi thời gian/địa điểm thực địa giả; trạng thái đồng ý trong phiếu SYN chỉ là dữ liệu thử logic sàng lọc.

""" + tab(["Tập bằng chứng", "Quy mô và nội dung", "Cách dùng"], [
    ("SYN-PH-001…144", "144 bản ghi Q01–Q17; 120 valid và 24 excluded", "Tính kết quả từ valid, giữ nguyên lý do loại"),
    ("SYN-PILOT-01…10", "10 ca kiểm tra logic công cụ, tách mẫu chính", "Không phải 10 người dùng hoặc kiểm thử usability thật"),
    ("SYN-PV-KH-01…08; VH-01…04", "08 nhân vật mua hàng và 04 vai trò vận hành; 48 phát hiện giả định", "Tìm tình huống và quy tắc; không suy rộng tần suất"),
    ("SYN-HS-DH-01…20; KHO-01…10", "20 đơn và 10 chứng từ kho; 13 dòng movement", "Kiểm tra quan hệ tiền, tồn, payment và kiện giao"),
    ("SYS-01…05", "Tổng quan; order/payment; inventory; fulfillment; auth/insights", "Đối chiếu hiện trạng, không dùng làm FIELD"),
], [1.65, 2.7, 2.15]) + """Kết quả Word là bản diễn giải; Excel kèm theo giữ dữ liệu từng phiếu và phép tính. Các tệp JSON là nguồn tái tạo. Không nhập bộ giả lập này vào database ứng dụng và không tạo vận đơn/thanh toán thật.

"""

CH4 += page("4.2 Sàng lọc, làm sạch và pilot giả lập")
f = SUMMARY["funnel"]
CH4 += tab(["Bước", "Số lượng SYN", "Quy tắc đối chiếu"], [
    ("Tiếp cận theo kịch bản", f["approached"], "Chỉ số tổng hợp giả định; không phải danh sách liên hệ"),
    ("Không bắt đầu", f["did_not_start"], "Không tạo câu trả lời cho 16 lượt này"),
    ("Bắt đầu / có bản ghi gốc", f["started"], "160 − 16 = 144"),
    ("Đủ điều kiện", f["eligible"], "144 − 4 không đồng ý − 5 ngoài tuổi − 7 không mua 06 tháng"),
    ("Hoàn tất sau sàng lọc", f["completed"], "128 − 4 chưa hoàn tất = 124"),
    ("Hợp lệ dùng phân tích", f["valid"], "124 − 4 bản ghi phát lại có duplicate_of = 120"),
], [2.1, 1.05, 3.35])
CH4 += f"Tỷ lệ bắt đầu trong kịch bản: 144/160 = {pct(144,160)}. Tỷ lệ hợp lệ trên số bắt đầu: 120/144 = {pct(120,144)}; trên số đủ điều kiện: 120/128 = {pct(120,128)}. Tổng loại 24/144 = {pct(24,144)}. Đây không phải response rate đo ngoài thực địa.\n\n"
CH4 += tab(["Ngày mô phỏng", "Bắt đầu", "Hợp lệ", "Không vào mẫu sạch"], [(r["day"],r["started"],r["valid"],r["started"]-r["valid"]) for r in SUMMARY["days"]], [2.2,1.3,1.3,1.7])
CH4 += """Quy tắc làm sạch: loại theo thứ tự sàng lọc → thiếu câu bắt buộc → bản phát lại. Mỗi phiếu chỉ có một lý do loại chính. Bản trùng được biết do generator cố ý tạo replay, không kết luận hai người trùng chỉ vì chọn giống nhau. Giá trị không được hỏi giữ null; không đổi thành câu trả lời “Không”.

10 ca pilot SYN đã mô tả tại Phụ lục D.1: kết thúc khi không đồng ý/ngoài tuổi/chưa mua gần đây; lựa chọn “không gặp vấn đề” độc lập; Q09 nằm trong Q08; Q11 theo nhánh; Q12 tối đa 3; mẫu số đúng; thiếu dữ liệu mở; tách hành vi và ý định. Đây là rà soát công cụ bằng kịch bản, không phải quan sát người dùng.

"""
duration = SUMMARY["completion_minutes_valid"]
CH4 += f"Thời lượng được gán cho phiếu hợp lệ: {str(duration['minimum']).replace('.',',')}–{str(duration['maximum']).replace('.',',')} phút, trung vị {str(duration['median']).replace('.',',')} phút. Các giá trị chỉ kiểm tra tính hợp lý với phiếu 7–10 phút dự kiến, không chứng minh thời lượng thực tế.\n\n"

CH4 += page("4.3 Đặc điểm mẫu và hành vi mua giả lập")
CH4 += stat_table(SUMMARY["demographics"]["age"])
CH4 += "Phân bổ tuổi đúng quota vì được sinh có chủ đích, không phải kết quả tuyển mẫu ngẫu nhiên. Mẫu tập trung người 18–44 tuổi đã mua quần áo online 06 tháng; không đại diện người chưa mua, nhóm tuổi khác hoặc toàn bộ thị trường.\n\n"
CH4 += stat_table(SUMMARY["demographics"]["frequency"])
CH4 += "Khu vực Q04: TP.HCM 45/120 (37,5%); Hà Nội 26/120 (21,7%); Đà Nẵng 16/120 (13,3%); đô thị khác 20/120 (16,7%); ngoài đô thị 11/120 (9,2%); không muốn trả lời 2/120 (1,7%). Cơ cấu địa lý là giả định, không gắn địa điểm khảo sát thật.\n\n"
CH4 += "Kênh Q06 cho phép chọn nhiều: sàn thương mại điện tử 102/120 (85,0%); social-chat 70/120 (58,3%); livestream và website thương hiệu cùng 43/120 (35,8%); khác 9/120 (7,5%). Tổng 267 lượt chọn không phải 267 người.\n\n"
CH4 += "Nhóm giá trị đơn Q07 lớn nhất là từ 300.000đ đến dưới 500.000đ: 37/120 (30,8%). Có 3/120 phiếu không nhớ. Không lấy trung điểm các khoảng để khẳng định giá trị đơn trung bình chính xác, nhất là khoảng mở từ 1.200.000đ trở lên. Bảng đầy đủ từng phương án nằm trong Excel.\n\n"

CH4 += page("4.4 Khó khăn khi mua quần áo online")
CH4 += stat_table("pains")
CH4 += "Q08 là câu nhiều lựa chọn; mẫu số 120 người giả lập, tổng 372 lượt chọn. “Không gặp vấn đề nào” được chọn độc lập ở 5 phiếu; các phiếu này bỏ qua Q09. Vì vậy tổng tỷ lệ Q08 có thể vượt 100%, còn mẫu số Q09a là 115.\n\n"
CH4 += "Trong 115 phiếu có vấn đề, 35/115 (30,4%) chọn khó xác định size là vấn đề ảnh hưởng lớn nhất ở Q09a. Không dùng mẫu số 120 cho tỷ lệ có điều kiện này. Size, ảnh/mô tả và tồn biến thể là các ưu tiên giả định cho trang sản phẩm; đổi trả cần thông tin rõ dù quy trình hoàn tiền đầy đủ chưa nằm trong hiện trạng.\n\n"
CH4 += page("4.4.1 Biểu đồ kết quả Q08 — chỉ dữ liệu SYN")
CH4 += "![Các khó khăn chính — SYN-PH-P1-120-v1, n=120; Q08 chọn nhiều](../../artifacts/project1-synthetic-diagrams/survey.png)\n\n"
CH4 += "Biểu đồ chỉ vẽ 7 khó khăn chính; hai phương án “không gặp” và “khác” được giữ trong bảng đầy đủ, không bị loại khỏi dữ liệu. Độ dài cột là tỷ lệ trên 120 phiếu hợp lệ; không phải phần trăm thị phần hoặc mức hài lòng.\n\n"

CH4 += page("4.5 Bỏ dở giỏ hàng, tài khoản và thanh toán")
CH4 += "Q10: có bỏ dở trong 03 tháng là 60/120 (50,0%); không 52/120 (43,3%); không nhớ 8/120 (6,7%). Chỉ 60 phiếu trả lời Có được hỏi Q11; 60 phiếu còn lại là không áp dụng, không phải chọn không có lý do.\n\n"
CH4 += stat_table("abandonment_reasons")
CH4 += "Q11 có 138 lượt chọn trên 60 phiếu trong nhánh. Nhóm ưu tiên minh họa là hiển thị tổng tiền sớm, kiểm tra đúng biến thể còn hàng và giảm bước thừa. 18/60 (30,0%) đề cập bắt buộc tạo tài khoản, tương đương 18/120 (15,0%) toàn mẫu; hai tỷ lệ trả lời hai câu hỏi khác nhau. Không quy mọi lần bỏ dở cho thiết kế website.\n\n"
CH4 += "Q14: muốn mua guest 47/120 (39,2%); đăng ký ngay 19/120 (15,8%); tùy lợi ích 48/120 (40,0%); không chắc 6/120 (5,0%). Thiết kế giữ cả checkout guest và tài khoản, giải thích lợi ích lưu địa chỉ/lịch sử thay vì bắt buộc đăng ký. Đây là ý định giả định, không phải tỷ lệ chuyển đổi.\n\n"
CH4 += "Q13 hỏi hành vi lần mua gần nhất: COD 68/120 (56,7%); trả trước 43/120 (35,8%); khác 3/120 (2,5%); không nhớ 6/120 (5,0%). Hệ thống hiện có COD và thanh toán online mô phỏng. Số liệu SYN không chứng minh cổng thanh toán thật đã được tích hợp hoặc khách đã trả tiền.\n\n"

CH4 += page("4.6 Nhu cầu thông tin trước và sau khi đặt hàng")
CH4 += stat_table("information_needs")
CH4 += "Q12 cho phép tối đa 3 lựa chọn: tổng 330 lượt ≤ 3 × 120 = 360. Tỷ lệ là số người chọn mỗi thông tin / 120, không chia cho 330. Việc số đo-size đứng đầu trong kịch bản phù hợp với ưu tiên hiển thị bảng size gần lựa chọn biến thể, nhưng chưa xác nhận hiệu quả thiết kế.\n\n"
CH4 += "Quyết định phạm vi: ưu tiên số đo/ảnh/tổng tiền và tồn SKU trong các FR đã có; thông tin đổi trả cần nêu chính sách rõ. Đánh giá người mua, gợi ý ưu đãi thông minh hoặc tự động hoàn tiền không được mặc nhận đã triển khai chỉ vì có nhu cầu trong phiếu.\n\n"
CH4 += page("4.6.1 Theo dõi giao hàng và mức sẵn sàng mua")
CH4 += stat_table("tracking_needs")
CH4 += "Q15 có 590 lượt chọn; không giới hạn 3 như Q12. Mã vận đơn, thời gian dự kiến và xác nhận đơn có mức chọn cao trong dữ liệu giả lập. 57/120 (47,5%) cần trạng thái từng kiện là một căn cứ mô phỏng cho màn hình đơn đa kho. ETA cần ghi là dự kiến và chỉ hiển thị khi có nguồn; tracking hiện do nhân viên nhập tay, chưa phải API hãng vận chuyển.\n\n"
CH4 += stat_table("willingness")
CH4 += "Q16 có 74/120 (61,7%) khá hoặc rất sẵn sàng. Đây là mức ý định trong dữ liệu do nhóm tạo, không phải dự báo doanh thu hoặc bằng chứng khách sẽ chuyển từ sàn sang NÉT Commerce. Q09b, Q13_reason và Q17 là văn bản giả lập; không ghi như lời nói đã được người thật xác nhận.\n\n"

CH4 += page("4.7 Phân tích chéo và giới hạn diễn giải")
CH4 += tab(["Tuổi SYN", "Số trong nhóm", "Gặp khó chọn size", "% trong nhóm tuổi"], [(r["age_label"],r["n"],r["size_uncertain"],pct(r["size_uncertain"],r["n"])) for r in SUMMARY["cross_tabs"]["age_by_size_pain"]], [1.4,1.4,1.7,2.0])
CH4 += "Ba nhóm cộng lại 120 phiếu, số gặp khó chọn size cộng lại 74. Mẫu số của mỗi dòng là số người trong nhóm tuổi, không phải 120. Việc nhóm 25–34 có tỷ lệ cao nhất chỉ là một kết quả của bộ giả lập, không dùng để loại bỏ nhóm khác khỏi thiết kế.\n\n"
cross = SUMMARY["cross_tabs"]["guest_preference_by_abandonment"]
CH4 += tab(["Lựa chọn Q14", "Số trong nhóm", "Q10 có bỏ dở", "% trong nhóm Q14"], [(r["guest_label"],r["n"],next(x["count"] for x in r["rows"] if x["code"]=="yes"),pct(next(x["count"] for x in r["rows"] if x["code"]=="yes"),r["n"])) for r in cross], [2.1,1.3,1.35,1.75])
CH4 += "Nhóm thích guest có 34/47 (72,3%) từng bỏ dở trong kịch bản; nhóm muốn đăng ký ngay là 5/19 (26,3%). Không suy ra bắt đăng ký gây ra bỏ dở từ bảng này: liên hệ được generator đưa vào có chủ đích, chưa kiểm soát các yếu tố khác, và nhóm không chắc chỉ có 6 phiếu.\n\n"
CH4 += "Giới hạn chung: mẫu thuận tiện giả định; quota được ấn định; câu trả lời và thời lượng là dữ liệu sinh; không có quan sát giao dịch thật; nội dung mở chưa được người tham gia xác nhận. Không tính p-value, khoảng tin cậy, sai số lấy mẫu hay suy luận nhân quả cho SYN. Khi có FIELD, lưu nguồn riêng và chạy lại toàn bộ thống kê; không trộn FIELD với SYN.\n\n"

CH4 += page("4.8 Kết quả phỏng vấn giả lập")
CH4 += "Bộ định tính có 08 nhân vật mua hàng và 04 vai trò vận hành (quản lý, kho, xử lý đơn/CS và thanh toán), mỗi biên bản có bối cảnh, tình huống, 04 phát hiện và mã yêu cầu liên quan. Tổng 48 phát hiện không phải 48 người. Bản rút gọn từng biên bản ở Phụ lục D.2; bản nguồn giữ lời giả định có tiền tố SYN.\n\n"
CH4 += tab(["Miền tổng hợp", "Kết quả giả định chính", "Yêu cầu liên quan"], [(r["domain"]," ".join(r["findings"][:2]),", ".join(r["requirements"])) for r in QUAL["synthesis"]], [1.45,3.55,1.5])
CH4 += "Cách mã hóa: từng phát hiện được gán theme, độ ưu tiên và systemFit. CURRENT chỉ nghĩa là có cơ sở từ baseline; PROPOSED là mong muốn cần bổ sung; KNOWN_DEFECT là khoảng cách với code đã biết. Không coi sự đồng thuận của nhân vật do nhóm viết là xác nhận khách hàng. Không tính phần trăm từ 12 biên bản để suy rộng.\n\n"

CH4 += page("4.9 Kết quả lấy mẫu hồ sơ nghiệp vụ giả lập")
CH4 += "Lấy mẫu hồ sơ là một kỹ thuật riêng: đọc trường dữ liệu, quan hệ chứng từ và ngoại lệ. Bộ SYN chọn có chủ đích 20 đơn và 10 chứng từ; không phải dữ liệu xuất từ hệ thống đang chạy và không dùng để ước tính tỷ lệ giao lỗi thực tế.\n\n"
CH4 += tab(["Chiều phủ nghiệp vụ", "Phân bổ SYN", "Cách đọc"], [
    ("Thanh toán trong 20 đơn", "10 COD; 10 online mô phỏng", "Mỗi đơn thuộc đúng một nhóm này"),
    ("Phân bổ kho trong 20 đơn", "10 một kho; 10 hai kho", "Giao với nhóm thanh toán, không cộng thành 40 đơn"),
    ("Tình huống trong 20 đơn", "4 đã giao; 7 đang xử lý/giao; 3 hủy; 2 giao lỗi; 4 có hàng hoàn", "Là nhóm bao phủ kịch bản, không phải cùng một trường trạng thái code"),
    ("10 chứng từ kho", "3 nhập; 3 chuyển; 2 kiểm kê; 2 điều chỉnh", "Có 13 movement vì mỗi chuyển có 2 chiều"),
], [1.65,2.65,2.2])
CH4 += "Mỗi hồ sơ là một snapshot độc lập. Các số dư không tạo thành sổ kho liên tục giữa 30 mẫu. Trong một đơn: subtotal = tổng số lượng × đơn giá; total = subtotal − discount + shipping. Tiền dùng VND nguyên; mã SYN-GIAM50 chỉ là voucher giả định (giảm 50.000đ khi tiền hàng tối thiểu 500.000đ), không khẳng định tồn tại trong seed ứng dụng.\n\n"
CH4 += "Kết quả phân tích: cần lưu snapshot đơn; tách order.status, order.payment_status, payment.status và fulfillment_status; giữ chỗ theo kho/SKU; xuất đúng phần của kiện đã shipped; COD chỉ paid khi mọi kiện delivered; hàng returned không tự restock. Sample register và ví dụ tính tại Phụ lục D.3–D.5 giúp truy ngược kết luận về từng hồ sơ.\n\n"
CH4 += "Nguồn SYS vẫn cần thiết để xác nhận hành vi code. Hồ sơ SYN không che bốn known defects tại mục 5.3; đặc biệt thanh toán thành công đến muộn và expiry chưa được xem là đã sửa. Quy trình hoàn tiền hoặc đối soát với hãng giao thật chưa được bổ sung vào hệ thống chỉ bằng việc mô tả trong báo cáo.\n\n"


APPENDIX = """# PHỤ LỤC D. HỒ SƠ THỰC HIỆN GIẢ LẬP

## D.1 Nhật ký pilot SYN — kiểm tra công cụ

10 ca sau là kịch bản rà soát bảng hỏi, không phải 10 buổi thử với người dùng. Không tạo điểm hài lòng, thời gian quan sát hoặc chữ ký xác nhận giả. Các ca không nằm trong 144 phiếu gốc hoặc 120 phiếu hợp lệ.

""" + tab(["Mã", "Kịch bản / vấn đề", "Cách xử lý trong công cụ"], [(r["id"].replace("SYN-PILOT-","PILOT-"), r["scenario"], r["adjustment"]) for r in SURVEY["pilot_cases"]], [0.9,2.7,2.9])
APPENDIX += "Các mã PILOT ở bảng đều có tiền tố nguồn đầy đủ SYN-PILOT trong JSON. Đây là log thiết kế, không phải chứng minh biểu mẫu đã được chạy và nghiệm thu bởi người dùng thật.\n\n"

fit = {"CURRENT":"Hiện trạng", "PROPOSED":"Đề xuất", "KNOWN_DEFECT":"Khoảng cách code"}
for ix, interview in enumerate(QUAL["interviews"]):
    if ix == 0:
        APPENDIX += page("D.2 Biên bản phỏng vấn SYN — 12 trường hợp")
    elif ix % 2 == 0:
        APPENDIX += "\n<!-- pagebreak -->\n\n"
    APPENDIX += f"### {interview['id']} · {interview['role']}\n\n"
    APPENDIX += f"Bối cảnh giả định: {interview['profile']} {interview['scenario']} Mốc kịch bản: {interview['day']}; không có consent/ghi âm thực tế.\n\n"
    for finding in interview["findings"]:
        req = ", ".join(x.replace("P1-", "") for x in finding["requirements"])
        APPENDIX += f"- {finding['observation']} → {req}; {fit[finding['systemFit']]}.\n"
    APPENDIX += "\nKết luận SYN: " + interview["summary"] + "\n\n"

APPENDIX += page("D.3 Sổ lấy mẫu 20 đơn SYN")
APPENDIX += "Tất cả mã rút gọn DH dưới đây mang tiền tố SYN-HS-DH. Trạng thái là snapshot, không phải kết quả đơn thật. Online là mô phỏng. Các tổng tiền mẫu không được gọi là doanh thu.\n\n"
APPENDIX += tab(["Mã", "Cách trả / kho", "Tình huống lấy mẫu", "Tổng tiền VND"], [(o["id"].replace("SYN-HS-",""),f"{o['paymentMethod']} / {len(o['fulfillments'])} kho",o["sampleReason"],money(o["amountVnd"]["total"])) for o in QUAL["orders"]], [0.75,1.05,3.45,1.25])

APPENDIX += page("D.4 Sổ lấy mẫu 10 chứng từ kho SYN")
APPENDIX += "Mã rút gọn KHO mang tiền tố SYN-HS-KHO. Mỗi mẫu có lý do, SKU, vai trò thao tác, idempotency key giả và các movement. Lệnh chuyển kho có hai movement; nhập, kiểm kê, điều chỉnh mỗi mẫu có một.\n\n"
APPENDIX += tab(["Mã", "Loại / số lượng", "Lý do", "Movement"], [(d["id"].replace("SYN-HS-",""),f"{d['type']} / {d['quantity']}",d["reason"],"; ".join(f"{m['warehouse'].replace('SYN-KHO-','')}: {m['onHandBefore']}→{m['onHandAfter']}" for m in d["movements"])) for d in QUAL["inventoryDocuments"]], [0.8,1.3,3.0,1.4])
APPENDIX += "Số lượng của receipt/transfer là lượng luân chuyển dương; stocktake là số đếm thực tế giả định; adjustment là chênh lệch có dấu. Không cộng cột quantity khác nghĩa thành một chỉ tiêu. Kiểm từng movement: on_hand sau = on_hand trước + delta; available = on_hand − reserved; ATP = max(available − safety_stock, 0).\n\n"

APPENDIX += page("D.5 Ba ví dụ phân tích hồ sơ và dữ liệu gốc")
for suffix in ["09","10"]:
    o = next(x for x in QUAL["orders"] if x["id"] == "SYN-HS-DH-"+suffix)
    a = o["amountVnd"]
    APPENDIX += f"### {o['id']} — {o['sampleReason']}\n\n"
    APPENDIX += "; ".join(f"{i['description']}: {i['quantity']} × {money(i['unitPriceVnd'])}" for i in o["items"]) + ".\n\n"
    APPENDIX += f"Tổng = {money(a['subtotal'])} − {money(a['discount'])} + {money(a['shipping'])} = {money(a['total'])}. "
    APPENDIX += "; ".join(f"{x['warehouse']}: {x['status']}, reservation {', '.join(r['status'] for r in x['reservations'])}" for x in o["fulfillments"]) + ".\n\n"
    APPENDIX += f"order.status={o['orderStatus']}; order.payment_status={o['orderPaymentStatus']}; payment.status={o['paymentRowStatus']}; fulfillment_status={o['fulfillmentStatus']}. {o['interpretation']}\n\n"
d = next(x for x in QUAL["inventoryDocuments"] if x["id"] == "SYN-HS-KHO-03")
m = d["movements"][0]
APPENDIX += "### SYN-HS-KHO-03 — nhập lại sau kiểm định giả định\n\n"
APPENDIX += f"{d['reason']} on_hand {m['onHandBefore']} + {m['quantityDelta']} = {m['onHandAfter']}; reserved giữ {m['reservedAfter']}; available = {m['availableAfter']}; safety_stock = {m['safetyStock']}; ATP = {m['atpAfter']}. {d['interpretation']}\n\n"
APPENDIX += "### Đọc bộ dữ liệu kèm theo\n\n"
APPENDIX += "Excel gồm hướng dẫn, 144 phiếu raw, kết quả có công thức, codebook, phỏng vấn, đơn hàng, dòng hàng và chứng từ kho. Cột status=valid quyết định vào mẫu phân tích; excluded giữ lý do và duplicate_of nếu có. Chỉnh dữ liệu nguồn phải kiểm lại công thức và xuất lại báo cáo, vì Word là snapshot của phiên bản dữ liệu ghi trên bìa.\n\n"


def main():
    source = (DIR / "bao-cao-khao-sat-va-mo-hinh-he-thong.md").read_text(encoding="utf-8")
    source = replace_section(source,"# KIỂM SOÁT TÀI LIỆU VÀ PHẠM VI BẰNG CHỨNG","# CHƯƠNG 1.",CONTROL)
    source = replace_section(source,"# CHƯƠNG 4.","# CHƯƠNG 5.",CH4)
    source = replace_section(source,"## 1.1 Bối cảnh", "## 1.5 Các bên liên quan", """## 1.1 Bối cảnh và lý do chọn đề tài

Mua quần áo online đòi hỏi chọn đúng size/màu khi không thể thử trực tiếp. Phía cửa hàng phải quản lý nhiều SKU, nhiều kho và các kiện giao của cùng một đơn. Giá, voucher, tồn, thanh toán và vận chuyển không liên kết sẽ gây thông tin mâu thuẫn cho khách và nhân viên.

Đề tài phù hợp Project 1 vì có chuỗi nghiệp vụ rõ: tìm sản phẩm → chọn biến thể → giỏ hàng → đặt đơn → giữ tồn → thanh toán → giao hàng. Nhóm có thể thực hành thu thập yêu cầu, phân tích ngoại lệ và mô hình hóa dữ liệu trên một sản phẩm cụ thể. Không dùng số liệu SYN để khẳng định tính khả thi kinh doanh.

## 1.2 Câu hỏi khảo sát

- Người mua cần gì để chọn size/màu, hiểu tổng tiền và quyết định đặt hàng?
- Đăng nhập, voucher, checkout và theo dõi kiện giao có những vướng mắc nào?
- Vận hành cần kiểm soát giữ tồn, xuất kho, COD, hủy và hàng hoàn ra sao?
- Quản lý cần báo cáo, phân khúc và trợ lý chỉ đọc hỗ trợ quyết định nào?

## 1.3 Mục tiêu và sản phẩm đầu ra

Tạo bộ yêu cầu truy vết từ nguồn đến tiêu chí nghiệm thu: kế hoạch 02 tuần; công cụ và dữ liệu SYN; tổng hợp nghiệp vụ; FR/NFR; BFD, Activity Diagram và ERD khái niệm.

## 1.4 Phạm vi hệ thống tham chiếu

Storefront, tài khoản, giỏ/voucher, checkout guest/thành viên, COD và online mô phỏng, theo dõi đơn; quản trị catalog, khách/phân khúc, tồn đa kho, giao hàng, báo cáo và Copilot chỉ đọc.

Chưa khẳng định có cổng thanh toán thật, API hãng vận chuyển, email production, hoàn tiền tự phục vụ hoặc LLM bên ngoài. Các mục này là hướng phát triển riêng.
""")
    source = exact(source,"Đây là mục tiêu phân bổ chứ không phải số thu được.","Trong PLAN đây là quota dự kiến; bộ SYN bản 1.1 chủ động sinh đúng quota này, không phải số tuyển được ngoài đời.")
    source = exact(source,"N4–N6 · 10–14/09", "N4–N7 · 10–15/09")
    source = exact(source,"Thu phiếu chính, phỏng vấn người mua, theo dõi quota", "Thu phiếu chính, phỏng vấn người mua; đóng thu trước bước làm sạch N7")
    source = exact(source,"## 3.5 Kiểm soát chất lượng và bảo vệ dữ liệu", "## 3.5 Kiểm soát chất lượng và bảo vệ dữ liệu\n\nQuy định dưới đây dành cho đợt FIELD nếu thực hiện. Bộ SYN không có thông tin cá nhân hay người thật; không giả mạo bước đồng ý hoặc ghi âm. Trong lịch PLAN, “pilot 10 người” là mục tiêu thực địa; bản mô phỏng chỉ tạo 10 ca kiểm tra công cụ.")
    source = exact(source,"Khi chưa đạt quota, báo cáo số thực thu và hạn chế thay vì tạo thêm dữ liệu.","Với FIELD, khi chưa đạt quota phải báo cáo số thực thu và hạn chế, không bù bằng SYN. Bộ SYN được phép sinh theo quota vì đã công khai là giả lập ngay từ đầu.")
    # Replace compact evidence-to-requirement matrix; retain technical rules and defects.
    new5 = """## 5.1 Từ bằng chứng đến yêu cầu

Tổng hợp kết hợp thống kê SYN, tình huống phỏng vấn/hồ sơ SYN và ràng buộc SYS. Không biến số liệu do nhóm sinh thành bằng chứng độc lập xác nhận giả thuyết của chính nhóm. Ưu tiên còn phụ thuộc rủi ro mất tiền/tồn và phạm vi đồ án, không chỉ số người chọn một phương án.

""" + tab(["Miền", "Bằng chứng SYN + SYS", "Quyết định / giới hạn", "Yêu cầu"], [
        ("Catalog", "Q08: size 74/120, ảnh 70/120; PV-KH-01/06", "Thông tin size, ảnh và tồn SKU; chưa đo hiệu quả UX", "FR-01/02"),
        ("Tài khoản", "Q14: guest 47/120; PV-KH-03/05; SYS-05", "Giữ guest + account; bảo vệ quyền sở hữu", "FR-03/04/10"),
        ("Giỏ / voucher", "Q11: tổng tiền 30/60; PV-KH-04; DH-09", "Tổng tiền minh bạch, server tính lại; ngưỡng mã rõ", "FR-05–07"),
        ("Payment", "Q13: COD 68/120; PV-VH-04; DH-10", "Tách trạng thái; COD mọi kiện delivered; còn known defects", "FR-08/09/11"),
        ("Kho", "Q08: tồn 53/120; PV-VH-02; KHO-01…10", "Giữ, xuất, nhả theo SKU/kho; chứng từ có audit", "FR-12–16"),
        ("Giao hàng", "Q15: từng kiện 57/120; PV-VH-03; DH-09/10", "Một kiện mỗi kho; tracking thủ công; returned ≠ restock", "FR-17–19"),
        ("Khách / quản trị", "PV-VH-01; SYS-05", "Phân khúc và Copilot chỉ đọc; không tự gửi chiến dịch", "FR-20–24"),
    ], [1.0,2.15,2.25,1.1]) + "Trong bảng: PV, DH và KHO là mã SYN đầy đủ ở Phụ lục D; FR là P1-FR. Các gợi ý như đánh giá sản phẩm, dự báo ETA tự động, duyệt chứng từ nhiều cấp hoặc hoàn tiền trực tuyến phải có yêu cầu thay đổi riêng nếu triển khai.\n\n"
    source = replace_section(source,"## 5.1 Từ bằng chứng đến yêu cầu","## 5.2",new5)
    source = source.replace("SYN-01: size, ảnh, tồn", "SYN Q08; PV-KH-01/06: size, ảnh, tồn")
    source = source.replace("SYN-01: tổng tiền; SYS-S01", "SYN Q11; DH-09: tổng tiền; SYS-02")
    source = exact(source,"Trong bảng này FR/NFR là viết tắt của P1-FR/P1-NFR. FIELD sẽ được bổ sung bằng mã phiếu, biên bản và mẫu hồ sơ tương ứng; không thay thế bằng một nhận xét chung “đã khảo sát”.", "Trong bảng này FR/NFR là viết tắt của P1-FR/P1-NFR. SYN Qxx trỏ về 120 phiếu valid trong Excel; PV/DH là mã rút gọn tại Phụ lục D. Nếu có FIELD, thêm mã nguồn mới và tính lại kết quả, không đổi nhãn SYN thành FIELD.")
    source = replace_section(source,"## 8.3 Kết luận và công việc tiếp theo","# PHỤ LỤC A.","""## 8.3 Kết luận và công việc tiếp theo

Bản 1.1 đã hoàn thành một bộ khảo sát giả lập có thể kiểm tra lại: 144 phiếu gốc với 120 hợp lệ; 10 ca pilot công cụ; 12 biên bản định tính; 20 đơn và 10 chứng từ kho; kết quả tổng hợp, FR/NFR, BFD, Activity Diagram và ERD khái niệm. Kết luận chỉ có giá trị minh họa quy trình phân tích yêu cầu cho đồ án NÉT Commerce.

Trước khi nộp, bổ sung tên trường/lớp, giảng viên, danh sách và mã sinh viên; xác nhận giảng viên cho phép dùng dữ liệu giả lập. Nếu học phần bắt buộc thực địa, bộ SYN không thay thế phỏng vấn, consent và dữ liệu FIELD thật. Khi triển khai FIELD, giữ nguyên bản SYN này làm mẫu tham khảo, tạo phiên bản nguồn mới, tính lại toàn bộ tỷ lệ và xem lại ưu tiên tính năng.

""")
    source = exact(source,"## B.3 Nhu cầu đối với website", "<!-- pagebreak -->\n\n## B.3 Nhu cầu đối với website")
    source = exact(source,"300.000–499.000đ / 500.000–799.000đ / 800.000–1.199.000đ", "Từ 300.000đ đến dưới 500.000đ / Từ 500.000đ đến dưới 800.000đ / Từ 800.000đ đến dưới 1.200.000đ")
    source = exact(source,"Mã số theo thứ tự; missing riêng", "Mã ASCII theo codebook; null khi chưa hỏi")
    source = exact(source,"Sổ theo dõi phải có số tiếp cận, bắt đầu, đủ điều kiện, hoàn tất, bị loại theo từng lý do và hợp lệ cuối cùng. Không điền các số này bằng mục tiêu kế hoạch. Bảng SYN-01 trong Chương 4 là ví dụ độc lập, không được mô tả là kết quả chạy phiếu PH-P1-v1 này.", "Bộ SYN-PH-P1-120-v1 được sinh theo PH-P1-v1 với mã ASCII tại codebook Excel/JSON. Q09 tách thành Q09a (chọn) và Q09b (mô tả); Q13_reason là lý do; các lựa chọn khác có trường văn bản riêng. Funnel 160 → 144 → 128 → 124 → 120 là kịch bản giả lập có log loại; không phải số liệu FIELD. Giá trị null có thể là chưa hỏi/bỏ qua theo nhánh hoặc không trả lời câu mở tùy chọn; không đồng nghĩa lựa chọn Không. Q13_reason và Q17 có thể bỏ trống; nếu phân tích riêng văn bản phải loại missing khỏi mẫu số và công bố số còn lại. Khi khảo sát thật, ghi số thực thu và nguyên nhân thiếu dữ liệu riêng.")
    source = exact(source,"## A.1 Lời giới thiệu và xin đồng ý", "## A.1 Lời giới thiệu và xin đồng ý\n\nCông cụ dưới đây dành cho lần khảo sát thật nếu có. Các biên bản SYN tại Phụ lục D không sử dụng lời giới thiệu này để ngụ ý đã có người đồng ý tham gia.")
    source = exact(source,"## C.2 Sổ bằng chứng và việc cần bổ sung", "## C.2 Sổ bằng chứng và việc cần bổ sung\n\nBộ SYN đã có đầy đủ mã bản ghi và nguồn tái tạo: survey.json, qualitative.json và qualitative.md trong docs/project-1/synthetic. Sổ FIELD dưới đây vẫn để trống vì chưa có hoạt động thực địa.")
    source = exact(source,"- S4: docs/research/01-bao-cao-khao-sat.md — bảng tổng hợp SYN-01, n=200; không có FIELD.", "- S4: docs/project-1/synthetic/survey.json; qualitative.json; qualitative.md — dữ liệu SYN của bản 1.1. Bảng n=200 ở hồ sơ nghiên cứu cũ không sử dụng và không gộp vào 120 mẫu mới.")
    source += "\n" + APPENDIX
    source = source.replace("../../artifacts/project1-diagrams/", "../../artifacts/project1-synthetic-diagrams/")
    source = simplify_report(source)
    (DIR / "bao-cao-khao-sat-gia-lap.md").write_text(source, encoding="utf-8")
    pains = [r for r in SUMMARY["pains"]["rows"] if r["code"] not in ["none", "other"]]
    metrics = {"evidence_type":"SYN", "dataset_id":SURVEY["metadata"]["dataset_id"],
               "pain_chart":[{"label":r["label"],"count":r["count"],"denominator":N} for r in pains],
               "valid_n":N, "source":"docs/project-1/synthetic/survey.json"}
    (DIR / "synthetic/report_metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Composed {len(source):,} characters; 120 valid records; all displayed frequency tables independently recounted.")


if __name__ == "__main__":
    main()
