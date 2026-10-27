import test from "node:test";
import assert from "node:assert/strict";
import { Physics, RAPIER } from "../src/physics";
import { Player } from "../src/player";
import { Combat, ENEMY, type CombatTarget } from "../src/combat";

await RAPIER.init();
function fixture() {
  const physics = new Physics(),
    player = new Player(physics),
    combat = new Combat(physics);
  function step(frames = 1) {
    for (let i = 0; i < frames; i++) {
      combat.beginStep();
      player.update({ x: 0, z: 0, jumpHeld: false, jumpPressed: false });
      physics.step();
      combat.update(player);
    }
  }
  function stand(x: number, z = -11, y = 0.72) {
    player.reset({ x, y, z });
    physics.step();
  }
  step(20);
  return { physics, player, combat, step, stand };
}
test("the enemy stays grounded and does not attack the safe route", () => {
  const { physics, combat, player, step, stand } = fixture();
  stand(18, 0, 0.93);
  step(240);
  assert.equal(combat.health, 3);
  assert.equal(combat.shots, 0);
  assert.equal(combat.action, "idle");
  assert.ok(Math.abs(combat.position.y - ENEMY.footOffset + 0.08) < 0.06);
  assert.ok(player.grounded);
  physics.dispose();
});
test("bite has a windup, deals one hit and can be dodged behind the enemy", () => {
  const { physics, combat, step, stand } = fixture();
  stand(19.2);
  step(20);
  assert.equal(combat.action, "melee");
  assert.equal(combat.health, 3);
  step(12);
  assert.equal(combat.health, 2);
  assert.equal(combat.meleeHits, 1);
  step(12);
  assert.equal(combat.meleeHits, 1);
  stand(-2.5, 1, 0.86);
  combat.reset();
  physics.step();
  step(20);
  stand(19.2);
  step(15);
  stand(16.8);
  step(25);
  assert.equal(combat.health, 3);
  physics.dispose();
});
test("fireball has a charge and damages the player only once", () => {
  const { physics, combat, step, stand } = fixture();
  stand(24);
  step(35);
  assert.equal(combat.action, "charging");
  assert.equal(combat.shots, 0);
  step(8);
  assert.equal(combat.shots, 1);
  step(60);
  assert.equal(combat.health, 2);
  assert.equal(combat.projectileHits, 1);
  assert.equal(combat.projectiles.length, 0);
  physics.dispose();
});
test("a fireball hits a thin wall added after aiming instead of passing through", () => {
  const { physics, combat, step, stand } = fixture();
  stand(24);
  step(35);
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.025, 2, 2).setTranslation(21, 1, -11),
  );
  physics.step();
  step(85);
  assert.equal(combat.shots, 1);
  assert.equal(combat.wallHits, 1);
  assert.equal(combat.health, 3);
  assert.equal(combat.projectileHits, 0);
  physics.dispose();
});
test("a dash damages once per burst and two separate dashes defeat the enemy", () => {
  const { physics, combat, player } = fixture();
  const p = combat.position;
  const target: CombatTarget = {
    position: { ...p, x: p.x + 1 },
    previous: { ...p, x: p.x - 1 },
    collider: player.collider,
    body: player.body,
    dashing: true,
    dashes: 1,
  };
  combat.update(target);
  assert.equal(combat.hp, 1);
  for (let i = 0; i < 12; i++) combat.update(target);
  assert.equal(combat.hp, 1);
  combat.update({ ...target, dashes: 2 });
  assert.equal(combat.hp, 0);
  assert.equal(combat.action, "defeated");
  assert.equal(combat.collider.isEnabled(), false);
  physics.dispose();
});
test("jump height avoids a low bite and reset clears attacks, health and projectiles", () => {
  const { physics, combat, step, stand } = fixture();
  stand(19.2);
  step(15);
  stand(19.2, -11, 3.3);
  step(20);
  assert.equal(combat.health, 3);
  combat.reset();
  physics.step();
  stand(24);
  step(65);
  assert.ok(combat.projectiles.length > 0);
  combat.reset();
  assert.equal(combat.projectiles.length, 0);
  assert.equal(combat.health, 3);
  assert.equal(combat.hp, 2);
  assert.equal(combat.action, "idle");
  assert.equal(combat.shots, 0);
  assert.equal(combat.collider.isEnabled(), true);
  physics.dispose();
});
