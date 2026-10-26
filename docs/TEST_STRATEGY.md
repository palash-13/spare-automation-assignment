# Test Strategy — Product Hunt

## Context
Product Hunt is a discovery platform: makers launch products, users browse, upvote and comment, and a ranked daily leaderboard decides who "wins". Third parties consume the same data through a public GraphQL API. As the sole QA engineer, I can't test everything, so I prioritise by **risk = user/business impact × likelihood of breaking**.

## What matters most (and why)
| Priority | Area | Why it matters |
|---|---|---|
| P0 | **Auth & access control** (API tokens, scopes, sign-in) | A leak of private data or unauthorised write (e.g. votes) is a trust and legal problem. |
| P0 | **Core discovery journey** — homepage → product page → topic/leaderboard | This *is* the product. If browsing breaks, nothing else matters. |
| P0 | **Ranking integrity** — vote counts, ordering, leaderboard | Rankings drive the business; wrong ordering or vote manipulation destroys credibility. |
| P1 | **API contract** — schema shape, pagination, errors, rate limits | External developers break silently when the contract drifts. |
| P1 | **Error handling** — 404s, invalid input, unknown slugs | Errors must fail safe: no stack traces, no wrong data, correct status codes. |
| P2 | Accessibility, performance, cross-browser | Important for reach; monitored, but lower blast radius than the above. |

## Approach (test pyramid)
- **API tests (many, fast):** contract and business rules — auth rejection, shape/types, cursor pagination, ordering, lookup consistency, error handling. Run on every PR (seconds).
- **E2E tests (few, critical paths only):** user journeys a real person takes. Resilient locators (roles, `href` patterns), web-first assertions, zero hard waits.
- **Exploratory testing:** time-boxed sessions on areas automation can't judge well — UX, edge cases, security headers, accessibility.
- **Out of scope / ethical bounds:** no load testing, no bot-protection bypass, no writes on other users' data, no brute-forcing.

## Environments & data
Production is a live, changing dataset, so tests assert **structure and invariants** (e.g. "sorted descending", "no duplicate IDs across pages"), never exact values. Historical, fixed dates are used where stable data is needed.

## CI & quality gates
- PR: typecheck + API suite + E2E suite (headless, retries=2 in CI, trace on retry).
- Auth tests need no secret, so they run even on forks. Token-dependent tests skip cleanly without `PH_TOKEN`.
- Nightly: full run + report artifact; a flaky test is quarantined within 24h, not ignored.

## KPIs I'd track
Escaped defects per release · flaky-test rate (<2%) · P0 journey coverage (100%) · suite duration (API <30s, E2E <5 min) · mean time to detect a contract break.

## Risks
Cloudflare bot protection challenges headless CI browsers → in a real team, request a staging environment or an allowlisted CI egress IP / bypass header. Live data changes daily → invariant-based assertions.
