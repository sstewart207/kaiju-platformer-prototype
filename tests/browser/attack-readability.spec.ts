import { test, expect, type Page } from "@playwright/test";
interface Effects {
  swipeVisible: boolean;
  swipeActive: boolean;
  swipeOpacity: number;
  swipeLength: number;
  rayVisible: boolean;
  muzzleVisible: boolean;
  fireballsVisible: number;
}
async function creamPixels(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
) {
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] > 235 && pixels[i + 1] > 220 && pixels[i + 2] > 180)
        count++;
    return count;
  }, png);
}
async function advance(page: Page, n: number) {
  await page.evaluate((n) => window.__solargon.advance(n), n);
}
async function effects(page: Page) {
  return page.evaluate(
    () =>
      (window.__solargon.state() as unknown as { combat: { effects: Effects } })
        .combat.effects,
  );
}
async function boot(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  await advance(page, 20);
}

test("claw slash has a readable active phase, dim follow-through and exact pause in every direction", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
    await page.keyboard.press("KeyJ");
    await advance(page, 5);
    expect((await effects(page)).swipeVisible).toBe(false);
    await advance(page, 9);
    const active = await effects(page);
    expect(active.swipeActive).toBe(true);
    expect(active.swipeOpacity).toBe(1);
    expect(active.swipeLength).toBeGreaterThan(2.7);
    await page.screenshot({
      path: `art/playtest/attack-readability-swipe-${direction}.png`,
    });
    await page.keyboard.press("Escape");
    await advance(page, 60);
    expect(await effects(page)).toEqual(active);
    await page.getByRole("button", { name: "RESUME", exact: true }).click();
    await advance(page, 9);
    const follow = await effects(page);
    expect(follow.swipeVisible).toBe(true);
    expect(follow.swipeActive).toBe(false);
    expect(follow.swipeOpacity).toBeLessThan(0.42);
    await advance(page, 12);
    expect((await effects(page)).swipeVisible).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("fireball and ray stay distinct and clear on restart", async ({
  page,
}) => {
  await boot(page);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("KeyL");
  await advance(page, 16);
  expect((await effects(page)).fireballsVisible).toBe(1);
  expect((await effects(page)).rayVisible).toBe(false);
  await page.screenshot({
    path: "art/playtest/attack-readability-fireball.png",
  });
  // This region contains the projectile body, clear of Solargon and the HUD.
  expect(
    await creamPixels(page, { x: 1096, y: 518, width: 44, height: 44 }),
  ).toBeGreaterThan(20);
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyK");
  await advance(page, 25);
  expect((await effects(page)).rayVisible).toBe(true);
  expect((await effects(page)).fireballsVisible).toBe(0);
  await page.screenshot({ path: "art/playtest/attack-readability-ray.png" });
  expect(
    await creamPixels(page, { x: 1150, y: 518, width: 200, height: 40 }),
  ).toBeGreaterThan(300);
  await page.keyboard.up("KeyK");
  await advance(page, 15);
  expect((await effects(page)).rayVisible).toBe(false);
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  const reset = await effects(page);
  expect(
    reset.swipeVisible || reset.rayVisible || reset.fireballsVisible > 0,
  ).toBe(false);
});

test("slash clips against a ruin wall and muzzle glow cannot cross nearby cover", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => window.__solargon.teleport({ x: 37, y: 1, z: -5 }));
  await advance(page, 20);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.press("KeyJ");
  await advance(page, 14);
  expect((await effects(page)).swipeActive).toBe(true);
  expect((await effects(page)).swipeLength).toBeLessThan(1.4);
  await page.screenshot({ path: "art/playtest/attack-readability-wall.png" });
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 37.97, y: 1, z: -5 }),
  );
  await advance(page, 20);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyK");
  await advance(page, 5);
  expect((await effects(page)).muzzleVisible).toBe(false);
  await advance(page, 20);
  expect(
    (await effects(page)).rayVisible || (await effects(page)).muzzleVisible,
  ).toBe(false);
  await page.keyboard.up("KeyK");
});
