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
  attackPressed?: boolean;
  specialPressed?: boolean;
  specialHeld?: boolean;
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
export interface SpriteMotionOptions {
  breathing?: { pixels: number; seconds: number };
  hair?: { pixels: number; seconds: number; from: number };
}
export interface SpriteAtlas {
  atlas: string;
  columns: number;
  rows: number;
  size: number;
  groundAnchor: readonly [number, number];
  directions: Record<Direction, number>;
  pixelsPerUnit?: number;
  frames?: Record<Direction, readonly SpriteFrame[]>;
}
export interface CharacterManifest<State extends string = AnimationState>
  extends SpriteAtlas {
  name: string;
  animations: Record<State, AnimationClip>;
  stateAtlases?: Partial<Record<State, SpriteAtlas>>;
  secondaryMotion?: SpriteMotionOptions;
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
