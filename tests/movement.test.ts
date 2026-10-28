import test from "node:test";
import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import { Physics, FIXED_DT } from "../src/physics";
import { Player, cameraMovement, FOOT_OFFSET } from "../src/player";
import { platformPosition, PLATFORMS, PATH_RAMPS } from "../src/course";
import type { MovementInput } from "../src/types";
import { FixedClock } from "../src/timestep";

await RAPIER.init();
const idle: MovementInput = { x: 0, z: 0, jumpPressed: false, jumpHeld: false };
test("enemy sensor hurtboxes cannot act as floors", () => {
  const { physics, player, step } = fixture();
  physics.world.createCollider(
    RAPIER.ColliderDesc.ball(2).setTranslation(-70, 1, 40).setSensor(true),
  );
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  step({}, 30);
  const ground = physics.groundBelow(player.position, player.collider);
  assert.ok(ground);
  assert.equal(ground.collider.isSensor(), false);
  assert.ok(Math.abs(player.position.y - 0.685) < 0.03);
  physics.dispose();
});
function fixture() {
  const physics = new Physics(),
    player = new Player(physics);
  let time = 0;
  function step(input: Partial<MovementInput> = {}, frames = 1) {
    for (let i = 0; i < frames; i++) {
      time += FIXED_DT;
      physics.updatePlatforms(time);
      player.update({
        ...idle,
        ...input,
        jumpPressed: i === 0 && !!input.jumpPressed,
        dashPressed: i === 0 && !!input.dashPressed,
      });
      physics.step();
    }
  }
  step({}, 20);
  return { physics, player, step };
}
test("camera-relative diagonals have equal top speed", () => {
  assert.ok(
    Math.abs(Math.hypot(...Object.values(cameraMovement(1, 1))) - 1) < 1e-8,
  );
  assert.ok(
    Math.abs(Math.hypot(...Object.values(cameraMovement(1, 0))) - 1) < 1e-8,
  );
});
test("grounded idle remains stable for 20 seconds", () => {
  const { physics, player, step } = fixture();
  const start = player.position;
  step({}, 1200);
  assert.equal(player.grounded, true);
  assert.ok(Math.abs(player.position.y - start.y) < 0.005);
  assert.ok(Math.abs(player.position.y - FOOT_OFFSET - 0.025) < 0.04);
  physics.dispose();
});
test("grass recovery steps onto low paths but course hurdles still need a jump", () => {
  const { physics, player, step } = fixture();
  player.reset({ x: 104, y: 0.8, z: -13 });
  physics.step();
  step({}, 20);
  step({ z: 1 }, 45);
  assert.ok(player.position.z > -9, "walk back onto the low path from grass");
  assert.equal(player.jumps, 0);
  player.reset({ x: 152, y: 1.5 + FOOT_OFFSET + 0.04, z: -42 });
  physics.step();
  step({}, 20);
  step({ x: 1 }, 60);
  assert.ok(player.position.x < 154.1, "walking must stop at the first hurdle");
  step({ x: 1, jumpPressed: true, jumpHeld: true });
  step({ x: 1, jumpHeld: true }, 40);
  assert.ok(player.position.x > 156, "jumping can clear the hurdle");
  physics.dispose();
});

