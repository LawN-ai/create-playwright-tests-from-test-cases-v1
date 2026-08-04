import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * sauce-demo — generated from config.yaml.
 *
 * Run FROM THE PROJECT ROOT:
 *   npx playwright test --config test-target/sauce-demo/playwright.config.ts
 *
 * testDir / outputDir / the HTML outputFolder all resolve relative to THIS
 * file, so this target's scripts and results stay inside its own folder.
 * html-report/ and artifacts/ are siblings — nesting one inside the other makes
 * Playwright fail with "HTML reporter output folder clashes with the tests
 * output folder".
 *
 * BOT PROTECTION — observed, not configured. The store has served a
 * Cloudflare-style "Just a moment..." / "Your connection needs to be verified"
 * challenge to automated browsers (see test-scripts/browse-to-checkout.md for
 * when, and for why pacing rather than this is doing the real work). Real Chrome
 * + headed (config.yaml browser.headed: true) + a clearance you save once is the
 * fallback if the wall returns:
 *
 *   node scripts/save-auth.mjs --url https://sauce-demo.myshopify.com/ \
 *     --out .auth/sauce-demo.json \
 *     --ready-text "Just a demo site showing off what Sauce can do."
 *
 * AUTH_FILE is relative to the PROJECT ROOT (the cwd you run from), not to this
 * file. A missing storageState file is a hard error, hence the existsSync guard
 * — without the clearance the run still starts, it just risks being challenged.
 */
const AUTH_FILE = '.auth/sauce-demo.json';

export default defineConfig({
  testDir: './test-scripts',
  outputDir: './test-results/artifacts',
  fullyParallel: false,
  // config.yaml browser.workers — also required for pacing: the fixture's
  // navigation gap is only shared between tests within a single worker.
  workers: 1,
  retries: 0,
  // config.yaml pacing.test_timeout_seconds: 120 — paced tests spend most of
  // their time deliberately waiting, so the 30s default is far too tight.
  timeout: 120_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://sauce-demo.myshopify.com/', // config.yaml base_url
    // config.yaml browser.channel: chrome, headed: true — real Chrome in a
    // visible window, which together with the saved clearance passes the check.
    channel: 'chrome',
    headless: false,
    storageState: existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    // config.yaml pacing.slow_mo_ms: 500 — pause before each browser action so
    // the run looks like someone using the site. The gap between page loads is
    // handled by test-scripts/pacing.fixture.ts.
    launchOptions: { slowMo: 500 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
