"""Read-only component audit; derives crops without changing generated pixels."""
import json
from pathlib import Path
from statistics import median
from PIL import Image

root = Path(__file__).resolve().parent.parent
def audit(source, output, columns, standing_height):
    im = Image.open(root/source).convert('RGBA')
    w,h=im.size; alpha=im.getchannel('A'); pixels=alpha.load(); seen=set(); parts=[]
    for y in range(h):
        for x in range(w):
            if (x,y) in seen or pixels[x,y]<102: continue
            queue=[(x,y)];seen.add((x,y)); n=0;left=right=x;top=bottom=y
            while queue:
                a,b=queue.pop();n+=1;left=min(left,a);right=max(right,a);top=min(top,b);bottom=max(bottom,b)
                for c,d in [(a-1,b),(a+1,b),(a,b-1),(a,b+1)]:
                    if 0<=c<w and 0<=d<h and (c,d) not in seen and pixels[c,d]>=102:
                        seen.add((c,d));queue.append((c,d))
            if n>1000: parts.append((left,top,right+1,bottom+1))
    assert len(parts)==columns*4,(source,len(parts))
    parts.sort(key=lambda p:(p[1]+p[3])/2)
    rows=[sorted(parts[r*columns:(r+1)*columns]) for r in range(4)]
    ys=[0]+[(max(p[3] for p in rows[r-1])+min(p[1] for p in rows[r]))//2 for r in range(1,4)]+[h]
    frames={}
    for row,direction in enumerate(['right','left','front','back']):
        cells=rows[row]; xs=[0]+[(cells[c-1][2]+cells[c][0])//2 for c in range(1,columns)]+[w]
        frames[direction]=[]
        for col,p in enumerate(cells):
            x,right=xs[col:col+2];y,bottom=ys[row:row+2]
            assert p[0]>x and p[2]<right and p[1]>=y and p[3]<=bottom,(direction,col,p)
            frames[direction].append(dict(x=x,y=y,width=right-x,height=bottom-y,groundX=.5,groundY=(bottom-p[3])/(bottom-y)))
    ppu=median(row[0][3]-row[0][1] for row in rows)/standing_height
    report=dict(image=source,width=w,height=h,pixelsPerUnit=ppu,frames=frames)
    (root/output).write_text(json.dumps(report,indent=2)+'\n')
    print(source,im.size,'frames',len(parts),'pixelsPerUnit',ppu)

audit('public/assets/human-zombie-atlas-v1.png','art/human-zombie-atlas-v1.audit.json',8,2.1)
audit('public/assets/solargon-combat-v1.png','art/solargon-combat-v1.audit.json',6,1.75)
