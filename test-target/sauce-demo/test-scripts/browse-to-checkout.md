# Sauce Demo, browse → checkout — Playwright tests

End-to-end tests for an anonymous shopper browsing, adding a product to the cart
and reaching the checkout hand-off: <https://sauce-demo.myshopify.com/>

Generated from the test cases in `../test-cases/sauce-demo-browse-to-checkout-test-cases.md`.
Each test maps to one test case and keeps its `TC-` id — if a test fails, start
with the case it came from.

The tests stop at the Shopify-hosted checkout page. No contact, delivery or
payment details are ever entered, and no order is placed.

## What's covered

| Test | What it verifies |
|------|------------------|
| TC-01: Home page loads with branding, tagline, navigation and an empty cart | Opens the home page: title, logo, tagline, the six main nav links, `My Cart (0)` and the header Check Out link |
| TC-02: Home page shows the three featured products with names and prices | The featured grid has exactly 3 cards — Grey jacket £55.00, Noir jacket £60.00, Striped top £50.00 — each linking to its product page with an image |
| TC-03: Catalog link in the main navigation opens the all-products collection | Clicking **Catalog** lands on `/collections/all` with the "Products" heading and a `Home — Products` breadcrumb |
| TC-04: Catalog lists all seven products with correct names and prices | All 7 catalog cards appear in order with the right names and prices, and there's no pagination |
| TC-05: Out-of-stock products are flagged "Sold Out" in the catalog | Exactly 2 cards carry the Sold Out badge (Brown Shades, White sandals), the other 5 don't, and the sold-out cards still link to their product pages |
| TC-06: Clicking a catalog product card opens its product detail page | Clicking the Grey jacket card opens its PDP with the right URL, title, name and price |
| TC-07: Product detail page shows product information and an enabled Add to Cart button | Breadcrumb, name, price, product image, variant dropdown, an enabled Add to Cart button, and no quantity field. **Currently fails — see Known findings.** |
| TC-08: Adding a product from the PDP updates the header cart count without leaving the page | Add to Cart moves the counter 0 → 1 without navigating or reloading (proved with a window stamp), and the cart then holds 1 × £55.00 |
| TC-09: Adding the same product twice merges into one cart line with quantity 2 | Two adds produce one line at quantity 2, unit price £55.00, line and order total £110.00 |
| TC-10: A sold-out product cannot be added to the cart | The Brown Shades PDP shows a disabled button labelled "Sold Out"; forcing a click leaves the counter at 0 |
| TC-11: Selected variant options are carried through to the cart | Size (S/M/L) and Color (Blue/Red) dropdowns; picking M + Red puts "Noir jacket - M / Red" at £60.00 in the cart |
| TC-12: Cart page shows correct line item details and order total | Cart title and heading, the Description/Price/Qty/Total columns, line details, vendor, order total, note field, Update and Check Out buttons |
| TC-13: Updating the quantity in the cart recalculates the totals | Changing quantity to 3 and clicking Update gives a £165.00 line and order total, and a header counter of 3 |
| TC-14: Removing the only cart line empties the cart | Clicking the **x** empties the cart, shows the empty-cart message with a Continue Shopping link, and resets the counter to 0 |
| TC-15: Check Out hands off to the Shopify checkout with the cart total preserved | Check Out lands on a `/checkouts/...` URL with the right title, the Contact/Delivery/Shipping method/Payment sections, and an order summary total of £165.00 matching the cart |

## Setup

Install dependencies and the browser (run once, from the project root):

```bash
npm install
npx playwright install chrome      # uses your system Google Chrome
```

This config uses `channel: 'chrome'`, so real Google Chrome is required — don't
substitute bundled Chromium, it gets challenged more readily on this site.

## Getting past the security check (important)

The store serves a Cloudflare-style **"Just a moment…"** / *"Your connection
needs to be verified before you can proceed"* challenge to automated browsers.
An ordinary browser session is unaffected.

**What was observed, so you can judge whether you need this.** On 2026-08-01 an
**unpaced, headless** run got about ten tests in before the store started
challenging every request. Since pacing was added, a **headed, paced** run passed
13 of 15 with **no saved clearance at all** — and neither failure was the wall. So
the pacing is doing the work; treat the clearance below as the fallback for when
the wall returns, not as a prerequisite. The store also rate-limits: keep
`workers: 1`, avoid needless page loads, and let it cool down after a blocked run
rather than retrying straight away.

