from __future__ import annotations

from build_word_report import *


ACADEMIC_DOCX_PATH = OUT_DIR / "Bao-cao-do-an-website-ban-quan-ao-truc-tuyen.docx"


def chapter(doc, num, title):
    """Start an academic chapter without leaving an empty break-only page."""
    doc.add_page_break()
    heading = doc.add_heading(f"CHƯƠNG {num}. {title}", level=1)
    heading.paragraph_format.page_break_before = False
    heading.paragraph_format.keep_with_next = True


def configure_academic_doc(doc):
    configure_doc(doc)
    for sec in doc.sections:
        sec.page_width = Inches(8.27)
        sec.page_height = Inches(11.69)
        sec.top_margin = Inches(0.79)
        sec.bottom_margin = Inches(0.79)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(0.77)
        sec.header_distance = Inches(0.45)
        sec.footer_distance = Inches(0.45)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11.5)
    normal.paragraph_format.line_spacing = 1.25
    normal.paragraph_format.space_after = Pt(6)

    hp = doc.sections[0].header.paragraphs[0]
    hp.text = "ĐỒ ÁN XÂY DỰNG WEBSITE BÁN QUẦN ÁO TRỰC TUYẾN"
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_run_font(hp.runs[0], size=8.5, color=MID_GRAY, bold=True)


