from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
QA_ROOT = ROOT / "artifacts" / "qa" / "academic-report-v7-inventory-20260901"
SOURCE = QA_ROOT / "pages"
OUTPUT = QA_ROOT / "contact-sheets"
OUTPUT.mkdir(parents=True, exist_ok=True)

files = sorted(SOURCE.glob("v7final-page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
font_path = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else ImageFont.load_default()
gap = 24
label_h = 42
cols = 2
per_sheet = 4

for old in OUTPUT.glob("*.png"):
    old.unlink()

for sheet_index in range(0, len(files), per_sheet):
    chunk = files[sheet_index:sheet_index + per_sheet]
    opened = [Image.open(path).convert("RGB") for path in chunk]
    page_w = max(img.width for img in opened)
    page_h = max(img.height for img in opened)
    rows = (len(opened) + cols - 1) // cols
    sheet = Image.new(
        "RGB",
        (cols * page_w + (cols + 1) * gap, rows * (page_h + label_h) + (rows + 1) * gap),
        "#D8DEE8",
    )
    draw = ImageDraw.Draw(sheet)
    for idx, (path, img) in enumerate(zip(chunk, opened)):
        col = idx % cols
        row = idx // cols
        x = gap + col * page_w
        y = gap + row * (page_h + label_h)
        sheet.paste(img, (x, y))
        page_number = int(path.stem.split("-")[-1])
        draw.text((x + 8, y + page_h + 7), f"Trang {page_number}", font=font, fill="#1D2A3A")
    first = int(chunk[0].stem.split("-")[-1])
    last = int(chunk[-1].stem.split("-")[-1])
    sheet.save(OUTPUT / f"trang-{first:02d}-{last:02d}.png")

print(f"Da tao {len(list(OUTPUT.glob('*.png')))} contact sheet.")