If you do hit the wall, clear the check once by hand and the tests reuse that
clearance:

```bash
node scripts/save-auth.mjs --url https://sauce-demo.myshopify.com/ --out .auth/sauce-demo.json --ready-text "Just a demo site showing off what Sauce can do."
```

A real Chrome window opens. If the check appears, **solve it in the window**;
once the real page loads, the clearance is saved to `.auth/sauce-demo.json` and
the window closes. `playwright.config.ts` picks it up automatically.

The clearance expires — when runs start hitting the wall again, re-run that
command.

## Run the tests

Run from the **project root**. The commands are identical on macOS, Linux and
Windows — only the terminal differs. These tests run **headed** (a visible
Chrome window) on purpose; that's part of what passes the security check.

**macOS / Linux (bash or zsh):**

```bash
npx playwright test --config test-target/sauce-demo/playwright.config.ts
npx playwright test --config test-target/sauce-demo/playwright.config.ts --ui
npx playwright test --config test-target/sauce-demo/playwright.config.ts -g "TC-03"
```

**Windows (PowerShell):**

```powershell
npx playwright test --config test-target/sauce-demo/playwright.config.ts
npx playwright test --config test-target/sauce-demo/playwright.config.ts --ui
npx playwright test --config test-target/sauce-demo/playwright.config.ts -g "TC-03"
```

`--ui` opens Playwright UI mode; `-g` runs a single test by its TC id.

### This suite runs slowly on purpose

The store rate-limits automated browsing, so the tests browse at a human pace:
a **10-second gap between page loads** (`pacing.fixture.ts`) and a **500ms pause
before each click or keystroke** (`slowMo`). Budget roughly **6–10 minutes** for
a full run — most of that is deliberate waiting, not slowness.

Debugging a single test and want it quick? Override the gap for that run instead
of editing the fixture:

**macOS / Linux:**

```bash
PACING_MIN_GAP_MS=0 npx playwright test --config test-target/sauce-demo/playwright.config.ts -g "TC-13"
```

**Windows (PowerShell):**

```powershell
$env:PACING_MIN_GAP_MS="0"; npx playwright test --config test-target/sauce-demo/playwright.config.ts -g "TC-13"
```

Don't run the whole suite unpaced against this site — that's what got it
challenging automated browsers in the first place.

## See the test report

Results are written to `test-target/sauce-demo/test-results/`:

- `html-report/` — the browsable HTML report
- `artifacts/` — screenshots, traces and page snapshots from failures

Open the report (same command on every platform):

```bash
npx playwright show-report test-target/sauce-demo/test-results/html-report
```

It shows each test's steps, timings, and — for any failure — the error, a
screenshot, and a trace you can step through.

## Known findings

**TC-07 fails by design.** The test case expects "a product image with alt text
**Grey jacket** is visible". On the live PDP at desktop width the visible image
is `<img class="desktop" alt="Product Image">` (300×480); the image with
`alt="Grey jacket"` is `class="mobile"` and measures 0×0, so it isn't visible.

The assertion has deliberately been left as the test case states it, rather than
relaxed to make the suite green. Either amend the test case to expect the real
alt text, or treat the generic `alt="Product Image"` as an accessibility defect
to raise against the site.

## Notes for maintainers

- Every non-obvious locator in the spec carries an `// observed:` comment
  recording what was actually read from the live DOM.
- `div#drawer` holds a **hidden duplicate** of the cart on every page — a second
  `form[action="/cart"]`, a second "Check Out" input and duplicate element ids.
  Cart locators are scoped to `section#cart` and product locators to
  `section.product-grid` to avoid strict-mode violations.
- The mini-cart drawer (header "My Cart" link) is broken on this demo — it opens
  a spinner that never resolves. Nothing is tested through it.
- No `/cart/clear` step is needed between tests: the cart is cookie-based and
  Playwright gives each test a fresh browser context, so every test starts empty.
  That also keeps page loads down, which matters given the rate limiting.
- The specs import `test`/`expect` from `./pacing.fixture`, **not** from
  `@playwright/test` — that import is what activates the navigation gap. If you
  add a spec here, import it the same way, or it will browse at full speed.
- The pacing gap is shared between tests within a worker, so the suite must keep
  `workers: 1`. The config's 120s per-test `timeout` exists to accommodate the
  waiting; don't lower it without lowering the gap too.
- The catalog card named "Black heels" links to `/products/flower-print-jeans`;
  match products by visible name, not by handle.
