import { test, expect, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import {
  PLATFORMS,
  MAIN_ROUTE_WAYPOINTS,
  SHORTCUT_ROUTE,
  COURSE_GATES,
  FINISH,
  platformPosition,
} from "../../src/course";

interface State {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  grounded: boolean;
  screen: string;
  time: number;
  elapsed: number;
  falls: number;
  fps: number;
  frameP95: number;
  samples: number;
  direction: string;
  animation: string;
  jumps: number;
  dashes: number;
  dashing: boolean;
  landings: number;
  gatesPassed: number;
}
interface Debug {
  state: () => State;
  gpu: () => string;
  manual: (on: boolean) => void;
  advance: (frames: number) => void;
  teleport: (position: { x: number; y: number; z: number }) => void;
}
declare global {
  interface Window {
    __solargon: Debug;
  }
}
async function state(page: Page) {
  return page.evaluate(() => window.__solargon.state());
}
async function advance(page: Page, frames = 1) {
  await page.evaluate((n) => window.__solargon.advance(n), frames);
}
async function boot(page: Page) {
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START" }).click();
  await advance(page, 20);
}
// Drive using actual keyboard events and fixed simulation ticks, never teleporting the route.
class Driver {
  private held = new Set<string>();
  constructor(
    private page: Page,
    private arrows = false,
  ) {}
  async keys(x: number, z: number, jump = false) {
    const next = new Set<string>();
    if (x > 0.15) next.add(this.arrows ? "ArrowRight" : "KeyD");
    if (x < -0.15) next.add(this.arrows ? "ArrowLeft" : "KeyA");
    if (z > 0.15) next.add(this.arrows ? "ArrowDown" : "KeyS");
    if (z < -0.15) next.add(this.arrows ? "ArrowUp" : "KeyW");
    if (jump) next.add("Space");
    for (const key of this.held)
      if (!next.has(key)) await this.page.keyboard.up(key);
    for (const key of next)
      if (!this.held.has(key)) await this.page.keyboard.down(key);
    this.held = next;
  }
  async stop(frames = 12) {
    await this.keys(0, 0);
    await advance(this.page, frames);
  }
  async go(x: number, z: number, jump = false, maxFrames = 400) {
    let didJump = false;
    for (let frame = 0; frame < maxFrames; frame += 3) {
      const s = await state(this.page);
      const dx = x - s.position.x,
        dz = z - s.position.z;
      if (Math.hypot(dx, dz) < 0.35 && (!jump || (s.grounded && didJump))) {
        await this.stop();
        return;
      }
      // Convert world direction to the fixed camera's screen-relative axes.
      const sx = dx,
        sz = dz;
      const length = Math.hypot(sx, sz);
      await this.keys(
        sx / length,
        sz / length,
        jump && (!didJump || !s.grounded),
      );
      await advance(this.page, 3);
      if (jump && !s.grounded) didJump = true;
      const next = await state(this.page);
      if (next.falls > 0)
        throw new Error(`Fell approaching ${x},${z}: ${JSON.stringify(next)}`);
      if (next.screen === "finished") return;
    }
    throw new Error(
      `Could not reach ${x},${z}: ${JSON.stringify(await state(this.page))}`,
    );
  }
}
test("title, jumps, pause, focus loss, fall recovery and restart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await boot(page);
  const original = await state(page);
  await page.keyboard.down("Space");
  await advance(page, 15);
  expect((await state(page)).position.y).toBeGreaterThan(
    original.position.y + 1,
  );
  await page.keyboard.up("Space");
  await advance(page, 60);
  expect((await state(page)).grounded).toBe(true);
  await page.keyboard.press("Escape");
  expect((await state(page)).screen).toBe("paused");
  await advance(page, 60);
  expect((await state(page)).time).toBeCloseTo(95 / 60, 3);
  await page.keyboard.press("Escape");
  await page.keyboard.down("KeyD");
  await advance(page, 15);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  expect((await state(page)).screen).toBe("paused");
  await page.keyboard.up("KeyD");
  await page.getByRole("button", { name: "RESUME" }).click();
  await advance(page, 25);
  expect(Math.abs((await state(page)).velocity.x)).toBeLessThan(0.01);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: -30, y: -13, z: 20 }),
  );
  await advance(page, 1);
  expect((await state(page)).falls).toBe(1);
  expect((await state(page)).position.x).toBeCloseTo(-2.5);
  await page.keyboard.press("KeyR");
  await advance(page, 20);
  expect((await state(page)).falls).toBe(0);
  expect((await state(page)).screen).toBe("playing");
  await page.screenshot({ path: "test-results/courtyard.png" });
  expect(errors).toEqual([]);
});
let safeRouteSeconds = 0;
for (const arrows of [false, true])
  test(`complete the designed ground route using ${arrows ? "arrow keys" : "WASD"}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await boot(page);
    const driver = new Driver(page, arrows);
    for (const point of MAIN_ROUTE_WAYPOINTS) await driver.go(point.x, point.z);
    const final = await state(page);
    expect(final.screen).toBe("finished");
    expect(final.falls).toBe(0);
    expect(final.jumps).toBe(0);
    expect(final.gatesPassed).toBe(COURSE_GATES.length);
    safeRouteSeconds = final.elapsed;
    console.log(
      `Ground route ${arrows ? "arrows" : "WASD"}: ${final.elapsed.toFixed(2)} seconds`,
    );
    await page.screenshot({
      path: `test-results/finish-${arrows ? "arrows" : "wasd"}.png`,
    });
    await page.getByRole("button", { name: "PLAY AGAIN" }).click();
    await advance(page, 20);
    expect((await state(page)).position.x).toBeCloseTo(-2.5);
    expect(errors).toEqual([]);
  });
test("jump and shuttle shortcuts beat the safe ground route", async ({
  page,
}) => {
  await boot(page);
  const driver = new Driver(page);
  if (safeRouteSeconds === 0) {
    for (const point of MAIN_ROUTE_WAYPOINTS) await driver.go(point.x, point.z);
    safeRouteSeconds = (await state(page)).elapsed;
    await driver.stop(0);
    await page.getByRole("button", { name: "PLAY AGAIN" }).click();
    await advance(page, 20);
  }
  await driver.go(20, 0);
  for (const gap of SHORTCUT_ROUTE.galleryJumps) {
    await driver.go(gap.takeoff.x, gap.takeoff.z);
    await page.keyboard.press("ShiftLeft");
    await driver.go(gap.landing.x, gap.landing.z, true);
  }
  await page.screenshot({ path: "test-results/gallery.png" });
  for (const point of [
    { x: 56, z: 0 },
    { x: 62, z: -6 },
    { x: 66, z: -20 },
    { x: 70, z: -20 },
    { x: 78, z: -24 },
    SHORTCUT_ROUTE.shuttle.takeoff,
  ])
    await driver.go(point.x, point.z);
  const ferry = PLATFORMS.find((p) => p.id === "ferry")!;
  for (let frame = 0; frame < 700; frame++) {
    const s = await state(page),
      phase = s.time % ferry.moving!.period;
    if (
      platformPosition(ferry, s.time).x < 97 &&
      phase > ferry.moving!.period - 0.65
    )
      break;
    await advance(page, 1);
  }
  await driver.keys(1, 0, true);
  let airborne = false,
    boarded = false;
  for (let frame = 0; frame < 100; frame += 2) {
    await advance(page, 2);
    const s = await state(page);
    if (!s.grounded) airborne = true;
    if (airborne && s.grounded && s.position.x > 93.5 && s.position.y > 3) {
      boarded = true;
      break;
    }
  }
  expect(boarded, "land on the actual elevated shuttle").toBe(true);
  await driver.stop(3);
  await page.screenshot({ path: "test-results/ferry-wasd.png" });
  for (let frame = 0; frame < 500; frame++) {
    const s = await state(page);
    if (platformPosition(ferry, s.time).x > 111) break;
    await advance(page, 1);
  }
  await driver.go(
    SHORTCUT_ROUTE.shuttle.landing.x,
    SHORTCUT_ROUTE.shuttle.landing.z,
    true,
  );
  await driver.go(120, -24);
  for (const point of [
    { x: 140, z: -24 },
    { x: 140, z: -42 },
  ])
    await driver.go(point.x, point.z);
  for (const gap of SHORTCUT_ROUTE.hurdleJumps) {
    await driver.go(gap.takeoff.x, gap.takeoff.z);
    await page.keyboard.press("ShiftLeft");
    await driver.go(gap.landing.x, gap.landing.z, true);
  }
  await driver.go(FINISH.x, FINISH.z);
  const final = await state(page);
  expect(final.screen).toBe("finished");
  expect(final.falls).toBe(0);
  expect(final.jumps).toBeGreaterThanOrEqual(7);
  expect(final.elapsed).toBeLessThan(safeRouteSeconds - 1);
  writeFileSync(
    "test-results/routes.json",
    JSON.stringify(
      {
        safeRouteSeconds,
        shortcutSeconds: final.elapsed,
        savedSeconds: safeRouteSeconds - final.elapsed,
        dashes: final.dashes,
      },
      null,
      2,
    ),
  );
  console.log(
    `Shortcut ${final.elapsed.toFixed(2)}s versus safe ${safeRouteSeconds.toFixed(2)}s`,
  );
});
test("missing the shuttle lands on grass and can recover to finish", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await boot(page);
  const driver = new Driver(page);
  for (const point of MAIN_ROUTE_WAYPOINTS.slice(0, 10))
    await driver.go(point.x, point.z);
  const ferry = PLATFORMS.find((p) => p.id === "ferry")!;
  // Leave the dock while the shuttle is departing and deliberately miss it.
  for (let frame = 0; frame < 400; frame++) {
    const s = await state(page);
    if (
      platformPosition(ferry, s.time).x > 110 &&
      s.time % ferry.moving!.period < 3.2
    )
      break;
    await advance(page, 1);
  }
  await driver.go(99, -24);
  await driver.stop(60);
  const landed = await state(page);
  expect(landed.grounded).toBe(true);
  expect(landed.position.y).toBeLessThan(1);
  expect(landed.falls).toBe(0);
  await page.screenshot({ path: "test-results/missed-shuttle.png" });
  // Rejoin the low garden path, then use its ramp back up to the arrival dock.
  await driver.go(104, -7);
  await page.screenshot({ path: "test-results/shuttle-recovery.png" });
  for (const point of MAIN_ROUTE_WAYPOINTS.slice(12))
    await driver.go(point.x, point.z);
  expect((await state(page)).screen).toBe("finished");
  expect((await state(page)).falls).toBe(0);
  expect(errors).toEqual([]);
});

test("finish requires the route markers, not a grass bypass", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(
    (p) => window.__solargon.teleport({ x: p.x, y: p.y + 0.77, z: p.z }),
    FINISH,
  );
  await advance(page, 20);
  expect((await state(page)).screen).toBe("playing");
  expect((await state(page)).gatesPassed).toBe(0);
});

test("live rendering performance and a compact viewport", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await boot(page);
  await page.evaluate(() => window.__solargon.manual(false));
  await page.keyboard.down("Space");
  await page.waitForFunction(() => window.__solargon.state().elapsed > 1);
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.__solargon.state().elapsed > 5);
  const performance = {
    ...(await state(page)),
    gpu: await page.evaluate(() => window.__solargon.gpu()),
    browser:
      "Microsoft Edge headless, 1280 × 720 viewport, 640 × 360 WebGL canvas",
  };
  console.log("PERFORMANCE", JSON.stringify(performance));
  writeFileSync(
    "test-results/performance.json",
    JSON.stringify(performance, null, 2),
  );
  expect(performance.fps).toBeGreaterThanOrEqual(55);
  expect(performance.falls).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/courtyard.png" });
  await page.setViewportSize({ width: 539, height: 398 });
  await page.keyboard.press("Escape");
  const button = page.getByRole("button", { name: "RESUME" });
  await expect(button).toBeInViewport();
  await page.screenshot({ path: "test-results/compact-pause.png" });
});

test("keyboard dash can be spammed and jump-dash stays collision safe", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() =>
    window.__solargon.teleport({ x: -70, y: 0.8, z: 40 }),
  );
  await advance(page, 20);
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await advance(page, 8);
  await page.keyboard.up("ShiftLeft");
  expect((await state(page)).dashes).toBe(1);
  expect((await state(page)).dashing).toBe(true);
  await advance(page, 25);
  await page.keyboard.down("Space");
  await page.keyboard.down("ShiftLeft");
  await advance(page, 8);
  await page.keyboard.up("ShiftLeft");
  await page.keyboard.up("Space");
  expect((await state(page)).dashes).toBe(2);
  expect((await state(page)).position.y).toBeGreaterThan(1);
  await page.keyboard.up("KeyD");
  await advance(page, 90);
  expect((await state(page)).grounded).toBe(true);
  expect((await state(page)).dashing).toBe(false);
  await expect(page.locator("#controls")).toContainText("SHIFT");
});
