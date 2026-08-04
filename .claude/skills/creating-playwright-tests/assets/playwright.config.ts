import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * TEMPLATE — copy into the TARGET FOLDER (next to that target's config.yaml)
 * and adapt. Every path below is relative to this file, so each target keeps
 * its own scripts and results:
 *
 *   <target-folder>/
 *   ├── playwright.config.ts   <- this file
 *   ├── test-scripts/          <- testDir
 *   └── test-results/
 *       ├── html-report/       <- HTML reporter
 *       └── artifacts/         <- outputDir: traces, screenshots, videos
 *
 * Run it FROM THE PROJECT ROOT with:
 *   npx playwright test --config <target-folder>/playwright.config.ts
 *
 * testDir / outputDir / the HTML outputFolder resolve relative to THIS FILE.
 * storageState and existsSync resolve relative to the CURRENT WORKING
 * DIRECTORY (verified) — which is why AUTH_FILE is written relative to the
 * project root, and why you run from there.
 *
 * Keep html-report/ and artifacts/ as SIBLINGS. If one sits inside the other,
 * Playwright fails with "HTML reporter output folder clashes with the tests
 * output folder".
 *
 * BOT PROTECTION (Imperva / hCaptcha / Cloudflare): the check is cleared once
 * by hand and the cookies saved to a storageState file (see save-auth.mjs).
 * Every run then reuses that "I'm human" clearance; when it expires, re-run the
 * auth helper. If the target site has NO bot protection, delete AUTH_FILE and
 * the channel/headless/storageState lines and run headless as normal.
 */
// Relative to the PROJECT ROOT (the cwd you run from), not to this file.
// A missing storageState file is a hard error, hence the existsSync guard below.
const AUTH_FILE = '.auth/<target-name>.json'; // <-- rename per target, or delete if unprotected

export default defineConfig({
  testDir: './test-scripts',
  outputDir: './test-results/artifacts',
  fullyParallel: false,
  // One worker: a burst of parallel sessions trips bot protection, and the
  // pacing fixture's navigation gap only holds across tests within a worker.
  workers: 1,
  retries: 0,
  // config.yaml pacing.test_timeout_seconds — paced tests spend most of their
  // time deliberately waiting, so the 30s default is far too tight.
  timeout: 120_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: './test-results/html-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://www.example.com', // <-- base_url from config.yaml
    // Real Chrome + headed is what reliably passes Imperva-style checks together
    // with the saved storageState. Drop these two lines if the site is unprotected.
    channel: 'chrome',
    headless: false,
    storageState: existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    // config.yaml pacing.slow_mo_ms — pause before each browser action so the
    // run looks like someone using the site, not a script hammering it. The gap
    // between page loads is handled by test-scripts/pacing.fixture.ts.
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
