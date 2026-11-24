import { fit, TAU } from "../vendor/pixelfx/src/core/index.js";

export const meta = {
  name: "Solargon mouth corona", size: [48, 48], origin: [24, 24],
  duration: 1.2, loop: true, fps: 30, options: { seed: 8 },
};

export function draw(p, t, o) {
  const c = fit(o.palette, 8), phase = t / meta.duration * TAU;
  for (let y = -19; y <= 19; y++) {
    for (let x = -19; x <= 19; x++) {
      const angle = Math.atan2(y, x);
      const radius = Math.hypot(x, y);
      const edge = 9 + 3 * Math.sin(angle * 5 + phase * 3);
      if (radius < edge)
        p.px(x, y, c[radius < 2.5 ? 7 : radius < 5 ? 6 : radius < 7 ? 4 : 1]);
    }
  }
  for (let i = 0; i < 10; i++) {
    const a = i * 2.399 + phase * .5;
    const progress = (t / 1.2 * 3 + i / 10) % 1;
    const radius = 19 - progress * 11;
    p.line(Math.cos(a)*radius, Math.sin(a)*radius,
      Math.cos(a)*(radius-3), Math.sin(a)*(radius-3), c[5]);
  }
}
