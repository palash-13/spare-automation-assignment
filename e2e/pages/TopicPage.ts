import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TopicPage extends BasePage {
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole("heading", { level: 1 }).first();
  }
}
