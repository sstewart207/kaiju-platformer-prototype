import * as THREE from "three";
import { CharacterSprite, SOLARGON } from "./animation";
import type { CharacterManifest, Direction, Vec3 } from "./types";
import { ATTACK, type CombatPose, type PlayerAttacks } from "./player-attacks";
import atlas from "../art/solargon-combat-v1.audit.json";

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
    swipe: { frames: [1, 0], fps: 7, loop: false },
    charge: { frames: [2], fps: 1, loop: false },
    beam: { frames: [3], fps: 1, loop: false },
    hurt: { frames: [4], fps: 1, loop: false },
    defeat: { frames: [5], fps: 1, loop: false },
  },
};
export class PlayerCombatView {
  readonly character: CharacterSprite<CombatPose>;
  private swipe: THREE.Mesh;
  private beam = new THREE.Group();
  private charge: THREE.Mesh;
  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    this.character = new CharacterSprite(SOLARGON_COMBAT, texture);
    const gold = new THREE.MeshBasicMaterial({
      color: SOLARGON.palette.primary,
      toneMapped: false,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const cream = new THREE.MeshBasicMaterial({
      color: SOLARGON.palette.highlight,
      toneMapped: false,
    });
    this.swipe = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.045, 5, 24, Math.PI / 1.4),
      gold,
    );
    this.beam.add(
      new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 0.2), gold),
      new THREE.Mesh(new THREE.BoxGeometry(1, 0.065, 0.08), cream),
    );
    this.charge = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), cream);
    scene.add(
      this.character.sprite,
      this.character.occludedSprite,
      this.swipe,
      this.beam,
      this.charge,
    );
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
  ) {
    this.character.sprite.visible = this.character.occludedSprite.visible =
      !!pose;
    if (pose) {
      this.character.update(position, pose, direction, dt, camera, pixelSize);
      this.character.sprite.material.opacity = opacity;
    }
    this.swipe.visible =
      attack.kind === "swipe" &&
      attack.age >= ATTACK.swipeWindup &&
      attack.age < ATTACK.swipeWindup + ATTACK.swipeActive;
    this.swipe.position.set(position.x, position.y + 0.85, position.z);
    this.swipe.rotation.set(
      Math.PI / 2,
      0,
      Math.atan2(attack.direction.z, attack.direction.x) - Math.PI / 2.8,
    );
    this.swipe.scale.setScalar(0.8 + (attack.age - ATTACK.swipeWindup) * 3);
    this.charge.visible =
      attack.kind === "solar" && attack.age < ATTACK.solarCharge;
    this.charge.position.set(
      attack.origin.x + attack.direction.x * 0.6,
      attack.origin.y,
      attack.origin.z + attack.direction.z * 0.6,
    );
    this.charge.scale.setScalar(0.5 + attack.age / ATTACK.solarCharge);
    this.beam.visible = attack.beamActive && attack.beamLength > 0.01;
    this.beam.position.set(
      attack.origin.x + attack.direction.x * (0.5 + attack.beamLength / 2),
      attack.origin.y,
      attack.origin.z + attack.direction.z * (0.5 + attack.beamLength / 2),
    );
    this.beam.rotation.y = -Math.atan2(attack.direction.z, attack.direction.x);
    this.beam.scale.set(attack.beamLength, 1, 1);
  }
}
