import { test, expect, type Page } from "@playwright/test";
interface FxState {
  effects: {
    library: string;
    fireballFrames: number[];
    contactFrames: number[];
    swipeVisible: boolean;
    rayVisible: boolean;
    fireballsVisible: number;
  };
  enemyEffects: {
    charging: boolean;
    slash: boolean;
    clawFrame: number;
    fireballFrames: number[];
    contactFrames: number[];
  };
  actionTime: number;
  enemyHp: number;
}
async function state(page: Page) {
  return page.evaluate(
    () => (window.__solargon.state() as unknown as { combat: FxState }).combat,
  );
}
async function advance(page: Page, ticks: number) {
  await page.evaluate((n) => window.__solargon.advance(n), ticks);
}
async function boot(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [],
      configurable: true,
    }),
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  await advance(page, 20);
}
test("PixelFX projectiles animate in all four directions, freeze on pause and clear on restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/assets/fx/") && !r.ok())
      errors.push(String(r.status()));
  });
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
    await page.keyboard.press("KeyL");
    await advance(page, 12);
    const first = (await state(page)).effects;
    expect(first.library).toBe("pixelfx");
    expect(first.fireballFrames).toHaveLength(1);
    await advance(page, 4);
    expect((await state(page)).effects.fireballFrames[0]).toBeGreaterThan(
      first.fireballFrames[0],
    );
    await page.screenshot({
      path: `art/playtest/pixelfx-fireball-${direction}.png`,
    });
    await page.keyboard.press("Escape");
    const paused = (await state(page)).effects;
    await advance(page, 90);
    expect((await state(page)).effects).toEqual(paused);
    await page.getByRole("button", { name: "RESUME", exact: true }).click();
  }
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  const reset = (await state(page)).effects;
  expect(reset.fireballsVisible).toBe(0);
  expect(reset.contactFrames).toEqual([]);
  expect(errors).toEqual([]);
});
test("contact sparks start on a real hit and disperse while the enemy recoils", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 16.3, y: 0.75, z: -11 }),
  );
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("KeyJ");
  await advance(page, 8);
  expect((await state(page)).enemyHp).toBe(1);
  expect((await state(page)).effects.contactFrames).toHaveLength(1);
  await page.screenshot({ path: "art/playtest/pixelfx-contact.png" });
  await advance(page, 6);
  expect((await state(page)).effects.contactFrames[0]).toBeGreaterThan(1);
  await advance(page, 30);
  expect((await state(page)).effects.contactFrames).toEqual([]);
});
test("enemy windup, strike and recovery have distinct effects and projectile contacts reset", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 16.8, y: 0.75, z: -11 }),
  );
  await advance(page, 18);
  expect((await state(page)).enemyEffects.slash).toBe(false);
  await advance(page, 12);
  expect((await state(page)).enemyEffects.slash).toBe(true);
  await page.screenshot({ path: "art/playtest/pixelfx-enemy-swipe.png" });
  await advance(page, 30);
  expect((await state(page)).enemyEffects.slash).toBe(false);
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 18, y: 0.75, z: -5 }),
  );
  await advance(page, 30);
  expect((await state(page)).enemyEffects.charging).toBe(true);
  await page.screenshot({ path: "art/playtest/pixelfx-enemy-charge.png" });
  await advance(page, 14);
  expect((await state(page)).enemyEffects.fireballFrames).toHaveLength(1);
  await page.screenshot({ path: "art/playtest/pixelfx-enemy-fireball.png" });
  await advance(page, 60);
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  expect((await state(page)).enemyEffects.contactFrames).toEqual([]);
});
