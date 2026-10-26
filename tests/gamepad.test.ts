import test from "node:test";
import assert from "node:assert/strict";
import {
  Controller,
  stickWithDeadzone,
  type PadSnapshot,
} from "../src/gamepad";
function pad(axes = [0, 0], pressed: number[] = []): PadSnapshot {
  return {
    index: 0,
    id: "DualSense Wireless Controller",
    mapping: "standard",
    connected: true,
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: pressed.includes(i),
      value: pressed.includes(i) ? 1 : 0,
    })),
  };
}
test("stick deadzone removes drift and preserves analog movement", () => {
  assert.deepEqual(stickWithDeadzone(0.1, -0.1), { x: 0, z: 0 });
  assert.ok(
    stickWithDeadzone(0.5, 0).x > 0.2 && stickWithDeadzone(0.5, 0).x < 0.5,
  );
  assert.equal(stickWithDeadzone(1, 0).x, 1);
  assert.ok(
    Math.abs(Math.hypot(...Object.values(stickWithDeadzone(1, 1))) - 1) < 1e-10,
  );
});
test("diagonal resting noise and incidental cross-axis input do not require counter-steering", () => {
  for (const x of [-0.2, 0, 0.2])
    for (const z of [-0.2, 0, 0.2])
      assert.deepEqual(stickWithDeadzone(x, z), { x: 0, z: 0 });
  assert.deepEqual(stickWithDeadzone(1, 0.15), { x: 1, z: 0 });
  assert.deepEqual(stickWithDeadzone(-0.1, -1), { x: 0, z: -1 });
});
test("Cross is edge-triggered for jump/select but remains held for jump height", () => {
  const controller = new Controller();
  controller.sample([pad()]);
  const first = controller.sample([pad([0, 0], [0])]);
  assert.ok(first.jumpPressed && first.confirm && first.jumpHeld);
  const held = controller.sample([pad([0, 0], [0])]);
  assert.equal(held.jumpPressed, false);
  assert.equal(held.confirm, false);
  assert.equal(held.jumpHeld, true);
  controller.sample([pad()]);
  assert.equal(controller.sample([pad([0, 0], [0])]).jumpPressed, true);
});
test("D-pad overrides stick and normalizes diagonal movement", () => {
  const state = new Controller().sample([pad([-1, 0], [13, 15])]);
  assert.ok(state.x > 0 && state.z > 0);
  assert.ok(Math.abs(Math.hypot(state.x, state.z) - 1) < 1e-10);
});
test("Options, Circle and Triangle use standard mapping with no repeats", () => {
  const controller = new Controller();
  const state = controller.sample([pad([0, 0], [1, 3, 9])]);
  assert.ok(state.back && state.restart && state.pause);
  const held = controller.sample([pad([0, 0], [1, 3, 9])]);
  assert.ok(!held.back && !held.restart && !held.pause);
});
test("clear blocks held buttons/sticks until neutral, preventing menu click-through", () => {
  const controller = new Controller();
  controller.sample([pad([1, 0], [0])]);
  controller.clear();
  const blocked = controller.sample([pad([1, 0], [0])]);
  assert.equal(blocked.x, 0);
  assert.equal(blocked.jumpHeld, false);
  assert.equal(blocked.confirm, false);
  controller.sample([pad()]);
  assert.equal(controller.sample([pad([1, 0], [0])]).confirm, true);
});
test("sparse slots and disconnect release input and emit one disconnect", () => {
  const controller = new Controller();
  assert.equal(controller.sample([null, pad()]).connected, true);
  const lost = controller.sample([null]);
  assert.equal(lost.disconnected, true);
  assert.equal(lost.x, 0);
  assert.equal(lost.jumpHeld, false);
  assert.equal(controller.sample([]).disconnected, false);
});
test("unknown mappings are not guessed", () => {
  const state = new Controller().sample([{ ...pad([1, 0], [0]), mapping: "" }]);
  assert.equal(state.unsupported, true);
  assert.equal(state.confirm, false);
  assert.equal(state.x, 0);
});
test("menu navigation uses directional edges rather than every poll", () => {
  const controller = new Controller();
  assert.equal(controller.sample([pad([0, 1])]).nav, 1);
  assert.equal(controller.sample([pad([0, 1])]).nav, 0);
  controller.sample([pad()]);
  assert.equal(controller.sample([pad([0, -1])]).nav, -1);
});

test("Square and R1 each trigger a dash once per press", () => {
  const controller = new Controller();
  controller.sample([pad()]);
  assert.equal(controller.sample([pad([0, 0], [2])]).dashPressed, true);
  assert.equal(controller.sample([pad([0, 0], [2])]).dashPressed, false);
  controller.sample([pad()]);
  assert.equal(controller.sample([pad([0, 0], [5])]).dashPressed, true);
});
