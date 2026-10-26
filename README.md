# Product Hunt — QA Engineering Assignment

Test strategy, exploratory/security findings, and automated E2E + API suites for [Product Hunt](https://www.producthunt.com), built with **Bun + TypeScript + Playwright**.

| Deliverable | Where |
|---|---|
| Part 1 — Test strategy | [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) |
| Part 2 — Exploratory & security findings | [docs/FINDINGS.md](docs/FINDINGS.md) |
| Part 3 — E2E suite (Playwright, 8 scenarios) | [e2e/](e2e/) |
| Part 3 — API suite (Bun test, 9 tests) | [api/](api/) |
| CI pipeline | [.github/workflows/tests.yml](.github/workflows/tests.yml) |

## Setup
Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
bun install
bunx playwright install chromium
cp .env.example .env        # then paste your token into PH_TOKEN
```
Get a free developer token at https://www.producthunt.com/v2/oauth/applications (create an app → "Create Token").

## Running the suites
```bash
bun run test:api          # API tests (Bun test runner)
bun run test:api:report   # API tests + HTML report → reports/api-report.html
bun run test:e2e          # E2E tests (headless Chromium)
bun run test:e2e:headed   # watch the browser
bun run report            # open the last Playwright HTML report (playwright-report/)
bun run typecheck         # tsc --noEmit (strict)
bun run test              # everything
```
- Without `PH_TOKEN`, the 2 auth tests still run; the 7 token-dependent tests **skip** (not fail).
- If Cloudflare challenges the headless browser, affected E2E tests **skip with a reason** (see ENV-01).

## Project structure
```
api/
  client/graphqlClient.ts   typed fetch-based GraphQL client
  client/queries.ts         GraphQL documents
  client/types.ts           response types
  tests/                    auth, posts, schema tests (*.test.ts)
e2e/
  pages/                    Page Object Model (BasePage + one class per page)
  fixtures.ts               injects page objects into tests
  tests/                    scenarios (*.e2e.ts)
docs/                       strategy + findings
```

## Test coverage
**E2E (Playwright)**
1. Homepage loads with "Top Products Launching Today"
2. Homepage lists ≥5 products, all linking to `/products/<slug>`
3. Header nav points to Launches / Best Products / Forums
4. Opening a product from the homepage shows its product page
5. A topic tag links to a working topic page
6. Clicking a topic tag on a card navigates — `test.fail()`, documents bug WEB-01
7. A past daily leaderboard lists products (fixed date = stable data)
8. Unknown URL returns HTTP 404

**API (Bun + TypeScript)**
1. No token → 401, no data · 2. Invalid token → 401, no data
3. `posts(first: 5)` returns ≤5 well-formed posts + rate-limit headers
4. Cursor pagination: page 2 shares no IDs with page 1
5. `post(slug)` matches the same post from the list
6. `order: VOTES` is sorted descending
7. Unknown slug returns `null`, not an error or a wrong post
8. Unknown field → GraphQL validation error, not 5xx
9. Topics return a valid shape

## Summary of findings
Full details with steps and evidence in [docs/FINDINGS.md](docs/FINDINGS.md).
- **WEB-01 (Medium):** clicking a topic tag inside a homepage card doesn't navigate.
- **WEB-02 (Medium, a11y):** upvote/comment buttons are announced as just a number ("57, button").
- **API-01 (Low):** error responses use `error`/`error_description` instead of the spec-required `message`.
- **API-02 (Low):** CORS advertises `GET`, but `GET` returns an HTML 404.
- **SEC-01 (Low):** HSTS `max-age` is 30 days, too short for the `preload` directive it declares.
- **Positive:** auth is enforced before parsing, so unauthenticated users can't introspect the schema.

## Architecture decisions
- **Page Object Model + fixtures.** Selectors live in page classes; specs read like user journeys. Fixtures inject page objects, so tests don't construct them.
- **Resilient locators.** Roles, visible text, and `href` patterns — no CSS classes (the site uses generated class names).
- **No hard waits.** Only web-first assertions (`expect(...).toBeVisible()`), which retry automatically.
- **Invariants over values.** Production data changes daily, so tests check rules ("sorted", "no duplicates", "≤ first") instead of exact numbers.
- **Plain `fetch` for the API.** Bun's native fetch + a 30-line generic client: `client.query<PostsData>(...)` types every response. No extra dependency, and the status code and headers are fully visible for assertions.
- **Strict TypeScript.** `strict` + `noUncheckedIndexedAccess`; `bun run typecheck` runs in CI before tests.
- **`*.e2e.ts` naming.** Keeps `bun test` and Playwright from picking up each other's files.
- **Honest skips.** Missing token or a bot challenge → `skip` with a reason, never a false pass/fail. No bot-protection bypass (ethical bounds).
- **Known bugs as `test.fail()`.** Documents the bug in code, and flags when it's fixed.

## What I'd do with more time
- Logged-in flows (upvote toggle, double-vote prevention) with a dedicated test account via `storageState`.
- Token scope tests, rate-limit behaviour (429 + `Retry-After`), query depth/complexity limits.
- Generate types from the GraphQL schema (graphql-codegen) instead of hand-written ones.
- GraphQL schema snapshot test to catch breaking contract changes.
- Visual regression on key pages; axe-core accessibility scans in E2E.
- Cross-browser (Firefox/WebKit) + mobile viewport projects.
- Performance budgets (k6/JMeter against staging only), Slack alerts + flaky-test dashboard.
