<!--
STANDARD RUN-GUIDE TEMPLATE for a generated Playwright spec.

Copy this into the target's test-scripts/ folder with the SAME base name as the
spec (e.g. test-scripts/checkout.spec.ts -> test-scripts/checkout.md). Fill in
every <placeholder>, then delete these HTML comments and any section that
doesn't apply.

Keep the section order and headings the same every time so the run guide is
standardised across targets. The "Getting past the security check" section is
OPTIONAL — include it ONLY if the target site is behind CAPTCHA / bot
protection; otherwise delete it entirely.
-->

# <Test title> — Playwright tests

End-to-end tests for <what these tests cover>: <PAGE_URL>

Generated from the test cases in `../test-cases/<test-case-file>.md`. Each test
below maps to one test case — if a test fails, start with the case it came from.

## What's covered

<!-- One row per test() in the spec: the test name (keep its TC id) and, in
     plain language, what it verifies. -->

| Test | What it verifies |
|------|------------------|
| <TC-01: test name> | <what it checks — the action and the expected result> |
| <TC-02: test name> | <what it checks> |

## Setup

Install dependencies and the browser (run once, from the project root):

```bash
npm install
npx playwright install chrome      # uses your system Google Chrome
# or: npx playwright install chromium   # just the bundled engine
```

<!-- Install only the browser the tests use. Do NOT tell users to run bare
     `npx playwright install` — it downloads Chromium, Firefox AND WebKit.
     This config uses channel: 'chrome', so `install chrome` is the right one. -->

## Run the tests

Run from the **project root**, pointing at this target's config. The commands are
identical on macOS, Linux and Windows — only the terminal differs.

**macOS / Linux (bash or zsh):**

```bash
npx playwright test --config <target-folder>/playwright.config.ts
npx playwright test --config <target-folder>/playwright.config.ts --headed
npx playwright test --config <target-folder>/playwright.config.ts --ui
npx playwright test --config <target-folder>/playwright.config.ts -g "TC-03"
```

**Windows (PowerShell):**

```powershell
npx playwright test --config <target-folder>/playwright.config.ts
npx playwright test --config <target-folder>/playwright.config.ts --headed
npx playwright test --config <target-folder>/playwright.config.ts --ui
npx playwright test --config <target-folder>/playwright.config.ts -g "TC-03"
```

`--headed` watches it in a visible browser, `--ui` opens Playwright UI mode, and
`-g` runs a single test by name.

<!-- Only if the tests read an environment variable, show the per-shell syntax, e.g.:
     macOS/Linux:  BASE_URL=https://staging.example.com npx playwright test --config …
     PowerShell:   $env:BASE_URL="https://staging.example.com"; npx playwright test --config …
     Delete this comment if there are no such variables. -->

## See the test report

Results are written to `<target-folder>/test-results/`:

- `html-report/` — the browsable HTML report
- `artifacts/` — screenshots and traces from failures

Open the report (same command on every platform):

```bash
npx playwright show-report <target-folder>/test-results/html-report
```

It shows each test's steps, timings, and — for any failure — the error, a
screenshot, and a trace you can step through.

<!-- OPTIONAL — include only for sites behind CAPTCHA / bot protection. Delete otherwise. -->
## Getting past the security check (important)

This site is behind **<Imperva / hCaptcha / Cloudflare / …>** bot protection, so
a fresh automated browser is blocked. Clear the check once by hand and the tests
reuse that clearance:

```bash
node scripts/save-auth.mjs --url <PAGE_URL> --out <.auth/state.json>
```

A real browser window opens. Solve the "<I am human / …>" check in the window;
once the real page loads, the clearance is saved and the window closes. The
clearance expires after a while — re-run the command when the tests start
hitting the security wall again.
