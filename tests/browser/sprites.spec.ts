import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Direction, SpriteFrame } from "../../src/types";
for (const [sheet, file, count] of [
  ["movement", "solargon-atlas-v2", 32],
  ["human", "human-zombie-atlas-v1", 32],
  ["combat", "solargon-combat-v1", 24],
] as const) {
  const atlas = JSON.parse(
    readFileSync(`art/${file}.audit.json`, "utf8").replace(/^\uFEFF/, ""),
  ) as { image: string; frames: Record<Direction, SpriteFrame[]> };

  test(`${sheet}: all directional animation frames render without errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/tests/fixtures/sprites.html?sheet=${sheet}`);
    await page.waitForFunction(
      () =>
        (window as unknown as { spriteCheckReady: boolean }).spriteCheckReady,
    );
    await expect(page.locator("canvas")).toBeVisible();
    // Read the actual atlas pixels: every crop must contain one entire character,
    // with no visible fragment of a neighboring character. Equal-width crops fail.
    const coverage = await page.evaluate(
      async ({ frames, imagePath }) => {
        const image = new Image();
        image.src = imagePath;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, image.width, image.height);
        const width = image.width,
          height = image.height;
        const visited = new Uint8Array(width * height);
        const components: {
          left: number;
          right: number;
          top: number;
          bottom: number;
          area: number;
        }[] = [];
        for (let seed = 0; seed < visited.length; seed++) {
          if (visited[seed] || data[seed * 4 + 3] < 102) continue;
          const queue = [seed];
          visited[seed] = 1;
          let left = width,
            right = 0,
            top = height,
            bottom = 0,
            area = 0;
          while (queue.length) {
            const index = queue.pop()!,
              x = index % width,
              y = Math.floor(index / width);
            area++;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
            for (const [a, b] of [
              [x - 1, y],
              [x + 1, y],
              [x, y - 1],
              [x, y + 1],
            ]) {
              if (a < 0 || a >= width || b < 0 || b >= height) continue;
              const next = b * width + a;
              if (!visited[next] && data[next * 4 + 3] >= 102) {
                visited[next] = 1;
                queue.push(next);
              }
            }
          }
          if (area > 500) components.push({ left, right, top, bottom, area });
        }
        return Object.entries(frames).flatMap(([direction, rects]) =>
          rects.map((rect, frame) => {
            const touching = components.filter(
              (c) =>
                c.left < rect.x + rect.width &&
                c.right >= rect.x &&
                c.top < rect.y + rect.height &&
                c.bottom >= rect.y,
            );
            const whole =
              touching.length === 1 &&
              touching.every(
                (c) =>
                  c.left > rect.x &&
                  c.right < rect.x + rect.width - 1 &&
                  c.top >= rect.y &&
                  c.bottom < rect.y + rect.height,
              );
            return { direction, frame, whole, characters: touching.length };
          }),
        );
      },
      { frames: atlas.frames, imagePath: atlas.image.replace(/^public/, "") },
    );
    expect(coverage).toHaveLength(count);
    expect(coverage.filter((frame) => !frame.whole)).toEqual([]);
    await page.screenshot({
      path: `art/playtest/sprites-${sheet}-${process.env.SPRITE_CAPTURE ?? "current"}.png`,
    });
    expect(errors).toEqual([]);
  });
}
