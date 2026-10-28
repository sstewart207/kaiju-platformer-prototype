import * as THREE from "three";
import type {
  CharacterManifest,
  PlayableCharacterManifest,
  AnimationState,
  Direction,
  Vec3,
  SpriteAtlas,
} from "./types";
import auditedAtlas from "../art/solargon-atlas-v2.audit.json";
import fallAtlas from "../art/solargon-fall-v1.audit.json";
import { SpriteMotion } from "./sprite-motion";

export const SOLARGON_FALL: SpriteAtlas = {
  atlas: `${import.meta.env.BASE_URL}assets/solargon-fall-v1.png`,
  columns: 2,
  rows: 2,
  size: 2.4,
  pixelsPerUnit: fallAtlas.pixelsPerUnit,
  frames: fallAtlas.frames,
  groundAnchor: [0.5, 0.1],
  directions: { right: 0, left: 0, front: 1, back: 1 },
};

export const SOLARGON: PlayableCharacterManifest = {
  name: "Solargon",
  palette: { primary: "#f4c45a", highlight: "#fff4cf" },
  secondaryMotion: { breathing: { pixels: 1.25, seconds: 8 / 3 } },
  stateAtlases: { falling: SOLARGON_FALL },
  atlas: `${import.meta.env.BASE_URL}assets/solargon-atlas-v2.png`,
  columns: 8,
  rows: 4,
  size: 2.4,
  // Preserve source-pixel scale when the irregular frame widths change.
  pixelsPerUnit: 1774 / 8 / 2.4,
  groundAnchor: [0.5, 0.08],
  frames: auditedAtlas.frames,
  directions: { right: 0, left: 1, front: 2, back: 3 },
  animations: {
    idle: { frames: [0, 1], fps: 0.75, loop: true },
    running: { frames: [2, 3, 4, 5], fps: 10, loop: true },
    dashing: { frames: [7], fps: 1, loop: false },
    jumping: { frames: [6], fps: 1, loop: false },
    falling: { frames: [0], fps: 1, loop: false },
    landing: { frames: [7], fps: 10, loop: false },
  },
};
export class CharacterSprite<State extends string = AnimationState> {
  readonly sprite: THREE.Sprite;
  readonly occludedSprite: THREE.Sprite;
  private projected = new THREE.Vector3();
  private time = 0;
  private state: State | null = null;
  private motion: SpriteMotion | null = null;
  constructor(
    private manifest: CharacterManifest<State>,
    private texture: THREE.Texture,
    private stateTextures: Partial<Record<State, THREE.Texture>> = {},
  ) {
    for (const atlasTexture of [
      texture,
      ...(Object.values(stateTextures) as THREE.Texture[]),
    ]) {
      atlasTexture.magFilter = THREE.NearestFilter;
      atlasTexture.minFilter = THREE.NearestFilter;
      atlasTexture.generateMipmaps = false;
      atlasTexture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.repeat.set(1 / manifest.columns, 1 / manifest.rows);
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.4,
        depthWrite: true,
        toneMapped: false,
      }),
    );
    this.sprite.center.set(...manifest.groundAnchor);
    this.sprite.scale.setScalar(manifest.size);
    // Show only the pixels hidden by closer geometry; visible sprite pixels
    // retain their normal colors and depth. This does not alter collision.
    this.occludedSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        color: "#fff0bc",
        transparent: true,
        opacity: 0.35,
        alphaTest: 0.1,
        depthTest: true,
        depthWrite: false,
        depthFunc: THREE.GreaterDepth,
        toneMapped: false,
      }),
    );
    this.occludedSprite.renderOrder = 1;
    if (manifest.secondaryMotion) {
      this.motion = new SpriteMotion(manifest.secondaryMotion);
      this.sprite.geometry = this.occludedSprite.geometry =
        this.motion.geometry;
    }
  }
  update(
    position: Vec3,
    state: State,
    direction: Direction,
    dt: number,
    camera: THREE.Camera,
    pixelSize: number,
  ) {
    if (state !== this.state) {
      this.state = state;
      this.time = 0;
    }
    this.time += dt;
    const clip = this.manifest.animations[state];
    const index = Math.floor(this.time * clip.fps);
    const frame =
      clip.frames[
        clip.loop
          ? index % clip.frames.length
          : Math.min(index, clip.frames.length - 1)
      ];
    const alternate = this.manifest.stateAtlases?.[state];
    if (alternate && !this.stateTextures[state])
      throw new Error(`Missing ${state} texture for ${this.manifest.name}`);
    const asset = alternate ?? this.manifest;
    const texture = alternate ? this.stateTextures[state]! : this.texture;
    this.sprite.material.map = this.occludedSprite.material.map = texture;
    // Inset a fraction of a texel to prevent adjacent frames bleeding at the cell edges.
    const image = texture.image as HTMLImageElement;
    const rect = asset.frames?.[direction][frame];
    const insetX = 0.5 / image.width,
      insetY = 0.5 / image.height;
    if (rect) {
      texture.repeat.set(
        (rect.width - 1) / image.width,
        (rect.height - 1) / image.height,
      );
      texture.offset.set(
        (rect.x + 0.5) / image.width,
        1 - (rect.y + rect.height - 0.5) / image.height,
      );
      this.sprite.center.set(rect.groundX, rect.groundY);
      const width = asset.pixelsPerUnit
        ? rect.width / asset.pixelsPerUnit
        : asset.size;
      this.sprite.scale.set(width, (width * rect.height) / rect.width, 1);
    } else {
      texture.repeat.set(
        1 / asset.columns - 2 * insetX,
        1 / asset.rows - 2 * insetY,
      );
      texture.offset.set(
        frame / asset.columns + insetX,
        1 - (asset.directions[direction] + 1) / asset.rows + insetY,
      );
      this.sprite.center.set(...asset.groundAnchor);
      this.sprite.scale.setScalar(asset.size);
    }
    this.motion?.update(
      state,
      direction,
      dt,
      pixelSize,
      this.sprite.scale,
      this.sprite.center.y,
      position,
    );
    const projected = this.projected
      .set(position.x, position.y, position.z)
      .applyMatrix4(camera.matrixWorldInverse);
    projected.x = Math.round(projected.x / pixelSize) * pixelSize;
    projected.y = Math.round(projected.y / pixelSize) * pixelSize;
    projected.applyMatrix4(camera.matrixWorld);
    this.sprite.position.copy(projected);
    this.occludedSprite.position.copy(projected);
    this.occludedSprite.scale.copy(this.sprite.scale);
    this.occludedSprite.center.copy(this.sprite.center);
  }
}