test("holding jump produces more height than tapping; repeated landings work", () => {
  function height(held: boolean) {
    const { physics, player, step } = fixture();
    const initial = player.position.y;
    let peak = initial;
    step({ jumpPressed: true, jumpHeld: true });
    for (let i = 0; i < 100; i++) {
      step({ jumpHeld: held });
      peak = Math.max(peak, player.position.y);
    }
    assert.equal(player.grounded, true);
    assert.equal(player.jumps, 1);
    physics.dispose();
    return peak - initial;
  }
  const held = height(true),
    tap = height(false);
  assert.ok(held > tap + 0.6, `${held} vs ${tap}`);
  assert.ok(held > 1.7 && held < 2.2);
});
test("jump input just before landing is buffered", () => {
  const { physics, player, step } = fixture();
  player.reset({ x: 0, y: 1.0, z: 0 });
  physics.step();
  let pressed = false;
  for (let i = 0; i < 40; i++) {
    const shouldPress =
      !pressed && player.velocity.y < -0.5 && player.position.y < 0.86;
    if (shouldPress) pressed = true;
    step({ jumpPressed: shouldPress, jumpHeld: true });
  }
  assert.ok(pressed);
  assert.equal(player.jumps, 1);
  physics.dispose();
});
test("coyote jump works just after stepping off a ledge", () => {
  const { physics, player, step } = fixture();
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(2, 0.5, 2).setTranslation(-25, 1.5, 30),
  );
  player.reset({ x: -23.4, y: 2.78, z: 30 });
  physics.step();
  step({}, 2);
  for (let i = 0; i < 60 && player.grounded; i++) step({ x: 1, z: 0 });
  assert.equal(player.grounded, false);
  step({ x: 1, z: 1, jumpPressed: true, jumpHeld: true });
  assert.ok(player.velocity.y > 8);
  physics.dispose();
});
test("walls slide and an overhead collider stops an upward jump", () => {
  const { physics, player, step } = fixture();
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.15, 2, 20).setTranslation(0, 1, 0),
  );
  physics.step();
  step({ x: 1, z: 1 }, 45);
  assert.ok(player.position.x < -0.46);
  assert.ok(player.position.z > 1.4);
  player.reset({ x: -3, y: 0.78, z: 0 });
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(1, 0.15, 1).setTranslation(-3, 2.5, 0),
  );
  physics.step();
  step({}, 5);
  step({ jumpPressed: true, jumpHeld: true });
  let peak = 0;
  for (let i = 0; i < 50; i++) {
    step({ jumpHeld: true });
    peak = Math.max(peak, player.position.y);
  }
  assert.ok(peak < 1.7);
  assert.equal(player.grounded, true);
  physics.dispose();
});
test("right movement stays on the route axis and releasing stops immediately", () => {
  const { physics, player, step } = fixture();
  const z = player.position.z;
  step({ x: 1 }, 30);
  assert.ok(player.position.x > -1);
  assert.ok(Math.abs(player.position.z - z) < 0.001);
  step();
  const stopped = player.position;
  step({}, 180);
  assert.ok(Math.abs(player.position.x - stopped.x) < 0.001);
  assert.ok(Math.abs(player.position.z - stopped.z) < 0.001);
  physics.dispose();
});
test("missed connections land on the real ground instead of falling through the world", () => {
  const { physics, player, step } = fixture();
  for (const spot of [
    { x: 15, z: 6 },
    { x: 52, z: -17 },
    { x: 99, z: -34 },
  ]) {
    player.reset({ ...spot, y: 5 });
    physics.step();
    step({}, 180);
    assert.equal(player.grounded, true);
    assert.ok(
      player.position.y > 0.6 && player.position.y < 0.8,
      JSON.stringify(player.position),
    );
  }
  physics.dispose();
});
test("moving ferry carries an idle player through a complete cycle", () => {
  const { physics, player, step } = fixture();
  const spec = PLATFORMS.find((p) => p.id === "ferry")!;
  const start = platformPosition(spec, 20 * FIXED_DT);
  player.reset({ x: start.x, y: spec.top + FOOT_OFFSET + 0.04, z: spec.z });
  physics.step();
  step({}, 10);
  const offset =
    player.position.x -
    physics.platforms.find((p) => p.spec.id === "ferry")!.body.translation().x;
  step({}, 540);
  const end = physics.platforms
    .find((p) => p.spec.id === "ferry")!
    .body.translation();
  assert.equal(player.grounded, true);
  assert.ok(
    Math.abs(player.position.x - end.x - offset) < 0.15,
    `${player.position.x - end.x - offset}`,
  );
  physics.dispose();
});
test("30, 60 and 144 Hz rendering produce identical physics and buffered jump results", () => {
  const results = [30, 60, 144].map((hz) => {
    const { physics, player } = fixture();
    const clock = new FixedClock();
    let ticks = 0;
    for (let frame = 0; frame < hz; frame++)
      clock.advance(1 / hz, () => {
        player.update({
          x: ticks < 36 ? 1 : 0,
          z: 0,
          jumpPressed: ticks === 4,
          jumpHeld: ticks < 20,
        });
        physics.step();
        ticks++;
      });
    const result = {
      ticks,
      position: player.position,
      jumps: player.jumps,
      grounded: player.grounded,
    };
    physics.dispose();
    return result;
  });
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
  assert.equal(results[0].ticks, 60);
});

