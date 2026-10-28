import test from "node:test";
import assert from "node:assert/strict";
import { KillObjective, killTargetForLevel } from "../src/level-objective";
test("new levels require increasing quotas; Ruins needs twelve unique defeats", () => {
  assert.deepEqual([1, 2, 3].map(killTargetForLevel), [12, 18, 24]);
  const objective = new KillObjective(12, 12);
  for (let i = 0; i < 11; i++) {
    objective.record(i);
    objective.record(i);
  }
  assert.equal(objective.kills, 11);
  assert.equal(objective.unlocked, false);
  objective.record(11);
  assert.equal(objective.unlocked, true);
  assert.throws(() => objective.record(12));
  assert.throws(() => new KillObjective(12, 3));
  objective.reset();
  assert.equal(objective.kills, 0);
  assert.equal(objective.unlocked, false);
});
