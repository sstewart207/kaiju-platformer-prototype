"""Build the shareable local recap from SITREP.md using the bundled Python runtime."""
from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak

root = Path(__file__).resolve().parent.parent
out = root / 'output' / 'pdf'
out.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='MemoTitle', fontName='Helvetica-Bold', fontSize=22, leading=26, spaceAfter=9, textColor=colors.black))
styles.add(ParagraphStyle(name='MemoBody', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=7, textColor=colors.HexColor('#263b3c')))
styles.add(ParagraphStyle(name='MemoHeading', fontName='Helvetica-Bold', fontSize=13, leading=17, spaceBefore=11, spaceAfter=6, textColor=colors.black))
styles.add(ParagraphStyle(name='MemoSmall', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=6, textColor=colors.HexColor('#566c69')))
def inline(text):
    text=escape(text).replace(' · ', ' / ').replace(' × ', ' x ')
    text=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`(.*?)`',r'<font name="Courier">\1</font>',text)
    return text

story=[]
source=(root/'SITREP.md').read_text(encoding='utf-8').splitlines()
table=[]
def flush_table():
    if not table:return
    data=[[Paragraph(inline(cell),styles['MemoSmall']) for cell in row] for row in table]
    grid=Table(data,colWidths=[1.05*inch,2.45*inch,2.9*inch],repeatRows=1,hAlign='LEFT')
    grid.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6efea')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),3),('LINEBELOW',(0,0),(-1,0),.5,colors.HexColor('#bdcec5'))]))
    story.append(grid);story.append(Spacer(1,7));table.clear()

for line in source:
    if line.startswith('|'):
        if not re.match(r'^\|[\s:|\-]+\|$',line):table.append([cell.strip() for cell in line.strip('|').split('|')])
        continue
    flush_table()
    if not line.strip():continue
    if line.startswith('# '):story.append(Paragraph(inline(line[2:]),styles['MemoTitle']))
    elif line.startswith('## '):
        if line=='## Validation and limits':story.append(PageBreak())
        story.append(Paragraph(inline(line[3:]),styles['MemoHeading']))
    elif line.startswith('- '):story.append(Paragraph('• '+inline(line[2:]),styles['MemoBody']))
    else:story.append(Paragraph(inline(line),styles['MemoSmall' if line.startswith('October ') else 'MemoBody']))
flush_table()
def footer(canvas,doc):
    canvas.saveState();canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#61716c'));canvas.drawString(42,28,'Untitled kaiju project / Build recap / October 26, 2026');canvas.drawRightString(letter[0]-42,28,str(doc.page));canvas.restoreState()
doc=SimpleDocTemplate(str(out/'Build-SITREP.pdf'),pagesize=letter,rightMargin=42,leftMargin=42,topMargin=38,bottomMargin=42,title='Untitled kaiju project build recap',author='Project team')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(out/'Build-SITREP.pdf')
