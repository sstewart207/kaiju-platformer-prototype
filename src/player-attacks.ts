import { Physics, RAPIER, FIXED_DT } from "./physics";
import { Combat } from "./combat";
import type { Player } from "./player";
import type { MovementInput, Vec3 } from "./types";
import { Stamina, STAMINA } from "./stamina";
import { PlayerProjectiles } from "./player-projectiles";

export type CombatPose =
  | "swipeWindup"
  | "swipe"
  | "charge"
  | "beam"
  | "hurt"
  | "defeat";
export const ATTACK = {
  swipeWindup: 0.1,
  swipeActive: 0.2,
  swipeDuration: 0.48,
  reach: 2.8,
  swipeHalfWidth: 1,
  swipeHalfHeight: 0.6,
  solarCharge: 0.18,
  solarActive: 0.16,
  solarDuration: 0.54,
  solarCooldown: 1.25,
  solarRange: 10,
  solarPulse: 0.4,
  solarHalfWidth: 0.2,
  solarHalfHeight: 0.16,
  solarMuzzle: 0.5,
  swipeStepSpeed: 3,
  hitStop: 0.05,
  fireballWindup: 0.1,
  fireballDuration: 0.28,
  fireballBuffer: 0.16,
  chainWindow: 0.65,
};
export interface AttackImpact {
  id: number;
  position: Vec3;
  age: number;
  kind: "swipe" | "solar" | "fireball";
}
export class PlayerAttacks {
  kind: "swipe" | "solar" | "fireball" | null = null;
  readonly stamina = new Stamina();
  readonly projectiles: PlayerProjectiles;
  fireballChain = 0;
  age = 0;
  solarCooldown = 0;
  direction = { x: 1, z: 0 };
  origin: Vec3 = { x: 0, y: 0, z: 0 };
  beamLength = 0;
  swipeLength = 0;
  swings = 0;
  beams = 0;
  hits = 0;
  private queue = 0;
  private hitEnemies = new Set<Combat>();
  private channelHeld = false;
  private pulseAge = 0;
  private impactStop = 0;
  private impactId = 0;
  impacts: AttackImpact[] = [];
  get hitStopped() {
    return this.impactStop > 0;
  }
  private fireballQueue = 0;
  private chainTime = 0;
  private fireballReleased = false;
  private solarExhausted = false;
  constructor(private physics: Physics) {
    this.projectiles = new PlayerProjectiles(physics, (position) =>
      this.impactAt(position, "fireball"),
    );
  }
  get pose(): CombatPose | null {
    return this.kind === "swipe"
      ? this.age < ATTACK.swipeWindup
        ? "swipeWindup"
        : "swipe"
      : this.kind === "solar" || this.kind === "fireball"
        ? this.age <
          (this.kind === "fireball"
            ? ATTACK.fireballWindup
            : ATTACK.solarCharge)
          ? "charge"
          : "beam"
        : null;
  }
  get beamActive() {
    return (
      this.kind === "solar" &&
      this.age >= ATTACK.solarCharge &&
      (this.channelHeld || this.age < ATTACK.solarCharge + ATTACK.solarActive)
    );
  }
  reset() {
    this.stamina.reset();
    this.projectiles.reset();
    this.fireballChain = this.chainTime = this.fireballQueue = 0;
    this.fireballReleased = this.solarExhausted = false;
    this.kind = null;
    this.age = 0;
    this.solarCooldown = 0;
    this.queue = 0;
    this.beamLength = 0;
    this.swipeLength = 0;
    this.hitEnemies.clear();
    this.channelHeld = false;
    this.pulseAge = 0;
    this.impactStop = 0;
    this.impacts = [];
    this.swings = this.beams = this.hits = 0;
  }
  private facing(player: Player) {
    return player.direction === "right"
      ? { x: 1, z: 0 }
      : player.direction === "left"
        ? { x: -1, z: 0 }
        : player.direction === "back"
          ? { x: 0, z: -1 }
          : { x: 0, z: 1 };
  }
  update(input: MovementInput, player: Player, enemies: readonly Combat[]) {
    this.stamina.tick();
    this.projectiles.update(player, enemies);
    if (!input.specialHeld) this.solarExhausted = false;
    this.chainTime = Math.max(0, this.chainTime - FIXED_DT);
    if (this.chainTime === 0) this.fireballChain = 0;
    this.fireballQueue = input.fireballPressed
      ? ATTACK.fireballBuffer
      : Math.max(0, this.fireballQueue - FIXED_DT);
    this.impacts = this.impacts.filter(
      (impact) => (impact.age += FIXED_DT) < 0.18,
    );
    const stopped = this.impactStop > 0;
    this.impactStop = Math.max(0, this.impactStop - FIXED_DT);
    this.channelHeld = !!input.specialHeld;
    this.solarCooldown = Math.max(0, this.solarCooldown - FIXED_DT);
    if (!stopped) this.age += FIXED_DT;
    this.queue = input.attackPressed
      ? 0.12
      : Math.max(0, this.queue - FIXED_DT);
    if (
      this.kind &&
      !(this.kind === "solar" && this.channelHeld) &&
      this.age >=
        (this.kind === "swipe"
          ? ATTACK.swipeDuration
          : this.kind === "fireball"
            ? ATTACK.fireballDuration
            : ATTACK.solarDuration)
    )
      this.kind = null;
    if (!this.kind) {
      if (
        input.specialPressed &&
        !this.solarExhausted &&
        this.solarCooldown <= 1e-8 &&
        this.stamina.spend(STAMINA.solar)
      ) {
        this.kind = "solar";
        this.solarCooldown = ATTACK.solarCooldown;
        this.beams++;
      } else if (
        this.fireballQueue > 0 &&
        this.fireballChain < 3 &&
        this.stamina.spend(STAMINA.fireball)
      ) {
        this.kind = "fireball";
        this.fireballQueue = 0;
        this.fireballReleased = false;
        this.fireballChain++;
        this.chainTime = ATTACK.chainWindow;
      } else if (this.queue > 0 && this.stamina.spend(STAMINA.swipe)) {
        this.kind = "swipe";
        this.swings++;
      }
      if (this.kind) {
        this.age = 0;
        this.queue = 0;
        this.hitEnemies.clear();
        this.pulseAge = 0;
        this.direction = this.facing(player);
      }
    }
    if (this.kind === "solar" && this.channelHeld) {
      this.direction = this.facing(player);
      this.solarCooldown = ATTACK.solarCooldown;
      if (this.age >= ATTACK.solarCharge && !this.stamina.drainRay()) {
        this.kind = null;
        this.solarExhausted = true;
        this.channelHeld = false;
      }
      this.pulseAge += FIXED_DT;
      if (this.pulseAge >= ATTACK.solarPulse) {
        this.hitEnemies.clear();
        this.pulseAge = 0;
      }
    }
    this.origin = { ...player.position, y: player.position.y + 0.45 };
    if (
      this.kind === "fireball" &&
      !this.fireballReleased &&
      this.age >= ATTACK.fireballWindup
    ) {
      this.projectiles.fire(this.origin, this.direction, player, enemies);
      this.fireballReleased = true;
    }
    const aim = { x: this.direction.x, y: 0, z: this.direction.z };
    // Sweep the visible cross-section horizontally. A ray down to a target's
    // center incorrectly treats low terraces as cover for a clear mouth ray.
    const rotation = { x: 0, y: 0, z: 0, w: 1 };
    const alongX = Math.abs(aim.x) > 0;
    // Use the same broad, horizontal footprint for the rendered slash and damage.
    // Its first contact with solid scenery clips the whole strike, including corners.
    const swipeWall =
      this.kind === "swipe"
        ? this.physics.world.castShape(
            this.origin,
            rotation,
            aim,
            new RAPIER.Cuboid(
              alongX ? 0.001 : ATTACK.swipeHalfWidth,
              ATTACK.swipeHalfHeight,
              alongX ? ATTACK.swipeHalfWidth : 0.001,
            ),
            0,
            ATTACK.reach,
            true,
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
            undefined,
            undefined,
            player.body,
          )
        : null;
    this.swipeLength =
      this.kind === "swipe"
        ? Math.max(
            0,
            Math.min(ATTACK.reach, swipeWall?.time_of_impact ?? ATTACK.reach),
          )
        : 0;
    const swipeCenter = {
      x: this.origin.x + (aim.x * this.swipeLength) / 2,
      y: this.origin.y,
      z: this.origin.z + (aim.z * this.swipeLength) / 2,
    };
    const swipeShape = new RAPIER.Cuboid(
      alongX ? this.swipeLength / 2 : ATTACK.swipeHalfWidth,
      ATTACK.swipeHalfHeight,
      alongX ? ATTACK.swipeHalfWidth : this.swipeLength / 2,
    );
    const wall = this.physics.world.castShape(
      this.origin,
      rotation,
      aim,
      new RAPIER.Cuboid(
        alongX ? 0.001 : ATTACK.solarHalfWidth,
        ATTACK.solarHalfHeight,
        alongX ? ATTACK.solarHalfWidth : 0.001,
      ),
      0,
      ATTACK.solarRange,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      player.body,
    );
    this.beamLength = Math.max(
      0,
      (wall?.time_of_impact ?? ATTACK.solarRange) - ATTACK.solarMuzzle,
    );
    const beamCenter = {
      x: this.origin.x + aim.x * (ATTACK.solarMuzzle + this.beamLength / 2),
      y: this.origin.y,
      z: this.origin.z + aim.z * (ATTACK.solarMuzzle + this.beamLength / 2),
    };
    const beamShape = new RAPIER.Cuboid(
      alongX ? this.beamLength / 2 : ATTACK.solarHalfWidth,
      ATTACK.solarHalfHeight,
      alongX ? ATTACK.solarHalfWidth : this.beamLength / 2,
    );
    const melee =
      this.kind === "swipe" &&
      this.age >= ATTACK.swipeWindup &&
      this.age < ATTACK.swipeWindup + ATTACK.swipeActive;
    player.attackMotion =
      this.kind === "swipe"
        ? {
            ...this.direction,
            speed: melee && !stopped ? ATTACK.swipeStepSpeed : 0,
            moveScale: stopped ? 0 : this.age < ATTACK.swipeWindup ? 0.2 : 0.65,
          }
        : { x: 0, z: 0, speed: 0, moveScale: 1 };
    if (!melee && !this.beamActive) return;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
      if (this.beamActive && !melee) {
        if (
          this.beamLength > 0 &&
          enemy.collider.intersectsShape(beamShape, beamCenter, rotation) &&
          enemy.hit(2)
        ) {
          this.hitEnemies.add(enemy);
          this.hits++;
          this.impact(enemy, "solar");
        }
        continue;
      }
      const p = enemy.position;
      const along =
        (p.x - this.origin.x) * aim.x + (p.z - this.origin.z) * aim.z;
      if (
        along <= 0 ||
        this.swipeLength <= 0 ||
        !enemy.collider.intersectsShape(swipeShape, swipeCenter, rotation)
      )
        continue;
      if (enemy.hit(1, { ...this.direction, speed: 7, stop: ATTACK.hitStop })) {
        this.hitEnemies.add(enemy);
        this.hits++;
        this.impactStop = ATTACK.hitStop;
        player.attackMotion.speed = 0;
        player.attackMotion.moveScale = 0;
        this.impact(enemy, "swipe");
      }
    }
  }
  private impact(enemy: Combat, kind: AttackImpact["kind"]) {
    this.impactAt({ ...enemy.position, y: enemy.position.y + 0.25 }, kind);
  }
  private impactAt(position: Vec3, kind: AttackImpact["kind"]) {
    this.impacts.push({
      id: ++this.impactId,
      position: { ...position },
      age: 0,
      kind,
    });
    if (this.impacts.length > 16) this.impacts.shift();
  }
  cancel() {
    this.kind = null;
    this.queue = this.fireballQueue = this.impactStop = 0;
    this.projectiles.balls = [];
    this.impacts = [];
    this.chainTime = this.fireballChain = 0;
  }
  clearBuffered() {
    this.queue = this.fireballQueue = 0;
  }
}
