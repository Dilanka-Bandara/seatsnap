import { test, expect } from "@playwright/test";

test("foundation preview is usable without a backend", async ({ page }) => {
  await page.route("**/api/status", route => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Some moments/ })).toBeVisible();
  await page.getByRole("link", { name: "Explore what’s coming" }).click();
  await expect(page.getByRole("heading", { name: "Our first events are on the way." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/home-${test.info().project.name}.png`, fullPage: true });
});

test("connectivity indicator reflects the actual API response", async ({ page }) => {
  await page.route("**/api/status", route => route.fulfill({ json: { name: "SeatSnap", stage: "foundation", message: "Ready" } }));
  await page.goto("/");
  await expect(page.getByText("SeatSnap API connected", { exact: false })).toBeVisible();
});
