import * as THREE from "three";
import { CharacterSprite } from "./animation";
import type { CharacterManifest, Direction, SpriteAtlas, Vec3 } from "./types";
import { ATTACK, type CombatPose, type PlayerAttacks } from "./player-attacks";
import atlas from "../art/solargon-combat-v1.audit.json";
import solarAtlas from "../art/solargon-solar-v2.audit.json";
import { AttackEffects } from "./attack-effects";

export const SOLARGON_SOLAR: SpriteAtlas = {
  atlas: `${import.meta.env.BASE_URL}assets/solargon-solar-v2.png`,
  columns: 8,
  rows: 4,
  size: 2.4,
  pixelsPerUnit: solarAtlas.pixelsPerUnit,
  frames: solarAtlas.frames,
  groundAnchor: [0.5, 0.1],
  directions: { right: 0, left: 1, front: 2, back: 3 },
};

export const SOLARGON_COMBAT: CharacterManifest<CombatPose> = {
  name: "Solargon",
  atlas: `${import.meta.env.BASE_URL}assets/solargon-combat-v1.png`,
  columns: 6,
  rows: 4,
  size: 2.4,
  pixelsPerUnit: atlas.pixelsPerUnit,
  frames: atlas.frames,
  groundAnchor: [0.5, 0.1],
  directions: { right: 0, left: 1, front: 2, back: 3 },
  stateAtlases: {
    charge: SOLARGON_SOLAR,
    beam: SOLARGON_SOLAR,
    recover: SOLARGON_SOLAR,
  },
  animations: {
    swipeWindup: { frames: [0], fps: 1, loop: false },
    swipe: { frames: [1], fps: 1, loop: false },
    charge: { frames: [0, 1, 3], fps: 3 / ATTACK.solarCharge, loop: false },
    beam: { frames: [2, 4, 5, 4], fps: 12, loop: true },
    recover: { frames: [6, 7], fps: 2 / ATTACK.solarRecovery, loop: false },
    hurt: { frames: [4], fps: 1, loop: false },
    defeat: { frames: [5], fps: 1, loop: false },
  },
};
export class PlayerCombatView {
  readonly character: CharacterSprite<CombatPose>;
  readonly effects: AttackEffects;
  constructor(
    scene: THREE.Scene,
    texture: THREE.Texture,
    solarTexture: THREE.Texture,
  ) {
    this.character = new CharacterSprite(SOLARGON_COMBAT, texture, {
      charge: solarTexture,
      beam: solarTexture,
      recover: solarTexture,
    });
    this.effects = new AttackEffects(scene);
    scene.add(this.character.sprite, this.character.occludedSprite);
  }
  update(
    pose: CombatPose | null,
    direction: Direction,
    position: Vec3,
    attack: PlayerAttacks,
    camera: THREE.Camera,
    pixelSize: number,
    dt: number,
    opacity: number,
    alpha = 1,
  ) {
    this.character.sprite.visible = this.character.occludedSprite.visible =
      !!pose;
    if (pose) {
      const end = ATTACK.swipeWindup + ATTACK.swipeActive;
      const recovering = pose === "swipe" && attack.age >= end;
      const breath = attack.kind === "solar";
      let animationTime: number | undefined;
      if (pose === "charge")
        animationTime = breath
          ? attack.age
          : attack.age * ATTACK.solarCharge / ATTACK.fireballWindup;
      if (pose === "beam")
        animationTime = breath
          ? attack.solarFireAge
          : attack.age - ATTACK.fireballWindup;
      if (pose === "recover")
        animationTime = attack.solarRecoveryProgress * ATTACK.solarRecovery;
      this.character.update(
        position,
        recovering ? "swipeWindup" : pose,
        direction,
        attack.hitStopped ? 0 : dt,
        camera,
        pixelSize,
        animationTime,
      );
      this.character.sprite.material.opacity = opacity;
      const winding = pose === "swipeWindup";
      const striking = pose === "swipe" && !recovering;
      const recovery = recovering
        ? Math.max(0, 1 - (attack.age - end) / (ATTACK.swipeDuration - end))
        : 0;
      const lean = direction === "right" ? -1 : direction === "left" ? 1 : 0;
      const rotation = lean * (winding ? -0.06 : striking ? 0.1 : recovery * 0.06);
      for (const sprite of [
        this.character.sprite,
        this.character.occludedSprite,
      ]) {
        // The new solar sheet carries jaw, neck and wing motion in the art.
        // Keep its planted feet stable instead of rotating the whole drawing.
        if (pose === "charge" || pose === "beam" || pose === "recover") {
          sprite.material.rotation = 0;
          continue;
        }
        sprite.material.rotation = rotation;
        sprite.scale.x *= winding
          ? 1.03
          : striking
            ? 1.05
            : 1 + recovery * 0.02;
        sprite.scale.y *= winding
          ? 0.97
          : striking
            ? 0.98
            : 1 - recovery * 0.01;
      }
    }
    this.effects.update(attack, camera, alpha);
  }
}
