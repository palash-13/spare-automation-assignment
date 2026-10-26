import { test, expect } from "../fixtures";

test.describe("Navigation & error handling", () => {
  test("a past daily leaderboard lists launched products", async ({ leaderboardPage }) => {
    // Fixed historical date keeps the data stable between runs
    await leaderboardPage.openDaily(2025, 1, 15);
    await expect(leaderboardPage.productLinks.first()).toBeVisible();
    expect(await leaderboardPage.productLinks.count()).toBeGreaterThan(0);
  });

  test("unknown URL returns a 404 page", async ({ homePage }) => {
    const response = await homePage.goto("/this-page-should-not-exist-qa-check");
    expect(response?.status()).toBe(404);
  });
});
