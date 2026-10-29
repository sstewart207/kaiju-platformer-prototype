import * as THREE from "three";
import { SOLARGON } from "./animation";
import { ATTACK, type PlayerAttacks } from "./player-attacks";
import { FIREBALL } from "./player-projectiles";

/** A tapered claw path in the normalized forward strike footprint (X forward). */
function clawRibbon(radius: number, span: number, thickness: number) {
  const vertices: number[] = [],
    indices: number[] = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      arc = Math.sin(t * Math.PI);
    const x = 0.04 + radius * arc;
    const z = (t * 2 - 1) * span;
    const width = thickness * Math.pow(arc, 0.65);
    vertices.push(Math.max(0, x - width), 0, z, Math.min(1, x + width), 0, z);
    if (i < segments) {
      const p = i * 2;
      indices.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  return geometry;
}

export class AttackEffects {
  readonly swipe = new THREE.Group();
  private swipeMaterials: THREE.MeshBasicMaterial[] = [];
  private clawCores: THREE.Mesh[] = [];
  private beam = new THREE.Group();
  private beamStreaks: THREE.Mesh[] = [];
  private muzzle = new THREE.Group();
  private contacts: THREE.Group[] = [];
  private fireballs: THREE.Group[] = [];
  private fading = 0;
  constructor(scene: THREE.Scene) {
    const palette = SOLARGON.palette;
    const outline = new THREE.Color(palette.primary).multiplyScalar(0.24);
    const rim = new THREE.MeshBasicMaterial({
      color: outline,
      side: THREE.BackSide,
      toneMapped: false,
    });
    const gold = new THREE.MeshBasicMaterial({
      color: palette.primary,
      side: THREE.BackSide,
      toneMapped: false,
    });
    const cream = new THREE.MeshBasicMaterial({
      color: palette.highlight,
      toneMapped: false,
    });
    const trail = new THREE.MeshBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      toneMapped: false,
    });

    for (let claw = 0; claw < 3; claw++) {
      const radius = 0.86 - claw * 0.17,
        span = 1 - claw * 0.17;
      for (const [color, width, lift] of [
        [outline, 0.14, 0],
        [new THREE.Color(palette.primary), 0.105, 0.008],
        [new THREE.Color(palette.highlight), 0.046, 0.016],
      ] as const) {
        const material = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          toneMapped: false,
        });
        const mesh = new THREE.Mesh(clawRibbon(radius, span, width), material);
        mesh.position.y = lift;
        this.swipe.add(mesh);
        this.swipeMaterials.push(material);
        if (lift > 0.01) this.clawCores.push(mesh);
      }
    }

    // The opaque outer body matches the simulated ray; energy lines stay inside it.
    const rayBody = new THREE.BoxGeometry(
      1,
      ATTACK.solarHalfHeight * 2,
      ATTACK.solarHalfWidth * 2,
    );
    this.beam.add(new THREE.Mesh(rayBody, rim));
    const sheath = new THREE.Mesh(rayBody, gold);
    sheath.scale.set(1, 0.86, 0.86);
    const core = new THREE.Mesh(rayBody, cream);
    core.scale.set(1, 0.38, 0.38);
    this.beam.add(sheath, core);
    for (let i = 0; i < 6; i++) {
      const streak = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.025, 0.05),
        cream,
      );
      this.beam.add(streak);
      this.beamStreaks.push(streak);
    }
    const muzzleGeometry = new THREE.IcosahedronGeometry(0.18, 1);
    this.muzzle.add(new THREE.Mesh(muzzleGeometry, gold));
    const muzzleCore = new THREE.Mesh(muzzleGeometry, cream);
    muzzleCore.scale.setScalar(0.7);
    this.muzzle.add(muzzleCore);

    const bodyGeometry = new THREE.IcosahedronGeometry(FIREBALL.radius, 1);
    const tailGeometry = new THREE.ConeGeometry(FIREBALL.radius * 0.8, 1.05, 5);
    tailGeometry.rotateZ(Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const ball = new THREE.Group();
      const tail = new THREE.Mesh(tailGeometry, trail);
      tail.position.x = -0.55;
      ball.add(tail, new THREE.Mesh(bodyGeometry, rim));
      const shell = new THREE.Mesh(bodyGeometry, gold);
      shell.scale.setScalar(0.87);
      const heart = new THREE.Mesh(bodyGeometry, cream);
      heart.scale.setScalar(0.56);
      ball.add(shell, heart);
      ball.visible = false;
      scene.add(ball);
      this.fireballs.push(ball);
    }

    const sparkGeometry = new THREE.BoxGeometry(0.28, 0.065, 0.025);
    for (let i = 0; i < 16; i++) {
      const contact = new THREE.Group();
      const flash = new THREE.Mesh(new THREE.CircleGeometry(0.13, 4), cream);
      contact.add(flash);
      for (let ray = 0; ray < 6; ray++) {
        const spark = new THREE.Mesh(sparkGeometry, ray % 2 ? gold : cream);
        spark.rotation.z = (ray * Math.PI) / 3;
        contact.add(spark);
      }
      contact.visible = false;
      scene.add(contact);
      this.contacts.push(contact);
    }
    this.swipe.visible = this.beam.visible = this.muzzle.visible = false;
    scene.add(this.swipe, this.beam, this.muzzle);
  }

  update(attack: PlayerAttacks, camera: THREE.Camera, alpha: number) {
    const end = ATTACK.swipeWindup + ATTACK.swipeActive;
    const active =
      attack.kind === "swipe" &&
      attack.age >= ATTACK.swipeWindup &&
      attack.age < end;
    const follow =
      attack.kind === "swipe" && attack.age >= end && attack.age < end + 0.12;
    this.swipe.visible = (active || follow) && attack.swipeLength > 0.04;
    this.fading = active
      ? 1
      : follow
        ? 0.42 * (1 - (attack.age - end) / 0.12)
        : 0;
    this.swipeMaterials.forEach((material) => {
      material.opacity = this.fading;
    });
    this.clawCores.forEach((mesh) => {
      mesh.visible = active;
    });
    this.swipe.position.set(
      attack.origin.x,
      attack.origin.y - 0.08,
      attack.origin.z,
    );
    this.swipe.rotation.y = -Math.atan2(attack.direction.z, attack.direction.x);
    this.swipe.scale.set(attack.swipeLength, 1, ATTACK.swipeHalfWidth);

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
      const progress = Math.min(1, impact.age / 0.18);
      contact.children[0].scale.setScalar(Math.max(0, 1 - progress * 3));
      for (let ray = 0; ray < 6; ray++) {
        const spark = contact.children[ray + 1];
        const angle = (ray * Math.PI) / 3;
        spark.position.set(
          Math.cos(angle) * (0.12 + progress * 0.48),
          Math.sin(angle) * (0.12 + progress * 0.48),
          0,
        );
        spark.scale.set(1 - progress * 0.85, 1 - progress * 0.6, 1);
      }
    });

    this.beam.visible = attack.beamActive && attack.beamLength > 0.01;
    this.beam.position.set(
      attack.origin.x +
        attack.direction.x * (ATTACK.solarMuzzle + attack.beamLength / 2),
      attack.origin.y,
      attack.origin.z +
        attack.direction.z * (ATTACK.solarMuzzle + attack.beamLength / 2),
    );
    this.beam.rotation.y = -Math.atan2(attack.direction.z, attack.direction.x);
    this.beam.scale.set(attack.beamLength, 1, 1);
    this.beamStreaks.forEach((streak, index) => {
      streak.position.set(
        -0.45 + ((attack.age * 3 + index / 6) % 1) * 0.9,
        (index % 2 ? -1 : 1) * 0.075,
        0,
      );
    });
    this.muzzle.visible =
      (((attack.kind === "solar" || attack.kind === "fireball") &&
        attack.pose === "charge") ||
        attack.beamActive) &&
      attack.beamLength > 0.01;
    this.muzzle.position.set(
      attack.origin.x + attack.direction.x * ATTACK.solarMuzzle,
      attack.origin.y,
      attack.origin.z + attack.direction.z * ATTACK.solarMuzzle,
    );
    const chargeTime =
      attack.kind === "fireball" ? ATTACK.fireballWindup : ATTACK.solarCharge;
    this.muzzle.scale.setScalar(
      Math.min(
        attack.beamLength / 0.18,
        attack.beamActive
          ? 1.15 + Math.sin(attack.age * 18) * 0.06
          : 0.6 + Math.min(1, attack.age / chargeTime) * 0.6,
      ),
    );

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

  snapshot() {
    return {
      swipeVisible: this.swipe.visible,
      swipeActive:
        this.swipe.visible && this.clawCores.some((mesh) => mesh.visible),
      swipeOpacity: this.fading,
      swipeLength: this.swipe.scale.x,
      rayVisible: this.beam.visible,
      muzzleVisible: this.muzzle.visible,
      fireballsVisible: this.fireballs.filter((mesh) => mesh.visible).length,
    };
  }
}
