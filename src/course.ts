import type { PlatformSpec, Vec3 } from "./types";

export const SPAWN: Vec3 = { x: -2.5, y: 0.86, z: 1 };
export const GROUND = { x: 90, z: -22, top: -0.08, width: 380, depth: 180 };
export const SECTIONS = [
  { name: "Start" },
  { name: "Walls" },
  { name: "Ramp" },
  { name: "Platform" },
  { name: "Garden" },
  { name: "Finish" },
];
export const PLATFORMS: PlatformSpec[] = [
  { id: "courtyard", x: 0, z: 0, top: 0, width: 18, depth: 14, section: 0 },
  { id: "runway", x: 20, z: 0, top: 0.15, width: 20, depth: 10, section: 0 },
  { id: "gallery", x: 45, z: 0, top: 0.15, width: 28, depth: 20, section: 1 },
  { id: "bend", x: 62, z: -10, top: 0.15, width: 8, depth: 26, section: 1 },
  { id: "staging", x: 70, z: -20, top: 0.35, width: 18, depth: 18, section: 2 },
  { id: "waiting", x: 88, z: -24, top: 2.5, width: 10, depth: 10, section: 2 },
  {
    id: "ferry",
    x: 96,
    z: -24,
    top: 2.5,
    width: 6,
    depth: 7,
    section: 3,
    moving: { axis: "x", distance: 16, period: 6.4 },
  },
  {
    id: "detour-west",
    x: 88,
    z: -7,
    top: 0.35,
    width: 9,
    depth: 12,
    section: 3,
  },
  {
    id: "detour-middle",
    x: 104,
    z: -7,
    top: 0.35,
    width: 24,
    depth: 9,
    section: 3,
  },
  {
    id: "detour-east",
    x: 120,
    z: -7,
    top: 0.35,
    width: 9,
    depth: 12,
    section: 3,
  },
  { id: "arrival", x: 120, z: -24, top: 2.5, width: 10, depth: 10, section: 3 },
  { id: "garden", x: 140, z: -24, top: 1.2, width: 22, depth: 20, section: 4 },
  { id: "turn", x: 140, z: -42, top: 1.2, width: 12, depth: 12, section: 4 },
  { id: "lane", x: 166, z: -42, top: 1.5, width: 34, depth: 12, section: 5 },
  {
    id: "sanctuary",
    x: 192,
    z: -42,
    top: 1.5,
    width: 16,
    depth: 16,
    section: 5,
  },
];
export const FINISH = { x: 192, y: 1.5, z: -42 };
export interface CourseGate {
  x: number;
  z: number;
  radius: number;
  minY?: number;
}
// Check these in order before accepting the finish. Both routes pass all gates.
export const COURSE_GATES: CourseGate[] = [
  { x: 20, z: 0, radius: 6 },
  { x: 45, z: 0, radius: 8 },
  { x: 70, z: -20, radius: 8 },
  { x: 120, z: -24, radius: 6, minY: 2.1 },
  { x: 140, z: -42, radius: 7 },
  { x: 174, z: -42, radius: 7 },
];
export interface RoutePoint {
  x: number;
  z: number;
}
export const MAIN_ROUTE_WAYPOINTS: RoutePoint[] = [
  { x: 20, z: 0 },
  { x: 34, z: 6 },
  { x: 44, z: 6 },
  { x: 44, z: -6 },
  { x: 56, z: -6 },
  { x: 62, z: -6 },
  { x: 66, z: -20 },
  { x: 70, z: -20 },
  { x: 78, z: -24 },
  { x: 88, z: -24 },
  { x: 88, z: -7 },
  { x: 104, z: -7 },
  { x: 120, z: -7 },
  { x: 120, z: -24 },
  { x: 140, z: -24 },
  { x: 140, z: -42 },
  { x: 151, z: -42 },
  { x: 151, z: -46.5 },
  { x: 182, z: -46.5 },
  { x: 192, z: -42 },
];
export const SHORTCUT_ROUTE = {
  galleryJumps: [
    { takeoff: { x: 36, z: 0 }, landing: { x: 42, z: 0 } },
    { takeoff: { x: 46, z: 0 }, landing: { x: 52, z: 0 } },
  ],
  shuttle: {
    takeoff: { x: 92, z: -24 },
    boardNearX: 96,
    boardingLanding: { x: 99, z: -24 },
    rideToX: 111.5,
    exitTakeoff: { x: 113.8, z: -24 },
    landing: { x: 116.5, z: -24 },
  },
  hurdleJumps: [
    { takeoff: { x: 152, z: -42 }, landing: { x: 158, z: -42 } },
    { takeoff: { x: 166, z: -42 }, landing: { x: 172, z: -42 } },
    { takeoff: { x: 176, z: -42 }, landing: { x: 182, z: -42 } },
  ],
};
export interface RuinWall {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  kind: "wall" | "hurdle" | "planter";
}
export const ARCH_REMNANTS = [
  { x: 31, z: -8.5, y: 0.15 },
  { x: 59, z: 8.5, y: 0.15 },
  { x: 88, z: -27.8, y: 2.5 },
  { x: 120, z: -27.8, y: 2.5 },
];
// y is the collider center; rendered masonry and physics consume this same list.
export const RUIN_WALLS: RuinWall[] = [
  { x: 45, y: 1.5, z: -10.4, width: 29, height: 2.7, depth: 1, kind: "wall" },
  { x: 45, y: 1.5, z: 10.4, width: 29, height: 2.7, depth: 1, kind: "wall" },
  { x: 39, y: 1.5, z: -5.7, width: 1.3, height: 2.7, depth: 7.8, kind: "wall" },
  { x: 39, y: 1.5, z: 2.6, width: 1.3, height: 2.7, depth: 1.6, kind: "wall" },
  {
    x: 39,
    y: 0.575,
    z: 0,
    width: 1.3,
    height: 0.85,
    depth: 3.6,
    kind: "hurdle",
  },
  { x: 49, y: 1.5, z: 5.7, width: 1.3, height: 2.7, depth: 7.8, kind: "wall" },
  { x: 49, y: 1.5, z: -2.6, width: 1.3, height: 2.7, depth: 1.6, kind: "wall" },
  {
    x: 49,
    y: 0.575,
    z: 0,
    width: 1.3,
    height: 0.85,
    depth: 3.6,
    kind: "hurdle",
  },
  {
    x: 135,
    y: 1.75,
    z: -18,
    width: 7,
    height: 1.1,
    depth: 2.2,
    kind: "planter",
  },
  {
    x: 144,
    y: 1.75,
    z: -29,
    width: 6,
    height: 1.1,
    depth: 2.2,
    kind: "planter",
  },
  { x: 155, y: 1.9, z: -42, width: 1.3, height: 0.8, depth: 6, kind: "hurdle" },
  { x: 169, y: 1.9, z: -42, width: 1.3, height: 0.8, depth: 6, kind: "hurdle" },
  { x: 179, y: 1.9, z: -42, width: 1.3, height: 0.8, depth: 6, kind: "hurdle" },
];
export const ROUTE_FLAGS: RoutePoint[] = [
  { x: 9, z: -4 },
  { x: 28, z: -3 },
  { x: 35, z: 7.4 },
  { x: 44, z: 7.4 },
  { x: 44, z: -7.4 },
  { x: 57, z: -7.4 },
  { x: 64.5, z: -15 },
  { x: 76, z: -25 },
  { x: 89.5, z: -28 },
  { x: 85, z: -9 },
  { x: 104, z: -10 },
  { x: 123, z: -10 },
  { x: 122, z: -21 },
  { x: 137, z: -28 },
  { x: 137, z: -40 },
  { x: 151, z: -47 },
  { x: 182, z: -47 },
  { x: 189, z: -46 },
];
export interface PathRamp {
  start: Vec3;
  end: Vec3;
  width: number;
}
const byId = new Map(PLATFORMS.map((platform) => [platform.id, platform]));
// Explicit graph: there must never be a walkable ramp beneath the shuttle gap.
const CONNECTIONS = [
  ["courtyard", "runway"],
  ["runway", "gallery"],
  ["gallery", "bend"],
  ["bend", "staging"],
  ["staging", "waiting"],
  ["waiting", "detour-west"],
  ["detour-west", "detour-middle"],
  ["detour-middle", "detour-east"],
  ["detour-east", "arrival"],
  ["arrival", "garden"],
  ["garden", "turn"],
  ["turn", "lane"],
  ["lane", "sanctuary"],
] as const;
export const PATH_RAMPS: PathRamp[] = CONNECTIONS.map(([from, to]) => {
  const previous = byId.get(from)!,
    next = byId.get(to)!;
  const dx = next.x - previous.x,
    dz = next.z - previous.z,
    length = Math.hypot(dx, dz),
    nx = dx / length,
    nz = dz / length;
  const edge = (p: PlatformSpec) =>
    Math.min(
      length / 2 - 0.25,
      Math.max(
        0,
        Math.min(
          Math.abs(nx) > 0.001 ? p.width / 2 / Math.abs(nx) : Infinity,
          Math.abs(nz) > 0.001 ? p.depth / 2 / Math.abs(nz) : Infinity,
        ) - 1,
      ),
    );
  return {
    start: {
      x: previous.x + nx * edge(previous),
      y: previous.top + 0.018,
      z: previous.z + nz * edge(previous),
    },
    end: {
      x: next.x - nx * (edge(next) + (next.top - previous.top > 0.8 ? 1.1 : 0)),
      y: next.top + 0.018,
      z: next.z - nz * (edge(next) + (next.top - previous.top > 0.8 ? 1.1 : 0)),
    },
    width: 7,
  };
});
export function rampMesh(ramp: PathRamp) {
  const dx = ramp.end.x - ramp.start.x,
    dz = ramp.end.z - ramp.start.z,
    length = Math.hypot(dx, dz);
  const rx = ((-dz / length) * ramp.width) / 2,
    rz = ((dx / length) * ramp.width) / 2;
  const top = [
    ramp.start.x - rx,
    ramp.start.y,
    ramp.start.z - rz,
    ramp.start.x + rx,
    ramp.start.y,
    ramp.start.z + rz,
    ramp.end.x + rx,
    ramp.end.y,
    ramp.end.z + rz,
    ramp.end.x - rx,
    ramp.end.y,
    ramp.end.z - rz,
  ];
  const bottom = top.map((n, i) => (i % 3 === 1 ? n - 0.25 : n));
  return {
    vertices: new Float32Array([...top, ...bottom]),
    indices: new Uint32Array([
      0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2,
      6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
    ]),
    length,
  };
}

export function ruinPillars(spec: PlatformSpec) {
  if (!["courtyard", "staging", "garden", "sanctuary"].includes(spec.id))
    return [];
  return [-1, 1].map((sign) => ({
    x: -spec.width / 2 + 1.1,
    z: sign * (spec.depth / 2 - 1.2),
    height: spec.id === "garden" ? 1.6 : 2.7,
    broken: sign === 1 && spec.id !== "sanctuary",
  }));
}
export function platformPosition(spec: PlatformSpec, time: number): Vec3 {
  const position = { x: spec.x, y: spec.top, z: spec.z };
  if (spec.moving)
    position[spec.moving.axis] +=
      (spec.moving.distance *
        (1 - Math.cos((time * Math.PI * 2) / spec.moving.period))) /
      2;
  return position;
}
