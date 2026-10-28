import { Physics, RAPIER, FIXED_DT } from "./physics";
import { FOOT_OFFSET, MOVEMENT } from "./player";
import type { Vec3, Direction } from "./types";

export type EnemyAction =
  | "idle"
  | "walking"
  | "melee"
  | "charging"
  | "shooting"
  | "hurt"
  | "defeated";
export const ENEMY = {
  spawn: { x: 18, y: 0.69, z: -11 },
  footOffset: 0.74,
  radius: 0.4,
  halfHeight: 0.34,
  health: 2,
  playerHealth: 3,
  speed: 2.1,
  aggro: 8,
  leash: 7,
  meleeRange: 1.6,
  meleeWindup: 0.45,
  meleeActive: 0.16,
  charge: 0.65,
  fireballSpeed: 7,
  fireballRadius: 0.18,
  projectileLifetime: 2.5,
  hurtTime: 0.28,
  invulnerability: 1.1,
};
export interface CombatTarget {
  position: Vec3;
  previous: Vec3;
  collider: RAPIER.Collider;
  body: RAPIER.RigidBody;
  dashing: boolean;
  dashes: number;
}
export interface Fireball {
  id: number;
  position: Vec3;
  previous: Vec3;
  direction: Vec3;
  age: number;
}

export class PlayerVitals {
  health = ENEMY.playerHealth;
  invulnerable = 0;
  tick() {
    this.invulnerable = Math.max(0, this.invulnerable - FIXED_DT);
  }
  reset() {
    this.health = ENEMY.playerHealth;
    this.invulnerable = 0;
  }
  damage() {
    if (this.invulnerable > 0 || this.health <= 0) return false;
    this.health--;
    this.invulnerable = ENEMY.invulnerability;
    return true;
  }
}
export interface EnemyDefinition {
  spawn: Vec3;
  patrol?: readonly Vec3[];
}
export const ENCOUNTERS: readonly EnemyDefinition[] = [
  {
    spawn: { ...ENEMY.spawn },
    patrol: [
      { x: 16, y: 0.69, z: -11 },
      { x: 20, y: 0.69, z: -11 },
    ],
  },
  {
    spawn: { x: 70, y: 1.13, z: -18 },
    patrol: [
      { x: 67, y: 1.13, z: -18 },
      { x: 73, y: 1.13, z: -18 },
    ],
  },
  {
    spawn: { x: 229, y: 2.28, z: 12 },
    patrol: [
      { x: 226, y: 2.28, z: 12 },
      { x: 232, y: 2.28, z: 12 },
    ],
  },
];

function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
function direction(from: Vec3, to: Vec3): Vec3 {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    dz = to.z - from.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  return { x: dx / length, y: dy / length, z: dz / length };
}
// Distance to the closest point on a swept segment, not just its end position.
export function segmentDistance(a: Vec3, b: Vec3, p: Vec3) {
  const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const length2 = d.x * d.x + d.y * d.y + d.z * d.z;
  const t = length2
    ? Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * d.x + (p.y - a.y) * d.y + (p.z - a.z) * d.z) / length2,
        ),
      )
    : 0;
  return Math.hypot(
    a.x + d.x * t - p.x,
    a.y + d.y * t - p.y,
    a.z + d.z * t - p.z,
  );
}

