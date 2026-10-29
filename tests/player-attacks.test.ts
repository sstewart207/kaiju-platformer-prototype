import test from "node:test";
import assert from "node:assert/strict";
import { Physics, RAPIER } from "../src/physics";
import { Player } from "../src/player";
import { Combat, PlayerVitals } from "../src/combat";
import { PlayerAttacks } from "../src/player-attacks";
import type { MovementInput } from "../src/types";
await RAPIER.init();
function fixture(positions = [{ x: -68.5, y: 0.69, z: 40 }]) {
  const physics = new Physics(),
    player = new Player(physics),
    attacks = new PlayerAttacks(physics);
  const enemies = positions.map((spawn) => new Combat(physics, { spawn }));
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  function step(input: Partial<MovementInput> = {}, frames = 1) {
    for (let i = 0; i < frames; i++) {
      const controls = {
        x: 0,
        z: 0,
        jumpPressed: false,
        jumpHeld: false,
        ...input,
        attackPressed: i === 0 && !!input.attackPressed,
        specialPressed: i === 0 && !!input.specialPressed,
        fireballPressed: i === 0 && !!input.fireballPressed,
      };
      player.update(controls);
      physics.step();
      attacks.update(controls, player, enemies);
    }
  }
  step({}, 20);
  player.direction = "right";
  return { physics, player, enemies, attacks, step };
}
test("swipe has a windup and hits once per swing; repeat defeats", () => {
  const { physics, enemies, attacks, step } = fixture();
  step({ attackPressed: true }, 5);
  assert.equal(enemies[0].hp, 2);
  step({}, 12);
  assert.equal(enemies[0].hp, 1);
  assert.equal(attacks.hits, 1);
  step({}, 10);
  step({ attackPressed: true }, 15);
  assert.equal(enemies[0].hp, 0);
  assert.equal(enemies[0].collider.isEnabled(), false);
  physics.dispose();
});
test("swipe respects facing, reach, height and solid walls", () => {
  const { physics, enemies, step } = fixture([
    { x: -68.5, y: 0.69, z: 40 },
    { x: -71, y: 0.69, z: 40 },
    { x: -67, y: 0.69, z: 40 },
    { x: -69, y: 3, z: 40 },
  ]);
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(-69.3, 1, 40),
  );
  physics.step();
  step({ attackPressed: true }, 16);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [2, 2, 2, 2],
  );
  physics.dispose();
});

test("longer swipe intersects capsule edges in all directions, excluding behind/outside/high bodies", () => {
  for (const [direction, x, z] of [
    ["right", 1, 0],
    ["left", -1, 0],
    ["front", 0, 1],
    ["back", 0, -1],
  ] as const) {
    const { physics, player, enemies, step } = fixture([
      { x: -70 + x * 2.95, y: 0.69, z: 40 + z * 2.95 },
      { x: -70 - x, y: 0.69, z: 40 - z },
      { x: -70 + x * 2 - z * 1.55, y: 0.69, z: 40 + z * 2 + x * 1.55 },
      { x: -70 + x * 2, y: 3, z: 40 + z * 2 },
    ]);
    player.direction = direction;
    step({ attackPressed: true }, 8);
    assert.deepEqual(
      enemies.map((enemy) => enemy.hp),
      [1, 2, 2, 2],
      direction,
    );
    physics.dispose();
  }
});

test("swipe clips at off-axis wall corners and cannot damage bodies behind its visible tip", () => {
  for (const [direction, x, z] of [
    ["right", 1, 0],
    ["left", -1, 0],
    ["front", 0, 1],
    ["back", 0, -1],
  ] as const) {
    const { physics, player, enemies, attacks, step } = fixture([
      { x: -70 + x * 2.5, y: 0.69, z: 40 + z * 2.5 },
    ]);
    physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.12, 2, 0.12).setTranslation(
        -70 + x * 1.4 - z * 0.9,
        1,
        40 + z * 1.4 + x * 0.9,
      ),
    );
    physics.step();
    player.direction = direction;
    step({ attackPressed: true }, 8);
    assert.equal(enemies[0].hp, 2, direction);
    assert.ok(attacks.swipeLength > 0 && attacks.swipeLength < 1.5, direction);
    physics.dispose();
  }
});

test("swipe reaches a zombie on a shallow step without hitting a different floor", () => {
  const { physics, enemies, step } = fixture([
    { x: -67.5, y: 1.17, z: 40 },
    { x: -68, y: -0.8, z: 40 },
  ]);
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.5, 0.215, 1).setTranslation(-67.5, 0.215, 40),
  );
  physics.step();
  step({ attackPressed: true }, 12);
  assert.deepEqual(
    enemies.map((enemy) => enemy.hp),
    [1, 2],
  );
  physics.dispose();
});

