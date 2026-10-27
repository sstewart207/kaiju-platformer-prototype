import { FIXED_DT, Physics, RAPIER } from "./physics";
import { SPAWN } from "./course";
import type { AnimationState, Direction, MovementInput, Vec3 } from "./types";

export const MOVEMENT = {
  speed: 8.5,
  acceleration: 52,
  deceleration: 80,
  airAcceleration: 34,
  jumpSpeed: 10.1,
  gravity: 26,
  releaseGravity: 48,
  maxFallSpeed: 23,
  coyoteTime: 0.11,
  bufferTime: 0.13,
  radius: 0.34,
  halfHeight: 0.4,
  dashSpeed: 16.5,
  dashDuration: 0.22,
  dashCooldown: 0.45,
  dashBuffer: 0.1,
};
export const FOOT_OFFSET = MOVEMENT.radius + MOVEMENT.halfHeight;
const RIGHT = { x: 1, z: 0 };
const DOWN = { x: 0, z: 1 };
export function cameraMovement(x: number, z: number) {
  const length = Math.max(1, Math.hypot(x, z));
  return {
    x: (RIGHT.x * x + DOWN.x * z) / length,
    z: (RIGHT.z * x + DOWN.z * z) / length,
  };
}
export class Player {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private controller: RAPIER.KinematicCharacterController;
  velocity: Vec3 = { x: 0, y: 0, z: 0 };
  previous: Vec3 = { ...SPAWN };
  grounded = false;
  direction: Direction = "front";
  animation: AnimationState = "idle";
  private coyote = 0;
  private buffer = 0;
  private landingTime = 0;
  private support: number | null = null;
  private facing = { x: 1, z: 0 };
  private dashDirection = { x: 1, z: 0 };
  private dashTime = 0;
  private dashQueued = 0;
  dashCooldown = 0;
  dashes = 0;
  get dashing() {
    return this.dashTime > 0;
  }
  jumps = 0;
  landings = 0;
  constructor(private physics: Physics) {
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        SPAWN.x,
        SPAWN.y,
        SPAWN.z,
      ),
    );
    this.collider = physics.world.createCollider(
      RAPIER.ColliderDesc.capsule(MOVEMENT.halfHeight, MOVEMENT.radius),
      this.body,
    );
    this.controller = physics.world.createCharacterController(0.025);
    this.controller.setSlideEnabled(true);
    this.controller.setMaxSlopeClimbAngle(Math.PI / 4);
    this.controller.setMinSlopeSlideAngle(Math.PI / 3);
    this.controller.enableSnapToGround(0.14);
    // Low paths sit 0.43 above the grass; missed shortcuts must be walkable to rejoin.
    this.controller.enableAutostep(0.5, 0.2, true);
    physics.step();
  }
  get position(): Vec3 {
    const p = this.body.translation();
    return { x: p.x, y: p.y, z: p.z };
  }
  reset(position: Vec3 = SPAWN) {
    this.body.setTranslation(position, true);
    this.body.setNextKinematicTranslation(position);
    this.previous = { ...position };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.grounded = false;
    this.coyote = 0;
    this.buffer = 0;
    this.landingTime = 0;
    this.support = null;
    this.animation = "idle";
    this.direction = "front";
    this.facing = { x: 1, z: 0 };
    this.dashDirection = { x: 1, z: 0 };
    this.dashTime = 0;
    this.dashQueued = 0;
    this.dashCooldown = 0;
    this.jumps = 0;
    this.landings = 0;
    this.dashes = 0;
  }
  update(input: MovementInput) {
    const dt = FIXED_DT;
    this.previous = this.position;
    this.coyote = this.grounded
      ? MOVEMENT.coyoteTime
      : Math.max(0, this.coyote - dt);
    this.buffer = input.jumpPressed
      ? MOVEMENT.bufferTime
      : Math.max(0, this.buffer - dt);
    const movement = cameraMovement(input.x, input.z);
    const hasInput = input.x !== 0 || input.z !== 0;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashQueued = input.dashPressed
      ? MOVEMENT.dashBuffer
      : Math.max(0, this.dashQueued - dt);
    if (hasInput) {
      const length = Math.hypot(movement.x, movement.z);
      this.facing = { x: movement.x / length, z: movement.z / length };
    }
    if (this.dashQueued > 0 && this.dashCooldown <= 1e-8) {
      this.dashDirection = { ...this.facing };
      this.dashTime = MOVEMENT.dashDuration;
      this.dashCooldown = MOVEMENT.dashCooldown;
      this.dashQueued = 0;
      this.dashes++;
    }
    const rate = this.grounded
      ? hasInput
        ? MOVEMENT.acceleration
        : MOVEMENT.deceleration
      : MOVEMENT.airAcceleration;
    // Accelerate as a vector, so diagonals have the same acceleration and top speed.
    const dx = movement.x * MOVEMENT.speed - this.velocity.x,
      dz = movement.z * MOVEMENT.speed - this.velocity.z;
    const change = Math.hypot(dx, dz),
      factor = change > 0 ? Math.min(1, (rate * dt) / change) : 0;
    this.velocity.x += dx * factor;
    this.velocity.z += dz * factor;
    if (this.dashing) {
      this.velocity.x = this.dashDirection.x * MOVEMENT.dashSpeed;
      this.velocity.z = this.dashDirection.z * MOVEMENT.dashSpeed;
    } else if (!hasInput && this.grounded) {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
    if (this.buffer > 0 && this.coyote > 0) {
      this.velocity.y = MOVEMENT.jumpSpeed;
      this.buffer = 0;
      this.coyote = 0;
      this.grounded = false;
      this.jumps++;
    }
    const gravity =
      this.velocity.y > 0 && !input.jumpHeld
        ? MOVEMENT.releaseGravity
        : MOVEMENT.gravity;
    this.velocity.y = Math.max(
      -MOVEMENT.maxFallSpeed,
      this.velocity.y - gravity * dt,
    );
    // Snapping can report grounded without emitting a collision event.
    const ground = this.grounded
      ? this.physics.groundBelow(
          this.previous,
          this.collider,
          FOOT_OFFSET + 0.18,
        )
      : null;
    const support = this.physics.platforms.find(
      (p) => p.collider.handle === (ground?.collider.handle ?? this.support),
    );
    const carry =
      this.grounded && support ? support.delta : { x: 0, y: 0, z: 0 };
    // Sweep platform transport separately from downward ground contact. Rapier's
    // contact skin can otherwise swallow tiny tangential carry displacements.
    let base = this.previous;
    if (support && (carry.x !== 0 || carry.z !== 0)) {
      this.controller.computeColliderMovement(
        this.collider,
        carry,
        RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        (c) => c.handle !== support.collider.handle,
      );
      const transport = this.controller.computedMovement();
      // Two millimeters of separation prevents float precision from starting
      // the next sweep inside the support's contact skin at large coordinates.
      base = {
        x: base.x + transport.x,
        y: base.y + transport.y + 0.002,
        z: base.z + transport.z,
      };
      this.body.setTranslation(base, true);
      this.physics.world.propagateModifiedBodyPositionsToColliders();
    }
    const desired = {
      x: this.velocity.x * dt,
      y: this.velocity.y * dt,
      z: this.velocity.z * dt,
    };
    const wasGrounded = this.grounded;
    this.controller.computeColliderMovement(
      this.collider,
      desired,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const corrected = this.controller.computedMovement();
    // Ground-contact correction on a slope must not move an idle character.
    // Platform transport has already been swept separately above.
    if (!hasInput && wasGrounded && !this.dashing) {
      corrected.x = 0;
      corrected.z = 0;
    }
    const contact = this.physics.groundBelow(
      {
        x: base.x + corrected.x,
        y: base.y + corrected.y,
        z: base.z + corrected.z,
      },
      this.collider,
      FOOT_OFFSET + 0.04,
    );
    this.grounded =
      (this.controller.computedGrounded() || !!contact) && this.velocity.y <= 0;
    if (this.grounded) {
      this.velocity.y = 0;
      if (!wasGrounded) {
        this.landingTime = 0.1;
        this.landings++;
      }
    } else if (this.velocity.y > 0 && corrected.y < desired.y - 0.001)
      this.velocity.y = 0;
    this.body.setNextKinematicTranslation({
      x: base.x + corrected.x,
      y: base.y + corrected.y,
      z: base.z + corrected.z,
    });
    this.support = null;
    if (this.grounded) {
      for (
        let index = 0;
        index < this.controller.numComputedCollisions();
        index++
      ) {
        const collision = this.controller.computedCollision(index);
        if (collision && collision.normal1.y > 0.5 && collision.collider)
          this.support = collision.collider.handle;
      }
    }
    this.landingTime = Math.max(0, this.landingTime - dt);
    if (hasInput) {
      if (Math.abs(input.x) >= Math.abs(input.z))
        this.direction = input.x > 0 ? "right" : "left";
      else this.direction = input.z > 0 ? "front" : "back";
    }
    this.animation = !this.grounded
      ? this.velocity.y > 0
        ? "jumping"
        : "falling"
      : this.landingTime > 0
        ? "landing"
        : Math.hypot(this.velocity.x, this.velocity.z) > 0.25
          ? "running"
          : "idle";
  }
}
