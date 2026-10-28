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
  test.setTimeout(240000);
  const height = 1080;
  const viewport = {width: 1920, height: 1080};
  await page.setViewportSize(viewport);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  // This walking-only benchmark does not fight; objective/combat has a separate clear test.
  await page.goto("/?test&peaceful");
  await page.waitForFunction(() => !!window.__solargon);
  const resolution = await page.locator("#world").evaluate(el => {
    const canvas = el as HTMLCanvasElement;
    return {width: canvas.width, height: canvas.height};
  });
  expect(resolution).toEqual({width: height * 16 / 9, height});
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
      const length=Math.hypot(dx,dz);
      if (dx/length > 0.15) next.add("KeyD");
      if (dx/length < -0.15) next.add("KeyA");
      if (dz/length > 0.15) next.add("KeyS");
      if (dz/length < -0.15) next.add("KeyW");
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
    environment: `Edge headless, ${viewport.width}x${viewport.height} viewport, ${resolution.width}x${resolution.height} world; real-time keyboard walking route`,
    resolution,
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
  await page.setViewportSize({width: 1920, height: 1080});
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

test("capture extended ruins for visual review", async ({page}) => {
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/?test");
  await page.waitForFunction(()=>!!window.__solargon);
  await page.evaluate(()=>window.__solargon.manual(true));
  await page.getByRole("button",{name:"START",exact:true}).click();
  for(const point of [
    {name:"south-gallery",x:229,z:12},
    {name:"upper-checkpoint",x:324,z:-76.5},
    {name:"final-turn",x:411,z:8},
  ]) {
    await page.evaluate(p=>{window.__solargon.teleport({x:p.x,y:2.3,z:p.z});window.__solargon.advance(20);},point);
    await page.screenshot({path:`art/playtest/extended-${point.name}.png`});
  }
});
