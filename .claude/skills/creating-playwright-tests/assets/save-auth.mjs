// One-time (occasionally repeated) helper to get past a site's CAPTCHA / bot
// protection and save the resulting clearance cookies to disk.
//
// Usage:
//   node scripts/save-auth.mjs --url <page-url> --out <.auth/file.json> [--ready-text "..."]
//
// Example:
//   node scripts/save-auth.mjs --url https://www.example.com/quote --out .auth/example.json
//
// A real Chrome window opens on the page. If a security check ("I am human" /
// "Additional security check") appears, YOU solve it in the window. As soon as
// the real page is detected, the cookies are saved and the browser closes.
// Test runs then reuse that file via `storageState` in playwright.config.ts.
//
// --ready-text is optional: text that appears ONLY on the real page, never on
// the security wall. Without it the helper waits for the first <h1>.

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const URL = arg('url');
const AUTH_FILE = arg('out');
const READY_TEXT = arg('ready-text');
const WAIT_MS = 3 * 60 * 1000; // up to 3 minutes to solve the check

if (!URL || !AUTH_FILE) {
  console.error(
    'Usage: node scripts/save-auth.mjs --url <page-url> --out <.auth/file.json> [--ready-text "..."]',
  );
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log(`\nOpening ${URL} …`);
console.log('If a security / "I am human" check appears, please solve it in the window.\n');

await page.goto(URL, { waitUntil: 'domcontentloaded' });

try {
  // Something that exists ONLY on the real page, never on the security wall.
  const ready = READY_TEXT
    ? page.getByText(READY_TEXT, { exact: false })
    : page.getByRole('heading', { level: 1 });
  await ready.first().waitFor({ state: 'visible', timeout: WAIT_MS });

  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`\n✅ Saved clearance to ${AUTH_FILE}. Test runs will now reuse it.`);
} catch {
  console.error(
    '\n❌ Timed out waiting for the real page. The security check was not cleared in time.\n' +
      '   Re-run this helper and solve the check when the window opens.',
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
