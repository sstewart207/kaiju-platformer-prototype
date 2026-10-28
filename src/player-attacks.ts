import { Physics, RAPIER, FIXED_DT } from "./physics";
import { Combat } from "./combat";
import type { Player } from "./player";
import type { MovementInput, Vec3 } from "./types";

export type CombatPose =
  | "swipeWindup"
  | "swipe"
  | "charge"
  | "beam"
  | "hurt"
  | "defeat";
export const ATTACK = {
  swipeWindup: 0.1,
  swipeActive: 0.12,
  swipeDuration: 0.38,
  reach: 2.1,
  solarCharge: 0.18,
  solarActive: 0.16,
  solarDuration: 0.54,
  solarCooldown: 1.25,
  solarRange: 10,
};
export class PlayerAttacks {
  kind: "swipe" | "solar" | null = null;
  age = 0;
  solarCooldown = 0;
  direction = { x: 1, z: 0 };
  origin: Vec3 = { x: 0, y: 0, z: 0 };
  beamLength = 0;
  swings = 0;
  beams = 0;
  hits = 0;
  private queue = 0;
  private hitEnemies = new Set<Combat>();
  constructor(private physics: Physics) {}
  get pose(): CombatPose | null {
    return this.kind === "swipe"
      ? this.age < ATTACK.swipeWindup
        ? "swipeWindup"
        : "swipe"
      : this.kind === "solar"
        ? this.age < ATTACK.solarCharge
          ? "charge"
          : "beam"
        : null;
  }
  get beamActive() {
    return (
      this.kind === "solar" &&
      this.age >= ATTACK.solarCharge &&
      this.age < ATTACK.solarCharge + ATTACK.solarActive
    );
  }
  reset() {
    this.kind = null;
    this.age = 0;
    this.solarCooldown = 0;
    this.queue = 0;
    this.beamLength = 0;
    this.hitEnemies.clear();
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
  private obstacle(
    origin: Vec3,
    direction: Vec3,
    length: number,
    player: Player,
  ) {
    return this.physics.world.castRay(
      new RAPIER.Ray(origin, direction),
      length,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      player.body,
    );
  }
  update(input: MovementInput, player: Player, enemies: readonly Combat[]) {
    this.solarCooldown = Math.max(0, this.solarCooldown - FIXED_DT);
    this.age += FIXED_DT;
    this.queue = input.attackPressed
      ? 0.12
      : Math.max(0, this.queue - FIXED_DT);
    if (
      this.kind &&
      this.age >=
        (this.kind === "swipe" ? ATTACK.swipeDuration : ATTACK.solarDuration)
    )
      this.kind = null;
    if (!this.kind) {
      if (input.specialPressed && this.solarCooldown <= 1e-8) {
        this.kind = "solar";
        this.solarCooldown = ATTACK.solarCooldown;
        this.beams++;
      } else if (this.queue > 0) {
        this.kind = "swipe";
        this.swings++;
      }
      if (this.kind) {
        this.age = 0;
        this.queue = 0;
        this.hitEnemies.clear();
        this.direction = this.facing(player);
      }
    }
    this.origin = { ...player.position, y: player.position.y + 0.45 };
    const aim = { x: this.direction.x, y: 0, z: this.direction.z };
    const wall = this.obstacle(this.origin, aim, ATTACK.solarRange, player);
    this.beamLength = Math.max(
      0,
      (wall?.timeOfImpact ?? ATTACK.solarRange) - 0.5,
    );
    const melee =
      this.kind === "swipe" &&
      this.age >= ATTACK.swipeWindup &&
      this.age < ATTACK.swipeWindup + ATTACK.swipeActive;
    if (!melee && !this.beamActive) return;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || this.hitEnemies.has(enemy)) continue;
      const p = enemy.position,
        dx = p.x - this.origin.x,
        dz = p.z - this.origin.z;
      const along = dx * aim.x + dz * aim.z,
        across = Math.abs(dx * aim.z - dz * aim.x),
        range = Math.hypot(dx, dz);
      if (Math.abs(p.y - player.position.y) > 0.9) continue;
      if (
        melee
          ? range > ATTACK.reach || along < range * 0.35
          : along < 0 || along > this.beamLength + 0.5 || across > 0.7
      )
        continue;
      const length = Math.hypot(dx, p.y - this.origin.y, dz);
      const heading = {
        x: dx / (length || 1),
        y: (p.y - this.origin.y) / (length || 1),
        z: dz / (length || 1),
      };
      if (this.obstacle(this.origin, heading, length, player)) continue;
      if (enemy.hit(melee ? 1 : 2)) {
        this.hitEnemies.add(enemy);
        this.hits++;
      }
    }
  }
}
