import { FIXED_DT, Physics, RAPIER } from "./physics";
import type { Player } from "./player";
import type { Combat } from "./combat";
import type { Vec3 } from "./types";

export const FIREBALL = {
  speed: 16,
  radius: 0.23,
  lifetime: 1.5,
  damage: 1,
  muzzle: 0.5,
};
export interface PlayerFireball {
  id: number;
  position: Vec3;
  previous: Vec3;
  direction: Vec3;
  age: number;
}
export class PlayerProjectiles {
  balls: PlayerFireball[] = [];
  shots = 0;
  private id = 0;
  constructor(
    private physics: Physics,
    private onImpact: (position: Vec3) => void,
  ) {}
  reset() {
    this.balls = [];
    this.shots = 0;
  }
  fire(
    origin: Vec3,
    direction: { x: number; z: number },
    player: Player,
    enemies: readonly Combat[],
  ) {
    this.shots++;
    const ball: PlayerFireball = {
      id: ++this.id,
      position: { ...origin },
      previous: { ...origin },
      direction: { ...direction, y: 0 },
      age: 0,
    };
    // Sweep the muzzle gap too, so walls close to the mouth cannot be skipped.
    if (this.move(ball, FIREBALL.muzzle, player, enemies))
      this.balls.push(ball);
  }
  update(player: Player, enemies: readonly Combat[]) {
    this.balls = this.balls.filter((ball) => {
      ball.previous = { ...ball.position };
      ball.age += FIXED_DT;
      return (
        ball.age < FIREBALL.lifetime &&
        this.move(ball, FIREBALL.speed * FIXED_DT, player, enemies)
      );
    });
  }
  private move(
    ball: PlayerFireball,
    distance: number,
    player: Player,
    enemies: readonly Combat[],
  ) {
    const hit = this.physics.world.castShape(
      ball.position,
      { x: 0, y: 0, z: 0, w: 1 },
      ball.direction,
      new RAPIER.Ball(FIREBALL.radius),
      0,
      distance,
      true,
      undefined,
      undefined,
      undefined,
      player.body,
      (collider) =>
        !collider.isSensor() ||
        enemies.some(
          (enemy) => enemy.hp > 0 && enemy.collider.handle === collider.handle,
        ),
    );
    const travel = hit?.time_of_impact ?? distance;
    ball.position = {
      x: ball.position.x + ball.direction.x * travel,
      y: ball.position.y,
      z: ball.position.z + ball.direction.z * travel,
    };
    if (!hit) return true;
    const enemy = enemies.find(
      (enemy) => enemy.collider.handle === hit.collider.handle,
    );
    if (enemy)
      enemy.hit(FIREBALL.damage, {
        x: ball.direction.x,
        z: ball.direction.z,
        speed: 3,
        stop: 0.025,
      });
    this.onImpact(ball.position);
    return false;
  }
}
