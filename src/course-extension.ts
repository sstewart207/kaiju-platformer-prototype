import type { PlatformSpec } from "./types";
import type { CourseGate, RoutePoint, RuinWall } from "./course";

// Broad masonry switchbacks sit on the continuous ground, not over a void.
export const EXTENSION_PLATFORMS: PlatformSpec[] = [
  {
    id: "east-entry",
    x: 218,
    z: -42,
    top: 1.5,
    width: 40,
    depth: 12,
    section: 6,
  },
  {
    id: "south-gallery",
    x: 232,
    z: 9,
    top: 1.5,
    width: 12,
    depth: 114,
    section: 6,
  },
  {
    id: "south-run",
    x: 266,
    z: 60,
    top: 1.5,
    width: 72,
    depth: 12,
    section: 7,
  },
  {
    id: "north-gallery",
    x: 300,
    z: -6,
    top: 1.5,
    width: 12,
    depth: 144,
    section: 7,
  },
  {
    id: "upper-run",
    x: 324,
    z: -72,
    top: 1.5,
    width: 60,
    depth: 12,
    section: 8,
  },
  {
    id: "return-gallery",
    x: 348,
    z: -6,
    top: 1.5,
    width: 12,
    depth: 144,
    section: 8,
  },
  {
    id: "return-run",
    x: 381,
    z: 60,
    top: 1.5,
    width: 78,
    depth: 12,
    section: 9,
  },
  {
    id: "final-gallery",
    x: 414,
    z: 9,
    top: 1.5,
    width: 12,
    depth: 114,
    section: 9,
  },
  {
    id: "finish-run",
    x: 445,
    z: -42,
    top: 1.5,
    width: 64,
    depth: 12,
    section: 10,
  },
  { id: "finish", x: 486, z: -42, top: 1.5, width: 22, depth: 16, section: 10 },
];
export const EXTENDED_FINISH = { x: 486, y: 1.5, z: -42 };
export const CHECKPOINTS = [
  { x: 192, y: 1.5, z: -42, requiredGates: 6, radius: 2 },
  { x: 324, y: 1.5, z: -72, requiredGates: 12, radius: 6 },
];
export const EXTENSION_RECOVERY_RAMPS = [
  {
    start: { x: 232, y: -0.062, z: 80 },
    end: { x: 232, y: 1.518, z: 64 },
    width: 7,
  },
  {
    start: { x: 300, y: -0.062, z: -92 },
    end: { x: 300, y: 1.518, z: -76 },
    width: 7,
  },
  {
    start: { x: 348, y: -0.062, z: 80 },
    end: { x: 348, y: 1.518, z: 64 },
    width: 7,
  },
  {
    start: { x: 414, y: -0.062, z: -62 },
    end: { x: 414, y: 1.518, z: -46 },
    width: 7,
  },
];

export const EXTENSION_GATES: CourseGate[] = [
  { x: 214, z: -42, radius: 7, minY: 1.1 },
  { x: 232, z: 10, radius: 7, minY: 1.1 },
  { x: 232, z: 58, radius: 7, minY: 1.1 },
  { x: 270, z: 60, radius: 7, minY: 1.1 },
  { x: 300, z: 8, radius: 7, minY: 1.1 },
  { x: 300, z: -70, radius: 7, minY: 1.1 },
  { x: 326, z: -72, radius: 7, minY: 1.1 },
  { x: 348, z: -10, radius: 7, minY: 1.1 },
  { x: 348, z: 58, radius: 7, minY: 1.1 },
  { x: 390, z: 60, radius: 7, minY: 1.1 },
  { x: 414, z: 10, radius: 7, minY: 1.1 },
  { x: 414, z: -40, radius: 7, minY: 1.1 },
  { x: 454, z: -42, radius: 7, minY: 1.1 },
];
// Alternating shoulder-height barriers leave a five-unit walking lane.
export const EXTENSION_WALLS: RuinWall[] = [
  ...[
    { x: 229.5, z: -10 },
    { x: 234.5, z: 18 },
    { x: 229.5, z: 43 },
    { x: 297.5, z: 30 },
    { x: 302.5, z: -4 },
    { x: 297.5, z: -40 },
    { x: 345.5, z: -45 },
    { x: 350.5, z: -5 },
    { x: 345.5, z: 35 },
    { x: 411.5, z: 35 },
    { x: 416.5, z: 0 },
    { x: 411.5, z: -25 },
  ].map((p) => ({
    ...p,
    y: 2.85,
    width: 7,
    height: 2.7,
    depth: 1.2,
    kind: "wall" as const,
  })),
  ...[
    { x: 254, z: 60 },
    { x: 278, z: 60 },
    { x: 316, z: -72 },
    { x: 338, z: -72 },
    { x: 372, z: 60 },
    { x: 396, z: 60 },
    { x: 438, z: -42 },
    { x: 460, z: -42 },
  ].map((p) => ({
    ...p,
    y: 1.9,
    width: 1.3,
    height: 0.8,
    depth: 6,
    kind: "hurdle" as const,
  })),
];

// Subdivide long legs so traversal tests follow the actual path rather than
// timing out on one distant target. The line includes the wide hurdle bypasses.
const turns: RoutePoint[] = [
  { x: 192, z: -42 },
  { x: 232, z: -42 },
  { x: 235, z: -18 },
  { x: 235, z: -6 },
  { x: 229, z: 10 },
  { x: 229, z: 22 },
  { x: 235, z: 35 },
  { x: 235, z: 47 },
  { x: 232, z: 60 },
  { x: 245, z: 55.5 },
  { x: 289, z: 55.5 },
  { x: 300, z: 60 },
  { x: 303, z: 38 },
  { x: 303, z: 34 },
  { x: 297, z: 4 },
  { x: 297, z: -8 },
  { x: 303, z: -32 },
  { x: 303, z: -44 },
  { x: 300, z: -72 },
  { x: 307, z: -76.5 },
  { x: 344, z: -76.5 },
  { x: 348, z: -72 },
  { x: 351, z: -53 },
  { x: 351, z: -41 },
  { x: 345, z: -13 },
  { x: 345, z: -1 },
  { x: 351, z: 27 },
  { x: 351, z: 39 },
  { x: 348, z: 60 },
  { x: 360, z: 55.5 },
  { x: 405, z: 55.5 },
  { x: 414, z: 60 },
  { x: 417, z: 43 },
  { x: 417, z: 39 },
  { x: 411, z: 8 },
  { x: 411, z: -4 },
  { x: 417, z: -17 },
  { x: 417, z: -21 },
  { x: 417, z: -29 },
  { x: 414, z: -42 },
  { x: 428, z: -46.5 },
  { x: 468, z: -46.5 },
  { x: 486, z: -42 },
];
export const EXTENSION_ROUTE_WAYPOINTS: RoutePoint[] = [];
let previous = turns[0];
for (const next of turns) {
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(next.x - previous.x, next.z - previous.z) / 22),
  );
  for (let n = 1; n <= count; n++)
    EXTENSION_ROUTE_WAYPOINTS.push({
      x: previous.x + ((next.x - previous.x) * n) / count,
      z: previous.z + ((next.z - previous.z) * n) / count,
    });
  previous = next;
}
export const EXTENSION_FLAGS: RoutePoint[] = turns
  .filter((_, i) => i % 2 === 0)
  .map((p) => {
    const column = [232, 300, 348, 414].find((x) => Math.abs(p.x - x) < 7);
    return column !== undefined
      ? { x: column - 5.4, z: p.z }
      : { x: p.x, z: p.z > 40 ? 65.2 : p.z < -60 ? -77.2 : -47.2 };
  });
