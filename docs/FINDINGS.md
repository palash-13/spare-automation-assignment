# Exploratory Testing & Security Findings

**Scope:** www.producthunt.com (logged-out) and the public GraphQL API (`api.producthunt.com/v2/api/graphql`).
**Environment:** macOS, Chromium (Playwright, headless), curl. Date: 2026-10-26.
**Ethical bounds:** read-only requests, no bypass of bot protection, no brute-force, no load, no interaction with other users' data.

Severity: **High** = security/data risk or broken core flow · **Medium** = clear defect, workaround exists · **Low** = inconsistency / hardening · **Info** = observation.

## Summary
| ID | Title | Area | Severity | Status |
|---|---|---|---|---|
| WEB-01 | Clicking a topic tag on a homepage card does not navigate | Web | Medium | Reproduced 3/3 (headless) — confirm headed |
| WEB-02 | Upvote/comment buttons have only a number as accessible name | Web / a11y | Medium | Confirmed via accessibility tree |
| WEB-03 | Every ranked homepage card has a "Promoted" image | Web | Low | Needs verification |
| WEB-04 | Duplicate nav entries pointing to the same URL | Web / UX | Low | Confirmed |
| API-01 | Error body doesn't follow the GraphQL spec | API | Low | Confirmed |
| API-02 | CORS advertises `GET`, but `GET` returns an HTML 404 | API | Low | Confirmed |
| SEC-01 | HSTS `max-age` too short for the `preload` directive | Security | Low | Confirmed |
| SEC-02 | `x-runtime` header exposes server timing | Security | Info | Confirmed |
| SEC-03 | `Access-Control-Allow-Origin: *` on the API | Security | Info | Acceptable — note |
| POS-01 | Auth enforced before query parsing | Security | ✅ Positive | Confirmed |
| ENV-01 | Cloudflare intermittently challenges headless browsers | Test env | Info | Confirmed |

---

### WEB-01 — Clicking a topic tag on a homepage card does not navigate
- **Steps:** Open `/` → in "Top Products Launching Today", click a topic tag (e.g. "Productivity") on the first card.
- **Expected:** Navigate to `/topics/productivity` (the element is an `<a href="/topics/productivity">`).
- **Actual:** URL stays on `/`. Opening `/topics/productivity` directly works (200, heading "Productivity").
- **Impact:** A discovery path users expect to work is dead; it also breaks middle-click/keyboard expectations if the card swallows the event.
- **Evidence:** `e2e/tests/product.e2e.ts` — test marked `test.fail()` documents it.
- **Note:** Reproduced in headless Chromium; confirm in a headed browser before filing as P2.

### WEB-02 — Upvote/comment buttons have a numeric-only accessible name
- **Actual:** Accessibility tree shows `button "57"`, `button "217"`. A screen reader announces "57, button" with no indication that it's an upvote or comment count.
- **Expected:** `aria-label="Upvote (57)"` / `"Comments (217)"` — the forum section already does this ("Upvote (N)").
- **Impact:** WCAG 2.1 SC 4.1.2 (Name, Role, Value). Inconsistent between sections.

### WEB-03 — Every ranked card carries a "Promoted" image
- **Actual:** 28 ranked product links, 28 `img[alt="Promoted"]` on the homepage.
- **Question:** Is the badge rendered visually for organic launches, or is it a hidden image with a misleading alt? Either way: mislabelling organic products as ads (or vice versa) is a trust/compliance issue. **Needs manual visual check.**

### WEB-04 — Duplicate nav entries
"Launches" and "Launch archive" both link to `/leaderboard/daily/<today>`; "News" and "Newsletter" both link to `/newsletters`. Minor UX confusion, and makes test locators ambiguous.

### API-01 — Error body doesn't follow the GraphQL spec
```json
{"data":null,"errors":[{"error":"invalid_oauth_token","error_description":"Please supply a valid access token..."}]}
```
The GraphQL spec requires each error to have a `message` field. Generic GraphQL clients (Apollo, urql) look for `message` and show "undefined". **Suggest:** add `message` and move the OAuth code into `extensions.code`.

### API-02 — CORS advertises `GET` but `GET` is not supported
Preflight returns `access-control-allow-methods: GET, POST, HEAD, OPTIONS`, yet `GET /v2/api/graphql?query={__typename}` returns an **HTML** "Page not found" page. Should be a JSON `405 Method Not Allowed`, or `GET` removed from CORS.

### SEC-01 — HSTS `max-age` too short for `preload`
`strict-transport-security: max-age=2592000; includeSubDomains; preload` → 30 days. The HSTS preload list requires `max-age` ≥ 31536000 (1 year), so the `preload` directive is ineffective. **Suggest:** `max-age=31536000`.

### SEC-02 — `x-runtime` header exposes server processing time
e.g. `x-runtime: 0.014396`. Reveals the stack (Rails) and gives a timing oracle useful for enumeration attacks. Low risk; strip at the edge.

### SEC-03 — Wildcard CORS on the API
`access-control-allow-origin: *`. Acceptable because auth is a bearer token (not cookies), so browsers won't send credentials cross-origin. Must stay that way — if cookie auth is ever added to this endpoint, this becomes High.

### POS-01 — Auth is enforced before query parsing ✅
No token / invalid token → `401` with no data, **even for malformed queries and introspection**. Unauthenticated users cannot discover the schema. Covered by `api/tests/auth.test.ts`.

### ENV-01 — Cloudflare challenges headless browsers
Headless Chromium sometimes gets `403` "Just a moment…". Tests detect this and **skip with a reason** rather than fail or bypass. For a real team: staging env or allowlisted CI egress.

---

## To explore next (needs token / account / more time)
- Token **scope** enforcement: can a `public`-scope token reach `viewer` / private fields?
- Rate limiting: does `x-rate-limit-remaining` decrease, and what happens at 0 (429 + `Retry-After`)?
- Query **complexity/depth** limits (deeply nested `posts → topics → posts…`).
- Large `first` values (e.g. 10 000) — capped or error?
- Logged-in flows: upvote toggle, double-vote prevention, comment input sanitisation (own content only).
- Leaderboard timezone boundaries (PT midnight).
