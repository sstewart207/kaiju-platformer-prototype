// Bake the pinned MIT PixelFX source into transparent, nearest-neighbour atlases.
// No PixelFX simulation or canvas upload runs in the game.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import {
  createFrame,
  clearFrame,
  createFx,
  composite,
} from "./vendor/pixelfx/src/core/index.js";
import { encodePNG } from "./vendor/pixelfx/tools/lib/png.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public/assets/fx");
mkdirSync(output, { recursive: true });
mkdirSync(join(root, "art/effects"), { recursive: true });
const solar = [
  "#51331b",
  "#805024",
  "#b77a2d",
  "#dba43c",
  "#f4c45a",
  "#ffe39a",
  "#fff4cf",
  "#fffbed",
];
const ember = [
  "#422030",
  "#722a32",
  "#ac3a24",
  "#d65b25",
  "#f58b37",
  "#ffc567",
  "#ffe8ac",
  "#fff4cf",
];
const definitions = [
  ["solar-claw", "melee/claw-swipe", solar],
  ["solar-fireball", "fire/fireball", solar],
  ["solar-hit", "impacts/hit-spark", solar],
  ["solar-charge", "arcane/spell-charge", solar, [35, 34, 48, 48]],
  ["solar-ray", "solar-stream", solar, [0, 0, 256, 40]],
  ["solar-mouth", "solar-mouth", solar, [0, 0, 48, 48]],
  ["solar-front", "solar-front", solar, [0, 0, 48, 48]],
  ["enemy-claw", "melee/claw-swipe", ember],
  ["enemy-fireball", "fire/fireball", ember],
  ["enemy-charge", "arcane/spell-charge", ember, [35, 34, 48, 48]],
  ["enemy-hit", "impacts/hit-spark", ember],
];
const manifest = {};
const previews = [];
for (const [name, id, palette, crop] of definitions) {
  const mod = await import(id.includes("/")
    ? `./vendor/pixelfx/src/fx/${id}.js`
    : `./effects/${id}.js`);
  const [w, h] = mod.meta.size;
  const frame = createFrame(w, h);
  const instance = createFx(mod, {
    x: mod.meta.origin[0],
    y: mod.meta.origin[1],
    palette,
    sparks: [palette[7], palette[6], palette[4], palette[2]],
    light: 0.18,
    seed: 8,
  });
  const fps = 30;
  const count = Math.round(mod.meta.duration * fps);
  const frames = [];
  let x0 = w,
    y0 = h,
    x1 = 0,
    y1 = 0;
  for (let i = 0; i < count; i++) {
    if (i) instance.update(1 / fps);
    clearFrame(frame);
    instance.draw(frame);
    const pixels = composite(frame, new Uint8ClampedArray(w * h * 4));
    // Drop faint glow; preserve sharp pixel silhouettes against the light ruins.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (pixels[p + 3] < 70) pixels[p + 3] = 0;
        if (pixels[p + 3]) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x + 1);
          y1 = Math.max(y1, y + 1);
        }
      }
    frames.push(pixels);
  }
  const [cx, cy, cw, ch] = crop ?? [
    Math.max(0, x0 - 1),
    Math.max(0, y0 - 1),
    Math.min(w, x1 + 1) - Math.max(0, x0 - 1),
    Math.min(h, y1 + 1) - Math.max(0, y0 - 1),
  ];
  // One-pixel transparent gutters prevent neighbour sampling at UV boundaries.
  const cellW = cw + 2,
    cellH = ch + 2,
    columns = 8,
    rows = Math.ceil(count / columns);
  const sheetW = cellW * columns,
    sheetH = cellH * rows;
  const sheet = new Uint8ClampedArray(sheetW * sheetH * 4);
  for (let i = 0; i < count; i++) {
    const dx = (i % columns) * cellW + 1,
      dy = Math.floor(i / columns) * cellH + 1;
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const src = ((cy + y) * w + cx + x) * 4,
          dst = ((dy + y) * sheetW + dx + x) * 4;
        sheet.set(frames[i].subarray(src, src + 4), dst);
      }
  }
  writeFileSync(join(output, `${name}.png`), encodePNG(sheetW, sheetH, sheet));
  manifest[name] = {
    width: cw,
    height: ch,
    cellW,
    cellH,
    columns,
    rows,
    count,
    fps,
    duration: mod.meta.duration,
    loop: mod.meta.loop,
    pivot: [mod.meta.origin[0] - cx, mod.meta.origin[1] - cy],
    source: id,
  };
  previews.push({ name, cw, ch, cx, cy, w, frames });
  console.log(`${name}: ${cw}x${ch}, ${count} frames`);
}
writeFileSync(
  join(root, "art/effects/pixelfx-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
// Six moments from each exported effect, on the game's warm stone color.
const pw = 960,
  ph = previews.length * 106;
const preview = new Uint8ClampedArray(pw * ph * 4);
for (let p = 0; p < preview.length; p += 4) preview.set([79, 88, 64, 255], p);
previews.forEach((q, row) => {
  for (let sample = 0; sample < 6; sample++) {
    const src =
      q.frames[
        Math.min(
          q.frames.length - 1,
          Math.floor(((sample + 0.4) / 6) * q.frames.length),
        )
      ];
    for (let y = 0; y < q.ch; y++)
      for (let x = 0; x < q.cw; x++) {
        const sp = ((q.cy + y) * q.w + q.cx + x) * 4;
        const xx = sample * 160 + x,
          yy = row * 106 + y;
        if (xx >= pw || yy >= ph) continue;
        const dp = (yy * pw + xx) * 4,
          a = src[sp + 3] / 255;
        for (let c = 0; c < 3; c++)
          preview[dp + c] = src[sp + c] * a + preview[dp + c] * (1 - a);
      }
  }
});
writeFileSync(
  join(root, "art/effects/pixelfx-contact.png"),
  encodePNG(pw, ph, preview),
);
