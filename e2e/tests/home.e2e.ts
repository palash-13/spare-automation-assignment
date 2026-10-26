import { test, expect } from "../fixtures";

test.describe("Homepage", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test("loads with today's launches section", async ({ homePage, page }) => {
    await expect(page).toHaveTitle(/Product Hunt/i);
    await expect(homePage.todaySection).toBeVisible();
  });

  test("lists products that link to valid product pages", async ({ homePage }) => {
    await expect(homePage.productLinks.first()).toBeVisible();
    expect(await homePage.productLinks.count()).toBeGreaterThanOrEqual(5);

    const hrefs = await homePage.productLinks.evaluateAll((links) =>
      links.slice(0, 10).map((a) => a.getAttribute("href")),
    );
    for (const href of hrefs) {
      expect(href).toMatch(/^\/products\/[a-z0-9-]+/);
    }
  });

  test("header navigation points to core sections", async ({ homePage }) => {
    await expect(homePage.headerLink("Launches")).toHaveAttribute("href", /\/leaderboard\/daily\//);
    await expect(homePage.headerLink("Best Products")).toHaveAttribute("href", /\/categories/);
    await expect(homePage.headerLink("Forums")).toHaveAttribute("href", /\/forums/);
  });
});
