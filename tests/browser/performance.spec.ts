import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { MAIN_ROUTE_WAYPOINTS, SECTIONS } from "../../src/course";

type Frame = { ms: number; section: number; calls: number };
declare global {
  interface Window { __courseFrames: Frame[] }
}
function summarize(frames: Frame[]) {
  const sorted = frames.map(f => f.ms).sort((a, b) => a - b);
  const percentile = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  return {
    frames: frames.length,
    fps: frames.length * 1000 / frames.reduce((sum, f) => sum + f.ms, 0),
    p95: percentile(0.95), p99: percentile(0.99), max: sorted.at(-1),
    over16ms: frames.filter(f => f.ms > 16.7).length,
    over33ms: frames.filter(f => f.ms > 33.4).length,
    averageDrawCalls: frames.reduce((sum, f) => sum + f.calls, 0) / frames.length,
  };
}

test("real-time full-course frame pacing", async ({ page }) => {
  test.skip(!process.env.COURSE_BENCHMARK, "Opt-in hardware benchmark");
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => {
    window.__courseFrames = [];
    let last = 0;
    function sample(now: number) {
      const s = window.__solargon.state();
      if (s.screen === "playing") {
        if (last) window.__courseFrames.push({ms: now - last, section: (s as typeof s & {section: number}).section, calls: (s as typeof s & {drawCalls: number}).drawCalls});
        last = now;
      } else last = 0;
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.getByRole("button", {name: "START", exact: true}).click();
  const held = new Set<string>();
  for (const point of MAIN_ROUTE_WAYPOINTS) {
    const deadline = Date.now() + 15000;
    while (true) {
      const s = await page.evaluate(() => window.__solargon.state());
      if (s.screen === "finished") break;
      const dx = point.x - s.position.x, dz = point.z - s.position.z;
      if (Math.hypot(dx, dz) < 0.6) break;
      expect(Date.now(), `reach ${point.x},${point.z}: ${JSON.stringify(s.position)}`).toBeLessThan(deadline);
      const next = new Set<string>();
      if (dx > 0.25) next.add("KeyD");
      if (dx < -0.25) next.add("KeyA");
      if (dz > 0.25) next.add("KeyS");
      if (dz < -0.25) next.add("KeyW");
      for (const key of held) if (!next.has(key)) await page.keyboard.up(key);
      for (const key of next) if (!held.has(key)) await page.keyboard.down(key);
      held.clear(); next.forEach(key => held.add(key));
      await page.waitForTimeout(40);
    }
    for (const key of held) await page.keyboard.up(key);
    held.clear();
  }
  const final = await page.evaluate(() => window.__solargon.state());
  expect(final.screen).toBe("finished");
  expect(final.falls).toBe(0);
  const frames = await page.evaluate(() => window.__courseFrames);
  const report = {
    label: process.env.COURSE_BENCHMARK,
    environment: "Edge headless, 1280x720 viewport, 640x360 world; real-time keyboard walking route",
    gpu: await page.evaluate(() => window.__solargon.gpu()),
    elapsed: final.elapsed,
    fullCourse: summarize(frames),
    sections: SECTIONS.map((s, i) => ({ name: s.name, ...summarize(frames.filter(f => f.section === i)) })),
    errors,
  };
  mkdirSync("art/playtest/performance", {recursive: true});
  writeFileSync(`art/playtest/performance/${process.env.COURSE_BENCHMARK}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  expect(report.fullCourse.p95).toBeLessThan(1000 / 55);
  expect(errors).toEqual([]);
});

test("capture front-wall occlusion for visual review", async ({ page }) => {
  await page.goto("/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", {name: "START", exact: true}).click();
  await page.evaluate(() => {
    window.__solargon.teleport({x: 45, y: 0.93, z: 8.5});
    window.__solargon.advance(20);
  });
  await page.screenshot({path: `art/playtest/performance/occlusion-${process.env.COURSE_BENCHMARK ?? "current"}.png`});
});
