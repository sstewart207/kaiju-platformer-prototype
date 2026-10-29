import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
interface Fight {
  stamina: number;
  fireballShots: number;
  fireballChain: number;
  fireballs: { position: { x: number; z: number } }[];
  enemyHp: number;
  beamActive: boolean;
  beams: number;
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

test("L fires traveling shots that hit a zombie; each shot consumes stamina", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 18, y: 0.75, z: -5 }),
  );
  await page.keyboard.down("KeyW");
  await advance(page, 1);
  await page.keyboard.up("KeyW");
  await page.keyboard.press("KeyL");
  await advance(page, 16);
  expect((await fight(page)).fireballShots).toBe(1);
  expect((await fight(page)).stamina).toBeCloseTo(82);
  expect((await fight(page)).enemyHp).toBe(2);
  expect((await fight(page)).fireballs.length).toBe(1);
  await page.screenshot({ path: "art/playtest/combat-feel-fireball.png" });
  await advance(page, 25);
  expect((await fight(page)).enemyHp).toBe(1);
  await page.keyboard.press("KeyL");
  await advance(page, 40);
  expect((await fight(page)).enemyHp).toBe(0);
  await expect(page.locator("#controls")).toContainText("L FIREBALL");
  expect(errors).toEqual([]);
});

test("three tap shots chain, holding does not repeat, pause preserves projectiles and restart clears them", async ({
  page,
}) => {
  await boot(page);
  for (let shot = 0; shot < 3; shot++) {
    await page.keyboard.press("KeyL");
    await advance(page, 17);
  }
  expect((await fight(page)).fireballShots).toBe(3);
  expect((await fight(page)).fireballChain).toBe(3);
  expect((await fight(page)).stamina).toBeCloseTo(46);
  await page.keyboard.press("Escape");
  const paused = await fight(page);
  await advance(page, 90);
  expect(await fight(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  expect((await fight(page)).stamina).toBe(100);
  expect((await fight(page)).fireballs).toHaveLength(0);
  await page.keyboard.down("KeyL");
  await advance(page, 120);
  expect((await fight(page)).fireballShots).toBe(1);
  await page.keyboard.up("KeyL");
});

test("ray exhaustion stops held fire and allows free movement while stamina recovers", async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.down("KeyK");
  await advance(page, 240);
  expect((await fight(page)).beamActive).toBe(false);
  expect((await fight(page)).stamina).toBeLessThan(1);
  const before = await page.evaluate(
    () => window.__solargon.state().position.x,
  );
  await page.keyboard.down("KeyD");
  await page.keyboard.press("ShiftLeft");
  await page.keyboard.press("Space");
  await advance(page, 12);
  await page.keyboard.up("KeyD");
  expect(
    await page.evaluate(() => window.__solargon.state().position.x),
  ).toBeGreaterThan(before + 2);
  await advance(page, 300);
  expect((await fight(page)).stamina).toBe(100);
  expect((await fight(page)).beams).toBe(1);
  expect((await fight(page)).beamActive).toBe(false);
  await page.keyboard.up("KeyK");
  await advance(page, 1);
  await page.keyboard.down("KeyK");
  await advance(page, 20);
  expect((await fight(page)).beams).toBe(2);
  expect((await fight(page)).beamActive).toBe(true);
  await page.keyboard.up("KeyK");
});

test("swipe contact poses stay grounded in all four directions and stop moving after recovery", async ({
  page,
}) => {
  await boot(page);
  for (const [direction, key] of [
    ["right", "KeyD"],
    ["left", "KeyA"],
    ["front", "KeyS"],
    ["back", "KeyW"],
  ]) {
    await page.keyboard.press("KeyR");
    await advance(page, 20);
    await page.keyboard.down(key);
    await advance(page, 1);
    await page.keyboard.up(key);
    const before = await page.evaluate(
      () => window.__solargon.state().position,
    );
    await page.keyboard.press("KeyJ");
    await advance(page, 10);
    await page.screenshot({
      path: `art/playtest/combat-feel-swipe-${direction}.png`,
    });
    expect((await fight(page)).stamina).toBeCloseTo(88);
    await advance(page, 40);
    const after = await page.evaluate(() => window.__solargon.state().position);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(
      0.4,
    );
    expect(Math.abs(after.y - before.y)).toBeLessThan(0.05);
    await advance(page, 60);
    const idle = await page.evaluate(() => window.__solargon.state().position);
    expect(idle.x).toBeCloseTo(after.x, 3);
    expect(idle.z).toBeCloseTo(after.z, 3);
  }
});

test("swipe contact shows one impact and displaces a surviving enemy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 16.3, y: 0.75, z: -11 }),
  );
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("KeyJ");
  await advance(page, 8);
  expect((await fight(page)).enemyHp).toBe(1);
  await page.screenshot({ path: "art/playtest/combat-feel-impact.png" });
  const x = await page.evaluate(
    () =>
      (
        window.__solargon.state() as unknown as {
          combat: { enemyPosition: { x: number } };
        }
      ).combat.enemyPosition.x,
  );
  await advance(page, 10);
  expect(
    await page.evaluate(
      () =>
        (
          window.__solargon.state() as unknown as {
            combat: { enemyPosition: { x: number } };
          }
        ).combat.enemyPosition.x,
    ),
  ).toBeGreaterThan(x + 0.1);
});

test("1080p frame pacing while chaining fireballs and exhausting a ray", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await boot(page);
  await page.evaluate(() => window.__solargon.manual(false));
  const started = await page.evaluate(() => window.__solargon.state().elapsed);
  for (let shot = 0; shot < 3; shot++) {
    await page.keyboard.press("KeyL");
    await page.waitForFunction(
      (target) => window.__solargon.state().elapsed >= target,
      started + (shot + 1) * 0.3,
    );
  }
  expect((await fight(page)).fireballShots).toBe(3);
  await page.keyboard.down("KeyK");
  await page.waitForFunction(
    (target) => window.__solargon.state().elapsed >= target,
    started + 4,
  );
  expect((await fight(page)).beamActive).toBe(false);
  await page.keyboard.up("KeyK");
  await page.waitForFunction(
    (target) => window.__solargon.state().elapsed >= target,
    started + 5.5,
  );
  const result = await page.evaluate(() => window.__solargon.state());
  expect(result.fps).toBeGreaterThanOrEqual(55);
  expect(result.frameP95).toBeLessThan(1000 / 55);
  expect(errors).toEqual([]);
  writeFileSync(
    "art/playtest/performance/combat-feel.json",
    JSON.stringify(
      {
        fps: result.fps,
        p95: result.frameP95,
        samples: result.samples,
        browser:
          "Edge headless 1920x1080, three fireballs then held ray until stamina exhaustion; starting area, 12 enemies enabled",
        errors,
      },
      null,
      2,
    ),
  );
});
