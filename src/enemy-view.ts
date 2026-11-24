import * as THREE from "three";
import { CharacterSprite } from "./animation";
import { Combat, ENEMY, type EnemyAction } from "./combat";
import type { CharacterManifest } from "./types";
import atlas from "../art/human-zombie-atlas-v1.audit.json";
import { PixelSheet, PixelSprite } from "./pixel-fx";

type EnemyPose = EnemyAction | "meleeWindup" | "meleeStrike";
export const HUMAN_ZOMBIE: CharacterManifest<EnemyPose> = {
  name: "Zombie",
  secondaryMotion: {
    breathing: { pixels: 1.25, seconds: 2.8 },
    hair: { pixels: 2, seconds: 0.36, from: 0.66 },
  },
  atlas: `${import.meta.env.BASE_URL}assets/human-zombie-atlas-v1.png`,
  columns: 8,
  rows: 4,
  size: 2,
  pixelsPerUnit: atlas.pixelsPerUnit,
  groundAnchor: [0.5, 0.1],
  frames: atlas.frames,
  directions: { right: 0, left: 1, front: 2, back: 3 },
  animations: {
    idle: { frames: [0], fps: 1, loop: true },
    walking: { frames: [1, 2], fps: 6, loop: true },
    melee: { frames: [0, 0, 3, 0, 0], fps: 5, loop: false },
    meleeWindup: { frames: [0], fps: 1, loop: false },
    meleeStrike: { frames: [3], fps: 1, loop: false },
    charging: { frames: [4], fps: 1, loop: false },
    shooting: { frames: [5], fps: 1, loop: false },
    hurt: { frames: [6], fps: 1, loop: false },
    defeated: { frames: [7], fps: 1, loop: false },
  },
};

