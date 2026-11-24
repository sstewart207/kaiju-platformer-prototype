import * as THREE from "three";
import { ATTACK, type PlayerAttacks } from "./player-attacks";
import { FIREBALL } from "./player-projectiles";
import { PixelSheet, PixelSprite, placeRibbon } from "./pixel-fx";

export class AttackEffects {
  readonly swipe: THREE.Mesh;
  private claw = new PixelSheet("solar-claw");
  private ray = new PixelSheet("solar-ray");
  private beam: THREE.Mesh;
  private tip = new PixelSprite("solar-front", 0.012);
  private muzzle = new PixelSprite("solar-mouth", 0.022);
  private contacts = Array.from(
    { length: 16 },
    () => new PixelSprite("solar-hit", 0.035, { x: 0, y: -20 }),
  );
  private fireballs = Array.from(
    { length: 12 },
    () => new PixelSprite("solar-fireball", FIREBALL.radius / 6),
  );
  private fading = 0;
  private active = false;
  constructor(scene: THREE.Scene) {
    const slash = new THREE.PlaneGeometry(1, 2);
    slash.translate(0.5, 0, 0);
    slash.rotateX(-Math.PI / 2);
    this.swipe = new THREE.Mesh(slash, this.claw.material);
    const ribbon = new THREE.PlaneGeometry(1, 1, 32, 1);
    const vertices = ribbon.getAttribute("position");
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i) + 0.5;
      vertices.setY(
        i,
        vertices.getY(i) * Math.min(1, 0.15 + x * 24, 0.15 + (1 - x) * 24),
      );
    }
    ribbon.translate(0.5, 0, 0);
    this.beam = new THREE.Mesh(ribbon, this.ray.material);
    this.beam.renderOrder = 1;
    this.swipe.visible = this.beam.visible = false;
    scene.add(
      this.swipe,
      this.beam,
      this.tip.sprite,
      this.muzzle.sprite,
      ...this.contacts.map((fx) => fx.sprite),
      ...this.fireballs.map((fx) => fx.sprite),
    );
  }
  update(attack: PlayerAttacks, camera: THREE.Camera, alpha: number) {
    const end = ATTACK.swipeWindup + ATTACK.swipeActive;
    this.active =
      attack.kind === "swipe" &&
      attack.age >= ATTACK.swipeWindup &&
      attack.age < end;
    const follow =
      attack.kind === "swipe" && attack.age >= end && attack.age < end + 0.12;
    this.swipe.visible = (this.active || follow) && attack.swipeLength > 0.04;
    this.fading = this.active
      ? 1
      : follow
        ? 0.42 * (1 - (attack.age - end) / 0.12)
        : 0;
    // Retimed tear, contact and closure within the existing strike and recovery.
    this.claw.frame(
      this.active
        ? 0.04 + ((attack.age - ATTACK.swipeWindup) / ATTACK.swipeActive) * 0.13
        : 0.24 + Math.max(0, attack.age - end) * 2,
    );
    this.claw.material.opacity = this.fading;
    this.swipe.position.set(
      attack.origin.x,
      attack.origin.y - 0.08,
      attack.origin.z,
    );
    this.swipe.rotation.y = -Math.atan2(attack.direction.z, attack.direction.x);
    this.swipe.scale.set(attack.swipeLength, 1, ATTACK.swipeHalfWidth);

    this.contacts.forEach((fx, index) => {
      const impact = attack.impacts[index];
      fx.sprite.visible = !!impact;
      if (!impact) return;
      fx.sprite.position.copy(impact.position);
      fx.frame(impact.age);
      fx.aim(impact.direction, camera);
    });

    const visualLength = attack.solarVisualLength;
    this.beam.visible = visualLength > 0.01;
    this.ray.frame(attack.solarFireAge);
    const fading =
      attack.solarPhase === "recover"
        ? Math.max(0, 1 - attack.solarRecoveryProgress * 3.4)
        : 1;
    this.ray.material.opacity = fading;
    const thickness = ATTACK.solarHalfHeight * 2 * attack.solarWidthScale;
    placeRibbon(
      this.beam,
      new THREE.Vector3(
        attack.origin.x + attack.direction.x * attack.solarMuzzle,
        attack.origin.y,
        attack.origin.z + attack.direction.z * attack.solarMuzzle,
      ),
      attack.direction,
      visualLength,
      thickness,
      camera,
    );
    // The end cap follows the simulated wave front and compresses at solid cover.
    this.tip.sprite.visible = attack.beamActive && attack.beamLength > 0.12;
    const tipInset = Math.min(0.18, attack.beamLength / 2);
    this.tip.sprite.position.set(
      attack.origin.x +
        attack.direction.x *
          (attack.solarMuzzle + attack.beamLength - tipInset),
      attack.origin.y,
      attack.origin.z +
        attack.direction.z *
          (attack.solarMuzzle + attack.beamLength - tipInset),
    );
    this.tip.frame(attack.solarFireAge * 2 + 0.4);
    this.tip.aim(attack.direction, camera);
    this.tip.sprite.scale.setScalar(
      Math.min(thickness * 0.8, attack.beamLength * 0.6),
    );

    this.muzzle.sprite.visible =
      (((attack.kind === "solar" || attack.kind === "fireball") &&
        attack.pose === "charge") ||
        attack.beamActive) &&
      attack.beamClearance > 0.01;
    this.muzzle.sprite.position.set(
      attack.origin.x +
        attack.direction.x * attack.solarMuzzle,
      attack.origin.y + (attack.solarPhase === "charge" ? 0.4 : 0),
      attack.origin.z + attack.direction.z * ATTACK.solarMuzzle,
    );
    const charge =
      attack.kind === "solar"
        ? Math.min(1, attack.age / ATTACK.solarCharge)
        : 1;
    this.muzzle.frame(attack.age * 2);
    const muzzleSize = Math.min(
      0.25 + charge * 0.65,
      attack.beamClearance * 1.6,
    );
    this.muzzle.sprite.scale.set(muzzleSize, muzzleSize, 1);

    this.fireballs.forEach((fx, index) => {
      const ball = attack.projectiles.balls[index];
      fx.sprite.visible = !!ball;
      if (!ball) return;
      // The front-facing drawing has a higher mouth in screen space. Blend
      // its launch socket onto the simulated path within the first body-width.
      const mouthLift = ball.direction.z > 0
        ? 0.5 * Math.max(0, 1 - FIREBALL.speed * ball.age / FIREBALL.sideMuzzle)
        : 0;
      fx.sprite.position.set(
        THREE.MathUtils.lerp(ball.previous.x, ball.position.x, alpha),
        THREE.MathUtils.lerp(ball.previous.y, ball.position.y, alpha) + mouthLift,
        THREE.MathUtils.lerp(ball.previous.z, ball.position.z, alpha),
      );
      fx.frame(ball.age);
      const unitsPerPixel = FIREBALL.radius / 6;
      fx.revealTrail(6 + FIREBALL.speed * ball.age / unitsPerPixel, unitsPerPixel);
      fx.aim(ball.direction, camera);
    });
  }
  snapshot() {
    return {
      swipeVisible: this.swipe.visible,
      swipeActive: this.swipe.visible && this.active,
      swipeOpacity: this.fading,
      swipeLength: this.swipe.scale.x,
      rayVisible: this.beam.visible,
      muzzleVisible: this.muzzle.sprite.visible,
      fireballsVisible: this.fireballs.filter((fx) => fx.sprite.visible).length,
      library: "pixelfx",
      clawFrame: this.claw.frameIndex,
      rayFrame: this.ray.frameIndex,
      fireballFrames: this.fireballs
        .filter((fx) => fx.sprite.visible)
        .map((fx) => fx.sheet.frameIndex),
      contactFrames: this.contacts
        .filter((fx) => fx.sprite.visible)
        .map((fx) => fx.sheet.frameIndex),
      rayLength: this.beam.scale.x,
      rayThickness: this.beam.scale.y,
    };
  }
}
