import { test, expect, type Page } from "@playwright/test";
import { FINISH, MAIN_ROUTE_WAYPOINTS } from "../../src/course";
import { writeFileSync } from "node:fs";
interface Enemy {
  hp: number;
  position: { x: number; y: number; z: number };
  action: string;
}
interface Mission {
  position: { x: number; y: number; z: number };
  screen: string;
  animation: string;
  animationAtlas: string;
  elapsed: number;
  kills: number;
  killTarget: number;
  exitUnlocked: boolean;
  defeatTime: number;
  displayPose: string | null;
  checkpoint: number;
  combat: {
    health: number;
    attack: string | null;
    solarCooldown: number;
    enemies: Enemy[];
  };
}
async function state(page: Page) {
  return page.evaluate(() => window.__solargon.state() as unknown as Mission);
}
async function advance(page: Page, n: number) {
  await page.evaluate((n) => window.__solargon.advance(n), n);
}
async function boot(page: Page, peaceful = false) {
  await page.goto(peaceful ? "/?test&peaceful" : "/?test");
  await page.waitForFunction(() => !!window.__solargon);
  await page.evaluate(() => window.__solargon.manual(true));
  await page.getByRole("button", { name: "START", exact: true }).click();
  await advance(page, 20);
}
async function face(page: Page, dx: number, dz: number) {
  const key =
    Math.abs(dx) >= Math.abs(dz)
      ? dx > 0
        ? "KeyD"
        : "KeyA"
      : dz > 0
        ? "KeyS"
        : "KeyW";
  await page.keyboard.down(key);
  await advance(page, 1);
  await page.keyboard.up(key);
}
test("falling selects a separate atlas and returns to movement on landing", async ({
  page,
}) => {
  await boot(page, true);
  await page.keyboard.down("Space");
  await advance(page, 10);
  expect((await state(page)).animation).toBe("jumping");
  expect((await state(page)).animationAtlas).toContain("solargon-atlas-v2");
  await page.keyboard.up("Space");
  await advance(page, 20);
  expect((await state(page)).animation).toBe("falling");
  expect((await state(page)).animationAtlas).toContain("solargon-fall-v1");
  await page.screenshot({ path: "art/playtest/solargon-falling.png" });
  await advance(page, 90);
  expect((await state(page)).animationAtlas).toContain("solargon-atlas-v2");
});
test("kill credit survives the recoil/collapse death sequence; restart clears it", async ({
  page,
}) => {
  await boot(page);
  expect((await state(page)).killTarget).toBe(12);
  const first = (await state(page)).combat.enemies[0].position;
  await page.evaluate((p) => window.__solargon.teleport(p), {
    x: first.x - 2,
    y: first.y + 0.04,
    z: first.z,
  });
  await face(page, 1, 0);
  await page.keyboard.press("KeyK");
  await advance(page, 18);
  const credited = await state(page);
  expect(credited.kills).toBeGreaterThan(0);
  expect(credited.exitUnlocked).toBe(false);
  const victim = credited.combat.enemies.find((e) => e.hp > 0)!;
  await page.evaluate((p) => window.__solargon.teleport(p), {
    x: victim.position.x + 1,
    y: victim.position.y + 0.04,
    z: victim.position.z,
  });
  for (let n = 0; n < 120 && (await state(page)).combat.health > 0; n++)
    await advance(page, 4);
  expect((await state(page)).combat.health).toBe(0);
  expect((await state(page)).displayPose).toBe("hurt");
  await page.keyboard.press("KeyJ");
  await advance(page, 12);
  expect((await state(page)).displayPose).toBe("defeat");
  await page.screenshot({ path: "art/playtest/player-defeat.png" });
  await advance(page, 40);
  const recovered = await state(page);
  expect(recovered.combat.health).toBe(3);
  expect(recovered.kills).toBe(credited.kills);
  expect(recovered.combat.enemies[0].hp).toBe(0);
  expect(recovered.combat.attack).toBe(null);
  await page.keyboard.press("KeyR");
  await advance(page, 1);
  expect((await state(page)).kills).toBe(0);
  expect((await state(page)).combat.enemies.every((e) => e.hp === 2)).toBe(
    true,
  );
  await page.evaluate(
    (p) => window.__solargon.teleport({ ...p, y: p.y + 0.8 }),
    FINISH,
  );
  await advance(page, 20);
  expect((await state(page)).screen).toBe("playing");
  await expect(page.locator("#kill-status")).toHaveText("KILLS 0/12");
});
test("clear twelve enemies and the full route with actual keyboard inputs", async ({
  page,
}) => {
  test.setTimeout(240000);
  await boot(page);
  const points = [{ x: 18, z: -8 }, ...MAIN_ROUTE_WAYPOINTS];
  let index = 0,
    held = new Set<string>(),
    stuck = 0,
    side = 1,
    lastKills = 0,
    deaths = 0;
  async function keys(next: Set<string>) {
    for (const key of held) if (!next.has(key)) await page.keyboard.up(key);
    for (const key of next) if (!held.has(key)) await page.keyboard.down(key);
    held = next;
  }
  async function steer(dx: number, dz: number) {
    const length = Math.hypot(dx, dz) || 1,
      next = new Set<string>();
    if (dx / length > 0.15) next.add("KeyD");
    if (dx / length < -0.15) next.add("KeyA");
    if (dz / length > 0.15) next.add("KeyS");
    if (dz / length < -0.15) next.add("KeyW");
    await keys(next);
  }
  for (let iteration = 0; iteration < 6500; iteration++) {
    const s = await state(page);
    if (s.screen === "finished") break;
    if (s.kills > lastKills) {
      console.log(`Kills ${s.kills}/12 at ${s.elapsed.toFixed(1)}s`);
      lastKills = s.kills;
    }
    if (s.combat.health <= 0) {
      await keys(new Set());
      await advance(page, 45);
      deaths++;
      const r = await state(page);
      const cp =
        r.checkpoint === 1
          ? { x: 324, z: -72 }
          : r.checkpoint === 0
            ? { x: 192, z: -42 }
            : points[0];
      index = points.reduce(
        (best, p, i) =>
          Math.hypot(p.x - cp.x, p.z - cp.z) <
          Math.hypot(points[best].x - cp.x, points[best].z - cp.z)
            ? i
            : best,
        0,
      );
      continue;
    }
    const candidates = s.combat.enemies
      .map((e, i) => ({
        ...e,
        id: i,
        d: Math.hypot(e.position.x - s.position.x, e.position.z - s.position.z),
      }))
      .filter(
        (e) =>
          e.hp > 0 &&
          e.d < 7.5 &&
          Math.abs(e.position.y - s.position.y) < 0.9 &&
          (["charging", "shooting", "melee", "hurt"].includes(e.action) ||
            e.d < 2.5),
      )
      .sort((a, b) => a.d - b.d);
    const enemy = candidates[0];
    if (enemy) {
      const dx = enemy.position.x - s.position.x,
        dz = enemy.position.z - s.position.z;
      const across = Math.min(Math.abs(dx), Math.abs(dz));
      if (
        !s.combat.attack &&
        (enemy.d < 1.8 || (s.combat.solarCooldown < 1e-6 && across < 0.6))
      ) {
        await keys(new Set());
        await face(page, dx, dz);
        await page.keyboard.press(
          s.combat.solarCooldown < 1e-6 && across < 0.6 ? "KeyK" : "KeyJ",
        );
        await advance(page, 14);
        continue;
      }
      if (s.combat.attack && enemy.d < 2.4) {
        await keys(new Set());
        await advance(page, 6);
        continue;
      }
      await steer(dx, dz);
    } else {
      const point = points[Math.min(index, points.length - 1)],
        dx = point.x - s.position.x,
        dz = point.z - s.position.z;
      if (Math.hypot(dx, dz) < 0.4) {
        await keys(new Set());
        await advance(page, 10);
        index++;
        continue;
      }
      await steer(dx, dz);
    }
    await advance(page, 4);
    const next = await state(page);
    stuck =
      Math.hypot(
        next.position.x - s.position.x,
        next.position.z - s.position.z,
      ) < 0.03
        ? stuck + 1
        : 0;
    if (stuck > 8) {
      await keys(new Set());
      await steer(side, side * 0.6);
      await advance(page, 12);
      side *= -1;
      stuck = 0;
    }
    expect(
      s.elapsed,
      JSON.stringify({ index, kills: s.kills, position: s.position }),
    ).toBeLessThan(420);
  }
  await keys(new Set());
  const final = await state(page);
  expect(final.kills).toBe(12);
  expect(final.exitUnlocked).toBe(true);
  expect(final.screen).toBe("finished");
  await expect(page.locator("#menu-description")).toContainText("Kills 12/12");
  writeFileSync(
    "art/playtest/kill-clear-timing.json",
    JSON.stringify(
      {
        simulationSeconds: final.elapsed,
        deaths,
        kills: final.kills,
        method:
          "Scripted fixed-step keyboard navigation and attacks; no teleporting or health/kill edits in this clear run. Human playtime is unmeasured.",
      },
      null,
      2,
    ),
  );
  await page.screenshot({ path: "art/playtest/kill-objective-complete.png" });
});
