export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export interface MovementInput {
  x: number;
  z: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  dashPressed?: boolean;
}
export type AnimationState =
  | "idle"
  | "running"
  | "dashing"
  | "jumping"
  | "falling"
  | "landing";
export type Direction = "right" | "left" | "front" | "back";
export interface AnimationClip {
  frames: readonly number[];
  fps: number;
  loop: boolean;
}
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  groundX: number;
  groundY: number;
}
export interface CharacterManifest<State extends string = AnimationState> {
  name: string;
  atlas: string;
  columns: number;
  rows: number;
  size: number;
  groundAnchor: readonly [number, number];
  directions: Record<Direction, number>;
  animations: Record<State, AnimationClip>;
  pixelsPerUnit?: number;
  frames?: Record<Direction, readonly SpriteFrame[]>;
}
export interface PlayableCharacterManifest extends CharacterManifest {
  palette: {
    primary: string;
    highlight: string;
  };
}
export interface PlatformSpec {
  id: string;
  x: number;
  z: number;
  top: number;
  width: number;
  depth: number;
  section: number;
  moving?: { axis: "x" | "z"; distance: number; period: number };
}
