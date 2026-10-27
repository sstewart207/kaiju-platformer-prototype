import { test, expect, type Page } from "@playwright/test";
import { ENEMY } from "../../src/combat";
import { writeFileSync } from "node:fs";
interface Snapshot {
  health: number;
  enemyHp: number;
  enemyPosition: { x: number; y: number; z: number };
  action: string;
  actionTime: number;
  shots: number;
  projectiles: unknown[];
  meleeHits: number;
  projectileHits: number;
  spriteWidth: number;
  spriteHeight: number;
  playerSpriteWidth: number;
}
async function state(page: Page) {
  return page.evaluate(
    () => (window.__solargon.state() as unknown as { combat: Snapshot }).combat,
  );
}
async function advance(page: Page, n: number) {
  await page.evaluate((n) => window.__solargon.advance(n), n);
}
async function stand(page: Page, x: number, z = -11) {
  await page.evaluate(
    (p) => {
      window.__solargon.teleport(p);
      window.__solargon.advance(2);
    },
    { x, y: 0.75, z },
  );
}
async function boot(page: Page) {
  await page.goto("/?test&enemies=1");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  await advance(page, 20);
}
test("enemy scale, melee windup, damage and pause/restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await stand(page, ENEMY.spawn.x - 2.5);
  const size = await state(page);
  expect(size.spriteWidth / size.playerSpriteWidth).toBeGreaterThan(0.9);
  expect(size.spriteWidth / size.playerSpriteWidth).toBeLessThan(1.15);
  await page.screenshot({ path: "art/playtest/enemy-scale.png" });
  await stand(page, ENEMY.spawn.x - 1.2);
  // Re-enter from a clean restart so this encounter begins with a melee, not a prior charge.
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await stand(page, ENEMY.spawn.x - 1.2);
  await advance(page, 18);
  expect((await state(page)).health).toBe(3);
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await advance(page, 120);
  expect(await state(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await advance(page, 20);
  expect((await state(page)).health).toBe(2);
  await expect(page.locator("#health")).toHaveAttribute(
    "aria-label",
    "Health 2 of 3",
  );
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  expect((await state(page)).health).toBe(3);
  expect((await state(page)).enemyHp).toBe(2);
  expect((await state(page)).projectiles).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("fireballs fly, pause in flight and hit; two keyboard dashes defeat the enemy", async ({
  page,
}) => {
  await boot(page);
  await stand(page, ENEMY.spawn.x - 5);
  await advance(page, 43);
  expect((await state(page)).shots).toBe(1);
  expect((await state(page)).projectiles.length).toBeGreaterThan(0);
  await page.screenshot({ path: "art/playtest/enemy-fireball.png" });
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await advance(page, 120);
  expect(await state(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await advance(page, 60);
  expect((await state(page)).projectileHits).toBe(1);
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await stand(page, ENEMY.spawn.x - 1.3);
  for (let hit = 0; hit < 2; hit++) {
    await page.keyboard.down("KeyD");
    await page.keyboard.press("ShiftLeft");
    await advance(page, 10);
    await page.keyboard.up("KeyD");
    await advance(page, 30);
    expect((await state(page)).enemyHp).toBe(1 - hit);
    if (hit === 0) {
      await page.keyboard.down("KeyA");
      await advance(page, 24);
      await page.keyboard.up("KeyA");
      await advance(page, 1);
    }
  }
  expect((await state(page)).action).toBe("defeated");
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  expect((await state(page)).enemyHp).toBe(2);
  await stand(page, ENEMY.spawn.x - 5);
  await advance(page, 600);
  expect((await state(page)).health).toBe(3);
  expect((await state(page)).projectiles).toHaveLength(0);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.x,
  ).toBeCloseTo(-2.5);
});

test("live 1080p combat frame pacing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await stand(page, ENEMY.spawn.x - 5);
  await page.evaluate(() => window.__solargon.manual(false));
  await page.waitForFunction(() => window.__solargon.state().elapsed > 4.5);
  const result = await page.evaluate(() => window.__solargon.state());
  const enemy = await state(page);
  expect(enemy.shots).toBeGreaterThanOrEqual(2);
  expect(result.fps).toBeGreaterThanOrEqual(55);
  expect(result.frameP95).toBeLessThan(1000 / 55);
  expect(errors).toEqual([]);
  writeFileSync(
    "art/playtest/performance/enemy-combat.json",
    JSON.stringify(
      {
        fps: result.fps,
        p95: result.frameP95,
        samples: result.samples,
        shots: enemy.shots,
        health: enemy.health,
        browser: "Edge headless, 1920x1080 viewport and render buffer",
        errors,
      },
      null,
      2,
    ),
  );
});
