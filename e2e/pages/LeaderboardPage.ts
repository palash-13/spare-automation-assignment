import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LeaderboardPage extends BasePage {
  readonly productLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.productLinks = page.locator('a[href^="/products/"]').filter({ hasText: /\w/ });
  }

  async openDaily(year: number, month: number, day: number) {
    return this.goto(`/leaderboard/daily/${year}/${month}/${day}`);
  }
}
