import { test, expect, type Page } from "@playwright/test";

async function advance(page: Page, n: number) {
  await page.evaluate((n) => window.__solargon.advance(n), n);
}
async function state(page: Page) {
  return page.evaluate(
    () =>
      window.__solargon.state() as unknown as {
        position: { x: number; z: number };
        combat: {
          solarPhase: string;
          solarFires: number;
          beamLength: number;
          beamActive: boolean;
          animationFrame: number;
          attackDirection: { x: number; z: number };
          effects: {
            rayLength: number;
            rayVisible: boolean;
            muzzleVisible: boolean;
          };
        };
      },
  );
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
test("quick tap fires on release and lets the player move without waiting for charge", async ({ page }) => {
  await boot(page);
  await page.keyboard.down("KeyK");
  await advance(page, 4);
  expect((await state(page)).combat.solarPhase).toBe("charge");
  await page.keyboard.up("KeyK");
  await advance(page, 1);
  const fired = await state(page);
  expect(fired.combat.solarPhase).toBe("fire");
  expect(fired.combat.solarFires).toBe(1);
  await page.keyboard.down("KeyD");
  await advance(page, 10);
  await page.keyboard.up("KeyD");
  expect((await state(page)).position.x - fired.position.x).toBeGreaterThan(0.5);
});

test("braced breath charges, propagates, commits aim, freezes on pause and collapses without damage", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await page.keyboard.down("KeyD");
  await advance(page, 1);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyK");
  await advance(page, 13);
  const charging = await state(page);
  expect(charging.combat.solarPhase).toBe("charge");
  expect(charging.combat.beamLength).toBe(0);
  expect(charging.combat.effects.rayVisible).toBe(false);
  expect(charging.combat.effects.muzzleVisible).toBe(true);
  expect(charging.combat.animationFrame).toBe(1);
  await page.screenshot({ path: "art/playtest/solar-breath-charge.png" });
  await advance(page, 10);
  const front = await state(page);
  expect(front.combat.solarPhase).toBe("fire");
  expect(front.combat.beamLength).toBeGreaterThan(0);
  expect(front.combat.beamLength).toBeLessThan(2);
  expect(front.combat.animationFrame).toBe(2);
  await page.screenshot({ path: "art/playtest/solar-breath-front.png" });
  await advance(page, 10);
  const firing = await state(page);
  expect(firing.combat.beamLength).toBeGreaterThan(9);
  expect(firing.combat.animationFrame).toBe(5);
  await page.screenshot({ path: "art/playtest/solar-breath-fire-right.png" });
  await page.keyboard.down("KeyA");
  await advance(page, 12);
  await page.keyboard.up("KeyA");
  const braced = await state(page);
  expect(braced.position.x).toBeCloseTo(firing.position.x, 3);
  expect(braced.position.z).toBeCloseTo(firing.position.z, 3);
  expect(braced.combat.attackDirection).toEqual({ x: 1, z: 0 });
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await advance(page, 60);
  expect(await state(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await page.keyboard.up("KeyK");
  await advance(page, 1);
  expect((await state(page)).combat.solarPhase).toBe("idle");
  await advance(page, 96);
  await page.keyboard.down("KeyK");
  await advance(page, 34);
  await page.keyboard.up("KeyK");
  await advance(page, 1);
  const released = await state(page);
  expect(released.combat.solarPhase).toBe("recover");
  expect(released.combat.beamActive).toBe(false);
  expect(released.combat.beamLength).toBe(0);
  expect(released.combat.animationFrame).toBe(6);
  await advance(page, 2);
  expect((await state(page)).combat.effects.rayLength).toBeLessThan(
    released.combat.effects.rayLength,
  );
  await page.screenshot({ path: "art/playtest/solar-breath-collapse.png" });
  await advance(page, 14);
  expect((await state(page)).combat.solarPhase).toBe("idle");
  expect((await state(page)).combat.effects.rayVisible).toBe(false);
  expect(errors).toEqual([]);
});
test("taking a hit interrupts breath and pausing windup cannot release a surprise shot", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: 16.8, y: 0.75, z: -11 }),
  );
  // Fire away from the nearby zombie so its incoming melee can interrupt.
  await page.keyboard.down("KeyA");
  await advance(page, 1);
  await page.keyboard.up("KeyA");
  await page.keyboard.down("KeyK");
  await advance(page, 40);
  expect((await state(page)).combat.solarPhase).toBe("idle");
  expect((await state(page)).combat.beamActive).toBe(false);
  await page.keyboard.up("KeyK");
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  await page.keyboard.down("KeyK");
  await advance(page, 10);
  expect((await state(page)).combat.solarPhase).toBe("charge");
  await page.keyboard.press("Escape");
  const paused = await state(page);
  await advance(page, 50);
  expect(await state(page)).toEqual(paused);
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await advance(page, 35);
  expect((await state(page)).combat.solarFires).toBe(0);
  expect((await state(page)).combat.beamActive).toBe(false);
  await page.keyboard.up("KeyK");
});
test("braced breath renders from the mouth in the other directions and dash escapes immediately", async ({
  page,
}) => {
  await boot(page);
  for (const [direction, key] of [
    ["left", "KeyA"],
    ["front", "KeyS"],
    ["back", "KeyW"],
  ]) {
    await page.keyboard.press("KeyR");
    await advance(page, 20);
    await page.keyboard.down(key);
    await advance(page, 1);
    await page.keyboard.up(key);
    await page.keyboard.down("KeyK");
    await advance(page, 34);
    expect((await state(page)).combat.beamActive).toBe(true);
    await page.screenshot({
      path: `art/playtest/solar-breath-fire-${direction}.png`,
    });
    await page.keyboard.press("ShiftLeft");
    await advance(page, 1);
    expect((await state(page)).combat.solarPhase).toBe("idle");
    expect((await state(page)).combat.effects.rayVisible).toBe(false);
    await page.keyboard.up("KeyK");
  }
});
