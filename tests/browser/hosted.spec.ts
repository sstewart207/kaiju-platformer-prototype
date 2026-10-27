import { test, expect } from "@playwright/test";

// Opt-in: PLAYTEST_URL can point to a prefixed local preview or the deployed site.
test("published game opens anonymously with assets, controls and pause", async ({
  page,
}) => {
  test.skip(
    !process.env.PLAYTEST_URL,
    "Set PLAYTEST_URL to verify a published build.",
  );
  const target = new URL(process.env.PLAYTEST_URL!);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const atlas = page.waitForResponse(
    (response) =>
      response.url() === new URL("assets/solargon-atlas-v2.png", target).href &&
      response.status() === 200,
  );
  const response = await page.goto(target.href);
  expect(response?.status()).toBe(200);
  expect(page.url()).toBe(target.href);
  await atlas;
  await expect(
    page.getByRole("heading", { name: "UNTITLED", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "START", exact: true }).click();
  await expect(page.locator("#hud")).toBeVisible();
  await expect(page.locator("#run-time")).not.toHaveText("0:00.00");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("ShiftLeft");
  await expect(page.locator("#dash-status")).toHaveText("DASH");
  await page.keyboard.up("ShiftLeft");
  await expect(page.locator("#dash-status")).toHaveText("DASH READY");
  await page.keyboard.up("KeyD");
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "PAUSED", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RESUME", exact: true }).click();
  await expect(page.locator("#hud")).toBeVisible();
  await expect(page.locator("#controls")).toContainText("SHIFT");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/public-playtest.png" });
});
