"""Read-only Solargon falling-pose crop/anchor audit; never edits pixels."""
import json
from pathlib import Path
from statistics import median
from PIL import Image
root=Path(__file__).resolve().parent.parent
im=Image.open(root/'public/assets/solargon-fall-v1.png').convert('RGBA')
a=im.getchannel('A');w,h=im.size
# Bounds verified against the four alpha-connected silhouettes in this draft.
boxes=[(45,49,609,550),(687,49,1251,549),(21,633,632,1135),(657,650,1281,1174)]
xs=[0,(609+687)//2,w];ys=[0,(550+633)//2,h]
frames={}
for index,direction in enumerate(['right','left','front','back']):
 row=index//2;col=index%2;x,right=xs[col:col+2];y,bottom=ys[row:row+2]
 b=boxes[index];foot=b[3]
 if direction=='back':
  # The sun-tail hangs below the toes; anchor the outer left foot, not the tail.
  band=a.crop((int(b[0]+(b[2]-b[0])*.25),b[1],int(b[0]+(b[2]-b[0])*.4),b[3]))
  foot=b[1]+band.point(lambda value:255 if value>=102 else 0).getbbox()[3]
 assert b[0]>x and b[2]<right and b[1]>y and b[3]<bottom
 frames[direction]=[dict(x=x,y=y,width=right-x,height=bottom-y,groundX=.5,groundY=(bottom-foot)/(bottom-y))]
report=dict(image='public/assets/solargon-fall-v1.png',width=w,height=h,pixelsPerUnit=median(b[3]-b[1] for b in boxes[:3])/1.95,frames=frames)
(root/'art/solargon-fall-v1.audit.json').write_text(json.dumps(report,indent=2)+'\n')
print('Audited four distinct falling poses',im.size,'back foot',frames['back'][0]['groundY'])