test("standing on sloped path connections does not slide sideways", () => {
  const { physics, player, step } = fixture();
  for (const ramp of PATH_RAMPS.filter(
    (p) => Math.abs(p.start.y - p.end.y) > 0.1,
  )) {
    player.reset({
      x: (ramp.start.x + ramp.end.x) / 2,
      y: (ramp.start.y + ramp.end.y) / 2 + FOOT_OFFSET + 0.04,
      z: (ramp.start.z + ramp.end.z) / 2,
    });
    physics.step();
    step({}, 30);
    const origin = player.position;
    step({}, 180);
    const end = player.position;
    assert.ok(
      Math.hypot(end.x - origin.x, end.z - origin.z) < 0.002,
      JSON.stringify({ origin, end }),
    );
  }
  physics.dispose();
});

test("dash bursts forward, respects cooldown and stops after release", () => {
  const { physics, player, step } = fixture();
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  step({}, 20);
  const start = player.position.x;
  step({ dashPressed: true }, 14);
  const burst = player.position.x - start;
  assert.ok(burst > 3 && burst < 4.5, `${burst}`);
  assert.equal(player.dashes, 1);
  step({}, 40);
  const stopped = player.position.x;
  step({}, 90);
  assert.ok(Math.abs(player.position.x - stopped) < 0.001);
  assert.equal(player.dashing, false);
  physics.dispose();
});
test("rapid dash presses repeat after cooldown without gaining vertical flight", () => {
  const { physics, player, step } = fixture();
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  step({}, 20);
  const groundHeight = player.position.y;
  for (let frame = 0; frame < 120; frame++) {
    step({ x: 1, dashPressed: frame % 6 === 0 });
    // Stay within the controller's 0.025-unit contact skin, never a jump arc.
    assert.ok(
      Math.abs(player.position.y - groundHeight) < 0.025,
      JSON.stringify({
        frame,
        groundHeight,
        position: player.position,
        grounded: player.grounded,
      }),
    );
    assert.equal(player.grounded, true);
    if (player.dashing || player.dashCooldown > 0)
      assert.equal(player.animation, "dashing");
  }
  assert.ok(player.dashes >= 8 && player.dashes <= 9, `${player.dashes}`);
  assert.ok(player.position.x > -34);
  assert.equal(player.jumps, 0);
  assert.equal(player.grounded, true);
  physics.dispose();
});

test("an early dash tap buffers the next burst and takes its new direction", () => {
  const { physics, player, step } = fixture();
  player.reset({ x: -70, y: 0.8, z: 40 });
  physics.step();
  step({}, 20);
  step({ x: 1, dashPressed: true }, 8);
  step({ x: -1, dashPressed: true });
  assert.equal(player.dashes, 1);
  assert.equal(player.direction, "right");
  step({ x: -1 }, 6);
  assert.equal(player.dashes, 2);
  assert.equal(player.direction, "left");
  assert.ok(player.velocity.x < 0);
  assert.equal(player.grounded, true);
  physics.dispose();
});
test("dash sweeps into thin walls without tunneling", () => {
  const { physics, player, step } = fixture();
  physics.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.05, 3, 5).setTranslation(-66, 2, 40),
  );
  player.reset({ x: -68, y: 0.8, z: 40 });
  physics.step();
  step({}, 20);
  step({ x: 1, dashPressed: true }, 20);
  assert.ok(player.position.x < -66.35, JSON.stringify(player.position));
  physics.dispose();
});
