import { fit, TAU } from "../vendor/pixelfx/src/core/index.js";

export const meta = {
  name: "Solargon stream front", size: [48, 48], origin: [24, 24],
  duration: 1.2, loop: true, fps: 30, options: { seed: 8 },
};

export function draw(p, t, o) {
  const c = fit(o.palette, 8), phase = t / meta.duration * TAU;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + Math.sin(phase * 3 + i) * .2;
    const radius = 9 + 4 * Math.sin(phase * 6 + i * 1.7);
    p.line(0, 0, Math.cos(a)*radius, Math.sin(a)*radius,
      (u) => c[u < .3 ? 7 : u < .65 ? 5 : 2]);
  }
  p.circle(0, 0, 5, c[4]);
  p.circle(0, 0, 3, c[7]);
}