export class Combat {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private controller: RAPIER.KinematicCharacterController;
  previous: Vec3;
  action: EnemyAction = "idle";
  facing: Direction = "front";
  hp = ENEMY.health;
  private vitals: PlayerVitals;
  private ownsVitals: boolean;
  get health() {
    return this.vitals.health;
  }
  set health(value: number) {
    this.vitals.health = value;
  }
  get invulnerable() {
    return this.vitals.invulnerable;
  }
  actionTime = 0;
  projectiles: Fireball[] = [];
  shots = 0;
  meleeHits = 0;
  projectileHits = 0;
  wallHits = 0;
  private cooldown = 0;
  private gravity = 0;
  private hitThisSwing = false;
  private lastDash = -1;
  private aim: Vec3 = { x: 1, y: 0, z: 0 };
  private patrolIndex = 0;
  constructor(
    private physics: Physics,
    readonly definition: EnemyDefinition = { spawn: ENEMY.spawn },
    sharedVitals?: PlayerVitals,
  ) {
    this.vitals = sharedVitals ?? new PlayerVitals();
    this.ownsVitals = !sharedVitals;
    this.previous = { ...definition.spawn };
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        definition.spawn.x,
        definition.spawn.y,
        definition.spawn.z,
      ),
    );
    // Sensor hurtbox lets a dash pass through; movement still sweeps the same shape
    // against solid scenery. The enemy never obstructs the safe route.
    this.collider = physics.world.createCollider(
      RAPIER.ColliderDesc.capsule(ENEMY.halfHeight, ENEMY.radius).setSensor(
        true,
      ),
      this.body,
    );
    this.controller = physics.world.createCharacterController(0.025);
    this.controller.enableSnapToGround(0.15);
    this.controller.enableAutostep(0.5, 0.2, true);
  }
  get position(): Vec3 {
    const p = this.body.translation();
    return { x: p.x, y: p.y, z: p.z };
  }
  beginStep() {
    this.previous = this.position;
  }
  get windup() {
    return this.action === "charging"
      ? this.actionTime / ENEMY.charge
      : this.action === "melee" && this.actionTime < ENEMY.meleeWindup
        ? this.actionTime / ENEMY.meleeWindup
        : 0;
  }
  reset() {
    this.body.setTranslation(this.definition.spawn, true);
    this.body.setNextKinematicTranslation(this.definition.spawn);
    this.collider.setEnabled(true);
    this.previous = { ...this.definition.spawn };
    this.hp = ENEMY.health;
    if (this.ownsVitals) this.vitals.reset();
    this.patrolIndex = 0;
    this.cooldown = 0;
    this.actionTime = 0;
    this.gravity = 0;
    this.action = "idle";
    this.facing = "front";
    this.lastDash = -1;
    this.projectiles = [];
    this.shots = 0;
    this.meleeHits = 0;
    this.projectileHits = 0;
    this.wallHits = 0;
    this.physics.world.propagateModifiedBodyPositionsToColliders();
  }
  private setAction(action: EnemyAction) {
    this.action = action;
    this.actionTime = 0;
    this.hitThisSwing = false;
  }
  private damagePlayer() {
    return this.vitals.damage();
  }
  hit(damage = 1) {
    if (this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.setAction(this.hp ? "hurt" : "defeated");
    if (!this.hp) {
      this.collider.setEnabled(false);
      this.projectiles = [];
    }
    return true;
  }
  private worldHit(
    origin: Vec3,
    heading: Vec3,
    length: number,
    target: CombatTarget,
  ) {
    return this.physics.world.castRay(
      new RAPIER.Ray(origin, heading),
      length,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      this.collider,
      target.body,
    );
  }
  update(target: CombatTarget) {
    const dt = FIXED_DT;
    if (this.ownsVitals) this.vitals.tick();
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.actionTime += dt;
    const p = this.position;
    const range = distance(p, target.position);
    // The entire dash sweep counts, so fast movement cannot skip a small hurtbox.
    const dashStart = { ...target.previous, y: 0 },
      dashEnd = { ...target.position, y: 0 };
    if (
      this.hp > 0 &&
      target.dashing &&
      target.dashes !== this.lastDash &&
      Math.abs(target.position.y - p.y) < 1.05 &&
      segmentDistance(dashStart, dashEnd, { ...p, y: 0 }) < 0.9 &&
      !this.worldHit(
        target.position,
        direction(target.position, p),
        Math.hypot(
          target.position.x - p.x,
          target.position.y - p.y,
          target.position.z - p.z,
        ),
        target,
      )
    ) {
      this.lastDash = target.dashes;
      this.hit();
    }
    let vx = 0,
      vz = 0;
    if (this.hp > 0) {
      if (this.action === "hurt") {
        if (this.actionTime >= ENEMY.hurtTime) {
          this.setAction("idle");
          this.cooldown = 0.4;
        }
      } else if (this.action === "melee") {
        if (
          this.actionTime >= ENEMY.meleeWindup &&
          this.actionTime < ENEMY.meleeWindup + ENEMY.meleeActive &&
          !this.hitThisSwing
        ) {
          this.hitThisSwing = true;
          const toward = direction(p, target.position);
          if (
            range < ENEMY.meleeRange + 0.2 &&
            Math.abs(
              target.position.y - FOOT_OFFSET - (p.y - ENEMY.footOffset),
            ) < 0.8 &&
            toward.x * this.aim.x + toward.z * this.aim.z > 0.25 &&
            !this.worldHit(
              p,
              toward,
              Math.hypot(
                target.position.x - p.x,
                target.position.y - p.y,
                target.position.z - p.z,
              ),
              target,
            )
          ) {
            if (this.damagePlayer()) this.meleeHits++;
          }
        }
        if (this.actionTime >= 1.1) {
          this.setAction("idle");
          this.cooldown = 0.5;
        }
      } else if (this.action === "charging") {
        if (this.actionTime >= ENEMY.charge) {
          const origin = {
            x: p.x + this.aim.x * 0.65,
            y: p.y + 0.25,
            z: p.z + this.aim.z * 0.65,
          };
          // Sweep from the body to the muzzle too: a nearby wall cannot be skipped.
          const muzzleRay = direction(p, origin);
          if (
            !this.worldHit(
              p,
              muzzleRay,
              Math.hypot(origin.x - p.x, origin.y - p.y, origin.z - p.z),
              target,
            )
          ) {
            this.projectiles.push({
              id: ++this.shots,
              position: origin,
              previous: { ...origin },
              direction: { ...this.aim },
              age: 0,
            });
          }
          this.setAction("shooting");
        }
      } else if (this.action === "shooting") {
        if (this.actionTime >= 0.35) {
          this.setAction("idle");
          this.cooldown = 1.1;
        }
      } else {
        const fromHome = distance(p, this.definition.spawn);
        const engaged = range <= ENEMY.aggro && fromHome <= ENEMY.leash;
        let visible = false;
        if (engaged) {
          const dx = target.position.x - p.x,
            dz = target.position.z - p.z;
          this.facing =
            Math.abs(dx) >= Math.abs(dz)
              ? dx >= 0
                ? "right"
                : "left"
              : dz >= 0
                ? "front"
                : "back";
          const mouth = { ...p, y: p.y + 0.25 };
          const aim = direction(mouth, target.position);
          const sightLength = Math.hypot(
            target.position.x - mouth.x,
            target.position.y - mouth.y,
            target.position.z - mouth.z,
          );
          visible = !this.worldHit(mouth, aim, sightLength, target);
          if (this.cooldown <= 0 && visible) {
            this.aim = aim;
            this.setAction(range <= ENEMY.meleeRange ? "melee" : "charging");
          } else if (range > 2.2 && visible) {
            const length = Math.hypot(dx, dz) || 1;
            vx = (dx / length) * ENEMY.speed;
            vz = (dz / length) * ENEMY.speed;
            if (this.action !== "walking") this.setAction("walking");
          } else if (this.action !== "idle") this.setAction("idle");
        } else if (fromHome > 0.2) {
          const d = direction(p, this.definition.spawn);
          vx = d.x * ENEMY.speed;
          vz = d.z * ENEMY.speed;
          this.setAction("walking");
        } else if (this.action !== "idle") this.setAction("idle");
        if ((!engaged || !visible) && this.definition.patrol?.length) {
          const point = this.definition.patrol[this.patrolIndex];
          if (distance(p, point) < 0.3)
            this.patrolIndex =
              (this.patrolIndex + 1) % this.definition.patrol.length;
          const d = direction(p, this.definition.patrol[this.patrolIndex]);
          vx = d.x * ENEMY.speed * 0.45;
          vz = d.z * ENEMY.speed * 0.45;
          this.facing =
            Math.abs(vx) > Math.abs(vz)
              ? vx > 0
                ? "right"
                : "left"
              : vz > 0
                ? "front"
                : "back";
          if (this.action !== "walking") this.setAction("walking");
        }
      }
      this.gravity = Math.max(-20, this.gravity - 26 * dt);
      this.controller.computeColliderMovement(
        this.collider,
        { x: vx * dt, y: this.gravity * dt, z: vz * dt },
        RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
      );
      const moved = this.controller.computedMovement();
      if (this.controller.computedGrounded()) this.gravity = 0;
      this.body.setNextKinematicTranslation({
        x: p.x + moved.x,
        y: p.y + moved.y,
        z: p.z + moved.z,
      });
    }
    this.projectiles = this.projectiles.filter((ball) => {
      ball.age += dt;
      if (ball.age > ENEMY.projectileLifetime) return false;
      ball.previous = { ...ball.position };
      const length = ENEMY.fireballSpeed * dt;
      const end = {
        x: ball.position.x + ball.direction.x * length,
        y: ball.position.y + ball.direction.y * length,
        z: ball.position.z + ball.direction.z * length,
      };
      const hit = this.worldHit(ball.position, ball.direction, length, target);
      const endpoint = hit
        ? {
            x: ball.position.x + ball.direction.x * hit.timeOfImpact,
            y: ball.position.y + ball.direction.y * hit.timeOfImpact,
            z: ball.position.z + ball.direction.z * hit.timeOfImpact,
          }
        : end;
      const closest = {
        ...target.position,
        y: Math.max(
          target.position.y - MOVEMENT.halfHeight,
          Math.min(target.position.y + MOVEMENT.halfHeight, endpoint.y),
        ),
      };
      if (
        segmentDistance(ball.position, endpoint, closest) <
        MOVEMENT.radius + ENEMY.fireballRadius
      ) {
        if (this.damagePlayer()) this.projectileHits++;
        return false;
      }
      if (hit) {
        this.wallHits++;
        return false;
      }
      ball.position = end;
      return true;
    });
  }
}
