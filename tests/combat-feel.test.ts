import test from "node:test";
import assert from "node:assert/strict";
import { Physics, RAPIER } from "../src/physics";
import { Player } from "../src/player";
import { Combat } from "../src/combat";
import { PlayerAttacks } from "../src/player-attacks";
import { FixedClock } from "../src/timestep";
await RAPIER.init();

test("swipe steps through the character controller and cannot tunnel through a wall", () => {
  for (const wall of [false, true]) {
    const physics = new Physics(),
      player = new Player(physics),
      attacks = new PlayerAttacks(physics);
    player.reset({ x: -70, y: 0.8, z: 40 });
    if (wall)
      physics.world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(-69.25, 1, 40),
      );
    for (let frame = 0; frame < 60; frame++) {
      const input = {
        x: 0,
        z: 0,
        jumpHeld: false,
        jumpPressed: false,
        attackPressed: frame === 20,
      };
      player.direction = "right";
      player.update(input);
      physics.step();
      attacks.update(input, player, []);
    }
    assert.ok(player.position.x > -69.8);
    assert.ok(player.position.x < (wall ? -69.6 : -69.1));
    assert.ok(Math.abs(player.position.z - 40) < 0.01);
    physics.dispose();
  }
});

test("hit reaction pauses the victim, recoils directionally and stops at walls", () => {
  for (const wall of [false, true]) {
    const physics = new Physics(),
      player = new Player(physics);
    player.reset({ x: -73, y: 0.8, z: 40 });
    const enemy = new Combat(physics, { spawn: { x: -70, y: 0.75, z: 40 } });
    if (wall)
      physics.world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(-69.4, 1, 40),
      );
    physics.step();
    enemy.hit(1, { x: 1, z: 0, speed: 7, stop: 0.05 });
    for (let frame = 0; frame < 12; frame++) {
      enemy.beginStep();
      enemy.update(player);
      physics.step();
      if (frame < 3) assert.ok(Math.abs(enemy.position.x + 70) < 0.01);
    }
    assert.ok(enemy.position.x > -69.95);
    assert.ok(enemy.position.x < (wall ? -69.8 : -69.35));
    physics.dispose();
  }
});

test("projectile chains, damage and stamina are identical at 30/60/144 Hz rendering", () => {
  const results = [30, 60, 144].map((fps) => {
    const physics = new Physics(),
      player = new Player(physics),
      attacks = new PlayerAttacks(physics),
      clock = new FixedClock();
    player.reset({ x: -70, y: 0.8, z: 40 });
    const enemies = [-66, -62].map(
      (x) => new Combat(physics, { spawn: { x, y: 0.69, z: 40 } }),
    );
    physics.step();
    player.direction = "right";
    let ticks = 0;
    for (let frame = 0; frame < fps * 2; frame++)
      clock.advance(1 / fps, () => {
        const input = {
          x: 0,
          z: 0,
          jumpHeld: false,
          jumpPressed: false,
          fireballPressed: [0, 17, 34].includes(ticks++),
        };
        player.update(input);
        physics.step();
        attacks.update(input, player, enemies);
      });
    const result = {
      ticks,
      hp: enemies.map((enemy) => enemy.hp),
      stamina: attacks.stamina.value,
      shots: attacks.projectiles.shots,
    };
    physics.dispose();
    return result;
  });
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
  assert.equal(results[0].shots, 3);
  assert.deepEqual(results[0].hp, [0, 1]);
});