export class EnemyView {
  readonly character: CharacterSprite<EnemyPose>;
  private shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private warning: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private pips = new THREE.Group();
  private balls = Array.from(
    { length: 4 },
    () => new PixelSprite("enemy-fireball", ENEMY.fireballRadius / 6),
  );
  private charge = new PixelSprite("enemy-charge", 0.014, { x: 15, y: -22 });
  private claw = new PixelSheet("enemy-claw");
  private slash: THREE.Mesh;
  private contacts = Array.from(
    { length: 4 },
    () => new PixelSprite("enemy-hit", 0.027, { x: 0, y: -20 }),
  );
  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    this.character = new CharacterSprite(HUMAN_ZOMBIE, texture.clone());
    scene.add(this.character.sprite, this.character.occludedSprite);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 16),
      new THREE.MeshBasicMaterial({
        color: "#354d39",
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    scene.add(this.shadow);
    this.warning = new THREE.Mesh(
      new THREE.RingGeometry(0.78, 0.87, 32),
      new THREE.MeshBasicMaterial({
        color: "#ff922b",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.warning.rotation.x = -Math.PI / 2;
    scene.add(this.warning, this.pips);
    for (let i = 0; i < ENEMY.health; i++) {
      const pip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.13, 0.1),
        new THREE.MeshBasicMaterial({
          color: "#ffb866",
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
          transparent: true,
        }),
      );
      pip.renderOrder = 2;
      pip.position.x = (i - 0.5) * 0.2;
      this.pips.add(pip);
    }
    const geometry = new THREE.PlaneGeometry(1, ENEMY.meleeHalfWidth * 2);
    geometry.translate(0.5, 0, 0);
    geometry.rotateX(-Math.PI / 2);
    this.slash = new THREE.Mesh(geometry, this.claw.material);
    this.slash.visible = false;
    scene.add(
      this.slash,
      this.charge.sprite,
      ...this.balls.map((fx) => fx.sprite),
      ...this.contacts.map((fx) => fx.sprite),
    );
  }
  update(
    combat: Combat,
    camera: THREE.Camera,
    pixelSize: number,
    dt: number,
    alpha: number,
  ) {
    const p = combat.position;
    const x = THREE.MathUtils.lerp(combat.previous.x, p.x, alpha);
    const y =
      THREE.MathUtils.lerp(combat.previous.y, p.y, alpha) - ENEMY.footOffset;
    const z = THREE.MathUtils.lerp(combat.previous.z, p.z, alpha);
    this.character.update(
      { x, y: y + 0.02, z },
      combat.hp <= 0 && combat.actionTime < 0.12
        ? "hurt"
        : combat.action === "melee"
          ? combat.actionTime < ENEMY.meleeWindup
            ? "meleeWindup"
            : combat.actionTime < ENEMY.meleeWindup + ENEMY.meleeActive + 0.12
              ? "meleeStrike"
              : "idle"
          : combat.action,
      combat.facing,
      dt,
      camera,
      pixelSize,
    );
    const visible = combat.hp > 0 || combat.actionTime < 0.8;
    this.character.sprite.visible = this.character.occludedSprite.visible =
      visible;
    this.character.sprite.material.opacity = combat.hp
      ? 1
      : Math.max(0, 1 - combat.actionTime / 0.8);
    this.shadow.position.set(x, y + 0.035, z);
    this.shadow.visible = visible;
    this.warning.visible =
      combat.hp > 0 &&
      (combat.action === "charging" ||
        (combat.action === "melee" && combat.actionTime < ENEMY.meleeWindup));
    this.warning.position.set(p.x, p.y - ENEMY.footOffset + 0.045, p.z);
    this.warning.scale.setScalar(0.7 + Math.min(1, combat.windup) * 0.55);
    this.warning.material.color.set(
      combat.action === "melee" ? "#e97555" : "#ffb12b",
    );
    this.pips.visible = combat.hp > 0;
    this.pips.position.set(x, y + 2.15, z);
    this.pips.quaternion.copy(camera.quaternion);
    this.pips.children.forEach((pip, i) => (pip.visible = i < combat.hp));
    const heading = combat.attackDirection;
    this.charge.sprite.visible =
      combat.hp > 0 && combat.action === "charging" && combat.muzzleClear;
    this.charge.sprite.position.set(
      p.x + heading.x * 0.65,
      p.y + 0.25,
      p.z + heading.z * 0.65,
    );
    this.charge.frame(combat.actionTime * 2);
    this.slash.visible =
      combat.hp > 0 &&
      combat.action === "melee" &&
      combat.actionTime >= ENEMY.meleeWindup &&
      combat.actionTime < ENEMY.meleeWindup + ENEMY.meleeActive + 0.1 &&
      combat.meleeVisualLength > 0.04;
    this.slash.position.set(p.x, p.y + 0.15, p.z);
    this.slash.rotation.y = -Math.atan2(heading.z, heading.x);
    this.slash.scale.set(combat.meleeVisualLength, 1, 1);
    const striking =
      combat.actionTime >= ENEMY.meleeWindup &&
      combat.actionTime < ENEMY.meleeWindup + ENEMY.meleeActive;
    this.claw.frame(
      striking
        ? 0.04 +
            ((combat.actionTime - ENEMY.meleeWindup) / ENEMY.meleeActive) * 0.13
        : 0.24 +
            Math.max(
              0,
              combat.actionTime - ENEMY.meleeWindup - ENEMY.meleeActive,
            ) *
              2,
    );
    this.claw.material.opacity =
      combat.actionTime < ENEMY.meleeWindup + ENEMY.meleeActive ? 1 : 0.3;
    this.contacts.forEach((fx, i) => {
      const impact = combat.impacts[i];
      fx.sprite.visible = !!impact;
      if (!impact) return;
      fx.sprite.position.copy(impact.position);
      fx.frame(impact.age);
      fx.aim(impact.direction, camera);
    });
    this.balls.forEach((fx, i) => {
      const ball = combat.projectiles[i];
      fx.sprite.visible = !!ball;
      if (!ball) return;
      fx.sprite.position.set(
        THREE.MathUtils.lerp(ball.previous.x, ball.position.x, alpha),
        THREE.MathUtils.lerp(ball.previous.y, ball.position.y, alpha),
        THREE.MathUtils.lerp(ball.previous.z, ball.position.z, alpha),
      );
      fx.frame(ball.age);
      fx.aim(ball.direction, camera);
    });
  }
  snapshot() {
    return {
      charging: this.charge.sprite.visible,
      slash: this.slash.visible,
      clawFrame: this.claw.frameIndex,
      fireballFrames: this.balls
        .filter((fx) => fx.sprite.visible)
        .map((fx) => fx.sheet.frameIndex),
      contactFrames: this.contacts
        .filter((fx) => fx.sprite.visible)
        .map((fx) => fx.sheet.frameIndex),
    };
  }
}
