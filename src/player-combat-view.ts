import * as THREE from "three";
import { CharacterSprite, SOLARGON } from "./animation";
import type { CharacterManifest, Direction, Vec3 } from "./types";
import { ATTACK, type CombatPose, type PlayerAttacks } from "./player-attacks";
import atlas from "../art/solargon-combat-v1.audit.json";
import { FIREBALL } from "./player-projectiles";

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
  private contacts: THREE.Group[] = [];
  private fireballs: THREE.Group[] = [];
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
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1,
          ATTACK.solarHalfHeight * 2,
          ATTACK.solarHalfWidth * 2,
        ),
        gold,
      ),
      new THREE.Mesh(new THREE.BoxGeometry(1, 0.065, 0.08), cream),
    );
    this.charge = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), cream);
    const fireballGeometry = new THREE.IcosahedronGeometry(FIREBALL.radius, 1);
    for (let i = 0; i < 12; i++) {
      const ball = new THREE.Group();
      ball.add(new THREE.Mesh(fireballGeometry, gold));
      const core = new THREE.Mesh(fireballGeometry, cream);
      core.scale.setScalar(0.6);
      ball.add(core);
      for (let trail = 0; trail < 3; trail++) {
        const ember = new THREE.Mesh(fireballGeometry, gold);
        ember.position.x = -(trail + 1) * 0.22;
        ember.scale.setScalar(0.55 - trail * 0.15);
        ball.add(ember);
      }
      ball.visible = false;
      scene.add(ball);
      this.fireballs.push(ball);
    }
    const sparkGeometry = new THREE.BoxGeometry(0.32, 0.04, 0.035);
    for (let i = 0; i < 16; i++) {
      const contact = new THREE.Group();
      for (let ray = 0; ray < 3; ray++) {
        const spark = new THREE.Mesh(sparkGeometry, cream);
        spark.rotation.z = (ray * Math.PI) / 3;
        contact.add(spark);
      }
      contact.visible = false;
      scene.add(contact);
      this.contacts.push(contact);
    }
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
    alpha = 1,
  ) {
    this.character.sprite.visible = this.character.occludedSprite.visible =
      !!pose;
    if (pose) {
      this.character.update(
        position,
        pose,
        direction,
        attack.hitStopped ? 0 : dt,
        camera,
        pixelSize,
      );
      this.character.sprite.material.opacity = opacity;
      const winding = pose === "swipeWindup";
      const striking =
        pose === "swipe" &&
        attack.age < ATTACK.swipeWindup + ATTACK.swipeActive;
      const lean = direction === "right" ? -1 : direction === "left" ? 1 : 0;
      const rotation = lean * (winding ? -0.08 : striking ? 0.12 : 0);
      for (const sprite of [
        this.character.sprite,
        this.character.occludedSprite,
      ]) {
        sprite.material.rotation = rotation;
        sprite.scale.x *= winding ? 1.05 : striking ? 1.08 : 1;
        sprite.scale.y *= winding ? 0.95 : striking ? 0.97 : 1;
      }
    }
    this.swipe.visible =
      attack.kind === "swipe" &&
      attack.age >= ATTACK.swipeWindup &&
      attack.age < ATTACK.swipeWindup + ATTACK.swipeActive;
    this.swipe.position.set(
      position.x + attack.direction.x * 0.75,
      position.y + 0.85,
      position.z + attack.direction.z * 0.75,
    );
    this.swipe.rotation.set(
      Math.PI / 2,
      0,
      Math.atan2(attack.direction.z, attack.direction.x) - Math.PI / 2.8,
    );
    this.swipe.scale.setScalar(
      1.05 + Math.max(0, attack.age - ATTACK.swipeWindup) * 2,
    );
    this.contacts.forEach((contact, index) => {
      const impact = attack.impacts[index];
      contact.visible = !!impact;
      if (!impact) return;
      contact.position.set(
        impact.position.x,
        impact.position.y,
        impact.position.z,
      );
      contact.quaternion.copy(camera.quaternion);
      contact.scale.setScalar(1.6 * (1 - impact.age / 0.18));
    });
    this.charge.visible =
      ((attack.kind === "solar" || attack.kind === "fireball") &&
        attack.age <
          (attack.kind === "fireball"
            ? ATTACK.fireballWindup
            : ATTACK.solarCharge)) ||
      attack.beamActive;
    this.charge.position.set(
      attack.origin.x + attack.direction.x * 0.6,
      attack.origin.y,
      attack.origin.z + attack.direction.z * 0.6,
    );
    const pulse = 1 + Math.sin(attack.age * 45) * 0.1;
    this.charge.scale.setScalar(
      attack.beamActive ? pulse : 0.5 + attack.age / ATTACK.solarCharge,
    );
    this.beam.visible = attack.beamActive && attack.beamLength > 0.01;
    this.beam.position.set(
      attack.origin.x +
        attack.direction.x * (ATTACK.solarMuzzle + attack.beamLength / 2),
      attack.origin.y,
      attack.origin.z +
        attack.direction.z * (ATTACK.solarMuzzle + attack.beamLength / 2),
    );
    this.beam.rotation.y = -Math.atan2(attack.direction.z, attack.direction.x);
    // Keep the outer silhouette identical to the damage volume; pulse only its core.
    this.beam.scale.set(attack.beamLength, 1, 1);
    this.beam.children[1].scale.set(1, pulse, pulse);
    this.fireballs.forEach((mesh, index) => {
      const ball = attack.projectiles.balls[index];
      mesh.visible = !!ball;
      if (!ball) return;
      mesh.position.set(
        THREE.MathUtils.lerp(ball.previous.x, ball.position.x, alpha),
        THREE.MathUtils.lerp(ball.previous.y, ball.position.y, alpha),
        THREE.MathUtils.lerp(ball.previous.z, ball.position.z, alpha),
      );
      mesh.rotation.y = -Math.atan2(ball.direction.z, ball.direction.x);
    });
  }
}
