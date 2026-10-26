import { test, expect } from "../fixtures";

/** "/products/foo?ref=x" -> "/products/foo" */
const pathOf = (href: string): string => href.split("?")[0] ?? href;

test.describe("Product discovery", () => {
  test("opening a product from the homepage shows its product page", async ({ homePage, productPage, page }) => {
    await homePage.open();
    await expect(homePage.productLinks.first()).toBeVisible();

    const href = await homePage.openFirstProduct();

    await expect(page).toHaveURL(new RegExp(pathOf(href)));
    await expect(productPage.title).toBeVisible();
    await expect(productPage.title).not.toBeEmpty();
  });

  test("a topic tag links to a working topic page", async ({ homePage, topicPage, page }) => {
    await homePage.open();
    const tag = homePage.topicLinks.first();
    await expect(tag).toBeVisible();

    const name = (await tag.innerText()).trim();
    const href = (await tag.getAttribute("href")) ?? "";
    expect(href).toMatch(/^\/topics\/[a-z0-9-]+/);

    await topicPage.goto(href);
    await expect(page).toHaveURL(new RegExp(pathOf(href)));
    await expect(topicPage.title).toHaveText(name);
  });

  // Known bug (see docs/FINDINGS.md, WEB-01): clicking a tag inside a homepage card does not navigate.
  // test.fail inverts the result — this test starts "failing" the day the bug is fixed, prompting cleanup.
  test("clicking a topic tag on a homepage card navigates to the topic", async ({ homePage, page }) => {
    test.fail();
    await homePage.open();
    await expect(homePage.topicLinks.first()).toBeVisible();

    const href = await homePage.openFirstTopic();
    await expect(page).toHaveURL(new RegExp(pathOf(href)), { timeout: 5_000 });
  });
});
