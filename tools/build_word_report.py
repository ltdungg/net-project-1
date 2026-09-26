from __future__ import annotations

import math
import os
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "deliverables"
IMG_DIR = ROOT / "artifacts" / "report-diagrams"
DOCX_PATH = OUT_DIR / "Bao-cao-tong-hop-du-an-cua-hang-thoi-trang-truc-tuyen.docx"
OUT_DIR.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

FONT_REG = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_ITALIC = Path(r"C:\Windows\Fonts\ariali.ttf")

NAVY = "0B2545"
BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
MID_BLUE = "5B9BD5"
PALE_BLUE = "EAF2F8"
LIGHT_BLUE = "DCEAF7"
LIGHT_GRAY = "F2F4F7"
MID_GRAY = "667085"
DARK_GRAY = "344054"
GREEN = "2E7D32"
PALE_GREEN = "E8F5E9"
GOLD = "9A6700"
PALE_GOLD = "FFF5D6"
RED = "9B1C1C"
PALE_RED = "FDECEC"
WHITE = "FFFFFF"
BLACK = "111111"


def font(size: int, bold: bool = False, italic: bool = False):
    p = FONT_BOLD if bold else FONT_ITALIC if italic else FONT_REG
    return ImageFont.truetype(str(p), size=size)


def wrap_px(draw: ImageDraw.ImageDraw, text: str, fnt, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = word if not current else current + " " + word
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def draw_text_center(draw, xy, text, fnt, fill, max_width, line_gap=6):
    lines = wrap_px(draw, text, fnt, max_width)
    heights = [draw.textbbox((0, 0), line, font=fnt)[3] for line in lines]
    total = sum(heights) + line_gap * (len(lines) - 1)
    y = xy[1] - total / 2
    for line, h in zip(lines, heights):
        box = draw.textbbox((0, 0), line, font=fnt)
        w = box[2] - box[0]
        draw.text((xy[0] - w / 2, y), line, font=fnt, fill=fill)
        y += h + line_gap


def rounded_box(draw, rect, title, subtitle=None, fill="#F2F6FA", outline="#2E74B5", title_size=34, sub_size=25):
    x1, y1, x2, y2 = rect
    draw.rounded_rectangle(rect, radius=20, fill=fill, outline=outline, width=4)
    if subtitle:
        draw_text_center(draw, ((x1 + x2) / 2, y1 + (y2-y1)*0.38), title, font(title_size, True), "#0B2545", x2-x1-36)
        draw_text_center(draw, ((x1 + x2) / 2, y1 + (y2-y1)*0.70), subtitle, font(sub_size), "#344054", x2-x1-36)
    else:
        draw_text_center(draw, ((x1 + x2) / 2, (y1 + y2) / 2), title, font(title_size, True), "#0B2545", x2-x1-36)


def arrow(draw, start, end, color="#667085", width=5, head=16):
    draw.line([start, end], fill=color, width=width)
    ang = math.atan2(end[1]-start[1], end[0]-start[0])
    left = (end[0] - head*math.cos(ang-math.pi/6), end[1] - head*math.sin(ang-math.pi/6))
    right = (end[0] - head*math.cos(ang+math.pi/6), end[1] - head*math.sin(ang+math.pi/6))
    draw.polygon([end, left, right], fill=color)


def canvas(title: str, size=(2200, 1300)):
    img = Image.new("RGB", size, "white")
    d = ImageDraw.Draw(img)
    d.text((70, 42), title, font=font(46, True), fill="#0B2545")
    d.line((70, 110, size[0]-70, 110), fill="#D0D5DD", width=3)
    return img, d


def save(img, name):
    path = IMG_DIR / name
    img.save(path, dpi=(220, 220), optimize=True)
    return path


def make_survey_chart():
    img, d = canvas("Các vấn đề khi mua quần áo trực tuyến - bộ dữ liệu khảo sát mô phỏng n=200")
    data = [
        ("Không chắc size", 68), ("Khác ảnh/mô tả", 59), ("Đổi trả khó/không rõ", 54),
        ("Phí xuất hiện muộn", 47), ("Không biết tồn size/màu", 46), ("Tracking không rõ", 35),
        ("Lo thanh toán online", 26)
    ]
    x0, x1 = 650, 2050
    y = 185
    for i, (label, val) in enumerate(data):
        d.text((75, y+10), label, font=font(30), fill="#344054")
        d.rounded_rectangle((x0, y, x1, y+58), radius=12, fill="#EEF2F6")
        bar_x = x0 + (x1-x0)*val/100
        color = "#2E74B5" if i < 3 else "#5B9BD5"
        d.rounded_rectangle((x0, y, bar_x, y+58), radius=12, fill=color)
        d.text((bar_x+18, y+8), f"{val}%", font=font(31, True), fill="#0B2545")
        y += 142
    d.text((75, 1215), "Lưu ý: dữ liệu mô phỏng dùng để minh họa phương pháp nghiên cứu; không phải kết quả khảo sát thực địa.", font=font(23, italic=True), fill="#667085")
    return save(img, "01-khao-sat-pain-points.png")


def make_problem_tree():
    img, d = canvas("Cây vấn đề của đề tài")
    rounded_box(d, (690, 150, 1510, 290), "Quy trình mua và quản lý thời trang trực tuyến chưa thống nhất", fill="#FDECEC", outline="#9B1C1C")
    mid = [(130, 430, 690, 600, "Trải nghiệm người dùng phân mảnh"), (820, 430, 1380, 600, "Quản lý dữ liệu thủ công"), (1510, 430, 2070, 600, "Thiếu công cụ hỗ trợ quản trị")]
    for x1,y1,x2,y2,t in mid:
        rounded_box(d, (x1,y1,x2,y2), t, fill="#FFF5D6", outline="#9A6700", title_size=32)
        arrow(d, (1100, 290), ((x1+x2)//2, y1))
    effects = [
        (70, 780, 510, 930, "Bỏ giỏ, hỏi nhiều"), (560, 780, 1000, 930, "Sai SKU/tồn/địa chỉ"),
        (1050, 780, 1490, 930, "CS và lead time cao"), (1540, 780, 2130, 930, "Không tối ưu funnel/retention")]
    for x1,y1,x2,y2,t in effects:
        rounded_box(d, (x1,y1,x2,y2), t, fill="#EAF2F8", outline="#2E74B5", title_size=29)
    arrow(d, (410,600),(290,780)); arrow(d,(1100,600),(780,780)); arrow(d,(1100,600),(1270,780)); arrow(d,(1790,600),(1835,780))
    rounded_box(d, (520, 1060, 1680, 1210), "Hệ thống khó bảo đảm tính đúng đắn, khả dụng và khả năng mở rộng", fill="#E8F5E9", outline="#2E7D32", title_size=34)
    for x in [290,780,1270,1835]: arrow(d,(x,930),(1100,1060))
    return save(img, "02-cay-van-de.png")


def make_journey():
    img, d = canvas("Hành trình khách hàng từ khám phá đến sau mua")
    stages = [
        ("1", "Nhận biết", "Social / SEO"), ("2", "Khám phá", "Search / Filter"),
        ("3", "Đánh giá", "PDP / Size"), ("4", "Quyết định", "Variant / Cart"),
        ("5", "Thanh toán", "Address / Pay"), ("6", "Giao hàng", "Track / Receive"),
        ("7", "Sau mua", "Return / Repeat")]
    x = 75
    for i,(n,t,s) in enumerate(stages):
        w=270
        rounded_box(d,(x,300,x+w,570),t,s,fill="#F2F6FA" if i%2==0 else "#EAF2F8",title_size=30,sub_size=23)
        d.ellipse((x+100,190,x+170,260),fill="#2E74B5")
        draw_text_center(d,(x+135,225),n,font(32,True),"white",60)
        if i<len(stages)-1: arrow(d,(x+w,435),(x+w+40,435),width=5)
        x += 300
    pain = ["Tải chậm", "Khó tìm size", "Thiếu fit info", "Phí chưa rõ", "Form/payment lỗi", "Không biết trạng thái", "Đổi trả khó"]
    x=75
    for p in pain:
        draw_text_center(d,(x+135,720),p,font(24),"#9B1C1C",250)
        x+=300
    d.text((75, 820), "Cơ hội thiết kế", font=font(32,True), fill="#0B2545")
    opportunities=["Landing đúng campaign","Filter theo variant","Size guide + model","Estimate tổng sớm","Guest + pending rõ","Timeline + notification","Policy + CS entry"]
    x=75
    for op in opportunities:
        rounded_box(d,(x,900,x+270,1080),op,fill="#E8F5E9",outline="#2E7D32",title_size=24)
        x+=300
    return save(img,"03-hanh-trinh-khach-hang.png")


def make_kpi_tree():
    img,d=canvas("Cây tiêu chí đánh giá hệ thống")
    rounded_box(d,(660,150,1540,300),"Website hoạt động đúng, dễ dùng và có thể triển khai",fill="#E8F5E9",outline="#2E7D32",title_size=36)
    nodes=[(120,470,650,630,"Trải nghiệm người dùng"),(835,470,1365,630,"Tính đúng nghiệp vụ"),(1550,470,2080,630,"Khả năng vận hành")]
    for r in nodes: rounded_box(d,r[:4],r[4],fill="#EAF2F8",outline="#2E74B5",title_size=31); arrow(d,(1100,300),((r[0]+r[2])//2,r[1]))
    children=[(40,820,430,960,"Responsive / a11y"),(480,820,870,960,"Browse → Cart"),(905,820,1295,960,"Checkout chính xác"),(1330,820,1720,960,"API / dữ liệu ổn định"),(1760,820,2160,960,"Deploy / quan sát được")]
    for r in children: rounded_box(d,r[:4],r[4],fill="#F2F4F7",outline="#667085",title_size=25)
    arrow(d,(385,630),(235,820)); arrow(d,(1100,630),(675,820)); arrow(d,(1100,630),(1100,820)); arrow(d,(1815,630),(1525,820)); arrow(d,(1815,630),(1960,820))
    rounded_box(d,(650,1080,1550,1220),"Chỉ số kiểm soát: lỗi thanh toán, oversell, hiệu năng, bảo mật và khả năng phục hồi",fill="#FFF5D6",outline="#9A6700",title_size=28)
    return save(img,"04-cay-kpi.png")


def make_system_context():
    img,d=canvas("Bối cảnh hệ thống và các tích hợp chính")
    rounded_box(d,(710,390,1490,770),"Nền tảng bán hàng thời trang", "Storefront + Admin + Commerce API",fill="#DCEAF7",outline="#1F4D78",title_size=38,sub_size=28)
    boxes=[(70,220,560,390,"Khách hàng","Guest / Member"),(70,780,560,950,"Nhân viên","Catalog / Kho / CS"),(1640,150,2130,320,"Cổng thanh toán","Payment"),(1640,400,2130,570,"Đơn vị vận chuyển","Shipping"),(1640,650,2130,820,"Email / Analytics","Notification"),(810,970,1390,1150,"Database + Object Storage","Dữ liệu / Media")]
    for x1,y1,x2,y2,t,s in boxes: rounded_box(d,(x1,y1,x2,y2),t,s,title_size=29,sub_size=22)
    arrow(d,(560,305),(710,500)); arrow(d,(560,865),(710,680)); arrow(d,(1490,485),(1640,235)); arrow(d,(1490,555),(1640,485)); arrow(d,(1490,655),(1640,735)); arrow(d,(1100,770),(1100,970))
    return save(img,"05-boi-canh-he-thong.png")


def make_architecture():
    img,d=canvas("Kiến trúc giải pháp ở mức logic")
    columns=[("Kênh",["Responsive Web","Admin Portal"]),("Ứng dụng",["React / Vinext","Route handlers"]),("Miền nghiệp vụ",["Catalog","Cart & Pricing","Order","Account","Inventory","Admin AI"]),("Nền tảng",["Cloudflare D1","Drizzle ORM","R2 Storage","Worker / Outbox"]),("Bên thứ ba",["Sites Identity","Payment","Shipping","Analytics"])]
    xs=[55,440,825,1345,1760]
    widths=[320,320,450,350,370]
    for idx,(title,items) in enumerate(columns):
        x=xs[idx]; w=widths[idx]
        d.rounded_rectangle((x,150,x+w,1180),radius=18,fill="#F8FAFC",outline="#D0D5DD",width=3)
        d.rectangle((x,150,x+w,240),fill="#0B2545")
        draw_text_center(d,(x+w/2,195),title,font(29,True),"white",w-30)
        y=285
        for item in items:
            rounded_box(d,(x+25,y,x+w-25,y+105),item,fill="#EAF2F8",outline="#5B9BD5",title_size=24)
            y+=135
    for a,b in zip(range(4),range(1,5)):
        arrow(d,(xs[a]+widths[a],665),(xs[b],665),color="#2E74B5",width=6)
    return save(img,"06-kien-truc-giai-phap.png")


def use_case_ellipse(d, rect, title, fill="#F7FBFF", outline="#2E74B5", title_size=25):
    d.ellipse(rect, fill=fill, outline=outline, width=4)
    x1, y1, x2, y2 = rect
    draw_text_center(d, ((x1 + x2) / 2, (y1 + y2) / 2), title, font(title_size, True), "#0B2545", x2 - x1 - 42)


def actor_card(d, rect, title, subtitle, fill="#FFF7E6", outline="#9A6700"):
    rounded_box(d, rect, title, subtitle, fill=fill, outline=outline, title_size=27, sub_size=20)


def association(d, start, end, color="#7A8699", width=4):
    d.line((start, end), fill=color, width=width)


def system_boundary(d, rect, label):
    x1, y1, x2, y2 = rect
    d.rounded_rectangle(rect, radius=22, fill="#FBFCFE", outline="#98A2B3", width=4)
    d.rounded_rectangle((x1 + 28, y1 - 26, x1 + 470, y1 + 42), radius=12, fill="#0B2545")
    draw_text_center(d, (x1 + 249, y1 + 8), label, font(25, True), "white", 410)


def make_use_cases():
    img, d = canvas("Use Case tổng quan - Nền tảng thương mại điện tử", size=(2800, 1600))
    boundary = (520, 170, 2280, 1370)
    system_boundary(d, boundary, "NÉT Commerce")
    actors = {
        "guest": (70, 240, 430, 400),
        "member": (70, 820, 430, 980),
        "staff": (2370, 240, 2730, 400),
        "manager": (2370, 820, 2730, 980),
    }
    actor_card(d, actors["guest"], "Khách vãng lai", "Guest")
    actor_card(d, actors["member"], "Thành viên", "Customer")
    actor_card(d, actors["staff"], "Nhân viên", "Staff / CSKH / Kho")
    actor_card(d, actors["manager"], "Quản lý", "Manager / Admin")

    cases = {
        "browse": (690, 250, 1220, 390),
        "cart": (690, 520, 1220, 660),
        "account": (690, 790, 1220, 930),
        "after_sale": (690, 1060, 1220, 1200),
        "checkout": (1570, 250, 2100, 390),
        "orders": (1570, 520, 2100, 660),
        "inventory": (1570, 790, 2100, 930),
        "governance": (1570, 1060, 2100, 1200),
    }
    # Actor links terminate at their dedicated lane; relationships are implied by grouping.
    # This keeps the overview readable and avoids many-to-many line crossings.
    for y in (320, 900): association(d, (430, y), (520, y))
    for y in (320, 900): association(d, (2370, y), (2280, y))
    d.text((820, 195), "NHÓM USE CASE KHÁCH HÀNG", font=font(21, True), fill="#667085")
    d.text((1670, 195), "NHÓM USE CASE VẬN HÀNH", font=font(21, True), fill="#667085")

    titles = {
        "browse": "Duyệt catalog và chọn SKU",
        "cart": "Quản lý giỏ và voucher",
        "account": "Quản lý tài khoản và địa chỉ",
        "after_sale": "Theo dõi, hủy và đổi trả",
        "checkout": "Checkout và thanh toán",
        "orders": "Xử lý đơn và giao nhận",
        "inventory": "Quản lý Inventory đa kho",
        "governance": "Catalog, promotion, báo cáo và audit",
    }
    for key, rect in cases.items():
        use_case_ellipse(d, rect, titles[key])
    d.text((560, 1430), "Phạm vi chi tiết được tách thành ba sơ đồ: Storefront, Backoffice và Inventory để tránh liên kết chồng chéo.", font=font(25, italic=True), fill="#667085")
    return save(img, "07-use-case-tong-quan.png")


def make_use_case_storefront():
    img, d = canvas("Use Case chi tiết - Storefront và tài khoản", size=(2800, 1600))
    system_boundary(d, (500, 170, 2300, 1400), "Storefront")
    actor_card(d, (60, 260, 410, 410), "Khách vãng lai", "Guest")
    actor_card(d, (60, 880, 410, 1030), "Thành viên", "Customer")
    actor_card(d, (2390, 230, 2740, 380), "Identity", "Đăng nhập")
    actor_card(d, (2390, 700, 2740, 850), "Thanh toán", "Payment provider")
    actor_card(d, (2390, 1160, 2740, 1310), "Vận chuyển", "Carrier")
    cases = {
        "browse": (670, 230, 1200, 370), "pdp": (670, 470, 1200, 610),
        "cart": (670, 710, 1200, 850), "profile": (670, 1030, 1200, 1170),
        "checkout": (1590, 250, 2120, 390), "pay": (1590, 560, 2120, 700),
        "track": (1590, 870, 2120, 1010), "cancel": (1590, 1170, 2120, 1310),
    }
    for y in (330, 955): association(d, (410, y), (500, y))
    for y in (305, 775, 1235): association(d, (2390, y), (2300, y))
    d.text((760, 190), "KHÁM PHÁ - GIỎ - TÀI KHOẢN", font=font(21, True), fill="#667085")
    d.text((1660, 190), "GIAO DỊCH - HẬU MÃI", font=font(21, True), fill="#667085")
    labels = {
        "browse": "Tìm kiếm và lọc sản phẩm", "pdp": "Xem PDP và chọn variant",
        "cart": "Giỏ hàng và voucher", "profile": "Hồ sơ và địa chỉ",
        "checkout": "Đặt hàng và giữ tồn", "pay": "Xác nhận thanh toán",
        "track": "Theo dõi giao nhận", "cancel": "Hủy đơn / yêu cầu đổi trả",
    }
    for key, rect in cases.items(): use_case_ellipse(d, rect, labels[key])
    return save(img, "16-use-case-storefront.png")


def make_use_case_admin():
    img, d = canvas("Use Case chi tiết - Backoffice quản trị", size=(2800, 1600))
    system_boundary(d, (500, 170, 2300, 1400), "Backoffice")
    actor_card(d, (60, 260, 410, 410), "Nhân viên", "Staff / CSKH")
    actor_card(d, (60, 900, 410, 1050), "Quản lý", "Manager")
    actor_card(d, (2390, 260, 2740, 410), "Quản trị viên", "Admin")
    actor_card(d, (2390, 980, 2740, 1130), "Hệ thống ngoài", "Payment / Shipping")
    cases = {
        "orders": (650, 230, 1190, 370), "customers": (650, 500, 1190, 640),
        "fulfill": (650, 770, 1190, 910), "returns": (650, 1090, 1190, 1230),
        "catalog": (1600, 230, 2140, 370), "promo": (1600, 500, 2140, 640),
        "metrics": (1600, 770, 2140, 910), "security": (1600, 1090, 2140, 1230),
    }
    for y in (330, 975): association(d, (410, y), (500, y))
    for y in (330, 1055): association(d, (2390, y), (2300, y))
    d.text((760, 190), "VẬN HÀNH HẰNG NGÀY", font=font(21, True), fill="#667085")
    d.text((1690, 190), "ĐIỀU HÀNH - KIỂM SOÁT", font=font(21, True), fill="#667085")
    labels = {
        "orders": "Duyệt và xử lý đơn", "customers": "Hỗ trợ khách hàng",
        "fulfill": "Fulfillment và tracking", "returns": "Đổi trả và hoàn tiền",
        "catalog": "Catalog và media", "promo": "Promotion và coupon",
        "metrics": "Dashboard và Copilot", "security": "Vai trò, audit và cấu hình",
    }
    for key, rect in cases.items(): use_case_ellipse(d, rect, labels[key])
    return save(img, "17-use-case-backoffice.png")


def make_use_case_inventory():
    img, d = canvas("Use Case chi tiết - Quản lý Inventory đa kho", size=(2800, 1600))
    system_boundary(d, (500, 170, 2300, 1400), "Inventory Management")
    actor_card(d, (60, 260, 410, 410), "Nhân viên kho", "Staff")
    actor_card(d, (60, 900, 410, 1050), "Quản lý kho", "Manager")
    actor_card(d, (2390, 260, 2740, 410), "Order service", "Reservation")
    actor_card(d, (2390, 900, 2740, 1050), "Copilot / Alert", "Read-only")
    cases = {
        "view": (650, 220, 1190, 360), "adjust": (650, 470, 1190, 610),
        "receipt": (650, 720, 1190, 860), "transfer": (650, 970, 1190, 1110),
        "count": (650, 1220, 1190, 1360), "reserve": (1600, 250, 2140, 390),
        "ledger": (1600, 620, 2140, 760), "replenish": (1600, 1030, 2140, 1170),
    }
    for y in (330, 975): association(d, (410, y), (500, y))
    for y in (330, 975): association(d, (2390, y), (2300, y))
    d.text((730, 190), "TÁC NGHIỆP KHO", font=font(21, True), fill="#667085")
    d.text((1650, 190), "TỰ ĐỘNG HÓA VÀ KIỂM SOÁT", font=font(21, True), fill="#667085")
    labels = {
        "view": "Tra cứu ATP theo kho / SKU", "adjust": "Điều chỉnh tồn có lý do",
        "receipt": "Nhập hàng / nhận hàng", "transfer": "Chuyển kho hai đầu",
        "count": "Kiểm kê và xử lý chênh lệch", "reserve": "Giữ / consume / release tồn",
        "ledger": "Xem sổ cái biến động", "replenish": "Cảnh báo tồn thấp và bổ sung",
    }
    for key, rect in cases.items(): use_case_ellipse(d, rect, labels[key])
    return save(img, "18-use-case-inventory.png")


def make_sequence():
    img,d=canvas("Sơ đồ tuần tự - Thanh toán trực tuyến")
    parts=[("Khách",140),("Storefront",460),("Commerce API",820),("Inventory",1180),("Payment",1510),("Worker / DB",1900)]
    top=190; bottom=1200
    for name,x in parts:
        rounded_box(d,(x-120,top-30,x+120,top+80),name,fill="#EAF2F8",outline="#2E74B5",title_size=23)
        d.line((x,top+80,x,bottom),fill="#98A2B3",width=3)
    msgs=[
        (140,460,"1. Đặt đơn + idempotency key"),(460,820,"2. Validate cart, giá, địa chỉ"),
        (820,1180,"3. Giữ tồn có TTL"),(820,1900,"4. Tạo order/payment/outbox"),
        (820,1510,"5. Tạo payment session"),(1510,140,"6. Khách xác nhận tại provider"),
        (1510,1900,"7. Webhook đã ký"),(1900,1900,"8. Xác minh + cập nhật idempotent"),
        (1900,1180,"9. Consume reservation"),(460,820,"10. Lấy trạng thái server"),(820,460,"11. CONFIRMED hoặc PENDING")]
    y=360
    for a,b,label in msgs:
        if a==b:
            d.line((a,y,a+100,y),fill="#667085",width=4); d.line((a+100,y,a+100,y+45),fill="#667085",width=4); arrow(d,(a+100,y+45),(a,y+45),width=4,head=12)
            d.text((a+115,y+5),label,font=font(22),fill="#344054")
        else:
            arrow(d,(a,y),(b,y),color="#2E74B5",width=4,head=13)
            mx=min(a,b)+abs(b-a)/2
            draw_text_center(d,(mx,y-28),label,font(21),"#344054",abs(b-a)-25)
        y+=78
    return save(img,"08-sequence-thanh-toan-online.png")


def make_order_state():
    img,d=canvas("Máy trạng thái đơn hàng")
    states={
        "PENDING_PAYMENT":(90,220,490,360),"CONFIRMED":(650,220,1030,360),"PROCESSING":(1190,220,1570,360),
        "READY_TO_SHIP":(1710,220,2110,360),"SHIPPED":(1430,650,1810,790),"DELIVERED":(820,650,1200,790),
        "RETURNED":(820,1000,1200,1140),"CANCELLED":(160,650,540,790)}
    for name,rect in states.items():
        fill="#E8F5E9" if name in ["DELIVERED"] else "#FDECEC" if name in ["CANCELLED","RETURNED"] else "#EAF2F8"
        outline="#2E7D32" if name=="DELIVERED" else "#9B1C1C" if name in ["CANCELLED","RETURNED"] else "#2E74B5"
        rounded_box(d,rect,name,fill=fill,outline=outline,title_size=28)
    def mid(rect,side):
        x1,y1,x2,y2=rect
        return {"l":(x1,(y1+y2)/2),"r":(x2,(y1+y2)/2),"t":((x1+x2)/2,y1),"b":((x1+x2)/2,y2)}[side]
    links=[("PENDING_PAYMENT","r","CONFIRMED","l"),("CONFIRMED","r","PROCESSING","l"),("PROCESSING","r","READY_TO_SHIP","l"),("READY_TO_SHIP","b","SHIPPED","t"),("SHIPPED","l","DELIVERED","r"),("DELIVERED","b","RETURNED","t"),("CONFIRMED","b","CANCELLED","t"),("PENDING_PAYMENT","b","CANCELLED","l")]
    for a,sa,b,sb in links: arrow(d,mid(states[a],sa),mid(states[b],sb),width=5)
    d.text((80,1185),"Mọi transition được kiểm tra quyền, trạng thái hiện tại và ghi lịch sử/audit trong cùng transaction.",font=font(24,italic=True),fill="#667085")
    return save(img,"09-state-don-hang.png")


def make_erd_overview():
    img, d = canvas("ERD tổng quan - 28 bảng hiện tại theo 9 miền", size=(3200, 1900))

    def domain_card(rect, name, tables, central=False):
        x1, y1, x2, y2 = rect
        d.rounded_rectangle(rect, radius=22, fill="#F7FAFC" if not central else "#EEF6FD", outline="#7A8699" if not central else "#2E74B5", width=4)
        d.rounded_rectangle((x1, y1, x2, y1 + 72), radius=20, fill="#0B2545" if not central else "#1F4D78")
        d.rectangle((x1, y1 + 40, x2, y1 + 72), fill="#0B2545" if not central else "#1F4D78")
        draw_text_center(d, ((x1 + x2) / 2, y1 + 36), name, font(29, True), "white", x2 - x1 - 30)
        pill_w = (x2 - x1 - 110) / 2
        for idx, table_name in enumerate(tables):
            col, row = idx % 2, idx // 2
            px = x1 + 35 + col * (pill_w + 40)
            py = y1 + 105 + row * 94
            rounded_box(d, (px, py, px + pill_w, py + 68), table_name, fill="white", outline="#8BB9DF", title_size=20)

    cards = {
        "account": (70, 160, 930, 560),
        "catalog": (1170, 160, 2030, 600),
        "inventory": (2270, 160, 3130, 560),
        "cart": (70, 730, 930, 1110),
        "order": (1170, 700, 2030, 1160),
        "payment": (2270, 730, 3130, 1110),
        "promotion": (70, 1300, 930, 1700),
        "fulfillment": (1170, 1300, 2030, 1700),
        "platform": (2270, 1300, 3130, 1700),
    }
    # Radial relations around the order aggregate: each relation owns a separate corridor.
    relations = [
        ((1270, 700), (930, 560)), ((1600, 700), (1600, 600)), ((1930, 700), (2270, 560)),
        ((1170, 930), (930, 930)), ((2030, 930), (2270, 930)),
        ((1270, 1160), (930, 1300)), ((1600, 1160), (1600, 1300)), ((1930, 1160), (2270, 1300)),
    ]
    for start, end in relations: arrow(d, start, end, color="#A4ADBA", width=4, head=14)
    domain_card(cards["account"], "Tài khoản", ["users", "addresses", "roles", "user_roles"])
    domain_card(cards["catalog"], "Danh mục", ["categories", "products", "product_categories", "product_variants", "product_media"])
    domain_card(cards["inventory"], "Tồn kho", ["warehouses", "inventory_items", "inventory_movements", "inventory_reservations"])
    domain_card(cards["cart"], "Giỏ hàng", ["carts", "cart_items"])
    domain_card(cards["order"], "Đơn hàng - aggregate trung tâm", ["customer_orders", "order_items", "order_status_history"], central=True)
    domain_card(cards["payment"], "Thanh toán", ["payments", "payment_events", "refunds"])
    domain_card(cards["promotion"], "Khuyến mãi", ["promotions", "coupons", "order_promotions"])
    domain_card(cards["fulfillment"], "Giao nhận", ["fulfillments", "fulfillment_items"])
    domain_card(cards["platform"], "Nền tảng", ["outbox_events", "audit_logs"])
    d.text((80, 1780), "Các đường quan hệ được bố trí dạng xuyên tâm quanh aggregate đơn hàng; không có hai quan hệ giao cắt nhau.", font=font(24, italic=True), fill="#667085")
    return save(img, "10-erd-tong-quan-28-bang.png")


def draw_entity(d, x, y, w, title, fields, fill="#F8FAFC"):
    row_h=45; h=70+row_h*len(fields)
    d.rounded_rectangle((x,y,x+w,y+h),radius=12,fill=fill,outline="#2E74B5",width=3)
    d.rectangle((x,y,x+w,y+65),fill="#0B2545")
    draw_text_center(d,(x+w/2,y+32),title,font(25,True),"white",w-20)
    yy=y+72
    for field in fields:
        d.text((x+18,yy),field,font=font(20),fill="#344054")
        yy+=row_h
    return (x,y,x+w,y+h)


def ortho_arrow(d, points, color="#667085", width=4, head=14):
    if len(points) < 2:
        return
    d.line(points, fill=color, width=width, joint="curve")
    arrow(d, points[-2], points[-1], color=color, width=width, head=head)


def relation_tag(d, xy, text):
    x, y = xy
    box = d.textbbox((0, 0), text, font=font(19, True))
    w = box[2] - box[0] + 24
    h = box[3] - box[1] + 16
    d.rounded_rectangle((x - w / 2, y - h / 2, x + w / 2, y + h / 2), radius=8, fill="white", outline="#D0D5DD", width=2)
    draw_text_center(d, (x, y), text, font(19, True), "#475467", w - 12)


def make_erd_catalog_inventory():
    img, d = canvas("ERD chi tiết - Catalog và tồn kho lõi", size=(3000, 1800))
    ents = {}
    ents["categories"] = draw_entity(d, 70, 200, 450, "categories", ["PK id", "FK parent_id", "UK slug", "name, status"])
    ents["pc"] = draw_entity(d, 600, 850, 520, "product_categories", ["PK/FK product_id", "PK/FK category_id", "is_primary", "sort_order"])
    ents["products"] = draw_entity(d, 720, 180, 500, "products", ["PK id", "UK slug", "name, status", "published_at"])
    ents["variants"] = draw_entity(d, 1430, 170, 550, "product_variants", ["PK id", "FK product_id", "UK sku", "size, color", "price, status", "version"])
    ents["media"] = draw_entity(d, 1180, 920, 560, "product_media", ["PK id", "FK product_id", "FK variant_id", "url, alt_text", "is_primary"])
    ents["warehouses"] = draw_entity(d, 2300, 130, 500, "warehouses", ["PK id", "UK code", "name, status", "address"])
    ents["items"] = draw_entity(d, 2260, 620, 570, "inventory_items", ["PK id", "FK warehouse_id", "FK variant_id", "on_hand, reserved", "safety_stock", "version"])
    ents["movements"] = draw_entity(d, 1830, 1260, 540, "inventory_movements", ["PK id", "FK inventory_item_id", "quantity_delta", "balance_after", "reference, reason", "idempotency_key"])
    ents["reservations"] = draw_entity(d, 2440, 1260, 520, "inventory_reservations", ["PK id", "FK inventory_item_id", "FK order_id", "quantity, status", "expires_at"])

    ortho_arrow(d, [(520, 380), (560, 380), (560, 940), (600, 940)])
    relation_tag(d, (560, 650), "category_id")
    ortho_arrow(d, [(930, 475), (930, 760), (900, 760), (900, 850)])
    relation_tag(d, (935, 735), "product_id")
    ortho_arrow(d, [(1220, 330), (1430, 330)])
    relation_tag(d, (1325, 305), "1 : n")
    ortho_arrow(d, [(980, 475), (980, 790), (1320, 790), (1320, 920)])
    relation_tag(d, (1135, 790), "product_id")
    ortho_arrow(d, [(1710, 575), (1710, 830), (1580, 830), (1580, 920)])
    relation_tag(d, (1660, 830), "variant_id")
    ortho_arrow(d, [(1980, 380), (2110, 380), (2110, 820), (2260, 820)])
    relation_tag(d, (2110, 600), "variant_id")
    ortho_arrow(d, [(2550, 425), (2550, 620)])
    relation_tag(d, (2615, 520), "warehouse_id")
    ortho_arrow(d, [(2420, 1005), (2420, 1150), (2100, 1150), (2100, 1260)])
    relation_tag(d, (2250, 1150), "movement")
    ortho_arrow(d, [(2680, 1005), (2680, 1260)])
    relation_tag(d, (2760, 1140), "reservation")
    d.text((80, 1715), "Đường nối dùng hành lang riêng và nhãn FK; không đi xuyên qua thực thể hoặc giao cắt với quan hệ khác.", font=font(24, italic=True), fill="#667085")
    return save(img, "11-erd-danh-muc-ton-kho.png")


def make_erd_order_payment():
    img, d = canvas("ERD chi tiết - Đơn hàng, thanh toán và giao nhận", size=(3200, 1900))
    o = draw_entity(d, 1200, 150, 760, "customer_orders", ["PK id", "UK order_number", "FK user_id", "status", "customer snapshot", "subtotal/discount/ship/tax/total", "idempotency_key, version"])
    oi = draw_entity(d, 80, 730, 610, "order_items", ["PK id", "FK order_id", "FK variant_id", "SKU/name/attribute snapshot", "unit_price, quantity, line_total"])
    hist = draw_entity(d, 820, 730, 540, "order_status_history", ["PK id", "FK order_id", "from/to status", "actor, reason", "correlation_id"])
    pay = draw_entity(d, 1530, 730, 550, "payments", ["PK id", "FK order_id", "method, provider_ref", "status, amount, currency", "attempt_no", "idempotency_key"])
    fulfill = draw_entity(d, 2310, 730, 570, "fulfillments", ["PK id", "FK order_id", "warehouse_id", "status", "carrier, tracking", "shipped/delivered_at"])
    res = draw_entity(d, 80, 1350, 610, "inventory_reservations", ["PK id", "FK inventory_item_id", "FK order_id", "quantity, status", "expires_at"])
    pe = draw_entity(d, 1450, 1350, 520, "payment_events", ["PK id", "FK payment_id", "UK provider/event_id", "signature_valid", "processing_status"])
    refund = draw_entity(d, 2050, 1350, 500, "refunds", ["PK id", "FK payment_id", "amount, status", "reason", "idempotency_key"])
    fi = draw_entity(d, 2630, 1350, 500, "fulfillment_items", ["PK id", "FK fulfillment_id", "FK order_item_id", "quantity"])

    # Ordered fan-out from the aggregate root; connection order matches child order.
    for start, end, label in [
        ((1280, 535), (385, 730), "items"), ((1450, 535), (1090, 730), "history"),
        ((1700, 535), (1805, 730), "payments"), ((1880, 535), (2595, 730), "fulfillments"),
    ]:
        arrow(d, start, end, color="#667085", width=4, head=14)
        relation_tag(d, ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 24), label)
    ortho_arrow(d, [(1200, 430), (45, 430), (45, 1500), (80, 1500)])
    relation_tag(d, (45, 960), "order_id")
    ortho_arrow(d, [(1805, 1115), (1805, 1230), (1710, 1230), (1710, 1350)])
    relation_tag(d, (1760, 1230), "events")
    ortho_arrow(d, [(1940, 1115), (1940, 1260), (2300, 1260), (2300, 1350)])
    relation_tag(d, (2120, 1260), "refunds")
    ortho_arrow(d, [(2595, 1160), (2595, 1240), (2880, 1240), (2880, 1350)])
    relation_tag(d, (2735, 1240), "fulfillment_id")
    # fulfillment_items -> order_items uses an isolated bottom corridor.
    ortho_arrow(d, [(2630, 1580), (2580, 1580), (2580, 1810), (385, 1810), (385, 1115)])
    relation_tag(d, (1480, 1810), "order_item_id")
    d.text((80, 1845), "Quan hệ nhiều nhánh được fan-out theo thứ tự và quan hệ dài dùng hành lang đáy riêng, không cắt qua thực thể.", font=font(23, italic=True), fill="#667085")
    return save(img, "12-erd-don-thanh-toan-giao-hang.png")


def make_erd_inventory_operations():
    img, d = canvas("ERD mở rộng - Inventory Operations", size=(3000, 1800))
    warehouses = draw_entity(d, 80, 220, 500, "warehouses", ["PK id", "UK code", "name, status", "address"])
    items = draw_entity(d, 830, 180, 570, "inventory_items", ["PK id", "FK warehouse_id", "FK variant_id", "on_hand, reserved", "safety_stock", "version"])
    reservations = draw_entity(d, 1690, 210, 540, "inventory_reservations", ["PK id", "FK inventory_item_id", "FK order_id", "quantity, status", "expires_at"])
    movements = draw_entity(d, 850, 1080, 570, "inventory_movements", ["PK id", "FK inventory_item_id", "quantity_delta", "balance_after", "reference_type/id", "reason, idempotency_key"])
    operations = draw_entity(d, 80, 1010, 610, "inventory_operations  [MỞ RỘNG]", ["PK id", "type: receipt/transfer/count", "source/destination warehouse", "status, actor, reason", "idempotency_key", "approved/posted_at"] , fill="#F1F8F1")
    operation_items = draw_entity(d, 1840, 1040, 660, "inventory_operation_items  [MỞ RỘNG]", ["PK id", "FK operation_id", "FK inventory_item_id", "expected/actual quantity", "quantity_delta", "note"] , fill="#F1F8F1")
    product_variants = draw_entity(d, 2410, 220, 500, "product_variants", ["PK id", "FK product_id", "UK sku", "size, color", "status"])

    ortho_arrow(d, [(580, 380), (700, 380), (700, 360), (830, 360)])
    relation_tag(d, (700, 330), "warehouse_id")
    ortho_arrow(d, [(1400, 380), (1690, 380)])
    relation_tag(d, (1545, 350), "reservation")
    ortho_arrow(d, [(2410, 380), (2320, 380), (2320, 700), (1400, 700), (1400, 540)])
    relation_tag(d, (1890, 700), "variant_id")
    ortho_arrow(d, [(1120, 565), (1120, 1080)])
    relation_tag(d, (1200, 820), "ledger")
    ortho_arrow(d, [(330, 515), (330, 1010)])
    relation_tag(d, (420, 760), "source/destination")
    # Quan hệ operation -> item đi qua hành lang riêng bên dưới entity movement.
    # Cách đi này giữ đường nối không xuyên qua hộp dữ liệu và không giao với các FK khác.
    ortho_arrow(d, [(690, 1260), (760, 1260), (760, 1470), (1760, 1470), (1760, 1260), (1840, 1260)])
    relation_tag(d, (1260, 1440), "1 : n")
    ortho_arrow(d, [(2170, 1040), (2170, 880), (1370, 880), (1370, 540)])
    relation_tag(d, (1780, 880), "inventory_item_id")
    d.rounded_rectangle((1620, 1510, 2910, 1680), radius=18, fill="#EEF6FD", outline="#8BB9DF", width=3)
    d.text((1660, 1545), "Mô hình mở rộng dùng một aggregate operation chung cho nhập hàng, chuyển kho và kiểm kê.", font=font(24, True), fill="#0B2545")
    d.text((1660, 1595), "Khi POSTED, hệ thống cập nhật balance và sinh movement trong cùng transaction.", font=font(23), fill="#344054")
    return save(img, "19-erd-inventory-operations.png")


def make_timeline():
    img,d=canvas("Kế hoạch MVP 8 tuần - 4 sprint",size=(2800,1500))
    weeks=[f"Tuần {i}" for i in range(1,9)]
    x0=600; unit=260
    for i,w in enumerate(weeks):
        d.rectangle((x0+i*unit,150,x0+(i+1)*unit,1350),outline="#D0D5DD",width=2)
        draw_text_center(d,(x0+i*unit+unit/2,190),w,font(25,True),"#344054",unit-10)
    tracks=[
        ("PM",[(1,2,"Scope / Rule / Provider"),(3,4,"Acceptance / RAID"),(5,6,"UAT / Content"),(7,8,"Go-live")],"#9A6700"),
        ("Frontend",[(1,2,"Prototype / Shell"),(3,4,"Browse / Cart"),(5,6,"Checkout / Admin"),(7,8,"A11y / Fix")],"#2E74B5"),
        ("Backend 1",[(1,2,"Auth / Catalog"),(3,4,"Cart / Pricing"),(5,6,"Order / Admin"),(7,8,"Regression")],"#1F4D78"),
        ("Backend 2",[(1,2,"Inventory"),(3,4,"Shipping / Pay"),(5,6,"Payment / Fulfill"),(7,8,"Integration")],"#5B9BD5"),
        ("DevOps",[(1,2,"CI/CD / Env"),(3,4,"Observability"),(5,6,"Load / Prod prep"),(7,8,"DR / Release")],"#2E7D32")]
    y=300
    for role,blocks,color in tracks:
        d.text((80,y+32),role,font=font(31,True),fill="#0B2545")
        for s,e,label in blocks:
            x1=x0+(s-1)*unit+12; x2=x0+e*unit-12
            d.rounded_rectangle((x1,y,x2,y+95),radius=16,fill=color,outline=color)
            draw_text_center(d,((x1+x2)/2,y+48),label,font(23,True),"white",x2-x1-24)
        y+=195
    d.line((x0+6*unit,250,x0+6*unit,1300),fill="#9B1C1C",width=6)
    d.text((x0+6*unit+15,1260),"Khóa tính năng / hardening",font=font(22,True),fill="#9B1C1C")
    return save(img,"13-timeline-8-tuan.png")


def generate_diagrams():
    return {
        "survey": make_survey_chart(), "problem": make_problem_tree(), "journey": make_journey(),
        "kpi": make_kpi_tree(), "context": make_system_context(), "architecture": make_architecture(),
        "use_cases": make_use_cases(), "use_case_storefront": make_use_case_storefront(),
        "use_case_admin": make_use_case_admin(), "use_case_inventory": make_use_case_inventory(),
        "sequence": make_sequence(), "order_state": make_order_state(),
        "erd_overview": make_erd_overview(), "erd_catalog": make_erd_catalog_inventory(),
        "erd_order": make_erd_order_payment(), "erd_inventory_ops": make_erd_inventory_operations(),
        "timeline": make_timeline(),
    }


def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tcPr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, val in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tcMar.append(node)
        node.set(qn("w:w"), str(val)); node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)


def set_table_geometry(table, widths_in):
    widths = [int(w*1440) for w in widths_in]
    total = sum(widths)
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    tblPr = table._tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW"); tblPr.append(tblW)
    tblW.set(qn("w:w"), str(total)); tblW.set(qn("w:type"), "dxa")
    tblInd = tblPr.find(qn("w:tblInd"))
    if tblInd is None:
        tblInd = OxmlElement("w:tblInd"); tblPr.append(tblInd)
    tblInd.set(qn("w:w"), "120"); tblInd.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid): grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol"); col.set(qn("w:w"), str(width)); grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn("w:tcW"))
            if tcW is None: tcW=OxmlElement("w:tcW"); tcPr.append(tcW)
            tcW.set(qn("w:w"), str(widths[idx])); tcW.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_run_font(run, name="Calibri", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    if size is not None: run.font.size = Pt(size)
    if color is not None: run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None: run.bold = bold
    if italic is not None: run.italic = italic


def add_page_field(paragraph, field):
    run = paragraph.add_run()
    fldChar1 = OxmlElement("w:fldChar"); fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText"); instrText.set(qn("xml:space"), "preserve"); instrText.text = field
    fldChar2 = OxmlElement("w:fldChar"); fldChar2.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t"); text.text = "1"
    fldChar3 = OxmlElement("w:fldChar"); fldChar3.set(qn("w:fldCharType"), "end")
    for e in (fldChar1,instrText,fldChar2,text,fldChar3): run._r.append(e)
    set_run_font(run,size=9,color=MID_GRAY)


def add_toc(paragraph):
    run = paragraph.add_run()
    begin=OxmlElement("w:fldChar"); begin.set(qn("w:fldCharType"),"begin")
    instr=OxmlElement("w:instrText"); instr.set(qn("xml:space"),"preserve"); instr.text='TOC \\o "1-1" \\h \\z \\u'
    sep=OxmlElement("w:fldChar"); sep.set(qn("w:fldCharType"),"separate")
    text=OxmlElement("w:t"); text.text="Mục lục sẽ được cập nhật khi mở trong Microsoft Word."
    end=OxmlElement("w:fldChar"); end.set(qn("w:fldCharType"),"end")
    for e in (begin,instr,sep,text,end): run._r.append(e)


def configure_doc(doc):
    sec=doc.sections[0]
    sec.page_width=Inches(8.5); sec.page_height=Inches(11)
    sec.top_margin=sec.bottom_margin=sec.left_margin=sec.right_margin=Inches(1)
    sec.header_distance=sec.footer_distance=Inches(0.492)
    sec.different_first_page_header_footer=True
    styles=doc.styles
    normal=styles['Normal']; normal.font.name='Calibri'; normal.font.size=Pt(11)
    normal._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); normal._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); normal._element.rPr.rFonts.set(qn('w:eastAsia'),'Calibri')
    normal.paragraph_format.space_before=Pt(0); normal.paragraph_format.space_after=Pt(6); normal.paragraph_format.line_spacing=1.10
    for name,size,color,before,after in [('Heading 1',16,BLUE,16,8),('Heading 2',13,BLUE,12,6),('Heading 3',12,DARK_BLUE,8,4)]:
        st=styles[name]; st.font.name='Calibri'; st.font.size=Pt(size); st.font.bold=True; st.font.color.rgb=RGBColor.from_string(color)
        st._element.rPr.rFonts.set(qn('w:ascii'),'Calibri'); st._element.rPr.rFonts.set(qn('w:hAnsi'),'Calibri'); st._element.rPr.rFonts.set(qn('w:eastAsia'),'Calibri')
        st.paragraph_format.space_before=Pt(before); st.paragraph_format.space_after=Pt(after); st.paragraph_format.keep_with_next=True
    for name in ['List Bullet','List Number']:
        st=styles[name]; st.font.name='Calibri'; st.font.size=Pt(11); st.paragraph_format.left_indent=Inches(.5); st.paragraph_format.first_line_indent=Inches(-.25); st.paragraph_format.space_after=Pt(8); st.paragraph_format.line_spacing=1.167
    cap=styles['Caption']; cap.font.name='Calibri'; cap.font.size=Pt(9); cap.font.italic=True; cap.font.color.rgb=RGBColor.from_string(MID_GRAY); cap.paragraph_format.space_before=Pt(3); cap.paragraph_format.space_after=Pt(9); cap.paragraph_format.keep_with_next=False
    # Header/footer
    hp=sec.header.paragraphs[0]; hp.text="ONLINE FASHION STORE  |  BÁO CÁO TỔNG HỢP"; hp.alignment=WD_ALIGN_PARAGRAPH.LEFT
    set_run_font(hp.runs[0],size=9,color=MID_GRAY,bold=True)
    fp=sec.footer.paragraphs[0]; fp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    r=fp.add_run("Trang "); set_run_font(r,size=9,color=MID_GRAY); add_page_field(fp,"PAGE"); r=fp.add_run(" / "); set_run_font(r,size=9,color=MID_GRAY); add_page_field(fp,"NUMPAGES")


def add_para(doc,text,bold_lead=None,italic=False,align=None,after=6):
    p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(after)
    if align is not None: p.alignment=align
    if bold_lead and text.startswith(bold_lead):
        r=p.add_run(bold_lead); set_run_font(r,bold=True)
        r=p.add_run(text[len(bold_lead):]); set_run_font(r,italic=italic)
    else:
        r=p.add_run(text); set_run_font(r,italic=italic)
    return p


def add_bullets(doc,items):
    for item in items:
        p=doc.add_paragraph(style='List Bullet'); r=p.add_run(item); set_run_font(r)


def add_numbered(doc,items):
    for index,item in enumerate(items, start=1):
        p=doc.add_paragraph()
        p.paragraph_format.left_indent=Inches(.5)
        p.paragraph_format.first_line_indent=Inches(-.25)
        p.paragraph_format.space_after=Pt(8)
        p.paragraph_format.line_spacing=1.167
        r=p.add_run(f"{index}. "); set_run_font(r,bold=True)
        r=p.add_run(item); set_run_font(r)


def add_callout(doc,title,text,kind='info',width=6.5):
    table=doc.add_table(rows=1,cols=1)
    set_table_geometry(table,[width])
    cell=table.cell(0,0)
    fill={'info':PALE_BLUE,'warning':PALE_GOLD,'risk':PALE_RED,'success':PALE_GREEN}[kind]
    set_cell_shading(cell,fill)
    p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(3)
    r=p.add_run(title+"  "); set_run_font(r,bold=True,color=NAVY)
    r=p.add_run(text); set_run_font(r,color=DARK_GRAY)
    doc.add_paragraph().paragraph_format.space_after=Pt(2)


def add_table(doc,headers,rows,widths,font_size=9.2):
    table=doc.add_table(rows=1,cols=len(headers))
    set_table_geometry(table,widths)
    set_repeat_table_header(table.rows[0])
    for i,h in enumerate(headers):
        c=table.rows[0].cells[i]; set_cell_shading(c,LIGHT_GRAY)
        p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=p.add_run(str(h)); set_run_font(r,size=font_size,bold=True,color=NAVY)
    for ridx,row in enumerate(rows):
        cells=table.add_row().cells
        for i,val in enumerate(row):
            if ridx%2==1: set_cell_shading(cells[i],"FAFBFC")
            p=cells[i].paragraphs[0]
            p.paragraph_format.space_after=Pt(0); p.paragraph_format.line_spacing=1.0
            if i==0 and len(headers)>2: p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            r=p.add_run(str(val)); set_run_font(r,size=font_size,color=BLACK)
    doc.add_paragraph().paragraph_format.space_after=Pt(2)
    return table


def add_figure(doc,path,caption,width=6.25):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_after=Pt(2); p.paragraph_format.keep_with_next=True
    run=p.add_run(); shape=run.add_picture(str(path),width=Inches(width))
    shape._inline.docPr.set("descr", caption)
    shape._inline.docPr.set("title", caption.split(".", 1)[0])
    c=doc.add_paragraph(caption,style='Caption'); c.alignment=WD_ALIGN_PARAGRAPH.CENTER


def chapter(doc,num,title):
    doc.add_page_break()
    h=doc.add_heading(f"CHƯƠNG {num}. {title}",level=1)
    h.paragraph_format.keep_with_next=True


def add_landscape_figure(doc,title,path,caption,chapter_title=None,callout=None):
    sec=doc.add_section(WD_SECTION.NEW_PAGE)
    sec.orientation=WD_ORIENT.LANDSCAPE
    sec.different_first_page_header_footer=False
    sec.page_width=Inches(11.69); sec.page_height=Inches(8.27)
    sec.top_margin=sec.bottom_margin=sec.left_margin=sec.right_margin=Inches(.65)
    sec.header_distance=sec.footer_distance=Inches(.35)
    if chapter_title:
        chapter_heading=doc.add_heading(chapter_title,level=1)
        chapter_heading.paragraph_format.page_break_before=False
    if callout:
        add_callout(doc,callout[0],callout[1],callout[2],width=9.7)
    h=doc.add_heading(title,level=2)
    figure_width=8.45 if chapter_title and callout else 9.35
    add_figure(doc,path,caption,width=figure_width)
    sec2=doc.add_section(WD_SECTION.NEW_PAGE)
    sec2.orientation=WD_ORIENT.PORTRAIT
    sec2.different_first_page_header_footer=False
    sec2.page_width=Inches(8.27); sec2.page_height=Inches(11.69)
    sec2.top_margin=sec2.bottom_margin=Inches(.79)
    sec2.left_margin=Inches(1.18); sec2.right_margin=Inches(.79)
    sec2.header_distance=sec2.footer_distance=Inches(.492)


def add_cover(doc):
    p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(95); p.paragraph_format.space_after=Pt(18); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run("BÁO CÁO TỔNG HỢP DỰ ÁN"); set_run_font(r,size=14,color=GOLD,bold=True)
    p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(10); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run("CỬA HÀNG THỜI TRANG\nTRỰC TUYẾN"); set_run_font(r,size=29,color=NAVY,bold=True)
    p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(38); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run("Business Case · Product · Business Analysis · Technical Design · Delivery Plan"); set_run_font(r,size=12.5,color=DARK_BLUE,italic=True)
    # restrained accent band as callout
    t=doc.add_table(rows=1,cols=1); set_table_geometry(t,[5.25]); t.alignment=WD_TABLE_ALIGNMENT.CENTER; set_cell_shading(t.cell(0,0),PALE_BLUE)
    cp=t.cell(0,0).paragraphs[0]; cp.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=cp.add_run("MVP 8 tuần  |  Đội 5 người  |  Thị trường Việt Nam"); set_run_font(r,size=11.5,color=NAVY,bold=True)
    p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(110); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    r=p.add_run("Phiên bản 1.0 · 30/08/2026\nTrạng thái: Bản đề xuất để thẩm định"); set_run_font(r,size=10,color=MID_GRAY)
    doc.add_page_break()


def build_document(diagrams):
    doc=Document(); configure_doc(doc); add_cover(doc)
    doc.add_heading("Thông tin tài liệu",level=1)
    add_table(doc,["Thuộc tính","Nội dung"],[
        ("Mục đích","Tổng hợp lý do đầu tư, yêu cầu sản phẩm/nghiệp vụ, thiết kế kỹ thuật và kế hoạch triển khai."),
        ("Đối tượng đọc","Sponsor, PO/PM/BA, UX, Backend, Frontend, DevOps, QA và vận hành."),
        ("Phạm vi","Website B2C thời trang tại Việt Nam, responsive web, COD và thanh toán trực tuyến."),
        ("Nguồn","Bộ tài liệu Markdown trong repository và nguồn thị trường công khai được trích ở cuối báo cáo."),
        ("Trạng thái dữ liệu","Số liệu thị trường có nguồn; khảo sát/phỏng vấn/tài chính nội bộ là mô phỏng cho đến khi được thay bằng dữ liệu thật."),
    ],[1.55,4.95],font_size=9.5)
    add_callout(doc,"LƯU Ý VỀ BẰNG CHỨNG", "Khảo sát n=200, phỏng vấn và mô hình tài chính trong báo cáo là dữ liệu synthetic để hoàn thiện thiết kế. Không được trình bày như nghiên cứu đã thực hiện thật hoặc dùng để duyệt ngân sách cuối.","warning")
    doc.add_heading("Mục lục",level=1)
    add_toc(doc.add_paragraph())

    chapter(doc,1,"TÓM TẮT ĐIỀU HÀNH")
    add_callout(doc,"KHUYẾN NGHỊ", "Go có điều kiện cho MVP 8 tuần với đội 5 người; ưu tiên nền tảng SaaS/hybrid, chỉ cam kết Must-have và xác minh khảo sát thật trước khi khóa phạm vi.","success")
    add_para(doc,"Thương mại điện tử Việt Nam đang ở quy mô đủ lớn để website riêng không còn là một thử nghiệm thuần công nghệ. Tuy nhiên, website chỉ tạo giá trị khi được coi là kênh giao dịch và dữ liệu sở hữu riêng, kết nối social/SEO/campaign, thay vì kỳ vọng tự tạo traffic.")
    add_para(doc,"Dự án giải quyết đồng thời hai nhóm vấn đề: khách hàng thiếu tự tin về size, ảnh, phí, đổi trả và trạng thái đơn; doanh nghiệp thiếu một nguồn sự thật cho catalog, tồn, order, payment, fulfillment và funnel.")
    add_table(doc,["Góc nhìn","Kết luận chính","Quyết định"],[
        ("Thị trường","TMĐT Việt Nam tăng trưởng nhanh; social/video vẫn là acquisition engine.","Xây kênh sở hữu, không tách rời social/sàn."),
        ("Khách hàng","Size, ảnh, return và total transparency là pain point lớn.","Khác biệt bằng fit confidence và trust."),
        ("Kỹ thuật","Order/payment/inventory cần idempotency, audit và reconciliation.","Không custom payment/logistics rail; tích hợp provider."),
        ("Triển khai","8 tuần/5 người có rủi ro cao nếu scope rộng.","Must-only, freeze đầu tuần 7, UAT tuần 8."),
        ("Tài chính","Kịch bản mô phỏng payback khoảng tháng 15.","Finance thay input thật và chạy sensitivity."),
    ],[1.1,2.7,2.7])
    doc.add_heading("Điều kiện Go",level=2)
    add_numbered(doc,[
        "Có Sponsor, PM kiêm PO/BA và SLA quyết định tối đa một ngày làm việc.",
        "Chốt platform, payment và shipping sandbox trước cuối tuần 2.",
        "Catalog, ảnh, size chart và chính sách có owner và content freeze.",
        "Khảo sát thật tối thiểu 120 người, 8–12 phỏng vấn và 2 vòng prototype test.",
        "Must-have estimate nằm trong capacity sau khi giữ tối thiểu 50% Sprint 4 cho hardening/release.",
    ])

    chapter(doc,2,"BỐI CẢNH VÀ LÝ DO THỰC HIỆN")
    doc.add_heading("2.1 Bối cảnh thị trường",level=2)
    add_table(doc,["Chỉ báo","Số liệu","Hàm ý"],[
        ("TMĐT Việt Nam 2025","Khoảng 32 tỷ USD; gần 12% tổng bán lẻ; tăng >20%","Thị trường trực tuyến đã trở thành kênh bán lẻ đáng kể."),
        ("Kinh tế số Việt Nam 2024","Khoảng 36 tỷ USD GMV","Hạ tầng và hành vi số đủ trưởng thành."),
        ("TMĐT Việt Nam 2024","Khoảng 22 tỷ USD GMV theo e-Conomy SEA","TMĐT là động lực chính của kinh tế số."),
        ("Video commerce SEA 2024","20% GMV TMĐT, từ <5% năm 2022","Website phải nối với social/video journey."),
    ],[1.55,1.7,3.25])
    add_para(doc,"Các nguồn có định nghĩa và methodology khác nhau; báo cáo dùng để xác nhận xu hướng, không trộn thành một chuỗi dự báo duy nhất.",italic=True)
    doc.add_heading("2.2 Vấn đề kinh doanh",level=2)
    add_figure(doc,diagrams['problem'],"Hình 2.1. Cây vấn đề: từ thiếu kênh sở hữu đến tác động doanh thu và vận hành.")
    add_bullets(doc,[
        "Khách phải nhắn hỏi size, màu, tồn và phí; trải nghiệm không tự phục vụ.",
        "Nhân viên kiểm tra nhiều file/chat; dễ sai SKU, địa chỉ, giá và trạng thái.",
        "Marketing không nối được campaign→order→repeat purchase.",
        "Doanh nghiệp phụ thuộc nền tảng về traffic, dữ liệu, chính sách và phí.",
    ])
    doc.add_heading("2.3 Mục tiêu kinh doanh",level=2)
    add_table(doc,["Mục tiêu","Kết quả mong đợi","KPI"],[
        ("Kênh giao dịch sở hữu riêng","Đơn đi từ catalog đến delivered/cancelled","Orders, conversion, AOV"),
        ("Giảm ma sát mua","Chọn đúng variant, total rõ, guest checkout","PDP→cart, checkout completion"),
        ("Chuẩn hóa vận hành","Order/payment/inventory có state và audit","Lead time, oversell, cancel"),
        ("Nền tảng dữ liệu","Event funnel và report nhất quán","Event quality, attribution, repeat"),
    ],[1.45,2.85,2.2])

    chapter(doc,3,"NGHIÊN CỨU THỊ TRƯỜNG VÀ NGƯỜI DÙNG")
    add_callout(doc,"PHƯƠNG PHÁP", "Dữ liệu dưới đây là mô phỏng n=200 có quota tuổi/giới tính/khu vực. Cấu trúc báo cáo sẵn sàng để thay bằng raw data thật sau 10 ngày research.","warning")
    doc.add_heading("3.1 Hồ sơ mẫu mô phỏng",level=2)
    add_table(doc,["Biến","Cơ cấu"],[
        ("Tuổi","18–24: 35%; 25–34: 40%; 35–44: 25%"),
        ("Giới tính","Nữ 60%; Nam 37%; Khác/không trả lời 3%"),
        ("Khu vực","TP.HCM 40%; Hà Nội 30%; Đà Nẵng 15%; đô thị khác 15%"),
        ("Sàng lọc","Đã mua quần áo online trong 6 tháng gần nhất"),
    ],[1.35,5.15])
    doc.add_heading("3.2 Pain points và cơ hội",level=2)
    add_figure(doc,diagrams['survey'],"Hình 3.1. Pain points của người mua - số liệu mô phỏng n=200.")
    add_table(doc,["Ưu tiên","Tỷ lệ mô phỏng","Ảnh hưởng thiết kế"],[
        ("Hướng dẫn size/số đo","72%","PDP Must; test theo category."),
        ("Tổng chi phí minh bạch","71%","Quote phí sớm và order review."),
        ("Chính sách đổi trả rõ","69%","Tóm tắt trên PDP/cart/checkout."),
        ("Ảnh thật/chất liệu","66%","Content gate trước launch."),
        ("Tồn theo size/màu","61%","ATP và concurrency đúng."),
    ],[2.1,1.3,3.1])
    doc.add_heading("3.3 Phỏng vấn mô phỏng và insight",level=2)
    add_bullets(doc,[
        "Size không chỉ là S/M/L: khách cần số đo, phom, model và cách đo.",
        "Phí xuất hiện muộn tạo cảm giác bị gài; tổng tiền cần được xác nhận server-side trước đặt.",
        "Guest checkout phù hợp first-time buyer; account được mời sau purchase.",
        "Return policy dễ hiểu là trust signal, không chỉ là trang pháp lý ở footer.",
        "Tracking tự phục vụ giúp giảm WISMO contacts cho CS.",
    ])
    doc.add_heading("3.4 Hành trình khách hàng",level=2)
    add_figure(doc,diagrams['journey'],"Hình 3.2. Hành trình khách hàng, pain points và cơ hội thiết kế.")

    chapter(doc,4,"ĐỊNH HƯỚNG SẢN PHẨM")
    doc.add_heading("4.1 Tầm nhìn",level=2)
    add_callout(doc,"TẦM NHÌN", "Tạo trải nghiệm mua thời trang ưu tiên mobile, giúp khách tìm đúng sản phẩm, chọn đúng biến thể, hiểu rõ chi phí và theo dõi đơn; đồng thời cung cấp nền tảng vận hành đáng tin cậy cho doanh nghiệp.","info")
    doc.add_heading("4.2 Nguyên tắc sản phẩm",level=2)
    add_bullets(doc,["Fit confidence.","Fast path to purchase.","Trust by design.","Mobile first.","Operationally realistic.","Measurable by default."])
    doc.add_heading("4.3 Phạm vi MVP",level=2)
    add_table(doc,["Trong phạm vi","Ngoài phạm vi"],[
        ("Home, PLP, search/filter, PDP, variant, size guide","Native app, đa ngôn ngữ/tiền tệ"),
        ("Cart, coupon cơ bản, guest/member checkout","Loyalty, gift card, subscription"),
        ("COD + một online payment provider","AI stylist/recommendation nâng cao"),
        ("Order confirmation/tracking/account history","Multi-warehouse optimization"),
        ("Admin catalog/inventory/order","Self-service return tự động"),
        ("Analytics, security, monitoring, backup","Marketplace đa nhà bán"),
    ],[3.25,3.25])
    doc.add_heading("4.4 KPI",level=2)
    add_figure(doc,diagrams['kpi'],"Hình 4.1. Cây KPI và guardrails của sản phẩm.")
    add_table(doc,["KPI","Định nghĩa","Cách đặt mục tiêu"],[
        ("Conversion","Order/session đủ điều kiện","Baseline 4 tuần; tối ưu theo source/category."),
        ("Checkout completion","Purchase/begin_checkout","Target sau baseline; theo device/payment."),
        ("Oversell","Đơn lỗi do ATP sai","Mục tiêu gần 0; alert mọi trường hợp."),
        ("Fulfillment lead time","Created/paid→ready_to_ship","Giảm 30% so quy trình cũ."),
        ("Repeat 90d","Khách ≥2 delivered orders","Theo cohort, không dùng vanity total."),
    ],[1.45,2.25,2.8])

    chapter(doc,5,"PHÂN TÍCH NGHIỆP VỤ VÀ YÊU CẦU")
    doc.add_heading("5.1 Tác nhân và trường hợp sử dụng",level=2)
    add_figure(doc,diagrams['use_cases'],"Hình 5.1. Tổng quan các trường hợp sử dụng chính.")
    doc.add_heading("5.2 Yêu cầu chức năng trọng tâm",level=2)
    add_table(doc,["Nhóm","Yêu cầu bắt buộc","Điều kiện nghiệm thu tóm tắt"],[
        ("Catalog","Category, search/filter, PDP, variant, stock","Chỉ published; URL/filter shareable; không ATC variant hết hàng."),
        ("Cart/Pricing","Add/update/remove, coupon, server-side total","Revalidate giá/tồn/coupon khi checkout."),
        ("Checkout","Guest/member, address, shipping, review","Place-order idempotent; total minh bạch."),
        ("Payment","COD + online, webhook, reconcile","Signature/amount/currency đúng; callback lặp không tạo side effect."),
        ("Order","Confirmation, lookup, history, transition","Ownership và state machine; audit mọi manual transition."),
        ("Admin","Catalog, tồn, order, RBAC","Permission server-side; movement/audit append-only."),
    ],[1.2,2.25,3.05],font_size=8.8)
    doc.add_heading("5.3 Quy tắc nghiệp vụ",level=2)
    add_bullets(doc,[
        "Backend là nguồn sự thật cho giá, discount, phí và total.",
        "Order item lưu snapshot tên, SKU, attributes và giá.",
        "SKU duy nhất và không tái sử dụng; ATP không âm nếu không có override được audit.",
        "Webhook/refund/reservation/movement đều idempotent.",
        "Order/payment/fulfillment chỉ chuyển theo state matrix hợp lệ.",
        "Customer chỉ đọc tài nguyên thuộc mình; guest lookup chống enumeration.",
    ])
    doc.add_heading("5.4 Yêu cầu phi chức năng",level=2)
    add_table(doc,["Nhóm","Mục tiêu"],[
        ("Hiệu năng","LCP p75 ≤2,5s; INP ≤200ms; CLS ≤0,1; API read p95 ≤500ms."),
        ("Sẵn sàng","99,9%/tháng sau stabilization; health check và alert critical path."),
        ("Bảo mật","TLS, encryption at rest, RBAC, rate limit, secure secret, OWASP controls."),
        ("Khôi phục","RPO ≤24h, RTO ≤4h; restore rehearsal trước go-live."),
        ("Truy vết","Correlation ID cho order/payment/inventory/admin action; không log secret/PII thừa."),
        ("Khả năng tiếp cận","Luồng mua hàng mục tiêu WCAG 2.2 AA."),
    ],[1.55,4.95])

    chapter(doc,6,"TỔNG QUAN GIẢI PHÁP KỸ THUẬT")
    doc.add_heading("6.1 Bối cảnh hệ thống",level=2)
    add_figure(doc,diagrams['context'],"Hình 6.1. Hệ thống và các tác nhân/tích hợp bên ngoài.")
    doc.add_heading("6.2 Kiến trúc logic",level=2)
    add_figure(doc,diagrams['architecture'],"Hình 6.2. Kiến trúc logic từ kênh đến nền tảng và provider.")
    doc.add_heading("6.3 Quyết định kỹ thuật khuyến nghị",level=2)
    add_table(doc,["Quyết định","Khuyến nghị","Lý do"],[
        ("Platform","SaaS/headless hoặc hybrid","Phù hợp 8 tuần; giảm rủi ro commerce core."),
        ("Database","PostgreSQL + UUID + timestamptz","Transaction, constraint, audit và JSONB khi cần."),
        ("External side effects","Transactional outbox","Order không rollback vì email/analytics lỗi."),
        ("Payment","Hosted page/SDK provider","Không lưu dữ liệu thẻ; giảm PCI scope."),
        ("Search/cache","Bắt đầu đơn giản, tách khi có scale","Tránh over-engineering MVP."),
        ("Observability","Structured logs, metrics, traces","Đối soát critical flow bằng correlation ID."),
    ],[1.35,2.2,2.95])
    doc.add_heading("6.4 Transaction và đồng thời",level=2)
    add_bullets(doc,[
        "Không giữ DB lock trong lúc gọi provider bên ngoài.",
        "Place order tạo order/items/reservation/payment/history/outbox trong transaction phù hợp.",
        "SKU cuối dùng conditional update/row lock; test 20 request đồng thời.",
        "Lock order cố định: order→payment→inventory items theo ID→reservation.",
        "Timeout provider được reconcile; không retry mù operation thiếu idempotency.",
    ])

    add_landscape_figure(
        doc,
        "7.1 ERD tổng quan",
        diagrams['erd_overview'],
        "Hình 7.1. ERD tổng quan 28 bảng theo miền nghiệp vụ.",
        chapter_title="CHƯƠNG 7. KIẾN TRÚC DỮ LIỆU VÀ ERD",
        callout=("QUY MÔ MÔ HÌNH", "28 bảng thuộc 9 miền: tài khoản, danh mục, tồn kho, giỏ hàng, đơn hàng, thanh toán, giao hàng, khuyến mãi và nền tảng/audit.", "info"),
    )
    doc.add_heading("7.2 Quy ước dữ liệu",level=2)
    add_bullets(doc,[
        "Khóa chính UUID; thời gian timestamptz lưu UTC; tiền numeric(18,2) + char(3).",
        "Khóa ngoại mặc định RESTRICT; CASCADE chỉ cho bảng nối không có ý nghĩa độc lập.",
        "Movement, history, payment event và audit là append-only; sửa sai bằng bản ghi bù.",
        "Dữ liệu PII được tối thiểu hóa, masking và không gửi vào analytics/log nếu không cần.",
    ])
    doc.add_heading("7.3 ERD danh mục và tồn kho",level=2)
    add_figure(doc,diagrams['erd_catalog'],"Hình 7.2. ERD chi tiết catalog, variant, media, warehouse và inventory.",width=6.35)
    doc.add_heading("7.4 ERD order, payment và fulfillment",level=2)
    add_figure(doc,diagrams['erd_order'],"Hình 7.3. ERD chi tiết order, payment, refund và fulfillment.",width=6.35)
    doc.add_heading("7.5 Bất biến dữ liệu",level=2)
    add_table(doc,["Bất biến","Quy tắc"],[
        ("ATP","on_hand - reserved - safety_stock; không âm nếu không override."),
        ("Order total","grand_total = subtotal - discount_total + shipping_total + tax_total."),
        ("Refund","Tổng refund succeeded ≤ payment captured/succeeded hợp lệ."),
        ("Snapshot","Catalog/promotion đổi không làm thay đổi đơn lịch sử."),
        ("Idempotency","Provider event/key chỉ tạo một kết quả nghiệp vụ."),
    ],[1.45,5.05])

    chapter(doc,8,"SƠ ĐỒ XỬ LÝ VÀ TRẠNG THÁI")
    doc.add_heading("8.1 Thanh toán trực tuyến",level=2)
    add_figure(doc,diagrams['sequence'],"Hình 8.1. Sequence thanh toán trực tuyến, webhook và inventory reservation.",width=6.35)
    add_para(doc,"Điểm kiểm soát quan trọng: client redirect không authoritative; webhook phải xác minh chữ ký/reference/amount/currency và chịu được duplicate/out-of-order.")
    doc.add_heading("8.2 Máy trạng thái đơn",level=2)
    add_figure(doc,diagrams['order_state'],"Hình 8.2. Máy trạng thái đơn và các trạng thái cuối.")
    add_table(doc,["Transition","Điều kiện","Side effect"],[
        ("PENDING_PAYMENT→CONFIRMED","Payment succeeded hợp lệ","Consume reservation, history, notification."),
        ("CONFIRMED→PROCESSING","Có quyền fulfill, không cancelled","Audit, SLA timestamp."),
        ("READY_TO_SHIP→SHIPPED","Tracking hoặc exception duyệt","Notification, shipped_at."),
        ("*→CANCELLED","Theo policy và trạng thái","Release stock; refund nếu đã thu."),
    ],[1.85,2.35,2.3])

    add_landscape_figure(
        doc,
        "9.1 Timeline và phân bổ đội",
        diagrams['timeline'],
        "Hình 9.1. Timeline 8 tuần cho PM, Frontend, hai Backend và DevOps.",
        chapter_title="CHƯƠNG 9. KẾ HOẠCH TRIỂN KHAI 8 TUẦN",
    )
    doc.add_heading("9.2 Đội hình và trách nhiệm",level=2)
    add_table(doc,["Vai trò","Trách nhiệm chính","Kiêm nhiệm"],[
        ("PM","Scope, RAID, stakeholder, release","PO/BA/UAT coordination"),
        ("Frontend","Storefront/admin UI, responsive, analytics","UI/UX thực thi, accessibility"),
        ("Backend 1","Catalog, auth, cart, pricing, order","Technical/domain lead"),
        ("Backend 2","Inventory, payment, shipping, fulfillment","Integration lead"),
        ("DevOps","CI/CD, env, security, observability, DR","NFR và E2E quality gate"),
    ],[1.3,3.05,2.15])
    doc.add_heading("9.3 Cột mốc",level=2)
    add_table(doc,["Mốc","Thời điểm","Điều kiện"],[
        ("Foundation ready","Cuối tuần 2","Scope/flow/provider, CI/CD, auth/catalog vertical slice."),
        ("Browse + cart ready","Cuối tuần 4","PDP→variant→cart, inventory/pricing và admin dùng được."),
        ("Transaction E2E","Cuối tuần 6","Checkout, payment, order, fulfillment và notification."),
        ("UAT entry","Đầu tuần 8","Must code complete; E2E pass; test data ổn định."),
        ("Go/No-Go","Cuối tuần 8","UAT, defect, security/performance/DR và support duyệt."),
    ],[1.55,1.35,3.6])
    doc.add_heading("9.4 Nguyên tắc điều hành",level=2)
    add_bullets(doc,[
        "Mỗi kỹ sư tối đa một task chính đang làm; hoàn tất vertical slice trước khi mở việc mới.",
        "Should/Could là stretch scope; feature freeze đầu tuần 7.",
        "Cross-review vì không có QA chuyên trách; DevOps giữ automated quality gates.",
        "Provider, content và Legal chạy song song từ tuần 1 để không thành critical blocker.",
    ])

    chapter(doc,10,"CHẤT LƯỢNG, RỦI RO VÀ PHÁT HÀNH")
    doc.add_heading("10.1 Chiến lược chất lượng",level=2)
    add_table(doc,["Lớp","Phạm vi","Chủ trì"],[
        ("Unit/static","Pricing, state, validation, lint/type","FE/BE1/BE2"),
        ("API/component","Catalog/cart/order/payment/inventory","BE1/BE2 + DevOps gate"),
        ("Integration","DB/provider/webhook/email/shipping","BE2/DevOps"),
        ("E2E","Browse→purchase→fulfill→track/cancel","DevOps + cả đội"),
        ("NFR","Performance, a11y, security, resilience, DR","DevOps; FE hỗ trợ a11y"),
        ("UAT","10 kịch bản business trọng tâm","PM + business testers"),
    ],[1.25,3.25,2.0])
    doc.add_heading("10.2 Rủi ro cao",level=2)
    add_table(doc,["Rủi ro","Điểm","Ứng phó"],[
        ("Payment sandbox chậm","20/Critical","Apply W1, mock adapter, COD fallback."),
        ("Scope creep","16/Critical","MoSCoW, change tolerance, protect Sprint 4."),
        ("Content/size/policy trễ","16/Critical","Template, owner, readiness tracker, freeze."),
        ("Đội thiếu QA/UX/BA chuyên trách","20/Critical","Cross-review, automation, Sponsor SLA."),
        ("Payment/inventory race","15/High","Idempotency, reservation, concurrency tests."),
        ("Mobile performance","16/Critical","Budget ảnh/script, measure mỗi sprint."),
    ],[2.2,1.0,3.3])
    doc.add_heading("10.3 Release gates",level=2)
    add_numbered(doc,[
        "100% Must-have UAT pass; không còn Sev-1/Sev-2.",
        "Security scan không còn Critical/High chưa xử lý hoặc chưa risk-accept.",
        "Performance, backup/restore, alert và rollback rehearsal có evidence.",
        "Catalog/price/stock/content/policy và provider production configuration được sign-off.",
        "Operations/CS/Finance được training; runbook và support roster sẵn sàng.",
    ])

    chapter(doc,11,"BUSINESS CASE VÀ KHUYẾN NGHỊ")
    doc.add_heading("11.1 Phương án",level=2)
    add_table(doc,["Phương án","Điểm trọng số","Nhận định"],[
        ("Không làm","2,90","Không đầu tư nhưng không giải quyết data/ops/ownership."),
        ("Chỉ tối ưu sàn/social","2,85","Nhanh nhưng tiếp tục phụ thuộc nền tảng."),
        ("SaaS/hybrid branded site","4,00","Phù hợp 8 tuần; cân bằng speed, ownership và risk."),
        ("Custom toàn bộ","3,25","Linh hoạt nhưng rủi ro cao với 5 người/8 tuần."),
    ],[2.35,1.25,2.9])
    doc.add_heading("11.2 Mô hình tài chính mô phỏng",level=2)
    add_table(doc,["Hạng mục","Giá trị mô phỏng"],[
        ("Đầu tư ban đầu","586,5 triệu VND"),("Opex tháng","46 triệu VND"),("AOV","650.000 VND"),
        ("Contribution margin","30%"),("Lợi ích ròng steady từ tháng 7","57,85 triệu/tháng"),("Payback sơ bộ","Khoảng tháng 15"),
    ],[3.8,2.7])
    add_callout(doc,"KẾT LUẬN", "Chọn SaaS/hybrid cho MVP, thực hiện research thật trước khóa scope, bảo vệ Sprint 4 và chỉ scale marketing sau khi data quality/funnel được xác minh.","success")
    doc.add_heading("11.3 Hành động tiếp theo",level=2)
    add_numbered(doc,[
        "Trong 10 ngày: khảo sát ≥120 người, phỏng vấn 8–12 khách + 5 stakeholder và test prototype.",
        "Finance thay mọi input synthetic bằng dữ liệu đơn/kênh/fee/margin thật.",
        "Tech chốt ADR platform, provider, data residency, reservation và retry/reconcile.",
        "Sponsor ra quyết định Go/No-Go và investment envelope sau Discovery Exit.",
    ])

    chapter(doc,"A","PHỤ LỤC - DANH MỤC 28 BẢNG DỮ LIỆU")
    table_rows=[
        ("Tài khoản","users","Danh tính khách/nhân viên","PII"),("Tài khoản","addresses","Sổ địa chỉ","PII"),("Tài khoản","roles","Vai trò/permissions","Nội bộ"),("Tài khoản","user_roles","Gán user-role","Nhạy cảm"),
        ("Danh mục","categories","Cây danh mục","Nội bộ/Public"),("Danh mục","products","Sản phẩm cấp mẫu","Public"),("Danh mục","product_categories","Nối product-category","Nội bộ"),("Danh mục","product_variants","SKU size/màu/giá","Nội bộ/Public"),("Danh mục","product_media","Ảnh/video metadata","Public"),
        ("Tồn kho","warehouses","Kho logic/vật lý","Nội bộ"),("Tồn kho","inventory_items","Balance theo kho/SKU","Nhạy cảm"),("Tồn kho","inventory_movements","Sổ cái biến động","Nhạy cảm"),("Tồn kho","inventory_reservations","Tồn giữ cho order","Nhạy cảm"),
        ("Giỏ","carts","Giỏ guest/member","PII nhẹ"),("Giỏ","cart_items","SKU/quantity trong giỏ","Nội bộ"),
        ("Đơn","customer_orders","Header, snapshot, totals","PII/Tài chính"),("Đơn","order_items","Snapshot dòng hàng","Tài chính"),("Đơn","order_status_history","Audit trạng thái","Nhạy cảm"),
        ("Thanh toán","payments","Payment attempts","Tài chính"),("Thanh toán","payment_events","Webhook receipt","Nhạy cảm"),("Thanh toán","refunds","Refund request/result","Tài chính"),
        ("Giao hàng","fulfillments","Shipment/tracking","PII/Nội bộ"),("Giao hàng","fulfillment_items","Order item allocation","Nội bộ"),
        ("Khuyến mãi","promotions","Conditions/benefits","Nội bộ"),("Khuyến mãi","coupons","Mã/usage","Nội bộ"),("Khuyến mãi","order_promotions","Discount snapshot","Tài chính"),
        ("Nền tảng","outbox_events","Sự kiện bất đồng bộ","Nội bộ"),("Nền tảng","audit_logs","Audit thao tác","Rất nhạy cảm"),
    ]
    add_table(doc,["Miền","Bảng","Mục đích","Phân loại"],table_rows,[1.1,1.75,2.6,1.05],font_size=8.4)
    doc.add_heading("A.1 Bảng trọng yếu và bất biến",level=2)
    add_bullets(doc,[
        "inventory_items/movements/reservations: balance, ledger và reservation phải nhất quán.",
        "customer_orders/order_items: totals và snapshot immutable sau place order.",
        "payments/payment_events/refunds: provider event unique, amount/currency reconcile và refund cap.",
        "outbox_events: at-least-once delivery; consumer dedup theo event ID.",
        "audit_logs: append-only, redaction, restricted access và retention theo Legal/Security.",
    ])

    chapter(doc,"B","PHỤ LỤC - PHÂN CÔNG 36 ĐẦU VIỆC")
    task_rows=[
        ("PM-001–004","PM","W1–2","Charter, Must scope, provider, rules/RTM/UAT"),("PM-005","PM","W1–8","Sprint, RAID, decision, dependency"),("PM-006–009","PM","W5–9","Content/UAT/Go-live/hypercare"),
        ("FE-001–002","FE","W1–2","Prototype, app shell, auth UI"),("FE-003","FE","W2–4","Home/PLP/search/filter/PDP"),("FE-004–006","FE","W3–6","Cart/checkout/order/admin UI"),("FE-007","FE","W7","A11y, browser/mobile, analytics, smoke"),
        ("BE1-001–003","BE1","W1–3","Architecture, auth, catalog/search"),("BE1-004","BE1","W3–4","Cart, pricing, coupon"),("BE1-005–006","BE1","W4–6","Checkout/order/admin/audit"),("BE1-007","BE1","W7–8","Regression/migration/fixes"),
        ("BE2-001–002","BE2","W2–4","Inventory và shipping"),("BE2-003–005","BE2","W4–6","Payment/reconcile/fulfillment/notification"),("BE2-006","BE2","W7–8","Integration regression/fixes"),
        ("DO-001–004","DevOps","W1–7","CI/CD, env, infra, observability, security"),("DO-005–006","DevOps","W6–7","E2E/load/concurrency/DR rehearsal"),("DO-007","DevOps","W8–9","Production deployment/hypercare"),
    ]
    add_table(doc,["Mã","Owner","Thời gian","Kết quả"],task_rows,[1.25,1.0,1.1,3.15],font_size=8.7)

    chapter(doc,"C","PHỤ LỤC - NGUỒN VÀ GIỚI HẠN")
    doc.add_heading("C.1 Nguồn thị trường",level=2)
    sources=[
        "Báo Điện tử Chính phủ (2025), Quy mô thị trường bán lẻ Việt Nam đạt khoảng 269 tỷ USD; phần TMĐT 32 tỷ USD.",
        "Google, Temasek, Bain (2024), Vietnam e-Conomy SEA 2024 country report.",
        "Temasek (2024), e-Conomy SEA release: regional GMV, profitability và video commerce.",
        "Báo Điện tử Chính phủ (2026), thông tin về Luật Thương mại điện tử có hiệu lực 01/07/2026.",
    ]
    add_numbered(doc,sources)
    doc.add_heading("C.2 Giới hạn",level=2)
    add_bullets(doc,[
        "Số liệu external có methodology khác nhau; không so sánh trực tiếp GMV, market size và B2C revenue.",
        "Survey/interview/competitor scores/financial model là synthetic cho đến khi thay bằng dữ liệu thật.",
        "Nội dung pháp lý chỉ là context; cần Legal review văn bản chính thức hiện hành.",
        "Timeline và estimate cần rebaseline sau discovery, platform/provider decision và planning poker.",
    ])
    doc.add_heading("C.3 Tài liệu nguồn nội bộ",level=2)
    add_para(doc,"Báo cáo này tổng hợp các tài liệu Markdown trong repository: Product Vision, PRD, Personas/Journeys, Roadmap/KPI, Backlog, BRD/SRS, Use Cases, Business Rules, Diagrams, ERD/Data Dictionary, RTM, Project Charter, Timeline, WBS, RACI, RAID, Quality/Release và bộ hồ sơ Research/Business Case.")

    # Core properties and update fields on open
    doc.core_properties.title="Báo cáo tổng hợp dự án cửa hàng thời trang trực tuyến"
    doc.core_properties.subject="Business Case, Product, BA, Technical Design và Delivery Plan"
    doc.core_properties.author="Project Team"
    settings=doc.settings.element
    upd=settings.find(qn('w:updateFields'))
    if upd is None: upd=OxmlElement('w:updateFields'); settings.append(upd)
    upd.set(qn('w:val'),'true')
    doc.save(DOCX_PATH)
    return DOCX_PATH


if __name__ == "__main__":
    diagrams=generate_diagrams()
    path=build_document(diagrams)
    print("Da tao file Word thanh cong.")
