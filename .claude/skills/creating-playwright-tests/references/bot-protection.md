# Bot protection (read only when a site actually blocks you)

Use this **only** if, during exploration, the page shows a CAPTCHA / bot wall
(Imperva "Additional security check", hCaptcha "I am human", Cloudflare, etc.)
instead of the real content. If the page loads normally, ignore this file and
use a plain headless config.

**You must never solve or bypass a CAPTCHA yourself. Hand that step to the user
in a visible (headed) window.**

## The storageState pattern

Once a human clears the check, the site drops a cookie that says "already
verified." Save those cookies to a JSON file (`storageState`) and every test run
reuses them, so the automated browser is waved through.

1. Run **headed** with **real Chrome** (`channel: 'chrome'`, `headless: false`),
   and `workers: 1` (a burst of parallel sessions can re-trip the protection).
   Set `browser.headed: true` in the target's `config.yaml`, and record what you
   saw in the run guide beside the specs, so later runs don't rediscover it the
   hard way. There is deliberately no `bot_protection` config field — this
   situation is diagnosed by observation, never declared up front.
2. The user solves the CAPTCHA once in the visible window; save cookies to a
   `storageState` file with the helper:

   ```bash
   node scripts/save-auth.mjs --url <page-url> --out .auth/<target>.json \
     --ready-text "<text only on the real page>"
   ```

3. Point the target's config at that file (see `assets/playwright.config.ts`,
   `AUTH_FILE`). Every run reuses the clearance.
4. The cookie **expires** after a while. When tests hit the wall again, the user
   re-runs the auth helper. Make the spec fail fast with a message that says so,
   e.g. assert the real page's key element is visible in `beforeEach` with a
   clear failure message pointing at the auth step.

## Seeding trick (skip the manual step)

If you *already* have a cleared browser session open (e.g. you got through during
exploration), export its cookies directly instead of making the user solve the
CAPTCHA again:

```bash
# with playwright-cli's already-cleared session:
playwright-cli state-save .auth/<name>.json
```

Then the very first `npx playwright test` reuses it — no separate auth run
needed until the cookie expires.

## Templates

- `assets/playwright.config.ts` — headed real-Chrome config with conditional
  `storageState`, copied into the target folder (drop the
  `channel`/`headless`/`storageState` lines for an unprotected site).
- `assets/save-auth.mjs` — one-time helper: opens headed Chrome, waits for the
  user to clear the check, saves `storageState` to the `--out` path.

## Keep it proportionate

This whole area is a workaround to reach the real page, not the goal. Set it up
once, get through, and get back to writing the tests. Don't iterate on auth
infrastructure beyond what's needed to load the page.
