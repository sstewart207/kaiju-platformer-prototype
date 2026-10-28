import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { SpriteMotion } from "../src/sprite-motion";

const pixel = 18 / 1080,
  scale = new THREE.Vector3(2.4, 2.5, 1),
  anchor = 0.08;
test("walking moves the hair crown without moving face or feet", () => {
  const motion = new SpriteMotion({
    hair: { pixels: 2, seconds: 0.36, from: 0.66 },
  });
  const attribute = motion.geometry.getAttribute("position");
  const rest = Float32Array.from(attribute.array);
  let moved = false;
  for (let frame = 0; frame < 120; frame++) {
    motion.update("walking", "right", 1 / 60, pixel, scale, anchor, {
      x: 3,
      y: 0,
      z: 1,
    });
    for (let index = 0; index < rest.length; index += 3) {
      const height = (rest[index + 1] + 0.5 - anchor) / (1 - anchor);
      const difference = (attribute.array[index] - rest[index]) * scale.x;
      if (height <= 0.66) assert.equal(attribute.array[index], rest[index]);
      assert.equal(attribute.array[index + 1], rest[index + 1]);
      assert.ok(Math.abs(difference) <= 2 * pixel + 1e-6);
      if (Math.abs(difference) > pixel * 0.9) moved = true;
    }
  }
  assert.ok(moved);
  motion.update("dashing", "right", 1 / 60, pixel, scale, anchor, {
    x: 3,
    y: 0,
    z: 1,
  });
  assert.deepEqual(Float32Array.from(attribute.array), rest);
  motion.geometry.dispose();
});
test("idle breathing keeps planted feet fixed, freezes on pause and clears for action poses", () => {
  const motion = new SpriteMotion({
    breathing: { pixels: 1.25, seconds: 2.8 },
  });
  const attribute = motion.geometry.getAttribute("position"),
    rest = Float32Array.from(attribute.array);
  let moved = false;
  for (let frame = 0; frame < 240; frame++) {
    motion.update("idle", "front", 1 / 60, pixel, scale, anchor, {
      x: 0,
      y: 0,
      z: 0,
    });
    for (let index = 0; index < rest.length; index += 3) {
      const height = (rest[index + 1] + 0.5 - anchor) / (1 - anchor);
      const difference =
        (attribute.array[index + 1] - rest[index + 1]) * scale.y;
      if (height <= 0.28)
        assert.equal(attribute.array[index + 1], rest[index + 1]);
      assert.equal(attribute.array[index], rest[index]);
      assert.ok(difference >= -1e-6 && difference <= pixel + 1e-6);
      if (difference > pixel * 0.9) moved = true;
    }
  }
  assert.ok(moved);
  const paused = Float32Array.from(attribute.array);
  for (let i = 0; i < 30; i++)
    motion.update("idle", "front", 0, pixel, scale, anchor, {
      x: 0,
      y: 0,
      z: 0,
    });
  assert.deepEqual(Float32Array.from(attribute.array), paused);
  motion.update("defeated", "front", 1 / 60, pixel, scale, anchor, {
    x: 0,
    y: 0,
    z: 0,
  });
  assert.deepEqual(Float32Array.from(attribute.array), rest);
  motion.geometry.dispose();
});
