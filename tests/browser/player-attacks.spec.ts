import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
interface Fight {
  enemyHp: number;
  health: number;
  attack: string | null;
  attackAge: number;
  swings: number;
  beams: number;
  hits: number;
  solarCooldown: number;
  beamActive: boolean;
  enemies: { hp: number; position: { x: number; y: number; z: number } }[];
}
async function fight(page: Page) {
  return page.evaluate(
    () => (window.__solargon.state() as unknown as { combat: Fight }).combat,
  );
}
async function advance(page: Page, n: number) {
  await page.evaluate((n) => window.__solargon.advance(n), n);
}
async function boot(page: Page) {
  // Keep keyboard scenarios independent of a physical controller being used nearby.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  await advance(page, 20);
}
async function approach(page: Page, distance: number) {
  const enemy = (await fight(page)).enemies[0].position;
  await page.evaluate((p) => window.__solargon.teleport(p), {
    x: enemy.x - distance,
    y: 0.75,
    z: enemy.z,
  });
  await advance(page, 15);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
}
test("keyboard swipe and solar beam defeat zombies, pause safely and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  expect((await fight(page)).enemies).toHaveLength(12);
  await approach(page, 1.5);
  await page.screenshot({ path: "art/playtest/human-zombie-scale.png" });
  await page.keyboard.press("KeyJ");
  await advance(page, 5);
  expect((await fight(page)).enemyHp).toBe(2);
  await advance(page, 4);
  expect((await fight(page)).enemyHp).toBe(1);
  await page.screenshot({ path: "art/playtest/solargon-swipe.png" });
  await advance(page, 20);
  await page.keyboard.press("KeyJ");
  await advance(page, 12);
  expect((await fight(page)).enemyHp).toBe(0);
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await approach(page, 5);
  await page.keyboard.press("KeyK");
  await advance(page, 5);
  expect((await fight(page)).enemyHp).toBe(2);
  await page.keyboard.press("Escape");
  const paused = await fight(page);
  await advance(page, 90);
  expect(await fight(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await advance(page, 8);
  expect((await fight(page)).enemyHp).toBe(0);
  expect((await fight(page)).beamActive).toBe(true);
  await page.screenshot({ path: "art/playtest/solargon-solar-beam.png" });
  await advance(page, 25);
  await page.keyboard.press("KeyK");
  await advance(page, 1);
  expect((await fight(page)).beams).toBe(1);
  await advance(page, 70);
  await expect(page.locator("#solar-status")).toHaveText("SOLAR READY");
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  const reset = await fight(page);
  expect(reset.enemies.map((e) => e.hp)).toEqual(Array(12).fill(2));
  expect(reset.health).toBe(3);
  expect(reset.solarCooldown).toBe(0);
  await expect(page.locator("#controls")).toContainText("ATTACK");
  expect(errors).toEqual([]);
});

test("hold K sustains the mouth ray; release, pause and restart stop it", async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.down("KeyK");
  await advance(page, 120);
  expect((await fight(page)).beamActive).toBe(true);
  expect((await fight(page)).beams).toBe(1);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: "art/playtest/solargon-sustained-ray.png" });
  await page.keyboard.up("KeyK");
  await advance(page, 1);
  expect((await fight(page)).beamActive).toBe(false);
  await advance(page, 80);
  await page.keyboard.down("KeyK");
  await advance(page, 50);
  await page.keyboard.press("Escape");
  const paused = await fight(page);
  await advance(page, 60);
  expect(await fight(page)).toEqual(paused);
  await page.keyboard.up("KeyK");
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await advance(page, 1);
  expect((await fight(page)).beamActive).toBe(false);
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  expect((await fight(page)).attack).toBe(null);
});

test("continuous ray maintains 60 FPS at 1080p", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await page.keyboard.down("KeyK");
  await page.evaluate(() => window.__solargon.manual(false));
  await page.waitForFunction(() => window.__solargon.state().elapsed > 2.5);
  const result = await page.evaluate(() => window.__solargon.state());
  expect((await fight(page)).beamActive).toBe(true);
  expect(result.fps).toBeGreaterThanOrEqual(55);
  expect(result.frameP95).toBeLessThan(1000 / 55);
  expect(errors).toEqual([]);
  writeFileSync(
    "art/playtest/performance/sustained-solar.json",
    JSON.stringify(
      {
        fps: result.fps,
        p95: result.frameP95,
        samples: result.samples,
        browser:
          "Edge headless, 1920x1080 viewport/render buffer; sustained ray at start, 12 enemies enabled",
        errors,
      },
      null,
      2,
    ),
  );
  await page.keyboard.up("KeyK");
});