test("the longer active window catches a late-entering moving body only once", () => {
  const { physics, player, enemies, attacks, step } = fixture([
    { x: -68, y: 0.69, z: 42 },
  ]);
  step({ attackPressed: true }, 15);
  assert.equal(enemies[0].hp, 2);
  assert.ok(attacks.age > 0.22 && attacks.age < 0.3);
  const arrival = { x: player.position.x + 2, y: 0.69, z: player.position.z };
  enemies[0].body.setTranslation(arrival, true);
  enemies[0].body.setNextKinematicTranslation(arrival);
  physics.world.propagateModifiedBodyPositionsToColliders();
  step({}, 8);
  assert.equal(enemies[0].hp, 1);
  assert.equal(attacks.hits, 1);
  physics.dispose();
});
test("solar beam charges, pierces aligned enemies once and enforces cooldown", () => {
  const { physics, enemies, attacks, step } = fixture([
    { x: -66, y: 0.69, z: 40 },
    { x: -62, y: 0.69, z: 40 },
    { x: -66, y: 0.69, z: 42 },
  ]);
  step({ specialPressed: true }, 9);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [2, 2, 2],
  );
  step({}, 15);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [0, 0, 2],
  );
  assert.equal(attacks.hits, 2);
  step({}, 12);
  step({ specialPressed: true });
  assert.equal(attacks.beams, 1);
  // Recast on the exact 75th recharge tick, not one frame after READY.
  step({}, 38);
  step({ specialPressed: true });
  assert.equal(attacks.beams, 2);
  attacks.reset();
  assert.equal(attacks.solarCooldown, 0);
  assert.equal(attacks.kind, null);
  physics.dispose();
});
test("solar beam stops at a thin wall, including a wall beside its origin", () => {
  for (const wallX of [-68, -69.9]) {
    const { physics, enemies, attacks, step } = fixture([
      { x: -65, y: 0.69, z: 40 },
    ]);
    physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(wallX, 1, 40),
    );
    physics.step();
    step({ specialPressed: true }, 22);
    assert.equal(enemies[0].hp, 2);
    assert.ok(attacks.beamLength < 2.1);
    physics.dispose();
  }
});

test("horizontal solar ray clears a low wall instead of aiming down at enemy feet", () => {
  const { physics, enemies, step } = fixture([{ x: -65, y: 0.69, z: 40 }]);
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.05, 0.45, 1).setTranslation(-67, 0.45, 40),
  );
  physics.step();
  step({ specialPressed: true, specialHeld: true }, 22);
  assert.equal(enemies[0].hp, 0);
  physics.dispose();
});

test("solar hits capsule edges at its end but misses bodies outside the visible width", () => {
  for (const [direction, x, z] of [
    ["right", 1, 0],
    ["left", -1, 0],
    ["front", 0, 1],
    ["back", 0, -1],
  ] as const) {
    const { physics, player, enemies, step } = fixture([
      { x: -70 + x * 10.2, y: 0.69, z: 40 + z * 10.2 },
      { x: -70 + x * 5 - z * 0.7, y: 0.69, z: 40 + z * 5 + x * 0.7 },
    ]);
    player.direction = direction;
    step({ specialPressed: true, specialHeld: true }, 22);
    assert.deepEqual(
      enemies.map((enemy) => enemy.hp),
      [0, 2],
      direction,
    );
    physics.dispose();
  }
});

test("held solar sustains, turns, hits newly arriving targets and stops on release", () => {
  const { physics, player, enemies, attacks, step } = fixture([
    { x: -66, y: 0.69, z: 40 },
    { x: -70, y: 0.69, z: 44 },
  ]);
  step({ specialPressed: true, specialHeld: true }, 120);
  assert.equal(attacks.beamActive, true);
  assert.equal(attacks.beams, 1);
  assert.equal(enemies[0].hp, 0);
  assert.equal(enemies[1].hp, 2);
  player.direction = "front";
  step({ specialHeld: true }, 2);
  assert.equal(enemies[1].hp, 0);
  assert.deepEqual(attacks.direction, { x: 0, z: 1 });
  step();
  assert.equal(attacks.beamActive, false);
  assert.ok(attacks.solarCooldown > 1.2);
  step({ specialPressed: true, specialHeld: true }, 4);
  assert.equal(attacks.beams, 1);
  physics.dispose();
});

test("sustained solar respects walls and resets without a stuck ray", () => {
  const { physics, enemies, attacks, step } = fixture([
    { x: -65, y: 0.69, z: 40 },
  ]);
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(-68, 1, 40),
  );
  physics.step();
  step({ specialPressed: true, specialHeld: true }, 180);
  assert.equal(enemies[0].hp, 2);
  assert.ok(attacks.beamLength < 2.1);
  attacks.reset();
  assert.equal(attacks.beamActive, false);
  assert.equal(attacks.pose, null);
  physics.dispose();
});
test("fireballs travel, stop on the first body and require a second shot to defeat", () => {
  const { physics, enemies, attacks, step } = fixture([
    { x: -66, y: 0.69, z: 40 },
    { x: -63, y: 0.69, z: 40 },
  ]);
  step({ fireballPressed: true }, 8);
  assert.equal(attacks.projectiles.shots, 1);
  assert.equal(enemies[0].hp, 2);
  assert.ok(attacks.projectiles.balls[0].position.x < -68);
  step({}, 22);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [1, 2],
  );
  assert.equal(attacks.projectiles.balls.length, 0);
  step({ fireballPressed: true }, 30);
  assert.deepEqual(
    enemies.map((e) => e.hp),
    [0, 2],
  );
  physics.dispose();
});

