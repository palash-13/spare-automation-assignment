import { test as base } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProductPage } from "./pages/ProductPage";
import { TopicPage } from "./pages/TopicPage";

type Pages = {
  homePage: HomePage;
  productPage: ProductPage;
  leaderboardPage: LeaderboardPage;
  topicPage: TopicPage;
};

/** Injects page objects into tests so specs never call `new XPage(page)` themselves. */
export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  leaderboardPage: async ({ page }, use) => use(new LeaderboardPage(page)),
  topicPage: async ({ page }, use) => use(new TopicPage(page)),
});

export { expect } from "@playwright/test";
