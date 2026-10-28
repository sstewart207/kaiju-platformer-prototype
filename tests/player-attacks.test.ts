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