test("fireballs sweep thin walls and the muzzle gap in all four directions", () => {
  for (const direction of ["right", "left", "front", "back"] as const)
    for (const distance of [0.4, 2.8]) {
      const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
      const dz = direction === "front" ? 1 : direction === "back" ? -1 : 0;
      const { physics, player, enemies, attacks, step } = fixture([
        { x: -70 + dx * 5, y: 0.69, z: 40 + dz * 5 },
      ]);
      physics.world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          dx ? 0.005 : 2,
          2,
          dz ? 0.005 : 2,
        ).setTranslation(-70 + dx * distance, 1, 40 + dz * distance),
      );
      physics.step();
      player.direction = direction;
      step({ fireballPressed: true }, 60);
      assert.equal(enemies[0].hp, 2);
      assert.equal(attacks.projectiles.shots, 1);
      assert.equal(attacks.projectiles.balls.length, 0);
      physics.dispose();
    }
});

test("three buffered fireballs chain, charge once per shot and cannot queue a fourth", () => {
  const { physics, attacks, step } = fixture([]);
  for (let shot = 0; shot < 3; shot++) {
    step({ fireballPressed: true });
    step({}, 16);
  }
  assert.equal(attacks.projectiles.shots, 3);
  assert.equal(attacks.fireballChain, 3);
  assert.ok(Math.abs(attacks.stamina.value - 46) < 0.01);
  step({ fireballPressed: true }, 12);
  assert.equal(attacks.projectiles.shots, 3);
  step({}, 70);
  assert.equal(attacks.fireballChain, 0);
  step({ fireballPressed: true }, 10);
  assert.equal(attacks.projectiles.shots, 4);
  attacks.cancel();
  assert.equal(attacks.projectiles.balls.length, 0);
  physics.dispose();
});

test("ray exhausts stamina, regenerates after rest but never restarts from a held button", () => {
  const { physics, attacks, step } = fixture([]);
  step({ specialPressed: true, specialHeld: true }, 240);
  assert.equal(attacks.beamActive, false);
  assert.equal(attacks.kind, null);
  assert.ok(attacks.stamina.value < 1);
  step({ specialHeld: true }, 300);
  assert.equal(attacks.stamina.value, 100);
  assert.equal(attacks.beamActive, false);
  assert.equal(attacks.beams, 1);
  step();
  step({ specialPressed: true, specialHeld: true }, 20);
  assert.equal(attacks.beams, 2);
  assert.equal(attacks.beamActive, true);
  attacks.reset();
  assert.equal(attacks.stamina.value, 100);
  physics.dispose();
});

test("insufficient stamina blocks attack windups and stale input buffers clear safely", () => {
  const { physics, attacks, step } = fixture([]);
  attacks.stamina.spend(100);
  step({ attackPressed: true, fireballPressed: true, specialPressed: true });
  assert.equal(attacks.kind, null);
  assert.equal(attacks.swings + attacks.beams + attacks.projectiles.shots, 0);
  attacks.clearBuffered();
  step({}, 100);
  assert.equal(attacks.kind, null);
  step({ attackPressed: true });
  assert.equal(attacks.kind, "swipe");
  physics.dispose();
});

test("simultaneous enemy attacks share one damage protection window", () => {
  const physics = new Physics(),
    player = new Player(physics),
    vitals = new PlayerVitals();
  const enemies = [
    new Combat(physics, { spawn: { x: -68.8, y: 0.69, z: 40 } }, vitals),
    new Combat(physics, { spawn: { x: -68.8, y: 0.69, z: 40 } }, vitals),
  ];
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  for (let frame = 0; frame < 40; frame++) {
    vitals.tick();
    enemies.forEach((e) => e.beginStep());
    player.update({ x: 0, z: 0, jumpPressed: false, jumpHeld: false });
    physics.step();
    enemies.forEach((e) => e.update(player));
  }
  assert.equal(vitals.health, 2);
  assert.ok(vitals.invulnerable > 0.8);
  physics.dispose();
});

test("an enemy uses authored patrol points to regain sight around a wall", () => {
  const physics = new Physics(),
    player = new Player(physics);
  const enemy = new Combat(physics, {
    spawn: { x: -70, y: 0.69, z: 40 },
    patrol: [
      { x: -70, y: 0.69, z: 43 },
      { x: -64, y: 0.69, z: 43 },
    ],
  });
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.1, 2, 1).setTranslation(-67, 1, 40),
  );
  player.reset({ x: -64, y: 0.8, z: 40 });
  physics.step();
  let sightPosition = null;
  for (let frame = 0; frame < 360; frame++) {
    enemy.beginStep();
    player.update({ x: 0, z: 0, jumpHeld: false, jumpPressed: false });
    physics.step();
    enemy.update(player);
    if (enemy.shots) {
      sightPosition = enemy.position;
      break;
    }
  }
  assert.ok(sightPosition);
  assert.ok(sightPosition.z > 41);
  physics.dispose();
});
