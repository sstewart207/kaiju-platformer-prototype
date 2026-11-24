import { fit, TAU } from "../vendor/pixelfx/src/core/index.js";

export const meta = {
  name: "Solargon solar stream", size: [256, 40], origin: [0, 20],
  duration: 1.2, loop: true, fps: 30,
  options: { seed: 8 },
};

// Discrete gold tongues surround a fine hot core. Traveling knots carry the
// energy outward while the darker envelope holds its shape on pale stone.
export function draw(p, t, o) {
  const c = fit(o.palette, 8);
  const phase = t / meta.duration * TAU;
  for (let x = 0; x < 256; x++) {
    const surge = Math.pow(Math.max(0, Math.sin(x * .071 - phase * 5)), 6);
    const width = 12 + surge * 4 + Math.sin(x * .27 - phase * 8) * 1.7;
    const center = Math.sin(x * .062 - phase * 3) * 1.2;
    for (let y = -19; y <= 19; y++) {
      const distance = Math.abs(y - center);
      if (distance > width) continue;
      const edge = distance / width;
      const broken = Math.sin(x * .44 - phase * 9 + y * 1.8);
      let tone = edge > .88 ? 0 : edge > .64 ? 2 : edge > .30 ? 4 : 5;
      if (broken > .55 && edge < .72) tone++;
      if (distance < 1 && Math.sin(x * .14 - phase * 10) > -.5) tone = 7;
      p.px(x, y, c[tone]);
    }
    for (const side of [-1, 1]) {
      const ribbon = Math.sin(x * .085 - phase * 6 + side * 2);
      if (ribbon > .05)
        p.px(x, center + side * (width * .6 + ribbon), c[6]);
    }
  }
}
