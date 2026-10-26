import { test, expect, type Page } from "@playwright/test";
interface FixturePad {
  connected: boolean;
  axes: number[];
  pressed: number[];
  mapping: string;
}
declare global {
  interface Window {
    __padFixture: FixturePad;
  }
}
async function setup(page: Page) {
  await page.addInitScript(() => {
    window.__padFixture = {
      connected: true,
      axes: [0, 0],
      pressed: [],
      mapping: "standard",
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => {
        const p = window.__padFixture;
        return p.connected
          ? [
              {
                index: 0,
                id: "DualSense Wireless Controller (test fixture)",
                connected: true,
                mapping: p.mapping,
                axes: p.axes,
                buttons: Array.from({ length: 17 }, (_, i) => ({
                  pressed: p.pressed.includes(i),
                  value: p.pressed.includes(i) ? 1 : 0,
                })),
              },
            ]
          : [];
      },
    });
  });
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
}
async function sample(
  page: Page,
  pressed: number[] = [],
  axes = [0, 0],
  frames = 1,
) {
  await page.evaluate(
    ({ pressed, axes, frames }) => {
      window.__padFixture.pressed = pressed;
      window.__padFixture.axes = axes;
      window.__solargon.advance(frames);
    },
    { pressed, axes, frames },
  );
}
test("DualSense start, analog/D-pad movement, jump, pause menus, restart and disconnect", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await setup(page);
  await sample(page, [0]);
  expect(await page.evaluate(() => window.__solargon.state().screen)).toBe(
    "playing",
  );
  await sample(page, [], [0, 0], 20);
  const origin = await page.evaluate(() => window.__solargon.state().position);
  await sample(page, [], [0.1, 0.1], 20);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.x,
  ).toBeCloseTo(origin.x, 3);
  await sample(page, [], [0.6, 0], 20);
  const moving = await page.evaluate(() => window.__solargon.state());
  expect(moving.position.x).toBeGreaterThan(origin.x + 0.2);
  await expect(page.locator("#controls")).toContainText("LEFT STICK");
  await sample(page, [0], [0, 0], 12);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.y,
  ).toBeGreaterThan(1.7);
  await sample(page, [], [0, 0], 60);
  expect((await page.evaluate(() => window.__solargon.state())).grounded).toBe(
    true,
  );
  await sample(page, [9]);
  expect((await page.evaluate(() => window.__solargon.state())).screen).toBe(
    "paused",
  );
  await expect(page.getByRole("button", { name: "RESUME" })).toBeFocused();
  await sample(page, [], [0, 0]);
  await sample(page, [13]);
  await expect(
    page.getByRole("button", { name: "Restart course" }),
  ).toBeFocused();
  await sample(page, []);
  await sample(page, [0]);
  await sample(page, [], [0, 0], 20);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.x,
  ).toBeCloseTo(-2.5);
  await sample(page, [15], [0, 0], 20);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.x,
  ).toBeGreaterThan(-2);
  await sample(page, []);
  await sample(page, [3]);
  await sample(page, [], [0, 0], 20);
  expect(
    (await page.evaluate(() => window.__solargon.state())).position.x,
  ).toBeCloseTo(-2.5);
  await sample(page, [9]);
  await sample(page, []);
  await sample(page, [1]);
  expect((await page.evaluate(() => window.__solargon.state())).screen).toBe(
    "playing",
  );
  await sample(page, []);
  await page.evaluate(() => {
    window.__padFixture.connected = false;
    window.__solargon.advance(1);
  });
  expect((await page.evaluate(() => window.__solargon.state())).screen).toBe(
    "paused",
  );
  await expect(page.locator("#menu-footer")).toContainText(
    "Controller disconnected",
  );
  await page.evaluate(() => {
    window.__padFixture.connected = true;
    window.__padFixture.pressed = [0];
    window.__solargon.advance(1);
  });
  expect((await page.evaluate(() => window.__solargon.state())).screen).toBe(
    "paused",
  );
  await sample(page, []);
  await sample(page, [0]);
  expect((await page.evaluate(() => window.__solargon.state())).screen).toBe(
    "playing",
  );
  await page.setViewportSize({ width: 539, height: 398 });
  await expect(page.locator("#controls")).toContainText("LEFT STICK");
  expect(
    await page.locator("#controls").evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(539);
  await page.screenshot({ path: "test-results/dualsense-compact.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await sample(page, []);
  await page.keyboard.down("KeyD");
  await sample(page, [], [0, 0], 10);
  await page.keyboard.up("KeyD");
  await expect(page.locator("#controls")).toContainText("W A S D");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/dualsense-controls.png" });
});

test("stick noise and release stay still; right needs no counter-steering", async ({
  page,
}) => {
  await setup(page);
  await sample(page, [0]);
  await sample(page, [], [0, 0], 20);
  const origin = await page.evaluate(() => window.__solargon.state().position);
  for (const axes of [
    [0.2, 0.2],
    [-0.2, 0.2],
    [0.17, -0.2],
    [0, 0],
  ])
    await sample(page, [], axes, 180);
  const still = await page.evaluate(() => window.__solargon.state().position);
  expect(still.x).toBeCloseTo(origin.x, 3);
  expect(still.z).toBeCloseTo(origin.z, 3);
  await sample(page, [], [1, 0.13], 40);
  const moved = await page.evaluate(() => window.__solargon.state().position);
  expect(moved.x).toBeGreaterThan(origin.x + 2);
  expect(moved.z).toBeCloseTo(origin.z, 3);
  await sample(page, [], [0, 0], 1);
  const stopped = await page.evaluate(() => window.__solargon.state().position);
  await sample(page, [], [0.2, -0.2], 600);
  const rested = await page.evaluate(() => window.__solargon.state().position);
  expect(rested.x).toBeCloseTo(stopped.x, 3);
  expect(rested.z).toBeCloseTo(stopped.z, 3);
});

test("DualSense Square and R1 dash with a short repeatable cooldown", async ({
  page,
}) => {
  await setup(page);
  await sample(page, [0]);
  await sample(page, [], [0, 0], 20);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: -70, y: 0.8, z: 40 }),
  );
  await sample(page, [], [0, 0], 20);
  await sample(page, [2], [1, 0], 8);
  expect((await page.evaluate(() => window.__solargon.state())).dashes).toBe(1);
  await sample(page, [], [1, 0], 24);
  await sample(page, [5], [1, 0], 8);
  expect((await page.evaluate(() => window.__solargon.state())).dashes).toBe(2);
  await expect(page.locator("#controls")).toContainText("DASH");
  await sample(page, [], [0, 0], 90);
  expect((await page.evaluate(() => window.__solargon.state())).dashing).toBe(
    false,
  );
});
