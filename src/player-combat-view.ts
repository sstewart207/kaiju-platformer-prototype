import * as THREE from "three";
import { CharacterSprite } from "./animation";
import type { CharacterManifest, Direction, Vec3 } from "./types";
import { ATTACK, type CombatPose, type PlayerAttacks } from "./player-attacks";
import atlas from "../art/solargon-combat-v1.audit.json";
import { AttackEffects } from "./attack-effects";

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
  animations: {
    swipeWindup: { frames: [0], fps: 1, loop: false },
    swipe: { frames: [1], fps: 1, loop: false },
    charge: { frames: [2], fps: 1, loop: false },
    beam: { frames: [3], fps: 1, loop: false },
    hurt: { frames: [4], fps: 1, loop: false },
    defeat: { frames: [5], fps: 1, loop: false },
  },
};
export class PlayerCombatView {
  readonly character: CharacterSprite<CombatPose>;
  readonly effects: AttackEffects;
  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    this.character = new CharacterSprite(SOLARGON_COMBAT, texture);
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
      this.character.update(
        position,
        recovering ? "swipeWindup" : pose,
        direction,
        attack.hitStopped ? 0 : dt,
        camera,
        pixelSize,
      );
      this.character.sprite.material.opacity = opacity;
      const winding = pose === "swipeWindup";
      const striking = pose === "swipe" && !recovering;
      const recovery = recovering
        ? Math.max(0, 1 - (attack.age - end) / (ATTACK.swipeDuration - end))
        : 0;
      const lean = direction === "right" ? -1 : direction === "left" ? 1 : 0;
      const rotation =
        lean * (winding ? -0.06 : striking ? 0.1 : recovery * 0.06);
      for (const sprite of [
        this.character.sprite,
        this.character.occludedSprite,
      ]) {
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
