from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "qa" / "rendered-pages-final"
OUTPUT = ROOT / "artifacts" / "qa" / "page-contact-sheets-final"
OUTPUT.mkdir(parents=True, exist_ok=True)

files = sorted(SOURCE.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
font_path = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(font_path), 24) if font_path.exists() else ImageFont.load_default()
gap = 24
label_h = 42
cols = 2
per_sheet = 4

for sheet_index in range(0, len(files), per_sheet):
    chunk = files[sheet_index:sheet_index + per_sheet]
    opened = [Image.open(path).convert("RGB") for path in chunk]
    page_w = max(img.width for img in opened)
    page_h = max(img.height for img in opened)
    rows = (len(opened) + cols - 1) // cols
    canvas = Image.new(
        "RGB",
        (cols * page_w + (cols + 1) * gap, rows * (page_h + label_h) + (rows + 1) * gap),
        "#D8DEE8",
    )
    draw = ImageDraw.Draw(canvas)
    for idx, (path, img) in enumerate(zip(chunk, opened)):
        col = idx % cols
        row = idx // cols
        x = gap + col * page_w
        y = gap + row * (page_h + label_h)
        canvas.paste(img, (x, y))
        draw.text((x + 8, y + page_h + 7), f"Trang {int(path.stem.split('-')[-1])}", font=font, fill="#1D2A3A")
    first = sheet_index + 1
    last = sheet_index + len(chunk)
    canvas.save(OUTPUT / f"trang-{first:02d}-{last:02d}.png")

print(f"Da tao {len(list(OUTPUT.glob('*.png')))} contact sheet.")
