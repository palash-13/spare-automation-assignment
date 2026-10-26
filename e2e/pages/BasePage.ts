import { test, type Locator, type Page, type Response } from "@playwright/test";

/**
 * Shared behaviour for every page object: navigation, the site header,
 * and detection of Cloudflare's bot challenge.
 */
export class BasePage {
  readonly header: Locator;

  constructor(readonly page: Page) {
    this.header = page.locator("header").first();
  }

  async goto(path: string): Promise<Response | null> {
    const response = await this.page.goto(path, { waitUntil: "domcontentloaded" });
    await this.skipIfBotChallenge();
    return response;
  }

  /**
   * Product Hunt sits behind Cloudflare, which can challenge headless/CI browsers.
   * We do NOT try to bypass it — we skip with a clear reason so the run reports
   * "blocked by environment" instead of a misleading product failure.
   */
  async skipIfBotChallenge(): Promise<void> {
    const title = await this.page.title();
    test.skip(
      /just a moment|attention required/i.test(title),
      "Blocked by Cloudflare bot challenge — run headed locally or from an allowlisted CI IP",
    );
  }

  headerLink(name: string): Locator {
    return this.page.getByRole("link", { name, exact: true }).first();
  }
}
