import * as THREE from "three";
import type { Direction, SpriteMotionOptions, Vec3 } from "./types";

// Deform only the rendered billboard. Feet, source UVs and physics stay fixed.
export class SpriteMotion {
  readonly geometry = new THREE.PlaneGeometry(1, 1, 2, 24);
  private attribute = this.geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  private rest = Float32Array.from(this.attribute.array);
  private time = 0;
  private phase: number | null = null;
  private breathBlend = 0;
  private hairBlend = 0;
  constructor(private options: SpriteMotionOptions) {}
  update(
    state: string,
    direction: Direction,
    dt: number,
    pixelSize: number,
    scale: THREE.Vector3,
    groundY: number,
    position: Vec3,
  ) {
    this.phase ??= Math.abs(position.x * 0.137 + position.z * 0.193) % 1;
    this.time += dt;
    const settle = 1 - Math.exp(-dt * 18);
    this.breathBlend +=
      ((state === "idle" ? 1 : 0) - this.breathBlend) * settle;
    this.hairBlend +=
      ((state === "walking" || state === "running" ? 1 : 0) - this.hairBlend) *
      settle;
    // Action poses must not inherit a breathing stretch or a moving hair crown.
    if (!["idle", "walking", "running"].includes(state))
      this.breathBlend = this.hairBlend = 0;
    const breath = this.options.breathing;
    const hair = this.options.hair;
    const breathPixels = breath
      ? (0.5 +
          0.5 *
            Math.sin((this.time / breath.seconds + this.phase) * Math.PI * 2)) *
        breath.pixels *
        this.breathBlend
      : 0;
    const hairPhase = hair
      ? (this.time / hair.seconds + this.phase) * Math.PI * 2
      : 0;
    const swayPixels = hair
      ? Math.sin(hairPhase) * hair.pixels * this.hairBlend
      : 0;
    const facing = direction === "left" ? -1 : 1;
    for (let index = 0; index < this.rest.length; index += 3) {
      const x = this.rest[index],
        y = this.rest[index + 1];
      const height = (y + 0.5 - groundY) / Math.max(0.01, 1 - groundY);
      const chest = THREE.MathUtils.smoothstep(height, 0.28, 0.78);
      const crown = hair
        ? THREE.MathUtils.smoothstep(height, hair.from, 0.96)
        : 0;
      const sway = Math.round(swayPixels * crown),
        rise = Math.round(breathPixels * chest);
      this.attribute.array[index] = sway
        ? x + (sway * facing * pixelSize) / scale.x
        : x;
      this.attribute.array[index + 1] = rise
        ? y + (rise * pixelSize) / scale.y
        : y;
    }
    this.attribute.needsUpdate = true;
  }
}
