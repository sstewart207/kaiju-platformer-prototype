import * as THREE from "three";
import { CharacterSprite } from "./animation";
import { Combat, ENEMY, type EnemyAction } from "./combat";
import type { CharacterManifest } from "./types";
import atlas from "../art/human-zombie-atlas-v1.audit.json";

export const HUMAN_ZOMBIE: CharacterManifest<EnemyAction> = {
  name: "Zombie",
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
    charging: { frames: [4], fps: 1, loop: false },
    shooting: { frames: [5], fps: 1, loop: false },
    hurt: { frames: [6], fps: 1, loop: false },
    defeated: { frames: [7], fps: 1, loop: false },
  },
};

export class EnemyView {
  readonly character: CharacterSprite<EnemyAction>;
  private shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private warning: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private pips = new THREE.Group();
  private balls: THREE.Group[] = [];
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
    const shell = new THREE.MeshBasicMaterial({ color: "#ff7715" });
    const core = new THREE.MeshBasicMaterial({ color: "#fff0a0" });
    const outerGeometry = new THREE.IcosahedronGeometry(
      ENEMY.fireballRadius,
      0,
    );
    const coreGeometry = new THREE.BoxGeometry(0.21, 0.21, 0.21);
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      group.add(
        new THREE.Mesh(outerGeometry, shell),
        new THREE.Mesh(coreGeometry, core),
      );
      for (let tail = 0; tail < 3; tail++) {
        const bit = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          shell,
        );
        bit.position.z = -(tail + 1) * 0.2;
        bit.scale.setScalar(1 - tail * 0.25);
        group.add(bit);
      }
      group.visible = false;
      scene.add(group);
      this.balls.push(group);
    }
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
      combat.action,
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
      (combat.action === "charging" || combat.action === "melee");
    this.warning.position.set(p.x, p.y - ENEMY.footOffset + 0.045, p.z);
    this.warning.scale.setScalar(0.7 + Math.min(1, combat.windup) * 0.55);
    this.warning.material.color.set(
      combat.action === "melee" ? "#e97555" : "#ffb12b",
    );
    this.pips.visible = combat.hp > 0;
    this.pips.position.set(x, y + 2.15, z);
    this.pips.quaternion.copy(camera.quaternion);
    this.pips.children.forEach((pip, i) => (pip.visible = i < combat.hp));
    this.balls.forEach((group, i) => {
      const ball = combat.projectiles[i];
      group.visible = !!ball;
      if (!ball) return;
      group.position.set(
        THREE.MathUtils.lerp(ball.previous.x, ball.position.x, alpha),
        THREE.MathUtils.lerp(ball.previous.y, ball.position.y, alpha),
        THREE.MathUtils.lerp(ball.previous.z, ball.position.z, alpha),
      );
      group.lookAt(
        group.position.x + ball.direction.x,
        group.position.y + ball.direction.y,
        group.position.z + ball.direction.z,
      );
    });
  }
}
