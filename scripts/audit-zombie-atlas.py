"""Read-only image audit; writes frame metadata, never modifies sprite pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
im = Image.open(root / "public/assets/zombie-walker-atlas-v1.png").convert("RGBA")
alpha = im.getchannel("A")
width, height = im.size
rows = [(0, 252), (252, 458), (458, 660), (660, height)]
frames = {}
for direction, (top, bottom) in zip(["right", "left", "front", "back"], rows):
    counts = [sum(alpha.getpixel((x, y)) > 128 for y in range(top, bottom)) for x in range(width)]
    edges = [0]
    for col in range(1, 8):
        center = round(width * col / 8)
        edge = min(range(center - 18, center + 19), key=lambda x: (sum(counts[max(0,x-1):x+2]), abs(x-center)))
        edges.append(edge)
    edges.append(width)
    clips = []
    for col in range(8):
        x, right = edges[col:col+2]
        bbox = alpha.crop((x, top, right, bottom)).point(lambda a: 255 if a > 128 else 0).getbbox()
        assert bbox is not None
        clips.append({"x": x, "y": top, "width": right-x, "height": bottom-top,
                      "groundX": 0.5, "groundY": (bottom-top-bbox[3])/(bottom-top),
                      "visibleWidth": bbox[2]-bbox[0], "visibleHeight": bbox[3]-bbox[1],
                      "touchesSide": bbox[0] == 0 or bbox[2] == right-x})
    frames[direction] = clips
result = {"image": "public/assets/zombie-walker-atlas-v1.png", "width": width, "height": height, "pixelsPerUnit": 90, "frames": frames}
out = root / "art/zombie-walker-atlas-v1.audit.json"
out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"size":im.size,"edgeFrames":[f"{d}:{i}" for d, fs in frames.items() for i,f in enumerate(fs) if f["touchesSide"]], "heightRange": [min(f["visibleHeight"] for fs in frames.values() for f in fs),max(f["visibleHeight"] for fs in frames.values() for f in fs)]}))
