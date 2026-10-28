import { test, expect, type Page } from "@playwright/test";
declare global {
  interface Window {
    motionStep: (dt: number) => void;
    motionReady: boolean;
  }
}
async function pixels(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector("canvas")!;
    const crop = (x: number, y: number, w: number, h: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(source, x, y, w, h, 0, 0, w, h);
      return canvas.toDataURL();
    };
    return {
      feet: crop(0, 355, 840, 60),
      body: crop(0, 0, 840, 355),
      solar: crop(0, 0, 420, 355),
      zombie: crop(420, 0, 420, 355),
    };
  });
}
test("idle breathing and walking hair animate above stationary feet; pause is exact", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 840, height: 420 });
  await page.goto("/tests/fixtures/secondary-motion.html");
  await page.waitForFunction(() => window.motionReady);
  const rest = await pixels(page);
  await page.screenshot({ path: "art/playtest/secondary-motion-rest.png" });
  await page.evaluate(() => window.motionStep(0.7));
  const inhale = await pixels(page);
  expect(inhale.feet === rest.feet).toBe(true);
  expect(inhale.solar === rest.solar).toBe(false);
  expect(inhale.zombie === rest.zombie).toBe(false);
  await page.screenshot({ path: "art/playtest/secondary-motion-inhale.png" });
  await page.evaluate(() => window.motionStep(0));
  expect((await pixels(page)).body === inhale.body).toBe(true);
  await page.evaluate(() => window.motionStep(1.2));
  const settle = await pixels(page);
  expect(settle.feet === rest.feet).toBe(true);
  expect(settle.body === inhale.body).toBe(false);
  await page.screenshot({ path: "art/playtest/secondary-motion-settle.png" });
  expect(errors).toEqual([]);
});
