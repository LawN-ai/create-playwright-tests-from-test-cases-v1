import { test as base, expect } from '@playwright/test';

/**
 * sauce-demo pacing — generated from config.yaml's `pacing` block.
 *
 * Specs import `test`/`expect` from here instead of from '@playwright/test':
 *
 *   import { test, expect } from './pacing.fixture';
 *
 * WHY: full page loads are what trip bot detection and rate limiting. A browser
 * that fires ten navigations in ten seconds does not look like a person. This
 * fixture spaces out `page.goto()` so the suite browses at a human pace.
 *
 * It covers direct navigations. Per-action pacing (clicks, typing, and the
 * navigations they trigger) comes from `launchOptions.slowMo` in
 * playwright.config.ts — the two work together.
 *
 * The gap is enforced ACROSS tests within a worker, not just inside one, so it
 * only really works with `workers: 1` (which is the default for these suites).
 * Remember to raise the per-test `timeout` in playwright.config.ts to allow for
 * the waiting, or paced tests will time out.
 *
 * Override the gap without editing code:
 *   macOS/Linux:  PACING_MIN_GAP_MS=2000 npx playwright test --config …
 *   PowerShell:   $env:PACING_MIN_GAP_MS="2000"; npx playwright test --config …
 * Set it to 0 to disable pacing for a quick local run.
 */

// config.yaml pacing.min_seconds_between_navigations: 10
const DEFAULT_MIN_GAP_MS = 10_000;

const MIN_GAP_MS = Number(process.env.PACING_MIN_GAP_MS ?? DEFAULT_MIN_GAP_MS);

// Module scope: shared by every test in this worker, so the gap is honoured
// between tests as well as within one.
let lastNavigationAt = 0;

export const test = base.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);

    page.goto = async (url: string, options?: Parameters<typeof originalGoto>[1]) => {
      const waitMs = lastNavigationAt + MIN_GAP_MS - Date.now();
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      lastNavigationAt = Date.now();
      return originalGoto(url, options);
    };

    await use(page);
  },
});

export { expect };
