# Data-Driven Playwright Suite — Project Board Demo

[![Playwright Tests](https://github.com/EspinozaLeo/Loop-Technical-Evaluation/actions/workflows/playwright.yml/badge.svg)](https://github.com/EspinozaLeo/Loop-Technical-Evaluation/actions/workflows/playwright.yml)

A Playwright + TypeScript suite that verifies task placement and tagging on the
[demo project board](https://create-asana-like-pr-39y5.bolt.host/). All six
acceptance-criteria scenarios are generated from a single JSON dataset, so
adding coverage is a data change rather than a code change.

## Quick start

```bash
npm ci
npx playwright install chromium
npm test
```

| Script | What it does |
| --- | --- |
| `npm test` | Run the full suite headless |
| `npm run test:headed` | Watch the browser drive the app |
| `npm run test:ui` | Playwright's interactive UI mode |
| `npm run test:debug` | Step through with the inspector |
| `npm run report` | Open the HTML report from the last run |
| `npm run typecheck` | `tsc --noEmit` |

## Design

### Data-driven by construction

The six scenarios differ only in four values — project, column, task, tags — so
the suite stores exactly those and generates a test per entry:

```jsonc
// src/data/testCases.json
{
  "id": "TC-01",
  "project": "Web Application",
  "column": "To Do",
  "task": "Implement user authentication",
  "tags": ["Feature", "High Priority"]
}
```

`tests/board.spec.ts` loops that array once. Six scenarios, one test body, zero
duplication. A seventh scenario is a JSON object, not a new function. The array
is typed as `BoardTestCase[]` (`src/types.ts`), so a malformed entry fails
typecheck before it ever reaches a browser.

### Layout

```
src/
  config/environment.ts   URL + credentials, env-var overridable
  data/testCases.json     the dataset that drives the suite
  fixtures/test.ts        custom fixtures (page objects, third-party blocking)
  pages/LoginPage.ts      login screen
  pages/BoardPage.ts      kanban board: projects, columns, cards, tags
  types.ts                BoardTestCase contract
tests/
  board.spec.ts           the six data-driven scenarios
  login.spec.ts           login happy path + invalid-credentials path
```

### Locator strategy

The application ships **no `data-testid` attributes**, so locators are built from
ARIA roles and document structure rather than CSS classes — roles and heading
text survive a restyle, Tailwind class names do not. Three details in this app
drive the approach:

- **Column headings include a count** — the heading reads `To Do (2)`, not
  `To Do`, so an exact-text match finds nothing. A substring match is the
  obvious alternative but is too loose in the other direction: it also selects a
  column named `To Dos` or `To Do Later`, silently making the locator ambiguous
  and passing a test that should fail. `BoardPage.column()` therefore matches an
  anchored pattern — the full name, count optional, nothing after it — and
  treats the heading's parent as the column container. Verified by intercepting
  the app bundle and renaming columns at runtime: `To Do` → `To Dos` now fails,
  and a second column containing `To Do` no longer creates a double match.
- **Scoping proves placement.** `taskCard(column, task)` is scoped *inside* the
  column, so an identically titled card elsewhere on the board cannot satisfy
  it. That is what makes "is in the To Do column" a real assertion rather than
  "exists somewhere on the page".
- **Tags are unlabelled `<span>`s**, and so are assignee names and due dates.
  `tagPills()` anchors to the first `<div>` of the card, which holds only the tag
  pills, keeping the other spans out of the result.

### Tag assertions catch both directions

`expectTags()` asserts the pill count equals the expected count *and* that each
expected tag appears exactly once. The count catches unexpected extra tags; the
per-tag check catches missing ones. Matching tags individually keeps the
assertion independent of render order.

### Login runs for real on every test

Every acceptance-criteria scenario starts with "Login to Demo App", so each test
drives the real login form rather than replaying a cached `storageState`.

It runs as the test's own first `test.step`, which means it is *visible* — the
report lists all four steps per scenario, mirroring the acceptance criteria:

```
✓ TC-01
   › Login to Demo App
   › Navigate to "Web Application"
   › Verify "Implement user authentication" is in the "To Do" column
   › Confirm tags: Feature, High Priority
```

Putting the login inside the fixture instead would still run it, but Playwright
files fixture work under "Before Hooks", where it is collapsed out of view. The
code is written once regardless — the loop in `board.spec.ts` supplies it to all
six scenarios.

At six tests the cost is negligible and it keeps the login path under continuous
coverage. If this suite grew to hundreds of tests, caching the authenticated
state would be the first optimisation — the app stores a 24-hour `auth_data`
object in `localStorage`, so it would cache cleanly.

### Third-party script blocking

The page loads `bolt.new/badge.js`, a hosting attribution badge that is not part
of the application under test. The fixture aborts that request. External scripts
that change without notice are a flake source, and excluding them keeps runs
deterministic.

## Verification

The suite passes — but a green run only proves the tests *ran*, not that they
*check* anything. Before submitting, each assertion was validated against
deliberately incorrect data to confirm it fails when it should:

| Mutation | Result |
| --- | --- |
| Task claimed to be in the wrong column | Fails — `toBeVisible` |
| Task claimed to be in the wrong project | Fails — `toBeVisible` |
| Typo in the task title | Fails — `toBeVisible` |
| Extra tag added to expectation | Fails — `toHaveCount` |
| Tag removed from expectation | Fails — `toHaveCount` |
| Tag renamed to a wrong value | Fails — `toHaveCount` |

All six failed for the expected reason. That scaffold was removed before
submission; the check is documented here rather than left in the suite.

### Scalability check

"Adding a scenario is a data change" is a claim worth testing too. Two extra
entries were temporarily added to `testCases.json` — deliberately reaching
beyond anything the existing tests covered:

| Added scenario | Why it is a real test of the design |
| --- | --- |
| `API integration` — Web Application / **Review** | Uses a column no other scenario touches |
| `Email campaign` — **Marketing Campaign** / In Progress | Uses a project referenced nowhere in the code |

Both generated and passed with **no code changes** — the suite went from six
tests to eight on the strength of the JSON alone. The entries were then removed,
leaving the six required scenarios.

## Defect found during exploration

**Due dates render one day early in any timezone behind UTC.**

Task cards render dates with `new Date(task.dueDate).toLocaleDateString()`. A
date-only ISO string like `"2024-03-25"` is parsed as **UTC midnight** per the
ECMAScript spec, then formatted in the viewer's local timezone. At UTC-4 that
renders as `3/24/2024`.

- Source data: `"2024-03-25"` → Displayed: `3/24/2024`
- Source data: `"2024-03-20"` → Displayed: `3/19/2024`

Reproducible in isolation:

```js
new Date('2024-03-25').toLocaleDateString(); // '3/24/2024' at UTC-4
```

Every task on the board is affected, and it worsens the further west the user
is. The fix is to parse as a local date rather than UTC — e.g. splitting the
string into parts and using `new Date(y, m - 1, d)`.

This is outside the six required scenarios, so the suite does not assert on due
dates. Adding an assertion against the currently rendered value would encode the
bug as expected behaviour, and the tests would then break when it is fixed.

## Note on the credentials

The brief lists the first credential as `Email: admin`, but the application
renders a field labelled **Username** and compares the value literally against
`"admin"`. The page object locates by the visible label so the test reflects
what the UI actually presents. Credentials are read from `APP_USERNAME` /
`APP_PASSWORD` (with the published demo values as defaults) and the target from
`APP_URL`, so the suite can be pointed elsewhere without a code change.

## CI

`.github/workflows/playwright.yml` runs the typecheck and the full suite on
every push and pull request to `main`, and uploads the HTML report as an
artifact on both pass and fail. Retries are enabled only in CI, where transient
network noise against a hosted demo app is the likelier cause of a blip than a
real regression.
