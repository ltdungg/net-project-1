"""Document QA contact sheets and page-text inventory; no delivery artifacts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
import argparse

parser=argparse.ArgumentParser()
parser.add_argument('--final',action='store_true')
args=parser.parse_args()

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'artifacts/qa/project1-synthetic-report'
pdf=QA/'Project-1-Bao-cao-khao-sat-GIA-LAP-NET.pdf'
reader=PdfReader(pdf)
for i,p in enumerate(reader.pages,1):
    lines=[x.strip() for x in p.extract_text().splitlines() if x.strip()]
    print(f'{i:02d} | {len(p.extract_text()):4d} chars | ' + ' / '.join(lines[1:4]))
files=sorted(QA.glob('delivery-page-*.png' if args.final else 'page-*.png'))
files=files[:len(reader.pages)]
font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',22)
for start in range(0,len(files),4):
    chunk=files[start:start+4]
    images=[Image.open(p).convert('RGB') for p in chunk]
    w,h=images[0].size
    contact=Image.new('RGB',(2*w+36,2*(h+30)+36),'#dae0e8')
    d=ImageDraw.Draw(contact)
    for j,img in enumerate(images):
        x=12+(j%2)*(w+12); y=12+(j//2)*(h+42)
        contact.paste(img,(x,y))
        d.text((x+5,y+h+3),f'Trang {start+j+1:02d}',font=font,fill='#172b4d')
    prefix='delivery-contact' if args.final else 'contact'
    contact.save(QA/f'{prefix}-{start+1:02d}-{start+len(chunk):02d}.png')