def add_academic_cover(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(28)
    p.paragraph_format.space_after = Pt(2)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(p.add_run("[TÊN TRƯỜNG / HỌC VIỆN]"), size=13, color=NAVY, bold=True)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(58)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(p.add_run("[KHOA / BỘ MÔN]"), size=12, color=NAVY, bold=True)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(12)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(p.add_run("BÁO CÁO ĐỒ ÁN"), size=19, color=GOLD, bold=True)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(8)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(
        p.add_run("XÂY DỰNG WEBSITE BÁN QUẦN ÁO\nTRỰC TUYẾN"),
        size=27,
        color=NAVY,
        bold=True,
    )

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(28)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(
        p.add_run("Phân tích yêu cầu · Thiết kế hệ thống · Cài đặt · Kiểm thử · Triển khai"),
        size=11.5,
        color=DARK_BLUE,
        italic=True,
    )

    table = doc.add_table(rows=5, cols=2)
    set_table_geometry(table, [1.75, 3.7])
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    metadata = [
        ("Học phần", "[Tên học phần]"),
        ("Giảng viên hướng dẫn", "[Họ và tên giảng viên]"),
        ("Nhóm thực hiện", "[Tên nhóm / lớp]"),
        ("Sinh viên", "[Họ tên - MSSV của từng thành viên]"),
        ("Thời gian thực hiện", "08 tuần, từ [ngày bắt đầu] đến [ngày kết thúc]"),
    ]
    for i, (label, value) in enumerate(metadata):
        set_cell_shading(table.cell(i, 0), LIGHT_GRAY)
        set_run_font(table.cell(i, 0).paragraphs[0].add_run(label), size=10, bold=True, color=NAVY)
        set_run_font(table.cell(i, 1).paragraphs[0].add_run(value), size=10, color=DARK_GRAY)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(70)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(
        p.add_run("TP. HỒ CHÍ MINH, THÁNG 09 NĂM 2026"),
        size=11,
        color=MID_GRAY,
        bold=True,
    )
    doc.add_page_break()


def add_detailed_use_case(
    doc,
    section_number,
    code,
    title,
    actor,
    objective,
    trigger,
    preconditions,
    main_flow,
    alternatives,
    postconditions,
    related_rules,
):
    doc.add_page_break()
    doc.add_heading(f"{section_number} {code} - {title}", level=2)
    add_table(
        doc,
        ["Thuộc tính", "Nội dung"],
        [
            ("Tác nhân chính", actor),
            ("Mục tiêu", objective),
            ("Sự kiện kích hoạt", trigger),
            ("Tiền điều kiện", preconditions),
            ("Hậu điều kiện", postconditions),
            ("Quy tắc liên quan", related_rules),
        ],
        [1.6, 4.9],
        font_size=9.2,
    )
    doc.add_heading("Luồng chính", level=3)
    add_numbered(doc, main_flow)
    doc.add_heading("Luồng thay thế và ngoại lệ", level=3)
    add_bullets(doc, alternatives)


def add_landscape_gallery(doc, figures):
    """Render several full-width diagrams in one landscape section without blank pages."""
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    sec.orientation = WD_ORIENT.LANDSCAPE
    sec.different_first_page_header_footer = False
    sec.page_width = Inches(11.69)
    sec.page_height = Inches(8.27)
    sec.top_margin = sec.bottom_margin = Inches(.62)
    sec.left_margin = sec.right_margin = Inches(.65)
    sec.header_distance = sec.footer_distance = Inches(.35)
    for index, (title, path, caption) in enumerate(figures):
        if index:
            doc.add_page_break()
        doc.add_heading(title, level=2)
        add_figure(doc, path, caption, width=9.35)
    sec2 = doc.add_section(WD_SECTION.NEW_PAGE)
    sec2.orientation = WD_ORIENT.PORTRAIT
    sec2.different_first_page_header_footer = False
    sec2.page_width = Inches(8.27)
    sec2.page_height = Inches(11.69)
    sec2.top_margin = sec2.bottom_margin = Inches(.79)
    sec2.left_margin = Inches(1.0)
    sec2.right_margin = Inches(.77)
    sec2.header_distance = sec2.footer_distance = Inches(.45)


def make_order_business_flow():
    img, d = canvas("Quy trình nghiệp vụ từ đặt hàng đến hoàn tất", size=(2800, 1600))
    lanes = [
        ("Khách hàng", 180, 430, "#F8FAFC"),
        ("Storefront / API", 430, 760, "#EEF6FD"),
        ("Nhân viên / Kho", 760, 1090, "#F8FAFC"),
        ("Thanh toán / Vận chuyển", 1090, 1420, "#F1F8F1"),
    ]
    for label, y1, y2, fill in lanes:
        d.rectangle((70, y1, 2730, y2), fill=fill, outline="#D0D5DD", width=3)
        d.rectangle((70, y1, 360, y2), fill="#0B2545")
        draw_text_center(d, (215, (y1 + y2) / 2), label, font(30, True), "white", 240)

    def step(x, y, text, fill="#FFFFFF", outline="#2E74B5", w=360, h=135):
        rounded_box(d, (x, y, x + w, y + h), text, fill=fill, outline=outline, title_size=26)
        return (x + w / 2, y + h / 2)

    # Customer lane
    c1 = step(430, 255, "Xác nhận giỏ, địa chỉ và phương thức trả")
    c2 = step(1010, 255, "Nhận mã đơn và tổng tiền đã chốt")
    c3 = step(1730, 255, "Theo dõi trạng thái và tracking")
    c4 = step(2260, 255, "Nhận hàng hoặc yêu cầu hậu mãi", w=400)
    # System lane
    s1 = step(430, 535, "Revalidate SKU, giá, tồn, voucher")
    s2 = step(900, 535, "Tạo order, snapshot và reservation", w=400)
    s3 = step(1390, 535, "Xử lý kết quả thanh toán / COD", w=390)
    s4 = step(1870, 535, "Ghi state, history, audit và notification", w=430)
    s5 = step(2390, 535, "Đóng đơn / mở luồng hậu mãi", w=300)
    # Operations lane
    o1 = step(900, 855, "Duyệt đơn và kiểm tra ngoại lệ", fill="#FFF5D6", outline="#9A6700", w=400)
    o2 = step(1390, 855, "Pick, pack và xác nhận sẵn sàng giao", fill="#FFF5D6", outline="#9A6700", w=390)
    o3 = step(1870, 855, "Bàn giao hãng vận chuyển", fill="#FFF5D6", outline="#9A6700", w=430)
    o4 = step(2390, 855, "Xử lý giao thất bại / hoàn kho", fill="#FDECEC", outline="#9B1C1C", w=300)
    # Provider lane
    p1 = step(1390, 1175, "Xác thực payment event", fill="#E8F5E9", outline="#2E7D32", w=390)
    p2 = step(1870, 1175, "Cấp tracking và cập nhật scan", fill="#E8F5E9", outline="#2E7D32", w=430)
    p3 = step(2390, 1175, "Trả kết quả giao hàng", fill="#E8F5E9", outline="#2E7D32", w=300)

    arrow(d, (610, 390), (610, 535), "#2E74B5")
    arrow(d, (790, 602), (900, 602), "#2E74B5")
    arrow(d, (1100, 535), (1100, 390), "#2E74B5")
    arrow(d, (1300, 602), (1390, 602), "#2E74B5")
    arrow(d, (1585, 670), (1585, 855), "#9A6700")
    arrow(d, (1585, 990), (1585, 1175), "#2E7D32")
    arrow(d, (1780, 1242), (1870, 1242), "#2E7D32")
    arrow(d, (2085, 1175), (2085, 990), "#9A6700")
    arrow(d, (2085, 855), (2085, 670), "#2E74B5")
    arrow(d, (2085, 535), (2085, 390), "#2E74B5")
    arrow(d, (2300, 602), (2390, 602), "#2E74B5")
    arrow(d, (2540, 670), (2540, 855), "#9B1C1C")
    arrow(d, (2540, 990), (2540, 1175), "#2E7D32")
    arrow(d, (2540, 535), (2460, 390), "#2E74B5")
    d.text((70, 1500), "Điểm kiểm soát: server chốt giá/tồn; payment event idempotent; mọi chuyển trạng thái có history; giao thất bại phải giải phóng hoặc hoàn kho.", font=font(24, italic=True), fill="#667085")
    return save(img, "14-quy-trinh-nghiep-vu-don-hang.png")


def make_return_refund_flow():
    img, d = canvas("Quy trình nghiệp vụ đổi trả và hoàn tiền", size=(2800, 1500))
    y = 260
    xs = [100, 500, 900, 1300, 1700, 2100, 2460]
    labels = [
        "Khách gửi yêu cầu và bằng chứng",
        "Kiểm tra cửa sổ đổi trả / điều kiện",
        "Phê duyệt và cấp mã nhận hàng",
        "Kho nhận, kiểm đếm và phân loại",
        "Quyết định đổi hàng / hoàn tiền / từ chối",
        "Thực hiện refund hoặc xuất hàng thay thế",
        "Thông báo và đóng hồ sơ",
    ]
    fills = ["#EEF6FD", "#FFF5D6", "#EEF6FD", "#F8FAFC", "#FFF5D6", "#E8F5E9", "#EEF6FD"]
    outlines = ["#2E74B5", "#9A6700", "#2E74B5", "#667085", "#9A6700", "#2E7D32", "#2E74B5"]
    centers = []
    for idx, (x, label) in enumerate(zip(xs, labels)):
        w = 330 if idx < 6 else 280
        rounded_box(d, (x, y, x + w, y + 180), label, fill=fills[idx], outline=outlines[idx], title_size=25)
        centers.append((x + w / 2, y + 90))
        if idx:
            arrow(d, (centers[idx - 1][0] + (165 if idx - 1 < 6 else 140), y + 90), (x, y + 90), "#667085")

    # Exception branches
    rounded_box(d, (520, 720, 980, 900), "Không đủ điều kiện: nêu rõ lý do, bằng chứng và kênh khiếu nại", fill="#FDECEC", outline="#9B1C1C", title_size=26)
    rounded_box(d, (1280, 720, 1740, 900), "Sai lệch khi nhận: lập biên bản, ảnh kiểm đếm và chuyển manager", fill="#FDECEC", outline="#9B1C1C", title_size=26)
    rounded_box(d, (2020, 720, 2480, 900), "Refund thất bại: giữ trạng thái pending, retry idempotent và đối soát", fill="#FDECEC", outline="#9B1C1C", title_size=26)
    arrow(d, (665, 440), (750, 720), "#9B1C1C")
    arrow(d, (1465, 440), (1510, 720), "#9B1C1C")
    arrow(d, (2265, 440), (2250, 720), "#9B1C1C")

    d.rounded_rectangle((140, 1080, 2660, 1320), radius=18, fill="#F8FAFC", outline="#D0D5DD", width=3)
    notes = [
        "Chính sách: chỉ xử lý item thuộc đơn đã giao và trong thời hạn công bố.",
        "Tài chính: tổng refund thành công không vượt số tiền đã thu.",
        "Kho: hàng bán lại, hàng lỗi và hàng loại bỏ phải có movement/biên bản riêng.",
        "Truy vết: mọi quyết định có actor, lý do, thời gian và liên kết order item.",
    ]
    for i, note in enumerate(notes):
        d.text((190, 1110 + i * 48), f"• {note}", font=font(27), fill="#344054")
    return save(img, "15-quy-trinh-doi-tra-hoan-tien.png")


def build_academic_document(diagrams):
    doc = Document()
    configure_academic_doc(doc)
    add_academic_cover(doc)

    doc.add_heading("THÔNG TIN ĐỒ ÁN", level=1)
    add_table(
        doc,
        ["Nội dung", "Mô tả"],
        [
            ("Tên đề tài", "Xây dựng website bán quần áo trực tuyến NÉT Commerce."),
            ("Loại báo cáo", "Báo cáo đồ án phần mềm, trình bày từ khảo sát đến triển khai."),
            ("Đối tượng nghiên cứu", "Quy trình mua sắm thời trang trực tuyến và quy trình quản trị cửa hàng."),
            ("Sản phẩm bàn giao", "Mã nguồn frontend/backend, cơ sở dữ liệu, Docker, website triển khai và tài liệu kỹ thuật."),
            ("Quy mô thực hiện", "08 tuần; 05 thành viên gồm PM, Frontend, 02 Backend và DevOps."),
            ("Phiên bản báo cáo", "4.1 - 01/09/2026; bổ sung nghiệp vụ Inventory đa kho, Use Case chi tiết và ERD mở rộng."),
        ],
        [1.7, 4.8],
        font_size=9.5,
    )

    doc.add_heading("LỜI CAM ĐOAN", level=1)
    add_para(
        doc,
        "Nhóm thực hiện cam đoan nội dung phân tích, thiết kế, cài đặt và kiểm thử trong báo cáo được tổng hợp từ quá trình xây dựng đồ án. Các nguồn tham khảo được liệt kê ở phần cuối. Những số liệu khảo sát chưa thu thập ngoài thực địa được ghi rõ là dữ liệu mô phỏng và chỉ dùng để minh họa phương pháp nghiên cứu.",
    )
    add_para(
        doc,
        "Các vị trí tên trường, khoa, học phần, giảng viên và sinh viên đang được để dạng chỗ trống để nhóm hoàn thiện trước khi nộp.",
        italic=True,
    )

    doc.add_heading("TÓM TẮT ĐỒ ÁN", level=1)
    add_para(
        doc,
        "Đồ án xây dựng một hệ thống thương mại điện tử thời trang gồm hai phân hệ: website mua sắm dành cho khách hàng và trang quản trị dành cho nhân viên. Hệ thống hỗ trợ duyệt 22 sản phẩm, tìm kiếm và lọc, lựa chọn biến thể, giỏ hàng, voucher, đăng nhập, đăng ký hồ sơ thành viên, đặt hàng, theo dõi đơn; đồng thời đặc tả quản lý Inventory đa kho từ tra cứu ATP, giữ tồn, điều chỉnh và sổ cái đến nhập hàng, chuyển kho, kiểm kê và cảnh báo tồn thấp.",
    )
    add_para(
        doc,
        "Giải pháp được phát triển bằng React 19, Vinext, TypeScript và Tailwind CSS; phần xử lý phía máy chủ chạy trên Cloudflare Workers. Dữ liệu quan hệ được lưu trong Cloudflare D1/SQLite và truy cập qua Drizzle ORM. Hệ thống có phân quyền customer, staff, manager, admin và bổ sung NÉT AI Copilot để tổng hợp tình hình tồn kho, đơn hàng, doanh thu và khuyến mãi cho người quản trị.",
    )
    add_para(
        doc,
        "Kết quả kiểm thử tại thời điểm hoàn thành cho thấy typecheck, lint và build đều thành công; 9/9 bài kiểm thử tự động đạt; container Docker ở trạng thái healthy; các luồng hồ sơ thành viên, voucher, đặt hàng và trợ lý quản trị hoạt động theo kịch bản kiểm thử.",
    )
    add_para(
        doc,
        "Báo cáo trình bày 30 yêu cầu chức năng dưới dạng mã truy vết, đặc tả đầy đủ vòng đời nghiệp vụ từ catalog, giỏ, khuyến mãi, đơn hàng, Inventory, thanh toán và giao nhận đến hủy, đổi trả, hoàn tiền và đối soát. Bốn sơ đồ Use Case, bốn ERD và 32 kịch bản kiểm thử được bố trí theo miền để dễ đọc; phần dữ liệu phân biệt rõ 28 bảng hiện tại với 02 bảng Inventory Operations đề xuất.",
    )
    add_callout(
        doc,
        "TỪ KHÓA",
        "Thương mại điện tử; thời trang trực tuyến; Inventory đa kho; React; Cloudflare Workers; D1; Docker; phân quyền; voucher; trợ lý quản trị.",
        "info",
    )

    doc.add_heading("DANH MỤC TỪ VIẾT TẮT", level=1)
    add_table(
        doc,
        ["Từ viết tắt", "Diễn giải"],
        [
            ("AI", "Artificial Intelligence - trí tuệ nhân tạo."),
            ("API", "Application Programming Interface - giao diện lập trình ứng dụng."),
            ("D1", "Cơ sở dữ liệu SQL phân tán của Cloudflare."),
            ("ERD", "Entity Relationship Diagram - sơ đồ thực thể liên kết."),
            ("RBAC", "Role-Based Access Control - kiểm soát truy cập theo vai trò."),
            ("SRS", "Software Requirements Specification - đặc tả yêu cầu phần mềm."),
            ("UAT", "User Acceptance Testing - kiểm thử chấp nhận người dùng."),
            ("CI/CD", "Tích hợp liên tục và triển khai liên tục."),
            ("NFR", "Non-functional Requirement - yêu cầu phi chức năng."),
        ],
        [1.45, 5.05],
        font_size=9.5,
    )
    doc.add_heading("MỤC LỤC", level=1)
    add_toc(doc.add_paragraph())

    doc.add_heading("CÁCH ĐỌC VÀ KIỂM CHỨNG BÁO CÁO", level=1)
    add_para(
        doc,
        "Báo cáo được tổ chức theo chuỗi truy vết từ lý do chọn đề tài đến yêu cầu, thiết kế, cài đặt, kiểm thử và kế hoạch triển khai. Người đọc có thể dùng mã FR, UC, BR và TC để đối chiếu một nghiệp vụ xuyên suốt các chương.",
    )
    add_table(
        doc,
        ["Nhu cầu đọc", "Phần nên xem", "Cách kiểm chứng"],
        [
            ("Hiểu bài toán và phạm vi", "Chương 1-3", "Đối chiếu khảo sát mô phỏng, actor, FR/NFR và trạng thái phạm vi."),
            ("Đánh giá thiết kế", "Chương 4-5", "Kiểm tra sequence, state, Use Case, ERD và bất biến dữ liệu."),
            ("Đánh giá sản phẩm", "Chương 6-7", "Đối chiếu hiện trạng API/UI với test và giới hạn được công bố."),
            ("Đánh giá kế hoạch nhóm", "Chương 8 và Phụ lục B", "Kiểm tra timeline 08 tuần, owner, phụ thuộc và Definition of Done."),
            ("Truy vết một yêu cầu", "Phụ lục D-E", "Đi từ FR → UC/module → API/data → TC và trạng thái."),
        ],
        [1.7, 1.7, 3.1],
        font_size=8.8,
    )
    add_callout(
        doc,
        "QUY ƯỚC PHẠM VI",
        "“Đã cài đặt” là phần có bằng chứng trong mã nguồn/kiểm thử; “Một phần” là đã có nền dữ liệu hoặc route; “Thiết kế mở rộng” là đặc tả để phát triển tiếp và không được xem là tính năng đã hoàn thành.",
        "info",
    )

    chapter(doc, 1, "TỔNG QUAN ĐỀ TÀI")
    doc.add_heading("1.1 Lý do chọn đề tài", level=2)
    add_para(
        doc,
        "Mua sắm quần áo trực tuyến là bài toán phù hợp để vận dụng đồng thời kiến thức phân tích nghiệp vụ, thiết kế giao diện, xây dựng API, mô hình hóa dữ liệu, bảo mật, kiểm thử và triển khai. Đặc thù của ngành thời trang nằm ở số lượng biến thể size/màu, yêu cầu trình bày hình ảnh, độ chính xác tồn kho và nhu cầu đổi trả. Vì vậy, đề tài không dừng ở việc tạo giao diện bán hàng mà hướng tới một hệ thống có luồng dữ liệu nhất quán từ catalog đến đơn hàng và quản trị.",
    )
    add_para(
        doc,
        "Việc lựa chọn đề tài còn giúp nhóm tiếp cận một quy trình phát triển phần mềm hoàn chỉnh: chia vai trò, quản lý phạm vi trong tám tuần, thiết kế cơ sở dữ liệu nhiều miền, kiểm soát truy cập và đóng gói bằng Docker. Sản phẩm cuối cùng được dùng làm minh chứng cho kiến thức và kỹ năng kỹ thuật của nhóm.",
    )

    doc.add_heading("1.2 Vấn đề đặt ra", level=2)
    add_figure(doc, diagrams["problem"], "Hình 1.1. Cây vấn đề của đề tài và các nhóm nguyên nhân chính.")
    add_bullets(
        doc,
        [
            "Người mua khó xác định size, màu, tồn kho, tổng tiền và trạng thái đơn nếu thông tin không được tổ chức rõ ràng.",
            "Dữ liệu sản phẩm, biến thể, khuyến mãi và tồn kho dễ sai lệch nếu không có một mô hình dữ liệu thống nhất.",
            "Nhân viên cần một trang quản trị có phân quyền để xử lý danh mục, đơn hàng và tồn kho.",
            "Hệ thống phải bảo đảm tổng tiền được tính phía server, giao dịch có thể truy vết và triển khai lặp lại.",
        ],
    )

    doc.add_heading("1.3 Mục tiêu của đồ án", level=2)
    add_para(
        doc,
        "Mục tiêu tổng quát là phân tích, thiết kế, xây dựng và triển khai một website bán quần áo trực tuyến có đầy đủ luồng người dùng và quản trị, đáp ứng các yêu cầu cơ bản về tính đúng đắn, bảo mật và khả năng vận hành.",
    )
    add_table(
        doc,
        ["Mã", "Mục tiêu cụ thể", "Tiêu chí hoàn thành"],
        [
            ("MT01", "Xây dựng storefront responsive.", "Có trang chủ, danh sách, chi tiết, giỏ hàng, checkout và tài khoản."),
            ("MT02", "Xây dựng backend và dữ liệu nhất quán.", "API kiểm tra quyền, validate input và lưu dữ liệu D1 qua migration."),
            ("MT03", "Hoàn thiện quản trị nhiều vai trò.", "Staff/manager/admin truy cập chức năng theo quyền."),
            ("MT04", "Áp dụng voucher chính xác.", "Server tính lại điều kiện, mức giảm, phí và tổng đơn."),
            ("MT05", "Hỗ trợ quản trị bằng AI.", "Copilot đọc dữ liệu, có nguồn và không tự sửa dữ liệu."),
            ("MT06", "Đóng gói và kiểm thử triển khai.", "Build, test và Docker healthcheck đạt."),
        ],
        [0.75, 2.8, 2.95],
        font_size=8.8,
    )

    doc.add_heading("1.4 Đối tượng và phạm vi nghiên cứu", level=2)
    add_table(
        doc,
        ["Nội dung", "Trong phạm vi", "Ngoài phạm vi"],
        [
            ("Kênh sử dụng", "Web responsive cho khách và quản trị.", "Ứng dụng di động native."),
            ("Nghiệp vụ", "Catalog, cart, voucher, account, order, inventory, admin.", "Marketplace nhiều nhà bán, loyalty phức tạp."),
            ("Thanh toán/giao nhận", "Mô hình dữ liệu và luồng tích hợp.", "Giao dịch production với ngân hàng/vận chuyển thật."),
            ("AI quản trị", "Phân tích dữ liệu D1 và gợi ý hành động.", "Mô hình tự huấn luyện hoặc tự động ra quyết định."),
        ],
        [1.25, 2.6, 2.65],
        font_size=8.9,
    )

    doc.add_heading("1.5 Phương pháp thực hiện", level=2)
    add_numbered(
        doc,
        [
            "Khảo sát tài liệu và xây dựng bộ dữ liệu mô phỏng để xác định pain point, actor và luồng sử dụng.",
            "Đặc tả yêu cầu bằng use case, quy tắc nghiệp vụ, yêu cầu phi chức năng và ma trận truy vết.",
            "Mô hình hóa hệ thống bằng context diagram, kiến trúc logic, sequence diagram, state diagram và ERD.",
            "Phát triển theo lát cắt dọc trong bốn giai đoạn hai tuần, ưu tiên luồng mua hàng trước.",
            "Kiểm thử tĩnh, unit, API/integration, build và Docker trước khi triển khai.",
        ],
    )

    doc.add_heading("1.6 Đóng góp và tiêu chí đánh giá", level=2)
    add_table(
        doc,
        ["Nhóm đóng góp", "Nội dung", "Cách đánh giá"],
        [
            ("Phân tích", "Chuyển nhu cầu mua và quản trị thành yêu cầu có mã, use case và quy tắc.", "Kiểm tra tính đầy đủ và ma trận truy vết."),
            ("Thiết kế", "Mô hình hóa kiến trúc, trạng thái, luồng giao dịch và 28 bảng dữ liệu.", "Đối chiếu sơ đồ với schema và API."),
            ("Cài đặt", "Storefront, account, voucher, order, backoffice và Copilot chạy được.", "Demo các luồng từ giao diện đến D1."),
            ("Chất lượng", "Tự động hóa typecheck, lint, unit test, build và Docker healthcheck.", "Bằng chứng kiểm thử và khả năng tái lập."),
            ("Tài liệu", "Báo cáo học thuật và data dictionary tách theo từng bảng.", "Khả năng tra cứu, tái sử dụng và bảo trì."),
        ],
        [1.25, 3.05, 2.2],
        font_size=8.9,
    )

    h = doc.add_heading("CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ", level=1)
    h.paragraph_format.keep_with_next = True
    doc.add_heading("2.1 Mô hình hệ thống thương mại điện tử", level=2)
    add_para(
        doc,
        "Một hệ thống thương mại điện tử B2C gồm lớp trải nghiệm khách hàng, lớp xử lý nghiệp vụ, lớp dữ liệu và các tích hợp ngoài. Catalog mô tả sản phẩm; variant đại diện cho SKU có size/màu cụ thể; cart là trạng thái tạm; order là bằng chứng giao dịch; payment, inventory và fulfillment có vòng đời độc lập nhưng liên kết với order.",
    )

    doc.add_heading("2.2 Các nguyên tắc thiết kế chính", level=2)
    add_table(
        doc,
        ["Nguyên tắc", "Áp dụng trong đồ án"],
        [
            ("Nguồn sự thật phía server", "Giá, voucher, phí và tổng tiền được tính lại trước khi tạo đơn."),
            ("Idempotency", "Webhook hoặc thao tác lặp không tạo nhiều kết quả nghiệp vụ."),
            ("Snapshot giao dịch", "Order item và promotion giữ dữ liệu tại thời điểm đặt hàng."),
            ("Phân quyền tối thiểu", "Mỗi API ghi dữ liệu kiểm tra vai trò ở phía server."),
            ("Append-only", "Movement, history, outbox và audit được bổ sung thay vì sửa lịch sử."),
            ("Quan sát được", "Healthcheck, log có cấu trúc và correlation phục vụ chẩn đoán."),
        ],
        [1.75, 4.75],
        font_size=9.2,
    )

    doc.add_heading("2.3 Công nghệ sử dụng", level=2)
    add_table(
        doc,
        ["Lớp", "Công nghệ", "Vai trò trong hệ thống"],
        [
            ("Frontend", "React 19, Vinext, TypeScript, Tailwind CSS", "Giao diện storefront và admin có kiểu dữ liệu rõ ràng."),
            ("Backend", "Vinext route handlers, Cloudflare Workers", "Xử lý API stateless gần người dùng."),
            ("Dữ liệu", "Cloudflare D1/SQLite, Drizzle ORM", "Dữ liệu quan hệ, migration và truy vấn."),
            ("Tệp", "Cloudflare R2", "Lưu ảnh sản phẩm; metadata nằm trong D1."),
            ("Xác thực", "Sites Identity", "Nhận danh tính và ánh xạ sang RBAC."),
            ("Kiểm thử", "Vitest, TypeScript, Oxlint", "Kiểm tra logic, kiểu dữ liệu và chất lượng mã."),
            ("Triển khai", "Docker, Wrangler, Sites hosting", "Tái lập local và phát hành website."),
        ],
        [1.25, 2.2, 3.05],
        font_size=8.8,
    )

    doc.add_heading("2.4 Phương pháp tổ chức phát triển", level=2)
    add_para(
        doc,
        "Đồ án sử dụng cách tiếp cận lặp và tăng trưởng. Mỗi giai đoạn tạo ra một lát cắt chạy được: nền tảng; duyệt và giỏ hàng; giao dịch; hoàn thiện và phát hành. PM điều phối phạm vi, yêu cầu và UAT; bốn thành viên kỹ thuật chịu trách nhiệm frontend, hai miền backend và DevOps.",
    )

    doc.add_heading("2.5 Vòng đời một yêu cầu trong hệ thống", level=2)
    add_numbered(
        doc,
        [
            "Yêu cầu được mô tả bằng mã FR/NFR và gắn với actor hoặc mục tiêu đồ án.",
            "Use case làm rõ tiền điều kiện, luồng chính, ngoại lệ và hậu điều kiện.",
            "Thiết kế ánh xạ yêu cầu sang route giao diện, API, bảng dữ liệu và quyền truy cập.",
            "Lập trình viên triển khai theo vertical slice và bổ sung migration khi schema thay đổi.",
            "Bài kiểm thử gắn lại với mã yêu cầu; kết quả được dùng làm bằng chứng nghiệm thu.",
            "Sau khi build và Docker đạt, phiên bản được đóng gói và phát hành lên môi trường riêng tư.",
        ],
    )
    doc.add_heading("2.6 Cơ sở về bảo mật và chất lượng", level=2)
    add_para(
        doc,
        "Bảo mật của đồ án tuân theo nguyên tắc defense in depth: danh tính do nền tảng xác nhận, quyền được kiểm tra ở API, input được validate, truy vấn có tham số, dữ liệu nhạy cảm được tối thiểu hóa và thao tác quản trị được audit. Không một kiểm soát đơn lẻ nào được xem là đủ để bảo vệ toàn bộ luồng.",
    )
    add_para(
        doc,
        "Chất lượng được đánh giá theo nhiều lớp. Static analysis phát hiện lỗi sớm; unit test bảo vệ logic thuần; integration test xác minh D1 và route; system test kiểm tra container; UAT đối chiếu sản phẩm với mục tiêu người dùng. Cách tiếp cận nhiều lớp giúp giảm chi phí phát hiện lỗi muộn.",
    )

    chapter(doc, 3, "KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU")
    add_callout(
        doc,
        "GIỚI HẠN NGHIÊN CỨU",
        "Bộ khảo sát n=200 và kết quả phỏng vấn trong chương này là dữ liệu mô phỏng để minh họa quy trình nghiên cứu. Khi trình bày như nghiên cứu thực nghiệm, nhóm phải thay bằng dữ liệu thu thập thật.",
        "warning",
    )
    doc.add_heading("3.1 Thiết kế khảo sát", level=2)
    add_table(
        doc,
        ["Thành phần", "Thiết kế"],
        [
            ("Mục tiêu", "Xác định trở ngại trong quá trình chọn và mua quần áo trực tuyến."),
            ("Đối tượng", "Người đã mua quần áo online trong sáu tháng gần nhất."),
            ("Biến quan sát", "Size, hình ảnh, đổi trả, phí, tồn biến thể, tracking, thanh toán."),
            ("Dạng câu hỏi", "Sàng lọc, lựa chọn nhiều đáp án, thang Likert và câu hỏi mở."),
            ("Cách phân tích", "Tần suất, tỷ lệ, phân nhóm pain point và đối chiếu với use case."),
        ],
        [1.6, 4.9],
        font_size=9.2,
    )

    doc.add_heading("3.2 Kết quả mô phỏng và nhận xét", level=2)
    add_figure(doc, diagrams["survey"], "Hình 3.1. Tỷ lệ vấn đề trong bộ dữ liệu khảo sát mô phỏng n=200.")
    add_para(
        doc,
        "Kết quả mô phỏng cho thấy sự không chắc chắn về size, khác biệt giữa hình ảnh và sản phẩm, cùng sự thiếu rõ ràng của chính sách đổi trả là ba nhóm vấn đề nổi bật. Từ đó, đồ án ưu tiên thông tin sản phẩm đầy đủ, lựa chọn variant rõ, hiển thị tổng tiền sớm và theo dõi đơn tự phục vụ.",
    )

    doc.add_heading("3.3 Hành trình người dùng", level=2)
    add_figure(doc, diagrams["journey"], "Hình 3.2. Hành trình người dùng, điểm khó khăn và cơ hội thiết kế.")

    doc.add_page_break()
    doc.add_heading("3.4 Tác nhân và trường hợp sử dụng", level=2)
    add_figure(doc, diagrams["use_cases"], "Hình 3.3. Tổng quan tác nhân và các trường hợp sử dụng chính.", width=5.6)
    add_table(
        doc,
        ["Tác nhân", "Mục tiêu", "Chức năng tiêu biểu"],
        [
            ("Khách vãng lai", "Tìm và mua nhanh.", "Duyệt, lọc, xem chi tiết, giỏ hàng, checkout."),
            ("Thành viên", "Quản lý hồ sơ và đơn cá nhân.", "Đăng ký hồ sơ, lịch sử và theo dõi đơn."),
            ("Nhân viên", "Xử lý vận hành hằng ngày.", "Đơn hàng, fulfillment, tồn kho, khách hàng."),
            ("Quản lý", "Điều hành danh mục và chương trình bán.", "Sản phẩm, khuyến mãi, báo cáo, Copilot."),
            ("Quản trị viên", "Quản trị toàn hệ thống.", "Toàn quyền và cấu hình phân quyền."),
        ],
        [1.35, 2.0, 3.15],
        font_size=9.0,
    )

    add_landscape_gallery(
        doc,
        [
            ("3.4.1 Use Case Storefront và tài khoản", diagrams["use_case_storefront"], "Hình 3.4. Use Case chi tiết Storefront, tài khoản, giao dịch và hậu mãi."),
            ("3.4.2 Use Case Backoffice quản trị", diagrams["use_case_admin"], "Hình 3.5. Use Case chi tiết vận hành Backoffice và kiểm soát quản trị."),
            ("3.4.3 Use Case quản lý Inventory đa kho", diagrams["use_case_inventory"], "Hình 3.6. Use Case chi tiết tác nghiệp kho, tự động giữ tồn và cảnh báo."),
        ],
    )

    doc.add_heading("3.5 Yêu cầu chức năng", level=2)
    add_table(
        doc,
        ["Nhóm", "Yêu cầu chính", "Điều kiện nghiệm thu"],
        [
            ("Catalog", "Danh mục, tìm/lọc, chi tiết, variant, tồn.", "Chỉ hiện sản phẩm công khai; không thêm SKU hết hàng."),
            ("Tài khoản", "Đăng nhập danh tính và đăng ký hồ sơ.", "Người dùng chỉ đọc/sửa dữ liệu của mình."),
            ("Giỏ/voucher", "Thêm, sửa, xóa, áp hoặc bỏ mã.", "Server kiểm tra điều kiện và tính lại tổng."),
            ("Đặt hàng", "Địa chỉ, phí, review và tạo đơn.", "Dữ liệu đơn là snapshot; tổng tiền nhất quán."),
            ("Inventory", "Tra cứu ATP, điều chỉnh, nhập, chuyển, kiểm kê và cảnh báo.", "Mọi thay đổi sinh movement; thao tác phê duyệt có audit."),
            ("Quản trị", "Catalog, đơn, khuyến mãi, báo cáo và AI.", "Tuân thủ quyền staff/manager/admin."),
        ],
        [1.25, 2.4, 2.85],
        font_size=8.8,
    )

    doc.add_heading("3.6 Yêu cầu phi chức năng", level=2)
    add_table(
        doc,
        ["Nhóm", "Yêu cầu"],
        [
            ("Hiệu năng", "Trang responsive, ảnh tối ưu và API phản hồi phù hợp."),
            ("Bảo mật", "TLS, validate input, RBAC server-side, hạn chế dữ liệu nhạy cảm trong log."),
            ("Tin cậy", "Migration có phiên bản, healthcheck, transaction và xử lý thao tác lặp."),
            ("Khả dụng", "Luồng chính có trạng thái lỗi, rỗng và loading dễ hiểu."),
            ("Tiếp cận", "Điều hướng bàn phím, nhãn form, tương phản và ngữ nghĩa HTML."),
            ("Bảo trì", "Module rõ, TypeScript, kiểm thử tự động và tài liệu chạy."),
        ],
        [1.45, 5.05],
        font_size=9.1,
    )

    doc.add_page_break()
    doc.add_heading("3.7 Danh mục yêu cầu có mã", level=2)
    add_para(
        doc,
        "Mã yêu cầu được dùng xuyên suốt từ đặc tả, thiết kế, cài đặt đến kiểm thử. Mức ưu tiên Must là bắt buộc trong phiên bản đồ án; Should được hoàn thành khi không ảnh hưởng các luồng cốt lõi.",
    )
    requirement_rows = [
        ("FR-01", "Hiển thị danh sách sản phẩm đã công khai theo danh mục.", "Must", "Danh sách có tên, giá, ảnh, URL chi tiết; dữ liệu ẩn không xuất hiện."),
        ("FR-02", "Tìm kiếm và lọc theo từ khóa, danh mục, giá hoặc thuộc tính.", "Must", "Kết quả phản ánh đúng bộ lọc và có trạng thái không tìm thấy."),
        ("FR-03", "Xem chi tiết sản phẩm và lựa chọn variant size/màu.", "Must", "Thông tin, giá và tồn thay đổi theo variant được chọn."),
        ("FR-04", "Thêm, cập nhật số lượng và xóa sản phẩm trong giỏ.", "Must", "Giỏ lưu đúng SKU, số lượng hợp lệ và tổng tạm tính."),
        ("FR-05", "Áp hoặc bỏ voucher trong giỏ hàng.", "Must", "Server kiểm tra thời hạn, ngưỡng, lượt dùng và trả tổng mới."),
        ("FR-06", "Đăng nhập bằng danh tính được nền tảng xác nhận.", "Must", "Ứng dụng nhận user ID/email mà không lưu mật khẩu riêng."),
        ("FR-07", "Đăng ký và cập nhật hồ sơ thành viên.", "Must", "Hồ sơ gắn đúng user; người khác không thể đọc hoặc sửa."),
        ("FR-08", "Nhập địa chỉ, kiểm tra giỏ và đặt hàng.", "Must", "Server revalidate giá, tồn, voucher trước khi tạo order."),
        ("FR-09", "Lưu snapshot sản phẩm và khuyến mãi trong đơn.", "Must", "Catalog thay đổi không làm đổi dữ liệu đơn lịch sử."),
        ("FR-10", "Xem xác nhận, lịch sử và trạng thái đơn cá nhân.", "Must", "Customer chỉ nhìn thấy đơn thuộc danh tính hiện tại."),
        ("FR-11", "Quản trị sản phẩm, variant, media và trạng thái công khai.", "Must", "Manager/admin tạo hoặc cập nhật; input được validate."),
        ("FR-12", "Điều chỉnh tồn kho có lý do và nhật ký biến động.", "Must", "Staff trở lên; balance và movement được ghi nhất quán."),
        ("FR-13", "Xử lý danh sách đơn và chuyển trạng thái hợp lệ.", "Must", "Transition sai bị từ chối; transition đúng có history/audit."),
        ("FR-14", "Nhận webhook thanh toán theo cơ chế idempotent.", "Should", "Sự kiện lặp không tạo tác động nghiệp vụ lần hai."),
        ("FR-15", "Quản lý khuyến mãi và mã coupon.", "Should", "Manager/admin cấu hình điều kiện, thời hạn và giới hạn dùng."),
        ("FR-16", "Tải và phục vụ media sản phẩm từ object storage.", "Should", "Tệp có key ổn định; chỉ loại tệp hợp lệ được chấp nhận."),
        ("FR-17", "Cung cấp số liệu dashboard cho quản trị.", "Must", "Metrics phản ánh order, revenue, inventory theo dữ liệu D1."),
        ("FR-18", "Copilot trả lời câu hỏi vận hành trong phạm vi hỗ trợ.", "Must", "Kết quả grounded, có đề xuất và không tự ghi dữ liệu."),
        ("FR-19", "Khách hàng gửi yêu cầu hủy đơn khi còn trong trạng thái cho phép.", "Should", "Đơn được hủy atomically; tồn giữ được giải phóng và lịch sử có lý do."),
        ("FR-20", "Nhân viên tạo fulfillment, bàn giao và cập nhật tracking.", "Should", "Tổng lượng giao không vượt lượng đặt; mọi mốc giao nhận có thời gian."),
        ("FR-21", "Tiếp nhận yêu cầu đổi trả theo order item và chính sách.", "Could", "Yêu cầu có bằng chứng, lý do, quyết định và trạng thái truy vết được."),
        ("FR-22", "Thực hiện hoàn tiền có kiểm soát và đối soát kết quả.", "Could", "Tổng refund thành công không vượt số tiền đã thu; lỗi có thể retry an toàn."),
        ("FR-23", "Quản trị vai trò và ghi audit cho thao tác nhạy cảm.", "Should", "Thay đổi quyền, giá, tồn, order và promotion có actor/thời gian/before-after."),
        ("FR-24", "Đối soát thanh toán và đơn hàng theo kỳ.", "Could", "Chênh lệch được phân loại, giao người xử lý và đóng bằng bằng chứng."),
        ("FR-25", "Tra cứu, lọc và xuất tồn theo kho, SKU và trạng thái ATP.", "Must", "Hiển thị on-hand, reserved, safety stock, available; file xuất dùng cùng bộ lọc."),
        ("FR-26", "Quản lý thông tin và trạng thái hoạt động của kho.", "Should", "Mã kho duy nhất; không vô hiệu hóa kho còn operation hoặc reservation mở."),
        ("FR-27", "Lập và ghi nhận phiếu nhập/nhận hàng theo từng SKU.", "Should", "Phiếu POSTED tăng tồn và sinh movement đúng một lần trong cùng transaction."),
        ("FR-28", "Thực hiện chuyển kho hai đầu có kiểm soát.", "Should", "Kho nguồn giảm, kho đích tăng bằng cặp movement liên kết; lỗi phải rollback toàn bộ."),
        ("FR-29", "Lập phiên kiểm kê và xử lý chênh lệch tồn.", "Should", "Lưu số hệ thống, số đếm, chênh lệch, người duyệt; chỉ POSTED mới đổi balance."),
        ("FR-30", "Cảnh báo tồn thấp và đề xuất bổ sung hàng.", "Should", "Cảnh báo theo safety stock/ATP, chống trùng và liên kết tới SKU, kho, owner."),
        ("NFR-01", "Ứng dụng responsive trên mobile, tablet và desktop.", "Must", "Luồng mua chính không tràn ngang ở viewport phổ biến."),
        ("NFR-02", "Kiểm tra quyền ở phía server cho mọi thao tác ghi.", "Must", "Request thiếu quyền trả 401/403 và không đổi dữ liệu."),
        ("NFR-03", "Validate input và trả lỗi API thống nhất.", "Must", "Lỗi có mã, thông điệp an toàn và correlation khi cần."),
        ("NFR-04", "Mã nguồn vượt qua typecheck, lint, test và build.", "Must", "Tất cả quality gate đạt trước khi phát hành."),
        ("NFR-05", "Container có healthcheck cho app, D1 và storage.", "Must", "Docker báo healthy khi ba thành phần sẵn sàng."),
        ("NFR-06", "Không ghi secret hoặc PII không cần thiết vào log.", "Must", "Log được rà soát, secret dùng runtime environment."),
        ("NFR-07", "Schema thay đổi qua migration có phiên bản.", "Must", "Môi trường mới chạy migration và khởi động thành công."),
        ("NFR-08", "Giao diện chính hỗ trợ khả năng tiếp cận cơ bản.", "Should", "Form có label, điều hướng bàn phím và tương phản phù hợp."),
    ]
    add_table(
        doc,
        ["Mã", "Nội dung yêu cầu", "Ưu tiên", "Tiêu chí nghiệm thu"],
        requirement_rows,
        [0.8, 2.55, 0.75, 2.4],
        font_size=8.1,
    )

    add_detailed_use_case(
        doc,
        "3.8",
        "UC-01",
        "Duyệt và chọn sản phẩm",
        "Khách vãng lai hoặc thành viên",
        "Tìm được sản phẩm phù hợp và chọn đúng SKU trước khi thêm vào giỏ.",
        "Người dùng mở trang danh sách hoặc truy cập một URL sản phẩm.",
        "Catalog có ít nhất một sản phẩm published và variant còn khả dụng.",
        [
            "Hệ thống tải danh sách sản phẩm và các bộ lọc có thể áp dụng.",
            "Người dùng nhập từ khóa hoặc chọn danh mục, khoảng giá, thuộc tính.",
            "Hệ thống cập nhật kết quả và thể hiện rõ tiêu chí đang lọc.",
            "Người dùng mở trang chi tiết một sản phẩm.",
            "Hệ thống hiển thị ảnh, mô tả, giá, variant và thông tin tồn.",
            "Người dùng chọn size/màu và xác nhận SKU có thể mua.",
        ],
        [
            "Không có kết quả: hiển thị trạng thái rỗng và nút xóa bộ lọc.",
            "Variant hết hàng: vô hiệu hóa hành động thêm vào giỏ và gợi ý variant khác.",
            "Slug không tồn tại: trả trang không tìm thấy thay vì lộ lỗi hệ thống.",
        ],
        "SKU được chọn sẵn sàng để thêm vào giỏ; chưa phát sinh giao dịch.",
        "FR-01, FR-02, FR-03, NFR-01, NFR-03.",
    )

    add_detailed_use_case(
        doc,
        "3.9",
        "UC-02",
        "Quản lý giỏ hàng và voucher",
        "Khách vãng lai hoặc thành viên",
        "Điều chỉnh các dòng hàng và biết tổng tiền dự kiến sau ưu đãi.",
        "Người dùng thêm SKU vào giỏ hoặc mở trang giỏ hàng.",
        "SKU tồn tại, đang bán và số lượng yêu cầu lớn hơn 0.",
        [
            "Hệ thống nhận SKU và số lượng, sau đó kiểm tra variant.",
            "Dòng hàng được tạo mới hoặc cộng dồn theo quy tắc giỏ.",
            "Người dùng thay đổi số lượng hoặc xóa một dòng hàng.",
            "Hệ thống tính lại subtotal từ dữ liệu giá phía server.",
            "Người dùng nhập một mã voucher hoặc chọn mã gợi ý.",
            "Hệ thống kiểm tra điều kiện và trả discount, shipping, grand total.",
            "Người dùng có thể bỏ voucher để quay lại tổng không ưu đãi.",
        ],
        [
            "Số lượng vượt tồn: giới hạn về số lượng hợp lệ và trả thông báo rõ.",
            "Mã hết hạn/không đủ ngưỡng/hết lượt: không thay đổi tổng và nêu lý do.",
            "Dòng hàng không còn hợp lệ: đánh dấu cần cập nhật trước checkout.",
        ],
        "Giỏ phản ánh đúng SKU, số lượng và voucher; chưa tạo đơn hàng.",
        "FR-04, FR-05, NFR-03; total luôn do server tính.",
    )

    add_detailed_use_case(
        doc,
        "3.10",
        "UC-03",
        "Đăng nhập và đăng ký hồ sơ thành viên",
        "Người dùng đã đăng nhập qua Sites Identity",
        "Tạo hoặc cập nhật hồ sơ NÉT gắn với danh tính đã xác thực.",
        "Người dùng mở trang đăng ký hoặc trang tài khoản.",
        "Request có identity header hợp lệ; production không bật local bypass.",
        [
            "Hệ thống đọc user ID và email từ danh tính chuyển tiếp.",
            "Người dùng nhập họ tên, số điện thoại và thông tin hồ sơ cần thiết.",
            "Client gửi dữ liệu tới API profile.",
            "API kiểm tra danh tính, validate input và tìm user hiện có.",
            "Hệ thống tạo mới hoặc cập nhật user, sau đó bảo đảm vai trò customer.",
            "API trả hồ sơ chuẩn hóa để giao diện hiển thị.",
        ],
        [
            "Chưa đăng nhập: chuyển tới luồng đăng nhập của nền tảng.",
            "Input không hợp lệ: trả lỗi theo trường, không ghi dữ liệu một phần.",
            "Email đã gắn với danh tính khác: từ chối và ghi nhận sự kiện an toàn.",
        ],
        "Hồ sơ thành viên được lưu và chỉ chủ sở hữu có thể truy cập.",
        "FR-06, FR-07, NFR-02, NFR-03, NFR-06.",
    )

    add_detailed_use_case(
        doc,
        "3.11",
        "UC-04",
        "Đặt hàng",
        "Khách vãng lai hoặc thành viên",
        "Tạo một đơn hợp lệ từ giỏ hàng với tổng tiền đã được kiểm chứng.",
        "Người dùng xác nhận trang review và chọn đặt hàng.",
        "Giỏ không rỗng; địa chỉ hợp lệ; các dòng hàng còn có thể mua.",
        [
            "Client gửi cart, địa chỉ, phương thức thanh toán và voucher tới API order.",
            "API nạp lại variant, giá, tồn và chương trình khuyến mãi từ D1.",
            "Hệ thống tính subtotal, discount, shipping và grand total.",
            "Order, order item, promotion snapshot, history và outbox được ghi nhất quán.",
            "Tồn được giữ hoặc trừ theo chính sách của phương thức thanh toán.",
            "API trả mã đơn và trạng thái để giao diện xác nhận.",
        ],
        [
            "Giá hoặc tồn thay đổi: yêu cầu người dùng xem lại tổng mới.",
            "Voucher không còn hợp lệ: loại mã và trả lý do trước khi tạo đơn.",
            "Request lặp: dùng idempotency để trả kết quả trước thay vì tạo đơn thứ hai.",
            "Lỗi ngoài transaction: outbox cho phép retry mà không rollback đơn đã tạo.",
        ],
        "Đơn và lịch sử được lưu; các side effect có thể tiếp tục bất đồng bộ.",
        "FR-08, FR-09, FR-10, FR-14, NFR-03, NFR-07.",
    )

    add_detailed_use_case(
        doc,
        "3.12",
        "UC-05",
        "Tra cứu, điều chỉnh tồn và xem sổ cái",
        "Manager hoặc admin; staff chỉ thực hiện nghiệp vụ được cấp",
        "Biết chính xác ATP theo SKU/kho và ghi một điều chỉnh có thể truy vết.",
        "Người dùng mở màn hình tồn hoặc đi từ cảnh báo tồn thấp/Copilot.",
        "Người dùng đã xác thực; vai trò đủ quyền; D1 sẵn sàng.",
        [
            "Hệ thống tải danh sách tồn theo kho và SKU, kèm on-hand, reserved, safety stock và ATP.",
            "Người dùng tìm kiếm, lọc kho/trạng thái và có thể xuất đúng tập dữ liệu đang xem.",
            "Người dùng mở lịch sử movement của SKU để đối chiếu nguồn biến động.",
            "Khi cần sửa sai, người có quyền nhập delta, reason và idempotency key.",
            "API kiểm tra quyền, input, phiên bản balance và quy tắc không âm.",
            "Hệ thống cập nhật inventory item và thêm inventory movement trong cùng transaction.",
            "Kết quả mới phản ánh trên dashboard; Copilot chỉ đọc và gợi ý bước tiếp theo.",
        ],
        [
            "Không đủ quyền: trả 403 và không lộ dữ liệu tồn chi tiết.",
            "Điều chỉnh làm tồn âm ngoài policy: từ chối hoặc yêu cầu override được audit.",
            "Balance đã đổi bởi người khác: trả 409 và yêu cầu tải lại trước khi điều chỉnh.",
            "Copilot không nhận ra intent: trả danh sách câu hỏi hỗ trợ thay vì suy đoán.",
        ],
        "Balance và movement nhất quán; có actor, thời gian và lý do để kiểm tra.",
        "FR-12, FR-17, FR-18, FR-25, FR-30; BR-INV-01 đến BR-INV-05.",
    )

    add_detailed_use_case(
        doc,
        "3.12.1",
        "UC-05A",
        "Nhập hàng và nhận hàng vào kho",
        "Nhân viên kho; manager phê duyệt ngoại lệ",
        "Ghi nhận số lượng thực nhận theo SKU và chỉ tăng tồn sau khi phiếu được POSTED.",
        "Nhân viên tạo phiếu nhập từ chứng từ mua hàng hoặc lô hàng đến kho.",
        "Kho đang hoạt động; SKU hợp lệ; người dùng có quyền nhận hàng.",
        [
            "Nhân viên chọn kho nhận, tham chiếu chứng từ và thêm các SKU cùng số lượng dự kiến.",
            "Hệ thống kiểm tra mã kho, SKU, số lượng và idempotency key của phiếu.",
            "Phiếu ở DRAFT có thể sửa; khi hàng đến, nhân viên nhập số thực nhận và ghi chú sai lệch.",
            "Nếu chênh lệch vượt ngưỡng, hệ thống yêu cầu manager phê duyệt trước khi post.",
            "Khi POSTED, hệ thống khóa phiếu, cập nhật on-hand từng inventory item và sinh movement RECEIPT.",
            "Operation, operation item, balance và movement được commit trong một transaction.",
            "Hệ thống trả biên nhận và làm mới ATP/cảnh báo cho các SKU liên quan.",
        ],
        [
            "SKU chưa có inventory item tại kho: tạo bản ghi với balance ban đầu bằng 0 rồi mới post.",
            "Phiếu đã POSTED: request lặp trả kết quả cũ, không tăng tồn lần hai.",
            "Một dòng lỗi hoặc xung đột version: rollback toàn phiếu, không nhận hàng từng phần ngoài chủ đích.",
            "Kho bị khóa: không cho post và giữ phiếu DRAFT để chuyển kho nhận hợp lệ.",
        ],
        "Phiếu POSTED là bất biến; tổng delta của các movement khớp lượng thực nhận.",
        "FR-26, FR-27; BR-INV-06, BR-INV-08, BR-INV-09. Trạng thái: thiết kế mở rộng.",
    )

    add_detailed_use_case(
        doc,
        "3.12.2",
        "UC-05B",
        "Chuyển kho hai đầu",
        "Nhân viên kho nguồn, nhân viên kho đích và manager",
        "Di chuyển tồn giữa hai kho mà không tạo ra hoặc làm mất tổng tồn hệ thống.",
        "Người dùng tạo yêu cầu chuyển vì bổ sung hàng hoặc cân bằng tồn.",
        "Hai kho khác nhau và đang hoạt động; SKU nguồn có đủ ATP; người dùng có quyền.",
        [
            "Người tạo chọn kho nguồn, kho đích, SKU, số lượng, reason và ngày dự kiến.",
            "Hệ thống kiểm tra ATP nguồn và ghi operation TRANSFER ở trạng thái DRAFT.",
            "Manager duyệt nếu vượt ngưỡng; kho nguồn xác nhận xuất và niêm phong lô hàng.",
            "Hệ thống ghi trạng thái IN_TRANSIT, giảm tồn nguồn hoặc chuyển sang vùng in-transit theo policy.",
            "Kho đích kiểm nhận, xác nhận số thực nhận và bằng chứng sai lệch nếu có.",
            "Khi hoàn tất, hệ thống sinh cặp movement liên kết: TRANSFER_OUT và TRANSFER_IN.",
            "Operation đóng khi hai đầu cân bằng; cảnh báo mở nếu thiếu/thừa hàng.",
        ],
        [
            "Nguồn thiếu ATP: từ chối duyệt và gợi ý giảm số lượng/chọn kho khác.",
            "Số nhận khác số gửi: không tự đóng; mở exception cho manager xử lý.",
            "Request post lặp: idempotency bảo đảm không sinh thêm cặp movement.",
            "Giao dịch D1 lỗi: rollback cả hai đầu, không để balance lệch một phía.",
        ],
        "Tổng tồn hệ thống được bảo toàn; operation, hai movement và bằng chứng có thể truy vết.",
        "FR-28; BR-INV-07, BR-INV-09, BR-INV-10. Trạng thái: thiết kế mở rộng.",
    )

    add_detailed_use_case(
        doc,
        "3.12.3",
        "UC-05C",
        "Kiểm kê và xử lý chênh lệch",
        "Nhân viên kho; manager phê duyệt chênh lệch",
        "Đối chiếu số đếm vật lý với số hệ thống và điều chỉnh theo quy trình kiểm soát.",
        "Manager mở phiên kiểm kê định kỳ hoặc đột xuất cho một kho/phạm vi SKU.",
        "Kho và phạm vi kiểm kê hợp lệ; snapshot số hệ thống đã được chốt.",
        [
            "Hệ thống tạo operation COUNT, lưu phạm vi và snapshot expected quantity theo thời điểm bắt đầu.",
            "Nhân viên đếm độc lập và nhập actual quantity; chưa thấy expected nếu dùng blind count.",
            "Hệ thống tính variance cho từng SKU và tổng hợp các dòng vượt ngưỡng.",
            "Nhân viên đếm lại dòng bất thường, đính kèm ghi chú hoặc bằng chứng.",
            "Manager duyệt hoặc từ chối phương án xử lý chênh lệch.",
            "Khi POSTED, hệ thống sinh movement COUNT_ADJUSTMENT và cập nhật balance trong một transaction.",
            "Báo cáo kiểm kê khóa sau khi post; dashboard ghi nhận tỷ lệ chính xác tồn.",
        ],
        [
            "Có movement phát sinh trong lúc kiểm kê: cảnh báo snapshot cũ và yêu cầu recount/rebase theo policy.",
            "Chênh lệch vượt ngưỡng nhưng thiếu phê duyệt: giữ trạng thái REVIEW, không đổi balance.",
            "Phiên bị hủy: lưu lý do, không sinh movement và không cập nhật tồn.",
            "Post lặp: trả biên bản cũ, không điều chỉnh lần hai.",
        ],
        "Mỗi chênh lệch có expected, actual, delta, người đếm, người duyệt và movement liên kết.",
        "FR-29; BR-INV-08, BR-INV-09, BR-INV-11. Trạng thái: thiết kế mở rộng.",
    )

    doc.add_page_break()
    doc.add_heading("3.13 Danh mục quy trình nghiệp vụ đầu-cuối", level=2)
    add_para(
        doc,
        "Danh mục dưới đây bao phủ cả luồng khách hàng, vận hành cửa hàng, kho, tài chính và quản trị. Trạng thái 'Đã cài đặt' phản ánh phiên bản hiện tại; 'Một phần' nghĩa là có dữ liệu hoặc API nền nhưng chưa đủ giao diện/quy trình; 'Thiết kế mở rộng' là phạm vi nghiệp vụ được đặc tả để phát triển tiếp.",
    )
    business_process_rows = [
        ("BP-01", "Tài khoản", "Khách hàng", "Danh tính nền tảng", "Hồ sơ và vai trò customer", "Đã cài đặt"),
        ("BP-02", "Duyệt catalog", "Khách hàng", "Danh mục/sản phẩm active", "SKU được chọn", "Đã cài đặt"),
        ("BP-03", "Quản lý giỏ", "Khách hàng", "SKU, số lượng", "Giỏ và subtotal hợp lệ", "Đã cài đặt"),
        ("BP-04", "Áp khuyến mãi", "Pricing service", "Giỏ và mã coupon", "Discount/phí/tổng mới", "Đã cài đặt"),
        ("BP-05", "Checkout và đặt hàng", "Khách hàng", "Giỏ, địa chỉ, phương thức trả", "Order và reservation", "Đã cài đặt"),
        ("BP-06", "Theo dõi/hủy đơn", "Khách hàng/Staff", "Mã đơn và trạng thái", "Timeline hoặc đơn hủy", "Một phần"),
        ("BP-07", "Quản lý catalog", "Manager", "Thông tin sản phẩm/variant", "Catalog được công bố", "Đã cài đặt"),
        ("BP-08", "Quản lý media", "Manager", "Tệp và metadata", "Asset R2 và product_media", "Đã cài đặt"),
        ("BP-09", "Quản lý promotion/coupon", "Manager", "Điều kiện, quyền lợi, thời hạn", "Chương trình có hiệu lực", "Một phần"),
        ("BP-10", "Tiếp nhận và xử lý đơn", "Staff", "Order confirmed", "Đơn được duyệt/pick/pack", "Đã cài đặt"),
        ("BP-11", "Quản lý tồn", "Staff/Manager", "SKU, kho, reason", "Balance và movement", "Đã cài đặt"),
        ("BP-12", "Giao nhận", "Staff/Đối tác", "Đơn sẵn sàng giao", "Fulfillment và tracking", "Một phần"),
        ("BP-13", "Ghi nhận thanh toán", "Payment service", "Webhook đã ký", "Payment/order được cập nhật", "Một phần"),
        ("BP-14", "Đối soát thanh toán", "Manager/Tài chính", "Payment event và báo cáo provider", "Chênh lệch được xử lý", "Thiết kế mở rộng"),
        ("BP-15", "Đổi trả", "CSKH/Staff", "Order item, lý do, bằng chứng", "Return case và quyết định", "Thiết kế mở rộng"),
        ("BP-16", "Hoàn tiền", "Manager/Payment service", "Quyết định refund", "Refund và kết quả provider", "Thiết kế mở rộng"),
        ("BP-17", "Dashboard/Copilot", "Manager", "Dữ liệu order/inventory/promotion", "KPI và hành động đề xuất", "Đã cài đặt"),
        ("BP-18", "Phân quyền/audit", "Admin/System", "User, role, thao tác nhạy cảm", "Quyền và dấu vết kiểm toán", "Một phần"),
        ("BP-19", "Tra cứu và xuất tồn đa kho", "Staff/Manager", "Kho, SKU, bộ lọc", "ATP và file xuất đồng nhất", "Một phần"),
        ("BP-20", "Quản lý kho", "Manager/Admin", "Mã, địa chỉ, trạng thái kho", "Kho hợp lệ cho tác nghiệp", "Thiết kế mở rộng"),
        ("BP-21", "Nhập/nhận hàng", "Nhân viên kho", "Phiếu và lượng thực nhận", "Tồn tăng cùng movement", "Thiết kế mở rộng"),
        ("BP-22", "Chuyển kho", "Hai kho/Manager", "SKU, nguồn, đích, số lượng", "Cặp movement cân bằng", "Thiết kế mở rộng"),
        ("BP-23", "Kiểm kê", "Kho/Manager", "Snapshot và số đếm", "Variance và adjustment", "Thiết kế mở rộng"),
        ("BP-24", "Cảnh báo bổ sung hàng", "System/Manager", "ATP, safety stock, xu hướng", "Alert có owner và đề xuất", "Một phần"),
    ]
    add_table(doc, ["Mã", "Quy trình", "Chủ trì", "Đầu vào", "Kết quả", "Trạng thái"], business_process_rows, [0.65, 1.15, 1.0, 1.45, 1.45, 0.8], font_size=7.2)

    add_detailed_use_case(
        doc,
        "3.14",
        "UC-06",
        "Quản lý catalog, biến thể và media",
        "Manager hoặc admin",
        "Tạo hoặc cập nhật một sản phẩm có đủ variant, giá, media và trạng thái công bố.",
        "Người quản trị chọn tạo mới hoặc chỉnh sửa sản phẩm.",
        "Đã xác thực; có quyền catalog; category và storage sẵn sàng.",
        [
            "Người quản trị nhập tên, slug, mô tả, category và trạng thái sản phẩm.",
            "Hệ thống kiểm tra slug, dữ liệu bắt buộc và quyền người gọi.",
            "Người quản trị thêm variant với SKU, size, màu, giá và thuộc tính.",
            "API kiểm tra SKU duy nhất, giá hợp lệ và quan hệ product-variant.",
            "Người quản trị tải media; server kiểm tra loại/kích thước và tạo R2 key.",
            "Hệ thống lưu product, variant, category, media và ghi audit.",
            "Sản phẩm chỉ được public khi thỏa điều kiện công bố; storefront nhận dữ liệu mới.",
        ],
        [
            "Slug/SKU trùng: trả lỗi theo trường, không tạo bản ghi một phần.",
            "Upload thất bại: sản phẩm vẫn ở draft; media lỗi không được gắn.",
            "Variant đã phát sinh order: không xóa cứng; chuyển trạng thái ngừng bán.",
            "Không có variant active hoặc media chính: từ chối publish.",
        ],
        "Catalog nhất quán; thay đổi nhạy cảm có audit và không phá lịch sử đơn.",
        "FR-11, FR-16, FR-23; BR-CAT-01 đến BR-CAT-04.",
    )

    add_detailed_use_case(
        doc,
        "3.15",
        "UC-07",
        "Tiếp nhận, duyệt và xử lý đơn",
        "Staff; manager xử lý ngoại lệ",
        "Đưa đơn hợp lệ từ confirmed qua processing tới ready-to-ship.",
        "Đơn mới xuất hiện trong hàng đợi backoffice.",
        "Order đã được tạo; payment/COD hợp lệ; reservation còn hiệu lực.",
        [
            "Staff lọc hàng đợi theo trạng thái, SLA hoặc mức ưu tiên.",
            "Hệ thống hiển thị snapshot khách hàng, dòng hàng, thanh toán và cảnh báo.",
            "Staff nhận xử lý; API kiểm tra transition và ghi actor/time.",
            "Kho pick theo SKU, xác nhận số lượng thực tế và báo thiếu nếu có.",
            "Đơn đủ hàng được pack; hệ thống chuyển processing sang ready-to-ship.",
            "Hệ thống ghi order history, audit và tạo công việc giao nhận.",
            "Khách hàng nhận thông báo trạng thái mới.",
        ],
        [
            "Thiếu hàng: giữ đơn ở exception, đề xuất đổi SKU/chờ/hủy từng phần theo policy.",
            "Hai nhân viên xử lý đồng thời: request sau nhận 409 và tải lại trạng thái.",
            "Payment chưa hợp lệ: không cho pick/pack, chuyển hàng đợi đối soát.",
            "Địa chỉ bất thường: manager xác minh trước khi tiếp tục.",
        ],
        "Đơn ở trạng thái ready-to-ship hoặc exception có owner và lý do rõ.",
        "FR-13, FR-20, FR-23; BR-ORD-03, BR-INV-01, BR-FUL-01.",
    )

    add_detailed_use_case(
        doc,
        "3.16",
        "UC-08",
        "Ghi nhận thanh toán và đối soát",
        "Payment provider, system và manager/tài chính",
        "Ghi nhận payment event đúng một lần và phát hiện chênh lệch với order.",
        "Provider gửi webhook hoặc quản lý mở kỳ đối soát.",
        "Secret/chữ ký hợp lệ; provider event ID tồn tại; order có thể đối chiếu.",
        [
            "Endpoint nhận raw event tối thiểu, xác minh chữ ký và thời gian sự kiện.",
            "Hệ thống kiểm tra provider event ID để bảo đảm idempotency.",
            "Event được ánh xạ tới payment và order; amount/currency được đối chiếu.",
            "Trong transaction, hệ thống ghi payment event và cập nhật payment/order theo state machine.",
            "Outbox phát notification hoặc công việc tiếp theo sau khi commit.",
            "Kỳ đối soát tổng hợp event nội bộ và báo cáo provider theo mã giao dịch.",
            "Chênh lệch được phân loại, giao owner, bổ sung bằng chứng và đóng hồ sơ.",
        ],
        [
            "Chữ ký sai: trả 401, không tiết lộ secret và ghi security event.",
            "Event lặp: trả acknowledgement nhưng không tác động lần hai.",
            "Số tiền/tiền tệ không khớp: không xác nhận paid; mở reconciliation case.",
            "Không tìm thấy order: giữ event ở trạng thái unmatched để xử lý thủ công.",
        ],
        "Payment và order nhất quán; mọi chênh lệch có trạng thái và người xử lý.",
        "FR-14, FR-22, FR-24; BR-PAY-01 đến BR-PAY-04.",
    )

    add_detailed_use_case(
        doc,
        "3.17",
        "UC-09",
        "Tạo fulfillment và cập nhật giao nhận",
        "Staff và đơn vị vận chuyển",
        "Tạo lô giao hợp lệ, cấp tracking và cập nhật kết quả giao hàng.",
        "Đơn đạt ready-to-ship hoặc hãng vận chuyển gửi trạng thái mới.",
        "Đơn còn lượng cần giao; địa chỉ và gói hàng hợp lệ.",
        [
            "Staff chọn các order item/quantity cần giao và đơn vị vận chuyển.",
            "API kiểm tra tổng lượng fulfillment không vượt lượng đã đặt chưa hủy/hoàn.",
            "Hệ thống tạo fulfillment, fulfillment items và yêu cầu tracking.",
            "Khi bàn giao, order chuyển shipped và lưu thời gian/carrier/tracking.",
            "Provider cập nhật scan; system chuẩn hóa trạng thái và ghi timeline.",
            "Kết quả delivered làm hoàn tất giao; khách nhận thông báo.",
            "Kết quả failed/returned mở luồng ngoại lệ và điều chỉnh tồn khi hàng về kho.",
        ],
        [
            "Không lấy được tracking: giữ ready-to-ship và cho retry an toàn.",
            "Giao một phần: tạo nhiều fulfillment nhưng tổng quantity vẫn bị kiểm soát.",
            "Webhook trạng thái cũ đến sau: lưu event nhưng không lùi state hiện tại.",
            "Giao thất bại: lưu reason, số lần giao và quyết định giao lại/hoàn về.",
        ],
        "Fulfillment và tracking liên kết order; khách và vận hành nhìn cùng một timeline.",
        "FR-20, FR-23; BR-FUL-01 đến BR-FUL-04.",
    )

    add_detailed_use_case(
        doc,
        "3.18",
        "UC-10",
        "Hủy đơn và giải phóng tồn",
        "Khách hàng hoặc staff/manager",
        "Hủy đơn đúng chính sách và đảo các cam kết tồn/thanh toán cần thiết.",
        "Khách bấm hủy hoặc nhân viên chọn hủy vì ngoại lệ vận hành.",
        "Đơn thuộc quyền truy cập; trạng thái hiện tại còn cho phép hủy.",
        [
            "Hệ thống đọc order hiện tại và xác định actor, reason, phạm vi hủy.",
            "Policy kiểm tra state, payment, fulfillment và thời điểm yêu cầu.",
            "API khóa logic đơn, chống request lặp và xác minh chưa chuyển state mới.",
            "Order chuyển cancelled; history và audit lưu reason/actor/time.",
            "Reservation được release hoặc movement hoàn kho được tạo theo tình trạng vật lý.",
            "Nếu đã thu tiền, hệ thống tạo yêu cầu refund chứ không tự coi là hoàn tất.",
            "Khách hàng nhận xác nhận hủy và tiến độ hoàn tiền nếu có.",
        ],
        [
            "Đã shipped/delivered: từ chối hủy và hướng dẫn luồng đổi trả.",
            "Refund tạm lỗi: đơn vẫn cancelled, refund ở pending để retry/đối soát.",
            "Đơn đã cancelled: trả trạng thái hiện có, không release tồn hai lần.",
            "Một phần đơn đã giao: chỉ xử lý phần còn lại theo policy có phê duyệt.",
        ],
        "Đơn hủy có lịch sử; tồn và nghĩa vụ tài chính được xử lý nhất quán.",
        "FR-19, FR-22, FR-23; BR-ORD-04, BR-INV-02, BR-PAY-03.",
    )

    add_detailed_use_case(
        doc,
        "3.19",
        "UC-11",
        "Tiếp nhận đổi trả và hoàn tiền",
        "Khách hàng, CSKH/staff, kho và manager",
        "Xử lý yêu cầu hậu mãi theo từng order item với quyết định và tài chính truy vết được.",
        "Khách chọn một dòng hàng đã giao và gửi lý do/bằng chứng.",
        "Order item đã delivered; còn trong cửa sổ chính sách; chưa hoàn toàn bộ trước đó.",
        [
            "Khách chọn item, quantity, loại yêu cầu, lý do và tải bằng chứng.",
            "Hệ thống kiểm tra quyền sở hữu, thời hạn, quantity và nhóm hàng ngoại lệ.",
            "CSKH duyệt sơ bộ, yêu cầu bổ sung hoặc từ chối có lý do.",
            "Yêu cầu hợp lệ được cấp mã nhận; khách gửi hàng về điểm nhận/kho.",
            "Kho kiểm đếm, chụp bằng chứng và phân loại bán lại, lỗi hoặc loại bỏ.",
            "Manager quyết định đổi hàng, hoàn tiền toàn phần/một phần hoặc từ chối.",
            "System tạo fulfillment thay thế hoặc refund idempotent; cập nhật tồn và đóng hồ sơ.",
        ],
        [
            "Quá hạn/nhóm hàng không đổi: từ chối với điều khoản chính sách áp dụng.",
            "Hàng nhận khác khai báo: chuyển manager, không tự hoàn tiền.",
            "SKU đổi hết tồn: đề xuất refund hoặc lựa chọn SKU khác có chênh lệch được xác nhận.",
            "Refund thất bại: case không đóng; tiếp tục retry và đối soát.",
        ],
        "Return case, inventory movement, refund/exchange và quyết định được liên kết order item.",
        "FR-21, FR-22, FR-23; BR-RET-01 đến BR-RET-05, BR-PAY-03.",
    )

    add_detailed_use_case(
        doc,
        "3.20",
        "UC-12",
        "Quản lý promotion và coupon",
        "Manager hoặc admin",
        "Tạo chương trình ưu đãi có điều kiện rõ và không làm sai lịch sử giao dịch.",
        "Người quản trị tạo mới, sửa, kích hoạt hoặc dừng chương trình.",
        "Có quyền promotion; thời gian hệ thống chuẩn; catalog cần áp dụng tồn tại.",
        [
            "Manager chọn loại ưu đãi phần trăm, số tiền hoặc miễn phí giao.",
            "Nhập thời hạn, ngưỡng đơn, trần giảm, phạm vi và giới hạn lượt dùng.",
            "Tạo coupon code nếu chương trình yêu cầu mã; hệ thống chuẩn hóa và kiểm tra duy nhất.",
            "API validate điều kiện không mâu thuẫn và quyền người gọi.",
            "Chương trình lưu draft, được preview bằng giỏ mẫu và sau đó kích hoạt.",
            "Pricing service chỉ xét chương trình active trong khoảng thời gian và phạm vi.",
            "Khi tạo order, ưu đãi được snapshot và lượt dùng được cập nhật nhất quán.",
        ],
        [
            "Code trùng hoặc điều kiện sai: từ chối trước khi kích hoạt.",
            "Chương trình đã có order: không sửa lịch sử; thay đổi chỉ áp dụng giao dịch mới.",
            "Hết ngân sách/lượt dùng: ngừng áp dụng và trả lý do rõ cho giỏ.",
            "Hai ưu đãi không cộng dồn: pricing chọn theo policy, không tự cộng cả hai.",
        ],
        "Promotion/coupon có vòng đời, audit và hiệu lực có thể kiểm chứng.",
        "FR-05, FR-15, FR-23; BR-PRO-01 đến BR-PRO-05.",
    )

    add_detailed_use_case(
        doc,
        "3.21",
        "UC-13",
        "Theo dõi dashboard và xử lý cảnh báo vận hành",
        "Manager hoặc admin",
        "Phát hiện vấn đề doanh thu, đơn tồn đọng, tồn thấp và ưu đãi bất thường để giao hành động.",
        "Người quản lý mở dashboard hoặc hỏi Copilot.",
        "Đã xác thực; có quyền metrics; dữ liệu order/inventory/promotion sẵn sàng.",
        [
            "Manager chọn khoảng thời gian và phạm vi cửa hàng/kho.",
            "Hệ thống tính KPI theo định nghĩa đã công bố và thời điểm dữ liệu mới nhất.",
            "Dashboard hiển thị doanh thu, đơn theo state, tồn thấp và promotion active.",
            "Copilot ánh xạ câu hỏi vào intent định sẵn và truy vấn read model theo quyền.",
            "Kết quả nêu dữ liệu bằng chứng, mức tin cậy và giới hạn.",
            "Manager mở bản ghi nguồn, giao owner và hạn xử lý cho cảnh báo.",
            "Sau xử lý, dashboard phản ánh trạng thái mới; thao tác ghi vẫn diễn ra ở module nghiệp vụ.",
        ],
        [
            "Không đủ dữ liệu: hiển thị thời điểm cập nhật và không suy đoán số liệu.",
            "Intent ngoài phạm vi: trả danh mục câu hỏi hỗ trợ.",
            "KPI lệch báo cáo nguồn: mở reconciliation/data quality case.",
            "Người dùng yêu cầu Copilot sửa dữ liệu: từ chối và dẫn tới màn hình nghiệp vụ có xác nhận.",
        ],
        "Cảnh báo có nguồn, owner và hành động; Copilot không tự thay đổi dữ liệu.",
        "FR-17, FR-18, FR-24; BR-AI-01 đến BR-AI-04.",
    )

    doc.add_page_break()
    doc.add_heading("3.22 Danh mục quy tắc nghiệp vụ có mã", level=2)
    business_rule_rows = [
        ("BR-CAT-01", "Catalog", "Chỉ product active có ít nhất một variant active và media chính mới được công bố.", "Giữ draft; trả danh sách điều kiện thiếu."),
        ("BR-CAT-02", "Catalog", "Slug product và SKU variant là duy nhất sau chuẩn hóa.", "Từ chối 409, không ghi một phần."),
        ("BR-CAT-03", "Catalog", "Variant đã xuất hiện trong order không bị xóa cứng.", "Chuyển inactive/discontinued."),
        ("BR-CAT-04", "Catalog", "Giá bán là số nguyên không âm và có hiệu lực theo thời điểm server.", "Từ chối input sai hoặc giá chưa hiệu lực."),
        ("BR-CART-01", "Giỏ", "Một giỏ chỉ có một dòng cho cùng SKU; thêm lặp sẽ cộng số lượng.", "Trả giỏ hợp nhất."),
        ("BR-CART-02", "Giỏ", "Quantity là số nguyên dương và không vượt mức cho phép.", "Giới hạn/từ chối và nêu tồn khả dụng."),
        ("BR-CART-03", "Giỏ", "Giá, tồn và promotion trong giỏ chỉ là dự kiến cho tới checkout.", "Đánh dấu cần review khi dữ liệu đổi."),
        ("BR-PRC-01", "Định giá", "Tiền lưu theo đơn vị nhỏ nhất, không dùng số thực.", "Từ chối dữ liệu sai kiểu."),
        ("BR-PRC-02", "Định giá", "grand_total = subtotal - discount + shipping + tax.", "Không tạo order nếu bất biến sai."),
        ("BR-PRO-01", "Khuyến mãi", "Promotion chỉ hợp lệ trong thời hạn, phạm vi, ngưỡng và lượt dùng.", "Không áp dụng; trả reason code."),
        ("BR-PRO-02", "Khuyến mãi", "Một coupon code chỉ thuộc một chương trình và duy nhất sau chuẩn hóa.", "Từ chối 409."),
        ("BR-PRO-03", "Khuyến mãi", "Discount không làm tổng hàng âm và không vượt trần cấu hình.", "Cắt theo trần hoặc từ chối cấu hình."),
        ("BR-PRO-04", "Khuyến mãi", "Các ưu đãi chỉ cộng dồn khi stacking policy cho phép.", "Chọn ưu đãi theo thứ tự policy."),
        ("BR-PRO-05", "Khuyến mãi", "Order lưu promotion snapshot và số tiền thực tế đã giảm.", "Không phụ thuộc cấu hình thay đổi sau đó."),
        ("BR-ORD-01", "Đơn hàng", "Tạo order dùng idempotency key trong phạm vi khách/giỏ.", "Request lặp trả order cũ."),
        ("BR-ORD-02", "Đơn hàng", "Order item snapshot tên, SKU, giá và thuộc tính tại thời điểm đặt.", "Catalog đổi không sửa lịch sử."),
        ("BR-ORD-03", "Đơn hàng", "Chỉ transition được định nghĩa mới hợp lệ và mọi lần đổi state có history.", "Trả 409 khi transition sai."),
        ("BR-ORD-04", "Đơn hàng", "Khách chỉ hủy trước shipped; ngoại lệ sau processing cần quyền staff/manager.", "Từ chối hoặc chuyển review."),
        ("BR-INV-01", "Tồn kho", "available = on_hand - reserved - safety_stock.", "Không bán vượt available."),
        ("BR-INV-02", "Tồn kho", "Reservation được commit, release hoặc hết hạn đúng một lần.", "Thao tác lặp không đổi balance lần hai."),
        ("BR-INV-03", "Tồn kho", "Mọi thay đổi balance có inventory movement append-only.", "Rollback transaction nếu thiếu movement."),
        ("BR-INV-04", "Tồn kho", "Không cho tồn âm trừ override được cấp quyền và audit.", "Từ chối hoặc yêu cầu manager."),
        ("BR-INV-05", "Tồn kho", "Mỗi cặp warehouse_id và variant_id chỉ có một inventory item.", "Từ chối 409; tải balance hiện hữu."),
        ("BR-INV-06", "Nhập hàng", "Phiếu DRAFT không đổi tồn; chỉ POSTED mới sinh movement RECEIPT.", "Giữ phiếu chưa post và nêu điều kiện thiếu."),
        ("BR-INV-07", "Chuyển kho", "TRANSFER phải có kho nguồn khác kho đích và đủ ATP ở nguồn.", "Không cho duyệt/post."),
        ("BR-INV-08", "Operation", "Operation POSTED là bất biến; thao tác sửa phải tạo operation bù.", "Từ chối mutation trên phiếu đã post."),
        ("BR-INV-09", "Operation", "Post operation, cập nhật balance và sinh movement phải cùng transaction và idempotent.", "Rollback toàn bộ; request lặp trả kết quả cũ."),
        ("BR-INV-10", "Chuyển kho", "TRANSFER_OUT và TRANSFER_IN dùng cùng operation/reference và phải cân bằng theo policy.", "Mở exception; không tự đóng operation."),
        ("BR-INV-11", "Kiểm kê", "Count lưu expected snapshot, actual, variance, người đếm và người duyệt.", "Không post khi thiếu bằng chứng/phê duyệt."),
        ("BR-INV-12", "Cảnh báo", "Một SKU/kho/loại cảnh báo chỉ có một alert mở; đóng khi ATP phục hồi hoặc owner xác nhận.", "Gộp cảnh báo lặp, cập nhật thời điểm gần nhất."),
        ("BR-PAY-01", "Thanh toán", "Webhook phải có chữ ký hợp lệ và provider event ID duy nhất.", "401 hoặc acknowledgement idempotent."),
        ("BR-PAY-02", "Thanh toán", "Amount/currency thành công phải khớp nghĩa vụ của order.", "Mở case đối soát, chưa xác nhận paid."),
        ("BR-PAY-03", "Thanh toán", "Tổng refund thành công không vượt tổng đã thu trừ refund trước.", "Từ chối phần vượt."),
        ("BR-PAY-04", "Thanh toán", "Payment/refund state chỉ tiến theo state machine, event cũ không lùi state.", "Lưu event và bỏ qua tác động."),
        ("BR-FUL-01", "Giao nhận", "Tổng fulfillment quantity mỗi order item không vượt lượng cần giao.", "Từ chối 409."),
        ("BR-FUL-02", "Giao nhận", "Tracking và carrier gắn với một fulfillment cụ thể.", "Không cập nhật mơ hồ theo order chung."),
        ("BR-FUL-03", "Giao nhận", "Delivered cần mốc thời gian; failed cần reason và hành động tiếp theo.", "Giữ case mở khi thiếu dữ liệu."),
        ("BR-FUL-04", "Giao nhận", "Hàng hoàn về chỉ tăng tồn sau khi kho xác nhận nhận và phân loại.", "Không hoàn kho theo trạng thái vận chuyển đơn thuần."),
        ("BR-RET-01", "Đổi trả", "Chỉ order item delivered, còn thời hạn và còn quantity đủ mới được yêu cầu.", "Từ chối kèm điều khoản policy."),
        ("BR-RET-02", "Đổi trả", "Mỗi case có reason, evidence, quantity và người ra quyết định.", "Không chuyển approved khi thiếu."),
        ("BR-RET-03", "Đổi trả", "Kho phân loại bán lại/lỗi/loại bỏ trước khi movement và refund cuối.", "Giữ trạng thái inspecting."),
        ("BR-RET-04", "Đổi trả", "Đổi SKU phụ thuộc tồn và xác nhận chênh lệch giá.", "Chuyển refund hoặc chờ xác nhận."),
        ("BR-RET-05", "Đổi trả", "Case chỉ đóng khi hàng, tồn, refund/exchange và thông báo đều có kết quả.", "Giữ pending action."),
        ("BR-SEC-01", "Phân quyền", "Mọi API ghi kiểm tra identity và RBAC phía server.", "401/403; không thay đổi dữ liệu."),
        ("BR-SEC-02", "Sở hữu", "Customer chỉ đọc/sửa tài nguyên thuộc subject hiện tại.", "403/404 để không lộ tồn tại."),
        ("BR-SEC-03", "Audit", "Thay đổi quyền, giá, tồn, order và promotion có actor/time/before-after.", "Không coi thao tác hoàn tất nếu thiếu audit bắt buộc."),
        ("BR-AI-01", "Copilot", "Copilot chỉ đọc read model và không gọi mutation.", "Từ chối yêu cầu ghi."),
        ("BR-AI-02", "Copilot", "Câu trả lời chỉ dùng intent/query được định nghĩa và lọc theo quyền.", "Không trả dữ liệu ngoài phạm vi."),
        ("BR-AI-03", "Copilot", "Kết quả nêu thời điểm dữ liệu, bằng chứng và mức tin cậy.", "Thông báo thiếu dữ liệu thay vì suy đoán."),
        ("BR-AI-04", "Copilot", "Hành động đề xuất cần người có quyền xác nhận ở màn hình nghiệp vụ.", "Không tự thực thi."),
    ]
    doc.add_heading("3.22.1 Catalog, giỏ, định giá, khuyến mãi, đơn hàng và tồn kho lõi", level=3)
    add_table(
        doc,
        ["Mã", "Nhóm", "Quy tắc", "Xử lý khi vi phạm"],
        business_rule_rows[:22],
        [0.95, 0.9, 3.25, 1.4],
        font_size=8.1,
    )
    doc.add_page_break()
    doc.add_heading("3.22.2 Inventory Operations nâng cao", level=3)
    add_table(
        doc,
        ["Mã", "Nhóm", "Quy tắc", "Xử lý khi vi phạm"],
        business_rule_rows[22:30],
        [0.95, 0.9, 3.25, 1.4],
        font_size=8.1,
    )
    add_callout(
        doc,
        "PHẠM VI THIẾT KẾ",
        "BR-INV-06 đến BR-INV-12 mô tả nghiệp vụ mở rộng. Mô hình hiện tại đã có balance, reservation và movement; operation nhập/chuyển/kiểm kê cần hai bảng đề xuất ở Chương 5.",
        "info",
    )
    doc.add_page_break()
    doc.add_heading("3.22.3 Thanh toán, giao nhận, đổi trả, bảo mật và Copilot", level=3)
    add_table(
        doc,
        ["Mã", "Nhóm", "Quy tắc", "Xử lý khi vi phạm"],
        business_rule_rows[30:],
        [0.95, 0.9, 3.25, 1.4],
        font_size=8.1,
    )

    doc.add_heading("3.23 Ngoại lệ nghiệp vụ và SLA đề xuất", level=2)
    add_callout(doc, "GIỚI HẠN", "Các mốc SLA dưới đây là mục tiêu thiết kế cho đồ án, chưa phải cam kết dịch vụ đã được đo trên production.", "warning")
    sla_rows = [
        ("Giá/tồn đổi tại checkout", "Checkout service", "Ngay trong request", "Trả tổng mới, yêu cầu xác nhận lại."),
        ("Payment webhook hợp lệ", "Payment service", "≤ 5 phút", "Cập nhật payment/order hoặc mở đối soát."),
        ("Đơn paid/COD mới", "Staff", "≤ 15 phút giờ vận hành", "Nhận owner hoặc vào hàng đợi ưu tiên."),
        ("Pick/pack đơn đủ hàng", "Kho", "≤ 24 giờ", "Ready-to-ship hoặc exception có reason."),
        ("Cấp tracking sau bàn giao", "Staff/Carrier", "≤ 2 giờ", "Tracking hiển thị cho khách."),
        ("Giao thất bại", "Staff/CSKH", "≤ 1 ngày", "Quyết định giao lại/hoàn về/hủy."),
        ("Yêu cầu hủy trước processing", "System", "Ngay lập tức", "Cancel, release reservation, notify."),
        ("Yêu cầu hủy khi processing", "Manager", "≤ 4 giờ", "Approve/reject có lý do."),
        ("Tiếp nhận yêu cầu đổi trả", "CSKH", "≤ 1 ngày làm việc", "Duyệt sơ bộ hoặc yêu cầu bổ sung."),
        ("Kiểm đếm hàng trả", "Kho", "≤ 2 ngày từ lúc nhận", "Biên bản và phân loại hàng."),
        ("Ra quyết định refund/exchange", "Manager", "≤ 1 ngày sau kiểm đếm", "Quyết định có bằng chứng."),
        ("Refund thành công", "Payment provider", "≤ 5-7 ngày làm việc", "Cập nhật kết quả hoặc case đối soát."),
        ("Post phiếu nhận hàng", "Kho/Manager", "≤ 4 giờ từ lúc kiểm nhận", "Balance, movement và biên nhận nhất quán."),
        ("Chuyển kho đang IN_TRANSIT", "Kho nguồn/đích", "Theo ETA; cảnh báo sau 24 giờ trễ", "Nhận đủ hoặc mở exception chênh lệch."),
        ("Hoàn tất phiên kiểm kê", "Kho/Manager", "≤ 1 ngày sau khi đếm", "Variance được duyệt và movement được post."),
        ("Tồn dưới safety stock", "System/Manager", "Tổng hợp hàng ngày", "Cảnh báo và owner xử lý."),
        ("Chênh lệch đối soát", "Tài chính/Manager", "≤ 2 ngày", "Phân loại, sửa mapping hoặc khiếu nại provider."),
        ("Sự cố mức nghiêm trọng", "DevOps/PM", "Phản hồi ≤ 30 phút", "Khoanh vùng, truyền thông và rollback khi cần."),
    ]
    add_table(doc, ["Ngoại lệ/sự kiện", "Owner", "SLA mục tiêu", "Kết quả bắt buộc"], sla_rows, [2.0, 1.2, 1.25, 2.05], font_size=7.8)

    doc.add_heading("3.24 Ma trận quyền nghiệp vụ", level=2)
    permission_rows = [
        ("Xem catalog công khai", "Có", "Có", "Có", "Có", "-"),
        ("Quản lý hồ sơ/địa chỉ cá nhân", "Của mình", "-", "-", "-", "Identity"),
        ("Tạo giỏ/đặt hàng", "Có", "Hỗ trợ", "Hỗ trợ", "Có", "Validate"),
        ("Xem/hủy đơn", "Của mình", "Theo policy", "Ngoại lệ", "Toàn quyền", "State guard"),
        ("Tạo/sửa catalog", "-", "-", "Có", "Có", "Audit"),
        ("Publish/ngừng bán", "-", "-", "Có", "Có", "Rule guard"),
        ("Điều chỉnh tồn", "-", "Có", "Có/override", "Có", "Movement/audit"),
        ("Xem/xuất tồn và movement", "-", "Theo kho", "Có", "Có", "Filter/RBAC"),
        ("Tạo phiếu nhập/chuyển/kiểm kê", "-", "Có", "Có", "Có", "DRAFT + validation"),
        ("Duyệt/post operation kho", "-", "Trong ngưỡng", "Có/override", "Có", "Approval/audit"),
        ("Tạo/sửa/vô hiệu hóa kho", "-", "-", "Có", "Có", "Dependency guard"),
        ("Chuyển trạng thái đơn", "-", "Có", "Ngoại lệ", "Có", "State guard"),
        ("Tạo fulfillment/tracking", "-", "Có", "Có", "Có", "Quantity guard"),
        ("Tạo promotion/coupon", "-", "-", "Có", "Có", "Validation/audit"),
        ("Duyệt đổi trả", "Gửi yêu cầu", "Sơ bộ", "Quyết định", "Có", "Policy guard"),
        ("Phê duyệt refund", "-", "-", "Có", "Có", "Payment guard"),
        ("Xem dashboard", "-", "Giới hạn", "Có", "Có", "Read model"),
        ("Dùng Copilot", "-", "Giới hạn", "Có", "Có", "Read-only"),
        ("Gán vai trò", "-", "-", "-", "Có", "Audit bắt buộc"),
        ("Xem audit log", "-", "-", "Theo phạm vi", "Có", "Retention/filter"),
    ]
    add_table(doc, ["Nghiệp vụ", "Customer", "Staff", "Manager", "Admin", "Kiểm soát hệ thống"], permission_rows, [1.8, 0.85, 0.85, 0.9, 0.75, 1.35], font_size=7.4)

    chapter(doc, 4, "PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG")
    doc.add_heading("4.1 Sơ đồ bối cảnh", level=2)
    add_figure(doc, diagrams["context"], "Hình 4.1. Bối cảnh hệ thống và các thành phần tương tác.")

    doc.add_heading("4.2 Kiến trúc logic", level=2)
    add_figure(doc, diagrams["architecture"], "Hình 4.2. Kiến trúc logic của hệ thống NÉT Commerce.")
    add_para(
        doc,
        "Storefront và backoffice cùng sử dụng các route handler theo miền nghiệp vụ. Worker xử lý request theo mô hình stateless; D1 lưu dữ liệu quan hệ; R2 lưu blob; migration và seed giúp tái lập môi trường. Thiết kế này giảm số dịch vụ phải vận hành nhưng vẫn giữ ranh giới module rõ.",
    )

    doc.add_heading("4.3 Thiết kế luồng thanh toán", level=2)
    add_figure(doc, diagrams["sequence"], "Hình 4.3. Sequence diagram cho luồng đặt hàng và thanh toán.", width=6.35)
    add_bullets(
        doc,
        [
            "Client gửi yêu cầu đặt hàng kèm khóa idempotency.",
            "Server kiểm tra giỏ, giá, voucher, địa chỉ và giữ tồn trước khi tạo đơn.",
            "Kết quả từ cổng thanh toán chỉ được ghi nhận sau khi xác minh sự kiện phía server.",
            "Khi thao tác lặp, hệ thống trả trạng thái hiện có thay vì tạo bản ghi trùng.",
        ],
    )

    doc.add_heading("4.4 Máy trạng thái đơn hàng", level=2)
    add_figure(doc, diagrams["order_state"], "Hình 4.4. Các trạng thái và chuyển đổi của đơn hàng.")
    add_table(
        doc,
        ["Chuyển trạng thái", "Điều kiện", "Kết quả"],
        [
            ("PENDING_PAYMENT → CONFIRMED", "Thanh toán hợp lệ hoặc xác nhận COD.", "Chốt giữ tồn và ghi lịch sử."),
            ("CONFIRMED → PROCESSING", "Nhân viên có quyền xử lý.", "Cập nhật mốc SLA và audit."),
            ("READY_TO_SHIP → SHIPPED", "Có thông tin giao hàng hợp lệ.", "Lưu tracking và gửi thông báo."),
            ("Bất kỳ → CANCELLED", "Thỏa chính sách theo trạng thái.", "Giải phóng tồn; hoàn tiền khi cần."),
        ],
        [2.15, 2.15, 2.2],
        font_size=8.9,
    )

    doc.add_heading("4.5 Thiết kế phân quyền và an toàn", level=2)
    add_table(
        doc,
        ["Vai trò", "Quyền chính", "Giới hạn"],
        [
            ("customer", "Hồ sơ và đơn của chính mình.", "Không truy cập backoffice."),
            ("staff", "Đơn, tồn, fulfillment và khách hàng.", "Không đổi cấu hình quản trị cao."),
            ("manager", "Catalog, khuyến mãi, báo cáo và Copilot.", "Không vượt quyền admin."),
            ("admin", "Toàn bộ chức năng.", "Thao tác quan trọng được audit."),
        ],
        [1.25, 3.1, 2.15],
        font_size=9.2,
    )
    add_bullets(
        doc,
        [
            "Mọi API ghi dữ liệu kiểm tra danh tính và vai trò ở phía server.",
            "Zod kiểm tra input; truy vấn dùng ORM hoặc tham số hóa.",
            "Production không lưu mật khẩu ứng dụng mà dùng danh tính do nền tảng chuyển tiếp.",
            "Copilot chỉ đọc và đề xuất; thay đổi nghiệp vụ cần người quản lý xác nhận.",
        ],
    )

    doc.add_heading("4.6 Phân rã hệ thống theo module", level=2)
    add_table(
        doc,
        ["Module", "Trách nhiệm", "Dữ liệu/API liên quan"],
        [
            ("Storefront", "Trang chủ, catalog, tìm kiếm, chi tiết sản phẩm và trạng thái giao diện.", "products, categories, variants; GET /api/products."),
            ("Identity & Account", "Nhận danh tính, đồng bộ hồ sơ, vai trò và địa chỉ.", "users, roles, user_roles, addresses; /api/account/profile."),
            ("Cart & Pricing", "Giỏ guest/member, số lượng, giá, phí giao hàng và voucher.", "carts, cart_items, promotions, coupons; /api/cart, /api/vouchers."),
            ("Order", "Tạo đơn, snapshot, máy trạng thái và lịch sử xử lý.", "customer_orders, order_items, order_status_history; /api/orders."),
            ("Inventory", "Tồn theo kho/SKU, giữ tồn, điều chỉnh và sổ cái.", "inventory_items, reservations, movements; /api/admin/inventory/adjust."),
            ("Payment & Fulfillment", "Sự kiện thanh toán, hoàn tiền, lô giao và tracking.", "payments, payment_events, refunds, fulfillments."),
            ("Admin Intelligence", "Chỉ số vận hành, hàng sắp hết, đơn tồn đọng và đề xuất có kiểm soát.", "Read model tổng hợp; /api/admin/metrics, /api/admin/ai."),
            ("Platform", "Healthcheck, object storage, outbox, audit và quan sát hệ thống.", "outbox_events, audit_logs, R2; /api/health, /api/assets."),
        ],
        [1.45, 3.05, 2.0],
        font_size=8.2,
    )

    doc.add_heading("4.7 Quy ước hợp đồng API", level=2)
    add_table(
        doc,
        ["Thành phần", "Quy ước áp dụng"],
        [
            ("Input", "Body và query được kiểm tra kiểu, miền giá trị, độ dài và trường bắt buộc trước khi vào nghiệp vụ."),
            ("Output", "Phản hồi thành công trả dữ liệu nhất quán; lỗi trả mã máy đọc được, thông điệp an toàn và correlation ID khi có."),
            ("Phân trang", "Danh sách lớn dùng cursor/limit; server giới hạn page size và trả mốc tiếp theo."),
            ("Idempotency", "Tạo đơn, webhook và điều chỉnh quan trọng phải chống thực thi lặp bằng khóa nghiệp vụ/sự kiện duy nhất."),
            ("Trạng thái HTTP", "400 sai dữ liệu; 401 chưa xác thực; 403 thiếu quyền; 404 không tồn tại; 409 xung đột; 500 lỗi ngoài dự kiến."),
            ("Phiên bản", "Thay đổi phá vỡ tương thích phải tạo phiên bản API hoặc có giai đoạn chuyển tiếp rõ ràng."),
        ],
        [1.55, 4.95],
        font_size=8.8,
    )

    doc.add_heading("4.8 Mô hình đe dọa và biện pháp kiểm soát", level=2)
    add_table(
        doc,
        ["Mối đe dọa", "Tác động", "Kiểm soát thiết kế"],
        [
            ("Giả mạo danh tính", "Truy cập hồ sơ/đơn của người khác.", "Tin cậy identity header chỉ từ nền tảng; kiểm tra phiên và subject phía server."),
            ("IDOR/vượt quyền", "Đọc hoặc sửa tài nguyên không thuộc sở hữu.", "Ràng buộc truy vấn theo user hiện tại; RBAC cho mọi route admin."),
            ("Sửa giá ở client", "Tạo đơn sai tổng tiền hoặc voucher.", "Server tải lại SKU, giá và điều kiện khuyến mãi rồi tự tính tổng."),
            ("Webhook lặp/giả", "Ghi nhận thanh toán hai lần.", "Xác minh chữ ký, event ID duy nhất, xử lý idempotent và lưu raw event tối thiểu."),
            ("Race tồn kho", "Bán vượt tồn khi nhiều đơn đồng thời.", "Giao dịch ngắn, kiểm tra available, reservation và unique constraint phù hợp."),
            ("Tệp tải lên độc hại", "Phát tán nội dung nguy hiểm hoặc chiếm storage.", "Giới hạn MIME/kích thước, tên khóa do server tạo, quyền upload riêng cho admin."),
            ("Lạm dụng Copilot", "Lộ dữ liệu hoặc hành động sai.", "Chỉ đọc, truy vấn định sẵn, lọc quyền, giới hạn input và yêu cầu xác nhận thủ công."),
            ("Rò rỉ bí mật", "Mất quyền truy cập cloud/database.", "Secret qua biến môi trường, không commit, xoay vòng và tách local/production."),
        ],
        [1.55, 1.75, 3.2],
        font_size=8.0,
    )

    doc.add_heading("4.9 Quan sát hệ thống và phục hồi lỗi", level=2)
    observability_points = [
        "Healthcheck tách trạng thái ứng dụng, D1 và R2 để phát hiện đúng dependency lỗi.",
        "Log có cấu trúc gồm thời gian, route, request/correlation ID, actor, latency và kết quả; không ghi token hay PII thô.",
        "Audit log lưu thao tác quản trị quan trọng; outbox giữ sự kiện cần phát lại khi tích hợp tạm thời gián đoạn.",
        "Retry chỉ áp dụng cho thao tác an toàn hoặc idempotent, có backoff và giới hạn số lần; lỗi nghiệp vụ không tự retry.",
        "Bản sao lưu, migration và quy trình restore phải được diễn tập trước khi coi là sẵn sàng vận hành.",
    ]
    for point in observability_points:
        paragraph = doc.add_paragraph(style="List Bullet")
        paragraph.paragraph_format.space_after = Pt(3)
        paragraph.paragraph_format.line_spacing = 1.05
        set_run_font(paragraph.add_run(point), size=10.5)

    add_landscape_figure(
        doc,
        "4.10 Luồng nghiệp vụ xử lý đơn đầu-cuối",
        diagrams["business_order_flow"],
        "Hình 4.5. Swimlane quy trình từ xác nhận giỏ đến giao hàng và hậu mãi.",
    )
    doc.add_heading("4.11 Trách nhiệm và điểm bàn giao trong xử lý đơn", level=2)
    add_table(
        doc,
        ["Chặng", "Chủ trì", "Điểm vào", "Điểm bàn giao/kiểm soát"],
        [
            ("Checkout", "Khách hàng + API", "Giỏ và địa chỉ", "Order snapshot, reservation và tổng server chốt."),
            ("Thanh toán", "Payment service", "Payment session/webhook", "Payment state và bằng chứng provider."),
            ("Duyệt đơn", "Staff", "Order confirmed", "Owner, SLA và exception nếu có."),
            ("Pick/pack", "Kho", "Reservation hợp lệ", "Số lượng thực tế và ready-to-ship."),
            ("Bàn giao", "Staff/Carrier", "Gói hàng hợp lệ", "Fulfillment, carrier, tracking và shipped_at."),
            ("Giao hàng", "Carrier/System", "Tracking active", "Delivered/failed/returned cùng thời điểm, reason."),
            ("Hậu mãi", "CSKH/Manager", "Đơn đã giao hoặc giao thất bại", "Hủy, đổi trả, refund hoặc đóng đơn."),
        ],
        [1.15, 1.35, 1.55, 2.45],
        font_size=8.2,
    )
    add_bullets(
        doc,
        [
            "Mỗi điểm bàn giao phải có owner mới trước khi owner cũ kết thúc trách nhiệm.",
            "Trạng thái giao diện không thay thế bằng chứng nghiệp vụ trong order history, payment event hoặc fulfillment.",
            "Ngoại lệ không được xử lý bằng cách sửa trực tiếp totals/balance; phải đi qua service và audit tương ứng.",
        ],
    )

    add_landscape_figure(
        doc,
        "4.12 Luồng nghiệp vụ đổi trả và hoàn tiền",
        diagrams["return_refund_flow"],
        "Hình 4.6. Quy trình hậu mãi từ yêu cầu đổi trả đến refund hoặc hàng thay thế.",
    )
    doc.add_heading("4.13 Hồ sơ nghiệp vụ và điểm kiểm soát hậu mãi", level=2)
    add_table(
        doc,
        ["Hồ sơ", "Dữ liệu tối thiểu", "Kiểm soát"],
        [
            ("Return request", "Order item, quantity, loại yêu cầu, lý do, bằng chứng, thời gian.", "Ownership, thời hạn, nhóm hàng và quantity còn lại."),
            ("Approval", "Người quyết định, quyết định, điều khoản policy, ghi chú.", "Không cho cùng người vừa kiểm đếm vừa override quyết định lớn khi có thể."),
            ("Receiving/inspection", "Mã nhận, ngày nhận, ảnh, tình trạng, phân loại hàng.", "Biên bản kho trước movement hoặc refund cuối."),
            ("Exchange", "SKU cũ/mới, chênh lệch, fulfillment thay thế.", "Tồn SKU mới và xác nhận chênh lệch giá."),
            ("Refund", "Amount, reason, provider reference, status, attempt.", "Không vượt số đã thu; idempotency và đối soát."),
            ("Closure", "Kết quả tài chính, tồn kho, thông báo và thời gian đóng.", "Chỉ đóng khi không còn pending action."),
        ],
        [1.25, 3.0, 2.25],
        font_size=8.2,
    )
    add_callout(
        doc,
        "PHẠM VI PHIÊN BẢN",
        "Schema đã có payments, refunds và fulfillment; quy trình đổi trả đầy đủ được đặc tả ở mức thiết kế mở rộng và chưa được tuyên bố là đã hoàn thiện trên giao diện hiện tại.",
        "info",
    )

    add_landscape_figure(
        doc,
        "5.1 ERD tổng quan",
        diagrams["erd_overview"],
        "Hình 5.1. ERD tổng quan 28 bảng theo các miền dữ liệu.",
        chapter_title="CHƯƠNG 5. THIẾT KẾ CƠ SỞ DỮ LIỆU",
    )
    doc.add_heading("5.2 Quy ước thiết kế dữ liệu", level=2)
    add_bullets(
        doc,
        [
            "Khóa chính ổn định; khóa ngoại bảo đảm quan hệ giữa user, variant, cart, order và promotion.",
            "Tiền lưu bằng số nguyên theo đơn vị nhỏ nhất để tránh sai số dấu phẩy động.",
            "Order item và promotion được snapshot để lịch sử không đổi khi catalog cập nhật.",
            "Payment event, order history, inventory movement, outbox và audit là append-only.",
            "Migration có thứ tự và được chạy tự động khi container khởi động.",
        ],
    )

    add_landscape_gallery(
        doc,
        [
            ("5.3 ERD danh mục và tồn kho", diagrams["erd_catalog"], "Hình 5.2. ERD chi tiết danh mục, biến thể, media và tồn kho."),
            ("5.4 ERD Inventory Operations mở rộng", diagrams["erd_inventory_ops"], "Hình 5.3. ERD Inventory Operations cho nhập hàng, chuyển kho và kiểm kê."),
            ("5.5 ERD đơn hàng, thanh toán và giao nhận", diagrams["erd_order"], "Hình 5.4. ERD chi tiết order, payment, refund và fulfillment."),
        ],
    )
    add_callout(
        doc,
        "RANH GIỚI PHẠM VI",
        "Bốn bảng warehouses, inventory_items, inventory_movements và inventory_reservations thuộc schema hiện tại. Hai bảng inventory_operations và inventory_operation_items là đề xuất mở rộng, được tô nền xanh nhạt trên sơ đồ.",
        "info",
    )
    doc.add_heading("5.4.1 Đối chiếu mô hình hiện tại và mô hình mở rộng", level=3)
    add_table(
        doc,
        ["Lớp dữ liệu", "Hiện tại", "Mở rộng có kiểm soát"],
        [
            ("Balance", "inventory_items giữ on-hand, reserved, safety stock và version.", "Giữ nguyên vai trò projection hiện tại; không cho UI sửa trực tiếp."),
            ("Ledger", "inventory_movements lưu delta, balance_after, reference, reason và idempotency.", "Tiếp tục là sổ cái; mỗi dòng operation POSTED sinh movement liên kết."),
            ("Reservation", "inventory_reservations giữ tồn theo order và thời hạn.", "Chuẩn hóa state/expiry và liên kết chặt với order/payment."),
            ("Chứng từ kho", "Chưa có aggregate cho phiếu nhiều dòng.", "Thêm operation + operation item cho receipt, transfer và count."),
        ],
        [1.25, 2.55, 2.7],
        font_size=8.2,
    )
    add_bullets(
        doc,
        [
            "Migration tạo hai bảng và chỉ mục trước, chưa đổi luồng điều chỉnh tồn hiện tại.",
            "API operation được triển khai sau service transaction/idempotency và test rollback nhiều dòng.",
            "UI được bật theo feature flag; sau UAT mới dùng operation làm đường chuẩn cho nhập/chuyển/kiểm kê.",
        ],
    )

    doc.add_heading("5.6 Các bất biến dữ liệu", level=2)
    add_table(
        doc,
        ["Bất biến", "Biểu diễn/kiểm soát"],
        [
            ("Tồn khả dụng", "available = on_hand - reserved - safety_stock; không âm ngoài thao tác được audit."),
            ("Tổng đơn", "grand_total = subtotal - discount_total + shipping_total + tax_total."),
            ("Giới hạn hoàn tiền", "Tổng refund thành công không vượt số tiền đã thu."),
            ("Tính duy nhất", "SKU, mã voucher và sự kiện provider có ràng buộc duy nhất."),
            ("Sở hữu dữ liệu", "Customer chỉ đọc hồ sơ, giỏ và đơn thuộc danh tính hiện tại."),
        ],
        [1.6, 4.9],
        font_size=9.0,
    )
    add_callout(
        doc,
        "TÀI LIỆU CHI TIẾT",
        "Mỗi bảng có một file data dictionary riêng trong docs/ba/data-dictionary; các file mô tả khóa, cột, ràng buộc, chỉ mục, CRUD và quy tắc bảo mật.",
        "info",
    )

    doc.add_heading("5.7 Phân tích quan hệ theo miền dữ liệu", level=2)
    add_table(
        doc,
        ["Miền", "Aggregate root", "Quan hệ quan trọng", "Lý do tách miền"],
        [
            ("Tài khoản", "users", "User 1-n address; user n-n role.", "Tách PII và phân quyền khỏi dữ liệu bán hàng."),
            ("Danh mục", "products", "Product n-n category; product 1-n variant/media.", "Một mẫu có nhiều SKU và nhiều cách phân loại."),
            ("Tồn kho", "inventory_items / inventory_operations", "Variant n-n warehouse; item 1-n movement/reservation; operation 1-n line.", "Tách balance hiện tại khỏi chứng từ nhập, chuyển, kiểm kê và lịch sử biến động."),
            ("Giỏ hàng", "carts", "Cart 1-n item; item tham chiếu variant.", "Dữ liệu tạm thời, có thể hết hạn và được định giá lại."),
            ("Đơn hàng", "customer_orders", "Order 1-n item/history/promotion/payment/fulfillment.", "Là hồ sơ giao dịch, phải lưu snapshot và bất biến."),
            ("Khuyến mãi", "promotions", "Promotion 1-n coupon; order n-n promotion.", "Quy tắc thay đổi theo thời gian nhưng lịch sử đơn không đổi."),
            ("Nền tảng", "outbox_events", "Audit/outbox tham chiếu logic tới actor/entity.", "Hỗ trợ truy vết và tích hợp mà không làm chặt coupling."),
        ],
        [1.05, 1.35, 2.45, 1.65],
        font_size=7.9,
    )

    doc.add_heading("5.8 Chỉ mục, ràng buộc và chiến lược migration", level=2)
    add_table(
        doc,
        ["Nhóm", "Thiết kế", "Mục tiêu"],
        [
            ("Khóa duy nhất", "user email/subject, category slug, product slug, SKU, coupon code, payment event ID.", "Chống trùng dữ liệu nghiệp vụ và xử lý lặp."),
            ("Chỉ mục tra cứu", "Product status/category; order user/status/created_at; inventory SKU/warehouse; audit actor/time.", "Giảm quét toàn bảng ở các màn hình chính."),
            ("Khóa ngoại", "Restrict với dữ liệu giao dịch; cascade có chọn lọc ở bảng nối hoặc dữ liệu tạm.", "Không xóa nhầm lịch sử đã phát sinh."),
            ("Check nghiệp vụ", "Số lượng và tiền không âm; enum trạng thái hợp lệ; khoảng thời gian promotion hợp lý.", "Đưa bất biến quan trọng xuống tầng dữ liệu."),
            ("Migration", "File tăng dần, chạy một lần, có bảng lịch sử và kiểm tra sau migration.", "Tái lập môi trường và tránh drift schema."),
            ("Rollback", "Ưu tiên forward-fix; migration phá hủy cần backup và kế hoạch phục hồi đã thử.", "Giảm rủi ro mất dữ liệu khi phát hành."),
        ],
        [1.35, 3.4, 1.75],
        font_size=8.2,
    )

    doc.add_heading("5.9 Ranh giới giao dịch và kiểm soát đồng thời", level=2)
    add_table(
        doc,
        ["Nghiệp vụ", "Trong cùng giao dịch", "Ngoài giao dịch/khôi phục"],
        [
            ("Tạo đơn", "Kiểm tra giỏ, tạo order/items, snapshot promotion, reservation và làm rỗng giỏ.", "Gửi thông báo qua outbox; thất bại thì không tạo nửa đơn."),
            ("Điều chỉnh tồn", "Cập nhật balance và ghi movement có cùng actor/reason.", "Nếu xung đột phiên bản, trả 409 để người dùng tải lại."),
            ("Post operation kho", "Khóa operation, cập nhật các balance và sinh movement cho mọi dòng.", "Một dòng lỗi rollback toàn phiếu; request lặp trả operation đã post."),
            ("Nhận payment event", "Ghi event duy nhất và cập nhật payment/order theo máy trạng thái.", "Event lặp trả thành công nhưng không ghi lại; event lỗi được điều tra."),
            ("Hủy đơn", "Đổi trạng thái, giải phóng reservation và ghi history.", "Hoàn tiền/notification là bước idempotent tiếp theo."),
            ("Áp voucher", "Đọc promotion/coupon hiện hành và tính lại totals trên server.", "Khi checkout phải kiểm tra lại để tránh dữ liệu cũ."),
        ],
        [1.35, 3.25, 1.9],
        font_size=8.2,
    )

    chapter(doc, 6, "CÀI ĐẶT HỆ THỐNG")
    doc.add_heading("6.1 Cấu trúc triển khai", level=2)
    add_para(
        doc,
        "Mã nguồn sản phẩm nằm trong thư mục platform. Giao diện, server component và API route được build chung bằng Vinext; Worker nhận request và truy cập D1/R2 qua binding. Cấu trúc này cho phép dùng một codebase nhưng vẫn phân tách theo route, component, thư viện nghiệp vụ và migration.",
    )

    doc.add_heading("6.2 Cài đặt frontend", level=2)
    add_table(
        doc,
        ["Phân hệ", "Chức năng đã cài đặt"],
        [
            ("Trang chủ/catalog", "Hiển thị bộ sưu tập, 22 mặt hàng, danh mục và sản phẩm mới."),
            ("Danh sách/chi tiết", "Lọc, tìm kiếm, thông tin sản phẩm, variant, giá và tồn."),
            ("Giỏ hàng", "Cập nhật số lượng, xóa, áp/bỏ voucher và hiển thị tổng tiền."),
            ("Đăng nhập/đăng ký", "Đăng nhập danh tính nền tảng và tạo hồ sơ thành viên."),
            ("Checkout/tài khoản", "Xác nhận đơn, địa chỉ, voucher và thông tin thành viên."),
            ("Backoffice", "Dashboard, catalog, bảng tồn theo kho/SKU, điều chỉnh tồn, đơn, khuyến mãi và AI Copilot."),
        ],
        [1.65, 4.85],
        font_size=9.1,
    )

    doc.add_heading("6.3 Cài đặt backend", level=2)
    add_table(
        doc,
        ["Nhóm API", "Xử lý chính"],
        [
            ("/api/products", "Truy vấn catalog, category, variant, media và tồn."),
            ("/api/cart", "Đọc/ghi giỏ và tính lại giá phía server."),
            ("/api/vouchers", "Áp/bỏ CHAONET, NET20, FREESHIP và kiểm tra điều kiện."),
            ("/api/orders", "Tạo đơn, snapshot dòng hàng/khuyến mãi và cập nhật lượt dùng."),
            ("/api/account/profile", "Đọc hoặc lưu hồ sơ gắn với danh tính hiện tại."),
            ("/api/admin/inventory/adjust", "Đã cài đặt: kiểm quyền, chống lặp, cập nhật balance và movement trong D1 batch."),
            ("/api/admin/inventory", "Thiết kế: tra cứu/lọc/xuất ATP theo kho và SKU."),
            ("/api/admin/inventory/movements", "Thiết kế: xem sổ cái append-only theo item, operation và thời gian."),
            ("/api/admin/warehouses", "Thiết kế: quản lý kho và kiểm tra dependency trước khi đổi trạng thái."),
            ("/api/admin/inventory/operations", "Thiết kế: tạo, duyệt và post receipt/transfer/count idempotent."),
            ("/api/admin/inventory/alerts", "Thiết kế: đọc, nhận xử lý và đóng cảnh báo tồn thấp."),
            ("/api/admin/ai", "Tổng hợp dữ liệu quản trị theo intent và quyền người gọi."),
            ("/api/health", "Kiểm tra trạng thái ứng dụng, database và storage."),
        ],
        [1.8, 4.7],
        font_size=9.0,
    )

    doc.add_heading("6.3.1 Hiện trạng triển khai Inventory", level=3)
    add_table(
        doc,
        ["Năng lực", "Hiện trạng", "Hướng hoàn thiện"],
        [
            ("Tồn theo kho/SKU", "Schema và màn hình quản trị đã có; hiển thị on-hand, reserved, safety stock, ATP.", "Bổ sung truy vấn server, bộ lọc, phân trang và export thực."),
            ("Điều chỉnh tồn", "API /api/admin/inventory/adjust đã có validation, RBAC, conflict guard, movement và idempotency.", "Bổ sung UI modal, optimistic locking rõ cho người dùng và audit before/after."),
            ("Giữ tồn", "inventory_reservations đã mô hình hóa vòng đời reservation.", "Hoàn thiện expiry worker và liên kết chắc với state đơn/payment."),
            ("Nhập/chuyển/kiểm kê", "Chưa có aggregate chứng từ chuyên biệt.", "Bổ sung 02 bảng operation, route và màn hình theo đặc tả FR-27..29."),
            ("Cảnh báo/Copilot", "Có dữ liệu safety stock và intent đọc tồn.", "Tạo alert có owner, chống trùng và đề xuất bổ sung theo lead time."),
        ],
        [1.35, 2.65, 2.5],
        font_size=8.2,
    )
    add_callout(
        doc,
        "NGUYÊN TẮC TRIỂN KHAI",
        "Không cập nhật trực tiếp inventory_items từ giao diện. Mọi mutation phải đi qua service có RBAC, idempotency, version check, transaction và movement append-only.",
        "success",
    )

    doc.add_heading("6.4 Voucher và tính tổng đơn", level=2)
    add_table(
        doc,
        ["Mã", "Điều kiện", "Kết quả"],
        [
            ("CHAONET", "Đơn từ 599.000đ.", "Giảm 10%, tối đa 150.000đ."),
            ("NET20", "Đơn từ 1.500.000đ.", "Giảm 20%, tối đa 300.000đ."),
            ("FREESHIP", "Đơn từ 399.000đ.", "Phí giao hàng bằng 0."),
        ],
        [1.35, 2.45, 2.7],
        font_size=9.2,
    )
    add_para(
        doc,
        "Voucher được áp dụng ở giỏ hàng để người dùng thấy kết quả ngay, nhưng API tạo đơn vẫn kiểm tra lại toàn bộ điều kiện. Nhờ đó, thay đổi dữ liệu client không thể làm sai tổng tiền lưu trong đơn.",
    )

    doc.add_heading("6.5 Đăng nhập và hồ sơ thành viên", level=2)
    add_para(
        doc,
        "Trên production, website nhận danh tính đã đăng nhập từ Sites Identity thay vì tự lưu mật khẩu. Sau khi đăng nhập, người dùng có thể tạo hồ sơ thành viên NÉT; API lưu hoặc cập nhật user và gán vai trò customer. Docker có bypass riêng cho local, chỉ hoạt động khi APP_ENV=local.",
    )

    doc.add_heading("6.6 NÉT AI Copilot cho quản trị", level=2)
    add_para(
        doc,
        "Copilot nhận câu hỏi tiếng Việt về doanh thu, đơn tồn đọng, hàng sắp hết, sản phẩm bán chạy và khuyến mãi. Bộ xử lý ánh xạ ý định, truy vấn dữ liệu tổng hợp trong D1 và trả nhận định, hành động đề xuất cùng mức tin cậy. Kết quả được grounded theo dữ liệu hiện có, không tự thực thi thay đổi và không được mô tả như một mô hình tạo sinh bên ngoài.",
    )
    add_table(
        doc,
        ["Câu hỏi mẫu", "Dữ liệu sử dụng", "Đầu ra"],
        [
            ("SKU nào sắp hết hàng?", "Inventory item, variant, product.", "Danh sách ưu tiên nhập bổ sung."),
            ("Đơn nào đang tồn đọng?", "Order status và thời gian cập nhật.", "Hàng đợi cần xử lý."),
            ("Doanh thu và sản phẩm nổi bật?", "Order và order item.", "Tóm tắt doanh thu/top sản phẩm."),
            ("Khuyến mãi nào đang hoạt động?", "Promotion, coupon và thời hạn.", "Mã đang dùng và cảnh báo."),
        ],
        [2.0, 2.25, 2.25],
        font_size=8.9,
    )

    doc.add_heading("6.7 Chi tiết tổ chức frontend", level=2)
    add_table(
        doc,
        ["Lớp", "Cách tổ chức", "Tiêu chí hoàn thành"],
        [
            ("Routing", "Route công khai cho catalog/sản phẩm; route tài khoản; route admin có guard quyền.", "URL có thể truy cập trực tiếp, reload không mất ngữ cảnh cần thiết."),
            ("Component", "Tách primitive dùng chung, khối nghiệp vụ và page composition; props có kiểu rõ ràng.", "Không lặp component chính, loading/empty/error được chuẩn hóa."),
            ("State", "State cục bộ cho UI; server là nguồn đúng của giá, tồn và đơn; cache được làm mới sau mutation.", "Không dùng dữ liệu client cũ để xác nhận giao dịch."),
            ("Form", "Schema validation, lỗi theo trường, trạng thái submit và chống bấm lặp.", "Bàn phím sử dụng được, focus chuyển tới lỗi đầu tiên."),
            ("Responsive", "Mobile-first; breakpoint theo nội dung; bảng admin có scroll hoặc layout thay thế.", "Không tràn ngang ở 360px; thao tác chính dễ chạm."),
            ("Accessibility", "Semantic HTML, nhãn form, alt text, focus visible, contrast và aria-live phù hợp.", "Các luồng chính dùng được bằng bàn phím và trình đọc màn hình cơ bản."),
            ("Performance", "Ảnh đúng kích thước, lazy-load dưới fold, giảm JS và tránh render lại không cần thiết.", "Trang catalog/chi tiết ổn định trên thiết bị phổ thông."),
        ],
        [1.15, 3.1, 2.25],
        font_size=8.2,
    )

    doc.add_heading("6.8 Chu trình xử lý backend", level=2)
    add_numbered(
        doc,
        [
            "Nhận request, tạo correlation ID và xác định route/method.",
            "Đọc danh tính đáng tin cậy từ môi trường; từ chối khi thiếu xác thực hoặc quyền.",
            "Parse và kiểm tra input bằng schema; chuẩn hóa mã, số lượng, tiền và pagination.",
            "Gọi service nghiệp vụ; service tự tính lại giá, tồn, voucher và chuyển trạng thái.",
            "Thực hiện repository/query trong ranh giới giao dịch ngắn; ghi audit/outbox khi cần.",
            "Ánh xạ kết quả sang HTTP status và response an toàn; không trả stack trace hoặc bí mật.",
            "Ghi metrics/log theo kết quả và latency; lỗi ngoài dự kiến được theo dõi bằng correlation ID.",
        ],
    )
    add_callout(
        doc,
        "NGUYÊN TẮC TIN CẬY",
        "Frontend tối ưu trải nghiệm, nhưng backend luôn là nguồn quyết định cuối cùng đối với quyền truy cập, giá, khuyến mãi, tồn kho và trạng thái đơn hàng.",
        "warning",
    )

    doc.add_heading("6.9 Docker và triển khai", level=2)
    add_numbered(
        doc,
        [
            "Sao chép .env.example thành .env và chỉ dùng LOCAL_AUTH_BYPASS ở local.",
            "Chạy docker compose up --build -d để build image, migration D1 và khởi động Worker.",
            "Dùng docker compose ps và /api/health để xác nhận container, database và storage.",
            "Chạy typecheck, lint, test và build trước khi lưu phiên bản triển khai.",
            "Phát hành phiên bản đã kiểm chứng lên Sites hosting ở chế độ truy cập riêng tư.",
        ],
    )
    add_table(
        doc,
        ["Lệnh kiểm tra tại thư mục platform", "Mục đích/kết quả mong đợi"],
        [
            ("Copy-Item .env.example .env", "Tạo cấu hình local; thay email demo và webhook secret khi cần."),
            ("docker compose up --build -d", "Build image và khởi động dịch vụ ở chế độ nền."),
            ("docker compose ps", "Dịch vụ ở trạng thái running/healthy, không restart liên tục."),
            ("Invoke-RestMethod http://localhost:8787/api/health", "Nhận app=ok, database=ok và storage=ok."),
            ("docker compose logs --tail 100", "Không có migration error, binding error hoặc exception lặp."),
            ("docker compose down", "Dừng môi trường local sau khi kiểm thử; volume chỉ xóa khi có chủ đích."),
        ],
        [2.75, 3.75],
        font_size=8.4,
    )
    add_table(
        doc,
        ["Biến môi trường", "Ý nghĩa", "Quy tắc"],
        [
            ("APP_ENV", "Phân biệt local và production.", "LOCAL_AUTH_BYPASS chỉ được phép khi local."),
            ("LOCAL_AUTH_EMAIL", "Danh tính demo cho local.", "Không dùng làm tài khoản production."),
            ("ADMIN_EMAILS / MANAGER_EMAILS", "Danh sách bootstrap vai trò.", "Giới hạn người nhận và rà soát trước phát hành."),
            ("PAYMENT_WEBHOOK_SECRET", "Xác minh sự kiện provider.", "Không commit; thay giá trị mẫu trước tích hợp."),
            ("PUBLIC_ASSET_ORIGIN", "Origin phục vụ media.", "Khớp host hiện tại và không chứa đường dẫn nhạy cảm."),
        ],
        [1.75, 2.2, 2.55],
        font_size=8.2,
    )

    chapter(doc, 7, "KIỂM THỬ VÀ ĐÁNH GIÁ")
    doc.add_heading("7.1 Chiến lược kiểm thử", level=2)
    add_table(
        doc,
        ["Mức", "Mục tiêu", "Công cụ/bằng chứng"],
        [
            ("Static", "Phát hiện lỗi kiểu và quy tắc mã nguồn.", "TypeScript, Oxlint."),
            ("Unit", "Kiểm tra catalog và quy tắc voucher.", "Vitest."),
            ("API/integration", "Kiểm tra profile, voucher, order và AI.", "HTTP request trên Docker local."),
            ("Build", "Bảo đảm mã nguồn tạo được artifact chạy.", "Vinext build."),
            ("System", "Kiểm tra route và dependency trong container.", "Docker healthcheck, D1/R2 local."),
        ],
        [1.3, 3.0, 2.2],
        font_size=9.1,
    )

    doc.add_heading("7.2 Kết quả kiểm thử", level=2)
    add_table(
        doc,
        ["Hạng mục", "Kết quả", "Trạng thái"],
        [
            ("Typecheck", "Không phát hiện lỗi TypeScript.", "Đạt"),
            ("Lint", "Không phát hiện lỗi quy tắc mã nguồn.", "Đạt"),
            ("Unit test", "03 file kiểm thử, 09/09 test pass.", "Đạt"),
            ("Build", "Vinext build hoàn tất thành công.", "Đạt"),
            ("Docker", "Container healthy; database=ok; storage=ok.", "Đạt"),
            ("HTTP routes", "Catalog và /admin/ai trả HTTP 200.", "Đạt"),
            ("Voucher/order", "Mức giảm và tổng đơn đúng theo kịch bản.", "Đạt"),
            ("Account/AI", "Lưu hồ sơ và truy vấn tồn kho hoạt động.", "Đạt"),
        ],
        [1.65, 3.65, 1.2],
        font_size=9.0,
    )

    doc.add_heading("7.3 Kịch bản nghiệp vụ tiêu biểu", level=2)
    add_table(
        doc,
        ["Mã", "Kịch bản", "Kết quả mong đợi"],
        [
            ("TC01", "Giỏ 750.000đ áp CHAONET.", "Giảm 75.000đ; phí 35.000đ; tổng 710.000đ."),
            ("TC02", "Giỏ đủ điều kiện FREESHIP.", "Phí giao hàng bằng 0."),
            ("TC03", "Đơn đủ điều kiện NET20.", "Giảm 20% nhưng không quá 300.000đ."),
            ("TC04", "Tạo đơn với voucher hợp lệ.", "Order và order_promotions cùng tổng đã kiểm tra."),
            ("TC05", "Quản lý hỏi SKU sắp hết.", "Copilot trả dữ liệu grounded và gợi ý nhập."),
        ],
        [0.8, 2.75, 2.95],
        font_size=8.9,
    )

    doc.add_heading("7.4 Danh mục kiểm thử nghiệp vụ chi tiết", level=2)
    detailed_tests = [
        ("TC-001", "FR-01", "Mở catalog có dữ liệu", "Hiển thị sản phẩm active, giá và ảnh; HTTP 200."),
        ("TC-002", "FR-02", "Lọc theo danh mục/từ khóa", "Kết quả đúng điều kiện, trạng thái bộ lọc được giữ."),
        ("TC-003", "FR-03", "Mở sản phẩm theo slug", "Đúng variant, media, giá và thông tin tồn."),
        ("TC-004", "FR-04", "Thêm SKU hợp lệ vào giỏ", "Tạo/cập nhật item và tổng tạm tính đúng."),
        ("TC-005", "FR-04", "Số lượng vượt tồn", "API từ chối có thông báo rõ; dữ liệu không đổi."),
        ("TC-006", "FR-05", "Áp CHAONET đủ điều kiện", "Giảm 10%, không vượt trần và tổng đúng."),
        ("TC-007", "FR-05", "Áp voucher hết hạn", "Trả lỗi nghiệp vụ; giỏ không lưu mã."),
        ("TC-008", "FR-08", "Tạo đơn từ giỏ hợp lệ", "Tạo order/items/snapshot/reservation atomically."),
        ("TC-009", "FR-08", "Gửi tạo đơn lặp", "Không tạo hai giao dịch cùng idempotency key."),
        ("TC-010", "FR-10", "Xem đơn của chính mình", "Trả đúng đơn và lịch sử trạng thái."),
        ("TC-011", "NFR-02", "Đọc đơn của user khác", "Trả 403/404; không lộ dữ liệu."),
        ("TC-012", "FR-07", "Lưu hồ sơ thành viên", "Upsert user, gán customer và trả hồ sơ mới."),
        ("TC-013", "FR-11", "Admin tạo/cập nhật sản phẩm", "Validation đạt, audit có actor/entity."),
        ("TC-014", "FR-12", "Điều chỉnh tồn có reason", "Balance và movement thay đổi trong một giao dịch."),
        ("TC-015", "FR-13", "Chuyển đơn sai trạng thái", "Trả 409; state/history không đổi."),
        ("TC-016", "FR-14", "Webhook payment lặp", "Event chỉ xử lý một lần, order không nhảy trạng thái lặp."),
        ("TC-017", "FR-18", "Copilot hỏi SKU sắp hết", "Trả dữ liệu grounded, mức tin cậy và đề xuất chỉ đọc."),
        ("TC-018", "NFR-03", "Input chứa script/SQL bất thường", "Bị escape/từ chối; không thực thi ngoài ý muốn."),
        ("TC-019", "NFR-05", "Dependency database lỗi", "Healthcheck báo database=error và log có correlation."),
        ("TC-020", "NFR-07", "Khởi tạo Docker sạch", "Migration/seed chạy, container healthy và route chính phản hồi."),
        ("TC-021", "FR-19", "Hủy đơn trước processing", "Đơn cancelled; reservation release đúng một lần; history có reason."),
        ("TC-022", "FR-20", "Tạo fulfillment giao một phần", "Tổng quantity không vượt order item; tracking gắn đúng lô."),
        ("TC-023", "FR-21", "Gửi đổi trả quá thời hạn", "Từ chối có policy/reason; không tạo refund hoặc movement."),
        ("TC-024", "FR-22", "Refund vượt số tiền đã thu", "API từ chối; tổng refund thành công không đổi."),
        ("TC-025", "FR-24", "Payment amount lệch order", "Không xác nhận paid; tạo case đối soát có owner."),
        ("TC-026", "FR-23", "Staff gọi thao tác chỉ dành cho admin", "Trả 403; audit/security log không chứa secret."),
        ("TC-027", "FR-25", "Lọc tồn theo kho, SKU và ATP thấp rồi xuất file", "Danh sách và file xuất cùng điều kiện; ATP đúng công thức."),
        ("TC-028", "FR-26", "Vô hiệu hóa kho còn reservation mở", "Trả 409; kho vẫn active và nêu dependency cản trở."),
        ("TC-029", "FR-27", "Post phiếu nhận hàng hai lần cùng idempotency key", "Tồn chỉ tăng một lần; trả operation và movement đã tạo."),
        ("TC-030", "FR-28", "Một dòng chuyển kho bị xung đột version", "Rollback toàn phiếu; hai kho và mọi movement không đổi."),
        ("TC-031", "FR-29", "Post kiểm kê chênh lệch lớn thiếu manager duyệt", "Giữ REVIEW; không đổi balance và không sinh movement."),
        ("TC-032", "FR-30", "Job cảnh báo chạy lặp khi SKU vẫn dưới safety stock", "Chỉ một alert mở; cập nhật last_seen, không tạo bản sao."),
    ]
    detailed_test_rows = [(*row, "Hiện tại" if int(row[0].split("-")[1]) <= 20 else "Mở rộng") for row in detailed_tests]
    doc.add_heading("7.4.1 Bộ nghiệm thu phạm vi hiện tại", level=3)
    add_table(
        doc,
        ["Mã", "Yêu cầu", "Điều kiện/kịch bản", "Kết quả mong đợi", "Phạm vi"],
        detailed_test_rows[:20],
        [0.65, 0.75, 1.9, 2.4, 0.8],
        font_size=7.6,
    )
    doc.add_heading("7.4.2 Bộ kiểm thử cho thiết kế mở rộng", level=3)
    add_table(
        doc,
        ["Mã", "Yêu cầu", "Điều kiện/kịch bản", "Kết quả mong đợi", "Phạm vi"],
        detailed_test_rows[20:],
        [0.65, 0.75, 1.9, 2.4, 0.8],
        font_size=7.8,
    )

    doc.add_heading("7.5 Đánh giá và hạn chế", level=2)
    add_para(
        doc,
        "Kết quả cho thấy hệ thống đạt mục tiêu cốt lõi: đủ luồng người dùng và quản trị, dữ liệu được kiểm soát phía server, môi trường chạy có thể tái lập và phiên bản có thể triển khai. Điểm mạnh là phạm vi chức năng tương đối hoàn chỉnh so với thời gian tám tuần và có tài liệu phân tích, thiết kế đi kèm.",
    )
    add_bullets(
        doc,
        [
            "Chưa kiểm thử tải quy mô lớn và chaos testing trên production.",
            "Thanh toán/vận chuyển thật mới ở mức thiết kế tích hợp.",
            "Khảo sát người dùng và usability test chưa thực hiện ngoài thực địa.",
            "Copilot có phạm vi ý định giới hạn, chưa dùng mô hình ngôn ngữ tạo sinh.",
            "Nhập hàng, chuyển kho và kiểm kê đã có đặc tả, ERD và test design nhưng chưa được tuyên bố là đã cài đặt.",
        ],
    )

    doc.add_heading("7.6 Tiêu chí nghiệm thu", level=2)
    add_table(
        doc,
        ["Cổng chất lượng", "Điều kiện đạt", "Bằng chứng"],
        [
            ("Yêu cầu", "100% must-have có mã, tiêu chí chấp nhận và test liên kết.", "Danh mục FR/NFR và RTM phụ lục D."),
            ("Mã nguồn", "Typecheck, lint và unit test không có lỗi chặn phát hành.", "Log pipeline và báo cáo kiểm thử."),
            ("Nghiệp vụ", "Catalog, giỏ, voucher, tài khoản, đặt hàng và admin chạy end-to-end.", "Kịch bản TC-001 đến TC-020."),
            ("Bảo mật", "Route ghi có auth/RBAC/validation; không lộ secret hoặc PII trong log.", "Review API, threat model và negative tests."),
            ("Triển khai", "Môi trường mới khởi tạo được từ hướng dẫn và healthcheck đạt.", "Docker compose, migration, /api/health."),
            ("Tài liệu", "Mục lục, hình, bảng, data dictionary và hướng dẫn chạy khớp phiên bản.", "Báo cáo và thư mục docs."),
        ],
        [1.35, 3.35, 1.8],
        font_size=8.4,
    )

    chapter(doc, 8, "QUẢN LÝ VÀ TIẾN ĐỘ ĐỒ ÁN")
    add_para(
        doc,
        "Kế hoạch được giới hạn trong 08 tuần với đúng 05 vai trò: PM, Frontend, Backend 1, Backend 2 và DevOps. Inventory Operations được giao chủ yếu cho Backend 2 và Frontend; PM kiểm soát phạm vi/nghiệm thu, Backend 1 phối hợp order-reservation và DevOps chịu migration, lịch chạy cảnh báo cùng khả năng phục hồi.",
    )
    add_table(
        doc,
        ["Nguyên tắc", "Áp dụng"],
        [
            ("Ưu tiên", "Hoàn tất luồng mua và tồn lõi trước; receipt/transfer/count triển khai theo lát cắt có thể nghiệm thu."),
            ("Sở hữu", "Mỗi đầu việc có một owner chính, đầu ra, phụ thuộc và Definition of Done."),
            ("Kiểm soát", "Review hằng tuần, demo cuối sprint, RTM và quality gate trước phát hành."),
        ],
        [1.35, 5.15],
        font_size=8.8,
    )

    add_landscape_figure(
        doc,
        "8.1 Tiến độ tám tuần",
        diagrams["timeline"],
        "Hình 8.1. Timeline thực hiện cho PM, Frontend, hai Backend và DevOps.",
    )
    doc.add_heading("8.2 Phân công nhóm", level=2)
    add_table(
        doc,
        ["Vai trò", "Trách nhiệm trong đồ án", "Sản phẩm bàn giao"],
        [
            ("PM", "Phạm vi, yêu cầu, tiến độ, rủi ro, UAT.", "Báo cáo, backlog, timeline, biên bản kiểm thử."),
            ("Frontend", "Storefront/admin UI, responsive, accessibility.", "Trang người dùng và quản trị."),
            ("Backend 1", "Catalog, account, cart, pricing, order.", "API và quy tắc nghiệp vụ chính."),
            ("Backend 2", "Inventory, voucher, payment/fulfillment model.", "API tích hợp và dữ liệu giao dịch."),
            ("DevOps", "CI/CD, Docker, migration, observability, deploy.", "Môi trường chạy và bằng chứng chất lượng."),
        ],
        [1.2, 3.0, 2.3],
        font_size=8.9,
    )

    doc.add_heading("8.3 Các mốc thực hiện", level=2)
    add_table(
        doc,
        ["Giai đoạn", "Tuần", "Kết quả"],
        [
            ("Khởi tạo", "1-2", "Chốt đề tài, yêu cầu, kiến trúc, môi trường và catalog cơ bản."),
            ("Luồng mua sắm", "3-4", "Danh sách, chi tiết, giỏ, tài khoản và admin nền tảng."),
            ("Luồng giao dịch", "5-6", "Voucher, checkout, order, tồn kho và quản trị."),
            ("Hoàn thiện", "7-8", "AI Copilot, kiểm thử, Docker, tài liệu và triển khai."),
        ],
        [1.5, 1.0, 4.0],
        font_size=9.1,
    )

    doc.add_heading("8.4 Quản lý rủi ro", level=2)
    add_table(
        doc,
        ["Rủi ro", "Ảnh hưởng", "Biện pháp"],
        [
            ("Phạm vi vượt tám tuần", "Trễ tiến độ, thiếu kiểm thử.", "Ưu tiên must-have, đóng băng tính năng sớm."),
            ("Thiếu QA chuyên trách", "Lỗi tích hợp phát hiện muộn.", "Cross-review và tự động hóa quality gate."),
            ("Xung đột giỏ/tồn", "Sai tổng tiền hoặc oversell.", "Revalidate server-side, test đồng thời."),
            ("Phụ thuộc cloud", "Khó tái lập hoặc demo.", "Docker local, migration và seed."),
            ("Dữ liệu nghiên cứu mô phỏng", "Kết luận chưa có tính thực nghiệm.", "Ghi rõ giới hạn và đề xuất khảo sát thật."),
        ],
        [2.0, 2.0, 2.5],
        font_size=8.8,
    )

    doc.add_heading("8.5 Kế hoạch theo sprint và định nghĩa hoàn thành", level=2)
    add_table(
        doc,
        ["Sprint", "Mục tiêu", "Sản phẩm tăng trưởng", "Definition of Done"],
        [
            ("Sprint 1\nTuần 1-2", "Nền tảng và yêu cầu", "Vision/FR-NFR, design system, identity, schema lõi, CI/Docker skeleton.", "Review yêu cầu; route khung chạy; migration đầu tiên và pipeline đạt."),
            ("Sprint 2\nTuần 3-4", "Luồng khám phá và giỏ", "Catalog, tìm kiếm/lọc, PDP, cart API/UI, hồ sơ cơ bản.", "Responsive; unit test catalog/cart; demo được luồng chọn hàng."),
            ("Sprint 3\nTuần 5-6", "Luồng giao dịch và quản trị", "Voucher, checkout/order, tồn kho, admin catalog/order.", "Server revalidate; audit/history; test integration luồng đặt hàng."),
            ("Sprint 4\nTuần 7-8", "Ổn định và nghiệm thu", "Copilot, observability, regression, tài liệu, triển khai.", "Quality gate đạt; Docker healthy; UAT ký nhận; báo cáo khớp phiên bản."),
        ],
        [1.05, 1.55, 2.25, 1.65],
        font_size=8.1,
    )

    doc.add_heading("8.6 Ma trận RACI theo nhóm năm người", level=2)
    add_table(
        doc,
        ["Hạng mục", "PM", "Frontend", "Backend 1", "Backend 2", "DevOps"],
        [
            ("Phạm vi/yêu cầu", "A/R", "C", "C", "C", "I"),
            ("UX và design system", "A", "R", "C", "I", "I"),
            ("Catalog/cart/account", "A", "C", "R", "C", "I"),
            ("Order/inventory/promotion", "A", "C", "C", "R", "I"),
            ("Admin và Copilot", "A", "R", "C", "R", "I"),
            ("Database/migration", "I", "I", "R", "R", "A/C"),
            ("CI/CD/Docker/deploy", "I", "C", "C", "C", "A/R"),
            ("Kiểm thử tích hợp/UAT", "A/R", "R", "R", "R", "C"),
            ("Báo cáo và nghiệm thu", "A/R", "C", "C", "C", "C"),
        ],
        [1.9, 0.75, 0.9, 0.95, 0.95, 0.95],
        font_size=8.0,
    )
    add_para(doc, "Quy ước: R - thực hiện; A - chịu trách nhiệm cuối cùng; C - tham vấn; I - được thông báo.", italic=True)

    doc.add_heading("8.7 Cơ chế phối hợp và kiểm soát thay đổi", level=2)
    add_bullets(
        doc,
        [
            "Daily 15 phút tập trung vào kết quả hôm trước, kế hoạch hôm nay và trở ngại; PM cập nhật RAID trong ngày.",
            "Planning đầu sprint chốt mục tiêu, capacity và tiêu chí chấp nhận; backlog refinement thực hiện giữa sprint.",
            "Pull request cần ít nhất một người review; thay đổi schema hoặc hợp đồng API phải có đại diện cả hai phía liên quan.",
            "Yêu cầu mới được ghi change request, đánh giá ảnh hưởng phạm vi-thời gian-chất lượng rồi mới đưa vào sprint.",
            "Demo cuối sprint dùng môi trường tích hợp; retrospective ghi hành động cải tiến có người phụ trách và hạn xử lý.",
            "Tuần 8 đóng băng tính năng, chỉ nhận lỗi nghiệm thu; phiên bản phát hành gắn tag và checklist rollback.",
        ],
    )

    chapter(doc, 9, "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")
    doc.add_heading("9.1 Kết quả đạt được", level=2)
    add_bullets(
        doc,
        [
            "Hoàn thiện website gồm storefront, tài khoản, giỏ hàng, voucher, checkout và backoffice.",
            "Xây dựng backend theo miền, kiểm soát dữ liệu phía server và phân quyền bốn vai trò.",
            "Thiết kế ERD, sequence, state diagram và tài liệu chi tiết cho từng bảng.",
            "Bổ sung trợ lý quản trị dựa trên dữ liệu vận hành, chỉ đọc và đề xuất.",
            "Đóng gói Docker, kiểm thử tự động và triển khai website hoạt động.",
        ],
    )

    doc.add_heading("9.2 Mức độ hoàn thành mục tiêu", level=2)
    add_table(
        doc,
        ["Mục tiêu", "Mức độ", "Minh chứng"],
        [
            ("Storefront responsive", "Hoàn thành", "22 sản phẩm và đầy đủ luồng mua."),
            ("Backend và dữ liệu", "Hoàn thành", "API, D1, Drizzle migration, healthcheck."),
            ("Quản trị nhiều vai trò", "Hoàn thành", "Staff, manager, admin và kiểm tra quyền."),
            ("Voucher/tài khoản", "Hoàn thành", "Ba mã demo, profile và order."),
            ("AI quản trị", "Trong phạm vi", "Intent giới hạn, dữ liệu grounded, không tự ghi."),
            ("Triển khai/kiểm thử", "Hoàn thành", "9/9 test, build pass, Docker healthy."),
        ],
        [2.15, 1.35, 3.0],
        font_size=8.9,
    )

    doc.add_heading("9.3 Hạn chế", level=2)
    add_para(
        doc,
        "Đồ án chưa thay dữ liệu khảo sát mô phỏng bằng nghiên cứu thực địa; chưa tích hợp giao dịch tiền thật; chưa kiểm thử hiệu năng ở tải lớn; một số chức năng nâng cao như đổi trả tự phục vụ, gợi ý phối đồ và tối ưu đa kho chưa được triển khai.",
    )

    doc.add_heading("9.4 Hướng phát triển", level=2)
    add_numbered(
        doc,
        [
            "Khảo sát và usability test với người dùng thật, sau đó điều chỉnh UX theo dữ liệu.",
            "Tích hợp payment và shipping sandbox/production, bổ sung reconcile và ngoại lệ.",
            "Mở rộng Copilot bằng mô hình ngôn ngữ có guardrail, log nguồn và phê duyệt.",
            "Bổ sung đổi trả, đánh giá sản phẩm, wishlist, recommendation và loyalty.",
            "Thực hiện load test, security test, backup/restore drill và giám sát production.",
        ],
    )
    add_callout(
        doc,
        "KẾT LUẬN CHUNG",
        "Đồ án đã chuyển hóa một bài toán bán hàng thời trang thành sản phẩm phần mềm có thể chạy, kiểm thử và triển khai; đồng thời thể hiện đầy đủ chu trình từ yêu cầu, mô hình hóa, cài đặt đến đánh giá.",
        "success",
    )

    chapter(doc, "A", "PHỤ LỤC - DANH MỤC BẢNG DỮ LIỆU HIỆN TẠI VÀ MỞ RỘNG")
    doc.add_heading("A.1 Danh mục 28 bảng trong schema hiện tại", level=2)
    table_rows = [
        ("Tài khoản", "users", "Danh tính khách/nhân viên", "PII"),
        ("Tài khoản", "addresses", "Sổ địa chỉ", "PII"),
        ("Tài khoản", "roles", "Vai trò/permissions", "Nội bộ"),
        ("Tài khoản", "user_roles", "Gán user-role", "Nhạy cảm"),
        ("Danh mục", "categories", "Cây danh mục", "Công khai"),
        ("Danh mục", "products", "Sản phẩm cấp mẫu", "Công khai"),
        ("Danh mục", "product_categories", "Nối product-category", "Nội bộ"),
        ("Danh mục", "product_variants", "SKU size/màu/giá", "Nội bộ/Công khai"),
        ("Danh mục", "product_media", "Ảnh/video metadata", "Công khai"),
        ("Tồn kho", "warehouses", "Kho logic/vật lý", "Nội bộ"),
        ("Tồn kho", "inventory_items", "Balance theo kho/SKU", "Nhạy cảm"),
        ("Tồn kho", "inventory_movements", "Sổ cái biến động", "Nhạy cảm"),
        ("Tồn kho", "inventory_reservations", "Tồn giữ cho order", "Nhạy cảm"),
        ("Giỏ hàng", "carts", "Giỏ guest/member", "PII nhẹ"),
        ("Giỏ hàng", "cart_items", "SKU/quantity trong giỏ", "Nội bộ"),
        ("Đơn hàng", "customer_orders", "Header, snapshot, totals", "PII/Tài chính"),
        ("Đơn hàng", "order_items", "Snapshot dòng hàng", "Tài chính"),
        ("Đơn hàng", "order_status_history", "Lịch sử trạng thái", "Nhạy cảm"),
        ("Thanh toán", "payments", "Lần thanh toán", "Tài chính"),
        ("Thanh toán", "payment_events", "Sự kiện webhook", "Nhạy cảm"),
        ("Thanh toán", "refunds", "Yêu cầu/kết quả hoàn tiền", "Tài chính"),
        ("Giao nhận", "fulfillments", "Lô giao/tracking", "PII/Nội bộ"),
        ("Giao nhận", "fulfillment_items", "Phân bổ dòng hàng", "Nội bộ"),
        ("Khuyến mãi", "promotions", "Điều kiện/quyền lợi", "Nội bộ"),
        ("Khuyến mãi", "coupons", "Mã và lượt dùng", "Nội bộ"),
        ("Khuyến mãi", "order_promotions", "Snapshot giảm giá", "Tài chính"),
        ("Nền tảng", "outbox_events", "Sự kiện bất đồng bộ", "Nội bộ"),
        ("Nền tảng", "audit_logs", "Nhật ký thao tác", "Rất nhạy cảm"),
    ]
    add_table(doc, ["Miền", "Bảng", "Mục đích", "Phân loại"], table_rows, [1.05, 1.75, 2.65, 1.05], font_size=8.2)
    add_para(
        doc,
        "Data dictionary chi tiết cho từng bảng được tách thành từng file trong docs/ba/data-dictionary. Phụ lục này đóng vai trò chỉ mục để tránh lặp toàn bộ định nghĩa cột trong báo cáo chính.",
        italic=True,
    )
    doc.add_heading("A.2 Hai bảng Inventory Operations đề xuất", level=2)
    add_table(
        doc,
        ["Miền", "Bảng", "Mục đích", "Trạng thái"],
        [
            ("Tồn kho", "inventory_operations", "Header chứng từ receipt/transfer/count, trạng thái, kho nguồn/đích, actor và idempotency.", "Thiết kế mở rộng"),
            ("Tồn kho", "inventory_operation_items", "Dòng SKU, expected/actual/delta và liên kết inventory item của một operation.", "Thiết kế mở rộng"),
        ],
        [1.0, 1.9, 2.8, 0.8],
        font_size=8.3,
    )
    add_callout(
        doc,
        "QUẢN LÝ THAY ĐỔI SCHEMA",
        "Hai bảng đề xuất chỉ được đưa vào schema qua migration có review. Việc bổ sung không thay thế inventory_movements; movement vẫn là sổ cái, còn operation là chứng từ nghiệp vụ gom nhiều dòng.",
        "warning",
    )

    chapter(doc, "B", "PHỤ LỤC - PHÂN CÔNG ĐẦU VIỆC")
    task_rows = [
        ("PM-01", "PM", "T1", "-", "Charter, mục tiêu, phạm vi và tiêu chí thành công được duyệt."),
        ("PM-02", "PM", "T1", "PM-01", "Stakeholder, giả định, giới hạn và RAID ban đầu."),
        ("PM-03", "PM", "T1-2", "PM-01", "FR/NFR, use case và acceptance criteria có mã."),
        ("PM-04", "PM", "T2", "PM-03", "Backlog ưu tiên, kế hoạch 4 sprint và capacity nhóm."),
        ("PM-05", "PM", "T3-6", "PM-04", "Điều phối review/demo, cập nhật rủi ro và change request."),
        ("PM-06", "PM", "T7", "PM-03", "RTM, kế hoạch UAT và checklist nghiệm thu."),
        ("PM-07", "PM", "T8", "PM-06", "UAT, báo cáo tổng kết và hồ sơ bàn giao."),
        ("PM-08", "PM", "T6-8", "PM-03, BE2-01", "Nghiệm thu Inventory theo ATP, receipt, transfer, count, alert và RTM."),
        ("FE-01", "Frontend", "T1", "PM-03", "Token, typography, component primitive và app shell."),
        ("FE-02", "Frontend", "T2", "FE-01", "Trang chủ, header/footer, đăng nhập và trạng thái chung."),
        ("FE-03", "Frontend", "T3", "FE-01, BE1-02", "Catalog responsive, tìm kiếm/lọc và skeleton/error."),
        ("FE-04", "Frontend", "T3-4", "FE-03", "PDP, variant selector, media gallery và add-to-cart."),
        ("FE-05", "Frontend", "T4", "BE1-03", "Giỏ hàng, quantity, voucher UI và tổng tiền."),
        ("FE-06", "Frontend", "T5", "BE1-04", "Checkout, địa chỉ, xác nhận và trang đơn cá nhân."),
        ("FE-07", "Frontend", "T5-6", "BE1-01", "Hồ sơ thành viên và trạng thái xác thực."),
        ("FE-08", "Frontend", "T6-7", "BE2-04", "Admin catalog/order/inventory/dashboard/Copilot."),
        ("FE-09", "Frontend", "T7-8", "FE-02..08", "A11y, responsive, performance và regression UI."),
        ("FE-10", "Frontend", "T6-8", "BE2-08", "Màn hình phiếu nhập/chuyển/kiểm kê, movement, cảnh báo và trạng thái ngoại lệ."),
        ("BE1-01", "Backend 1", "T1-2", "PM-03", "Identity adapter, user/profile và RBAC middleware."),
        ("BE1-02", "Backend 1", "T2-3", "BE1-01", "Catalog repository/API, pagination và seed sản phẩm."),
        ("BE1-03", "Backend 1", "T3-4", "BE1-02", "Cart API, ownership, quantity và pricing service."),
        ("BE1-04", "Backend 1", "T4-5", "BE1-03, BE2-02", "Checkout/order transaction và snapshot dữ liệu."),
        ("BE1-05", "Backend 1", "T5-6", "BE1-04", "Order query, state transition, history và audit."),
        ("BE1-06", "Backend 1", "T7", "BE1-01..05", "Unit/integration test, API error contract và tối ưu query."),
        ("BE1-07", "Backend 1", "T8", "BE1-06", "Sửa lỗi UAT, migration tương thích và tài liệu API."),
        ("BE2-01", "Backend 2", "T2-3", "BE1-02", "Warehouse, inventory balance, movement và reservation."),
        ("BE2-02", "Backend 2", "T4", "BE1-03", "Promotion/coupon evaluator và voucher API."),
        ("BE2-03", "Backend 2", "T5", "BE1-04", "Payment event idempotency và fulfillment model."),
        ("BE2-04", "Backend 2", "T5-6", "BE2-01", "Admin product/order/inventory/metrics API."),
        ("BE2-05", "Backend 2", "T6-7", "BE2-04", "Copilot intent, grounded query, confidence và guardrail."),
        ("BE2-06", "Backend 2", "T7", "BE2-01..05", "Security/negative/concurrency test và audit review."),
        ("BE2-07", "Backend 2", "T8", "BE2-06", "Sửa lỗi tích hợp và hỗ trợ dữ liệu nghiệm thu."),
        ("BE2-08", "Backend 2", "T5-7", "BE2-01", "Inventory operation service/API cho receipt, transfer, count và transaction nhiều dòng."),
        ("BE2-09", "Backend 2", "T7-8", "BE2-08", "Job cảnh báo tồn thấp, owner workflow và báo cáo độ chính xác tồn."),
        ("DO-01", "DevOps", "T1", "-", "Repository convention, env mẫu và quality commands."),
        ("DO-02", "DevOps", "T1-2", "DO-01", "CI typecheck/lint/test/build và artifact retention."),
        ("DO-03", "DevOps", "T2", "DO-01", "Dockerfile, compose, D1/R2 local và healthcheck."),
        ("DO-04", "DevOps", "T3-5", "DO-02", "Migration/seed automation và cấu hình theo môi trường."),
        ("DO-05", "DevOps", "T6", "DO-03", "Structured log, correlation, audit retention và cảnh báo."),
        ("DO-06", "DevOps", "T7", "FE/BE hoàn thiện", "Smoke/E2E trên container sạch và release candidate."),
        ("DO-07", "DevOps", "T8", "DO-06", "Deploy Sites, rollback checklist và runbook bàn giao."),
        ("DO-08", "DevOps", "T6-8", "BE2-08", "Migration Inventory Operations, lịch chạy alert và backup/restore kiểm chứng."),
    ]
    add_table(doc, ["Mã", "Phụ trách", "Tuần", "Phụ thuộc", "Đầu ra/tiêu chí hoàn thành"], task_rows, [0.8, 1.0, 0.65, 1.25, 2.8], font_size=7.3)

    chapter(doc, "C", "PHỤ LỤC - TÀI LIỆU THAM KHẢO VÀ GIỚI HẠN")
    doc.add_heading("C.1 Tài liệu tham khảo", level=2)
    add_numbered(
        doc,
        [
            "Google, Temasek và Bain & Company (2024), e-Conomy SEA 2024.",
            "Cloudflare Developers, tài liệu Workers, D1, R2 và Wrangler.",
            "React Documentation, tài liệu React 19.",
            "Drizzle ORM Documentation, schema, query và migration.",
            "OWASP, Web Security Testing Guide và Top 10.",
            "W3C, Web Content Accessibility Guidelines (WCAG) 2.2.",
        ],
    )
    doc.add_heading("C.2 Tài liệu nội bộ của đồ án", level=2)
    add_para(
        doc,
        "Báo cáo tổng hợp từ Product Vision, PRD, Personas/Journeys, Backlog, BRD/SRS, Use Cases, Business Rules, Diagrams, ERD, Data Dictionary, RTM, Project Charter, Timeline, WBS, RACI, RAID, Quality/Release, mã nguồn platform và tài liệu vận hành Docker.",
    )
    doc.add_heading("C.3 Giới hạn sử dụng số liệu", level=2)
    add_bullets(
        doc,
        [
            "Survey và interview được ghi là mô phỏng, không phải nghiên cứu đã thu thập thật.",
            "Nguồn thị trường chỉ cung cấp bối cảnh, không dùng để lập luận hiệu quả đầu tư.",
            "Kết quả kiểm thử phản ánh phiên bản ngày 31/08/2026 và cần chạy lại sau thay đổi.",
            "Thông tin trường, lớp, giảng viên và sinh viên phải được điền trước khi nộp.",
        ],
    )

    chapter(doc, "D", "PHỤ LỤC - MA TRẬN TRUY VẾT YÊU CẦU")
    rtm_rows = [
        ("FR-01", "UC-01", "Storefront", "GET /api/products", "products, variants", "TC-001", "Đạt"),
        ("FR-02", "UC-01", "Storefront", "GET /api/products", "products, categories", "TC-002", "Đạt"),
        ("FR-03", "UC-01", "Storefront", "GET /api/products/[slug]", "products, variants, media", "TC-003", "Đạt"),
        ("FR-04", "UC-02", "Cart", "/api/cart, /items/[id]", "carts, cart_items", "TC-004/005", "Đạt"),
        ("FR-05", "UC-02", "Pricing", "/api/vouchers", "promotions, coupons", "TC-006/007", "Đạt"),
        ("FR-06", "UC-03", "Identity", "Sites Identity", "users", "IT-AUTH-01", "Đạt"),
        ("FR-07", "UC-03", "Account", "/api/account/profile", "users, user_roles", "TC-012", "Đạt"),
        ("FR-08", "UC-04", "Checkout", "POST /api/orders", "orders, items, reservations", "TC-008/009", "Đạt"),
        ("FR-09", "UC-04", "Order", "POST /api/orders", "order_items, order_promotions", "UT-ORD-02", "Đạt"),
        ("FR-10", "UC-04", "Account/Order", "GET /api/orders", "orders, order_history", "TC-010", "Đạt"),
        ("FR-11", "UC-A01", "Admin Catalog", "/api/admin/products", "products, variants, media", "TC-013", "Đạt"),
        ("FR-12", "UC-05", "Inventory", "/api/admin/inventory/adjust", "inventory_items, movements", "TC-014", "Đạt"),
        ("FR-13", "UC-A02", "Admin Order", "/api/admin/orders/[id]/status", "orders, order_history", "TC-015", "Đạt"),
        ("FR-14", "UC-I01", "Payment", "/api/payments/webhook", "payments, payment_events", "TC-016", "Thiết kế/test"),
        ("FR-15", "UC-A03", "Promotion", "/api/vouchers", "promotions, coupons", "UT-VOU-01", "Đạt"),
        ("FR-16", "UC-A01", "Media", "/api/admin/uploads", "product_media, R2", "IT-UPL-01", "Đạt"),
        ("FR-17", "UC-A04", "Admin Metrics", "/api/admin/metrics", "order/inventory read model", "IT-MET-01", "Đạt"),
        ("FR-18", "UC-05", "Admin Copilot", "/api/admin/ai", "read model", "TC-017", "Đạt"),
        ("FR-19", "UC-10", "Order Cancel", "/api/orders/[id]/cancel (planned)", "orders, history, reservations", "TC-021", "Thiết kế"),
        ("FR-20", "UC-09", "Fulfillment", "/api/admin/fulfillments (planned)", "fulfillments, items", "TC-022", "Một phần"),
        ("FR-21", "UC-11", "Returns", "/api/returns (planned)", "return case mở rộng", "TC-023", "Thiết kế"),
        ("FR-22", "UC-08/11", "Refund", "/api/admin/refunds (planned)", "refunds, payment_events", "TC-024", "Thiết kế"),
        ("FR-23", "UC-06..13", "RBAC/Audit", "Mọi API nhạy cảm", "roles, user_roles, audit_logs", "TC-026", "Một phần"),
        ("FR-24", "UC-08/13", "Reconciliation", "/api/admin/reconciliation (planned)", "payments, events, orders", "TC-025", "Thiết kế"),
        ("FR-25", "UC-05", "Inventory Query", "/api/admin/inventory (planned)", "inventory_items, variants, warehouses", "TC-027", "Một phần"),
        ("FR-26", "UC-05A/B", "Warehouse", "/api/admin/warehouses (planned)", "warehouses", "TC-028", "Thiết kế"),
        ("FR-27", "UC-05A", "Inventory Receipt", "/api/admin/inventory/operations (planned)", "operations, operation_items, movements", "TC-029", "Thiết kế"),
        ("FR-28", "UC-05B", "Inventory Transfer", "/api/admin/inventory/operations (planned)", "operations, operation_items, movements", "TC-030", "Thiết kế"),
        ("FR-29", "UC-05C", "Inventory Count", "/api/admin/inventory/operations (planned)", "operations, operation_items, movements", "TC-031", "Thiết kế"),
        ("FR-30", "UC-05/13", "Inventory Alert", "/api/admin/inventory/alerts (planned)", "inventory read model/alerts", "TC-032", "Một phần"),
        ("NFR-01", "Toàn bộ", "Frontend", "-", "-", "UI-RWD-01", "Đạt"),
        ("NFR-02", "Toàn bộ", "Auth/RBAC", "API ghi/admin", "users, roles", "TC-011", "Đạt"),
        ("NFR-03", "Toàn bộ", "Validation", "Mọi API", "-", "TC-018", "Đạt"),
        ("NFR-04", "Toàn bộ", "Quality", "-", "-", "CI-QUAL-01", "Đạt"),
        ("NFR-05", "Vận hành", "Health", "/api/health", "D1/R2", "TC-019", "Đạt"),
        ("NFR-06", "Toàn bộ", "Logging", "Mọi API", "audit_logs", "SEC-LOG-01", "Đạt"),
        ("NFR-07", "Vận hành", "Migration", "Container startup", "schema/migrations", "TC-020", "Đạt"),
        ("NFR-08", "Toàn bộ", "Accessibility", "-", "-", "UI-A11Y-01", "Đạt cơ bản"),
    ]
    doc.add_heading("D.1 Truy vết yêu cầu chức năng", level=2)
    add_table(
        doc,
        ["Yêu cầu", "Use case", "Module", "API", "Dữ liệu", "Test", "Trạng thái"],
        rtm_rows[:30],
        [0.75, 0.8, 1.05, 1.35, 1.35, 0.9, 0.8],
        font_size=7.5,
    )
    doc.add_page_break()
    doc.add_heading("D.2 Truy vết yêu cầu phi chức năng", level=2)
    add_table(
        doc,
        ["Yêu cầu", "Use case", "Module", "API", "Dữ liệu", "Test", "Trạng thái"],
        rtm_rows[30:],
        [0.75, 0.8, 1.05, 1.35, 1.35, 0.9, 0.8],
        font_size=7.8,
    )
    add_para(doc, "Các mã kiểm thử IT/UT/UI/SEC/CI là kiểm thử kỹ thuật bổ sung; TC-001 đến TC-032 là bộ kiểm thử nghiệp vụ hiện tại và thiết kế mở rộng được trình bày tại Chương 7.", italic=True)

    chapter(doc, "E", "DANH MỤC API")
    api_rows = [
        ("GET", "/api/health", "Public", "-", "Trạng thái app/database/storage", "200/503"),
        ("GET", "/api/products", "Public", "q, category, limit", "Danh sách và phân trang", "200/400"),
        ("GET", "/api/products/[slug]", "Public", "slug", "Chi tiết product/variant/media", "200/404"),
        ("GET/POST", "/api/cart", "Guest/User", "cart token hoặc identity", "Đọc/tạo giỏ", "200/400"),
        ("PATCH/DELETE", "/api/cart/items/[id]", "Owner", "quantity hoặc item id", "Giỏ và totals mới", "200/404/409"),
        ("POST/DELETE", "/api/vouchers", "Guest/User", "code", "Giỏ và discount mới", "200/400/409"),
        ("POST/GET", "/api/orders", "User", "address, cart, idem key", "Đơn mới/danh sách đơn", "200/201/409"),
        ("GET/PUT", "/api/account/profile", "User", "Tên, điện thoại, thuộc tính hồ sơ", "Hồ sơ hiện tại", "200/400/401"),
        ("GET/POST/PUT", "/api/admin/products", "Manager/Admin", "Product/variant/media DTO", "Sản phẩm đã lưu", "200/201/403"),
        ("GET", "/api/admin/orders", "Staff+", "status, cursor, limit", "Danh sách đơn quản trị", "200/403"),
        ("PATCH", "/api/admin/orders/[id]/status", "Staff+", "next status, note", "Order và history", "200/409"),
        ("POST", "/api/admin/inventory/adjust", "Staff+", "SKU, warehouse, delta, reason, idem key", "Balance và movement", "200/409"),
        ("GET", "/api/admin/metrics", "Manager+", "range", "KPI order/revenue/inventory", "200/403"),
        ("POST", "/api/admin/ai", "Manager+", "question/intent", "Answer, evidence, actions, confidence", "200/400"),
        ("POST", "/api/admin/uploads", "Manager+", "file metadata/content", "R2 key và public asset URL", "201/400/413"),
        ("GET", "/api/assets/[...key]", "Public/Policy", "object key", "Nội dung media", "200/404"),
        ("POST", "/api/payments/webhook", "Provider", "signed event", "Acknowledgement idempotent", "200/400/401"),
    ]
    add_table(doc, ["Method", "Route", "Quyền", "Input chính", "Output", "Status"], api_rows, [0.65, 1.45, 0.85, 1.2, 1.6, 0.75], font_size=7.7)
    doc.add_heading("E.1 Mẫu lỗi chuẩn", level=2)
    add_para(doc, '{ "error": { "code": "ORDER_CONFLICT", "message": "Dữ liệu đã thay đổi, vui lòng tải lại.", "correlationId": "req_...", "details": [] } }')
    add_para(doc, "Thông điệp gửi người dùng không chứa stack trace, câu truy vấn, token hoặc dữ liệu cá nhân. Chi tiết kỹ thuật được ghi ở log nội bộ và liên kết qua correlationId.", italic=True)

    doc.add_heading("E.2 API nghiệp vụ thiết kế mở rộng", level=2)
    planned_api_rows = [
        ("POST", "/api/orders/[id]/cancel", "Owner/Staff+", "reason, idempotency key", "Order cancelled hoặc policy error", "Thiết kế"),
        ("POST", "/api/admin/fulfillments", "Staff+", "order items, carrier", "Fulfillment và tracking", "Một phần"),
        ("PATCH", "/api/admin/fulfillments/[id]", "Staff+/Provider", "normalized status, time, reason", "Timeline giao nhận", "Thiết kế"),
        ("POST", "/api/returns", "Owner", "order item, quantity, reason, evidence", "Return case", "Thiết kế"),
        ("PATCH", "/api/admin/returns/[id]", "Staff+/Manager", "decision, inspection, note", "Return state mới", "Thiết kế"),
        ("POST", "/api/admin/refunds", "Manager+", "payment, amount, reason, idem key", "Refund pending/succeeded", "Thiết kế"),
        ("GET", "/api/admin/reconciliation", "Manager+", "provider, date range, status", "Danh sách chênh lệch", "Thiết kế"),
        ("PATCH", "/api/admin/reconciliation/[id]", "Manager+", "owner, resolution, evidence", "Case đã xử lý", "Thiết kế"),
        ("GET", "/api/admin/audit-logs", "Manager+/Admin", "actor, entity, time, action", "Audit trail có phân trang", "Một phần"),
        ("GET", "/api/admin/inventory", "Staff+", "warehouse, SKU, ATP status, cursor", "Tồn đa kho và tổng hợp ATP", "Một phần"),
        ("GET", "/api/admin/inventory/movements", "Staff+", "item, operation, time, cursor", "Sổ cái biến động", "Thiết kế"),
        ("GET/POST/PATCH", "/api/admin/warehouses", "Manager+", "code, name, address, status", "Kho và dependency result", "Thiết kế"),
        ("POST", "/api/admin/inventory/operations", "Staff+", "type, warehouses, lines, idem key", "Operation DRAFT", "Thiết kế"),
        ("PATCH", "/api/admin/inventory/operations/[id]", "Staff+/Manager", "action, lines, approval, version", "Operation state/movements", "Thiết kế"),
        ("GET/PATCH", "/api/admin/inventory/alerts", "Staff+/Manager", "status, owner, warehouse, SKU", "Danh sách/cập nhật alert", "Một phần"),
    ]
    add_table(doc, ["Method", "Route", "Quyền", "Input chính", "Output", "Mức hoàn thiện"], planned_api_rows, [0.65, 1.65, 1.0, 1.45, 1.35, 0.9], font_size=7.1)

    doc.core_properties.title = "Báo cáo đồ án xây dựng website bán quần áo trực tuyến"
    doc.core_properties.subject = "Phân tích đầy đủ nghiệp vụ, yêu cầu, kiến trúc, dữ liệu, API, kiểm thử, truy vết và quản lý triển khai"
    doc.core_properties.author = "Nhóm thực hiện đồ án"
    settings = doc.settings.element
    update_fields = settings.find(qn("w:updateFields"))
    if update_fields is None:
        update_fields = OxmlElement("w:updateFields")
        settings.append(update_fields)
    update_fields.set(qn("w:val"), "true")
    doc.save(ACADEMIC_DOCX_PATH)
    return ACADEMIC_DOCX_PATH


if __name__ == "__main__":
    generated_diagrams = generate_diagrams()
    generated_diagrams["business_order_flow"] = make_order_business_flow()
    generated_diagrams["return_refund_flow"] = make_return_refund_flow()
    output_path = build_academic_document(generated_diagrams)
    print("Da tao file Word do an thanh cong.")
    print(output_path.name)
