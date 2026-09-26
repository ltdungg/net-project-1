from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "report-diagrams"
OUTPUT = ROOT / "artifacts" / "qa" / "diagram-contact-sheet.png"

thumb_w, thumb_h = 760, 430
label_h = 42
gap = 24
cols = 2
files = sorted(SOURCE.glob("*.png"))
rows = (len(files) + cols - 1) // cols
canvas = Image.new("RGB", (cols * thumb_w + (cols + 1) * gap, rows * (thumb_h + label_h) + (rows + 1) * gap), "#E9EEF5")
draw = ImageDraw.Draw(canvas)
font_path = Path("C:/Windows/Fonts/arial.ttf")
font = ImageFont.truetype(str(font_path), 20) if font_path.exists() else ImageFont.load_default()

for idx, path in enumerate(files):
    img = Image.open(path).convert("RGB")
    img.thumbnail((thumb_w - 20, thumb_h - 20), Image.Resampling.LANCZOS)
    x0 = gap + (idx % cols) * thumb_w
    y0 = gap + (idx // cols) * (thumb_h + label_h)
    draw.rounded_rectangle((x0, y0, x0 + thumb_w, y0 + thumb_h + label_h), radius=12, fill="white", outline="#BCC7D6", width=2)
    x = x0 + (thumb_w - img.width) // 2
    y = y0 + (thumb_h - img.height) // 2
    canvas.paste(img, (x, y))
    draw.text((x0 + 12, y0 + thumb_h + 10), path.name, font=font, fill="#24364B")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT, quality=92)
print("Da tao contact sheet so do.")
