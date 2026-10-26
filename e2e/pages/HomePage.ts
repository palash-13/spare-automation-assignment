import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  readonly todaySection: Locator;
  readonly productLinks: Locator;
  readonly topicLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.todaySection = page.getByText("Top Products Launching Today").first();
    // Cards contain an image link and a text link to the same product; keep text links only
    this.productLinks = page.locator('a[href^="/products/"]').filter({ hasText: /\w/ });
    this.topicLinks = page.locator('a[href^="/topics/"]').filter({ hasText: /\w/ });
  }

  async open() {
    return this.goto("/");
  }

  async openFirstProduct(): Promise<string> {
    const link = this.productLinks.first();
    const href = (await link.getAttribute("href")) ?? "";
    await link.click();
    return href;
  }

  async openFirstTopic(): Promise<string> {
    const link = this.topicLinks.first();
    const href = (await link.getAttribute("href")) ?? "";
    await link.click();
    return href;
  }
}
