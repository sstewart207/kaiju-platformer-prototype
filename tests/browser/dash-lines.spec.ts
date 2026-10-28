import { test, expect } from "@playwright/test";

test("dash speed lines follow all four directions, freeze on pause and clear afterward", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  for (const [key, direction] of [
    ["KeyD", "right"],
    ["KeyA", "left"],
    ["KeyW", "back"],
    ["KeyS", "front"],
  ]) {
    await page.evaluate(() => {
      window.__solargon.teleport({ x: -70, y: 0.8, z: 40 });
      window.__solargon.advance(20);
    });
    expect(
      (await page.evaluate(() => window.__solargon.state())).dashLines,
    ).toBe(0);
    await page.keyboard.down(key);
    await page.keyboard.press("ShiftLeft");
    await page.evaluate(() => window.__solargon.advance(6));
    const active = await page.evaluate(() => window.__solargon.state());
    expect(active.direction).toBe(direction);
    expect(active.dashLines).toBe(6);
    await page.screenshot({ path: `art/playtest/dash-lines-${direction}.png` });
    await page.keyboard.up(key);
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.__solargon.advance(20));
    const paused = await page.evaluate(() => window.__solargon.state());
    expect(paused.time).toBe(active.time);
    expect(paused.dashLines).toBe(6);
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.__solargon.advance(30));
    expect(
      (await page.evaluate(() => window.__solargon.state())).dashLines,
    ).toBe(0);
  }
  await page.keyboard.press("KeyR");
  await page.evaluate(() => window.__solargon.advance(1));
  expect((await page.evaluate(() => window.__solargon.state())).dashLines).toBe(
    0,
  );
  expect(errors).toEqual([]);
});
