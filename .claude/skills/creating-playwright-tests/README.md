# creating-playwright-tests — how to use this skill

A Claude Code skill that turns **test cases you have already written** into
**runnable Playwright test scripts**, then runs them and saves the results.

It works against any website. Each site you test gets its own self-contained
folder, so nothing about one target leaks into another.

---

## What it does — and what it deliberately doesn't

**It does:**

- read a per-target `config.yaml` (or interview you if there isn't one)
- read the test cases you supply
- open the real pages in a browser and record the actual selectors, roles,
  labels and values — before writing a line of code
- write Playwright specs into the target's `test-scripts/` folder
- generate that target's `playwright.config.ts`
- run the suite and put the report and artifacts in `test-results/`
- write a plain-language run guide beside the specs

**It does not:**

- **write test cases.** Test cases are an input. If you don't supply any, the
  skill stops and asks — it won't invent a "starter set", and it won't add extra
  tests beyond the cases you gave it.
- solve CAPTCHAs. On a bot-protected site it opens a visible browser and asks
  *you* to clear the check once; the clearance is then reused.
- cross the hard limits in your `config.yaml` (login, payment, real
  submissions), during either exploration or testing.

---

## Folder layout

One folder per target site:

```
test-target/
└── sauce-demo/                  <- the target folder
    ├── config.yaml              the contract: URLs, paths, limits
    ├── playwright.config.ts     generated; all paths resolve inside this folder
    ├── test-cases/              INPUT  — you write these
    ├── test-scripts/            OUTPUT — generated specs + run guide
    └── test-results/            OUTPUT — gitignored
        ├── html-report/
        └── artifacts/
```

`test-target/` is just this project's convention — the skill uses whatever
folder you point it at.

---

## Using the skill (with Claude)

### 1. Put your test cases in place

Write them in `<target-folder>/test-cases/` as Markdown (or `.feature`). Any
readable format works; clearer cases produce better scripts. Give each case an
ID (`TC-01`, `TC-02`, …) — the generated tests keep those IDs, so a failure
points straight back to the case it came from.

### 2. Fill in `config.yaml`

Copy `assets/config.yaml.example` to `<target-folder>/config.yaml` and edit it.
Skip this if you'd rather be interviewed — the skill asks for the same
information and offers to save your answers as `config.yaml` afterwards.

| Field | What it's for |
|---|---|
| `target_name` | Short name for the target; the default spec name and the run guide's title |
| `base_url` | Site root, used as Playwright's `baseURL` |
| `target_urls` | The specific pages the test cases exercise; exploration stays on these |
| `paths.test_cases` | Where the skill **reads** cases from (never writes) |
| `paths.test_scripts` | Where generated specs go |
| `paths.test_results` | Where the report and artifacts go |
| `spec_file` | Name of the generated spec; the run guide takes its base name. Defaults to `<target_name>.spec.ts` |
| `boundary.scope` | How far exploration may roam: `page`, `section`, `domain` |
| `boundary.never_past` | Hard limits — login, payment, real submissions |
| `boundary.out_of_scope` | Anything else ruled out, and why |
| `test_data_rules` | The only source of values the tests may type into forms. Not covered → the skill asks |
| `browser.*` | `chrome` / `chromium` / `msedge`, headed or headless, workers |
| `pacing.*` | How gently to browse — see below |

Every field above is one the skill reads and acts on — there are no decorative
settings. Two things deliberately **aren't** configurable: bot protection, which
the skill decides by observation (it assumes a site is open and only sets up a
headed run with a saved clearance when a wall actually appears), and the test
cases themselves, which are always an input.

### Pacing — browsing like a person

Firing off page loads back to back is the clearest bot signal there is, and it
gets you rate-limited or shown a security wall part-way through a run — which
looks like flaky tests but isn't. The `pacing` block slows things down:

| Setting | Effect |
|---|---|
| `min_seconds_between_navigations` | Minimum gap between full page loads. Applies to the agent's own exploration *and* the generated suite. Default `10`; set `0` to disable |
| `slow_mo_ms` | Pause before each click, keystroke and selection (`slowMo`). Default `500` |
| `test_timeout_seconds` | Per-test timeout. Must allow for all that waiting — the Playwright default of 30s is far too tight for a paced suite |

In the generated suite the gap is enforced by `test-scripts/pacing.fixture.ts`,
which the specs import instead of `@playwright/test`. It holds *between* tests as
well as within one, which is why these suites run with `workers: 1`.

Need a quick, impolite run while debugging? Override it per run rather than
editing the file:

```bash
PACING_MIN_GAP_MS=0 npx playwright test --config test-target/<target-name>/playwright.config.ts
```

```powershell
$env:PACING_MIN_GAP_MS="0"; npx playwright test --config test-target/<target-name>/playwright.config.ts
```

### 3. Ask Claude

> Use the creating-playwright-tests skill on `test-target/sauce-demo`.

It will confirm the target folder, list the test cases it found, explore the
pages in a visible browser (watch along — on a protected site you may be asked
to clear a security check), write the specs, run them once, and report what
passed and failed.

### 4. Review

Check the generated spec and its run guide in `test-scripts/`. Non-obvious
locators carry an `// observed: …` comment recording what was actually seen on
the page — that's your audit trail.

---

## Running the tests yourself (no Claude needed)

Once generated, the tests are ordinary Playwright tests. Run them from the
**project root**.

### One-time setup

**macOS / Linux — Terminal (bash or zsh):**

```bash
npm install
npx playwright install chrome
```

**Windows — PowerShell:**

```powershell
npm install
npx playwright install chrome
```

`npx playwright install chrome` uses your system Google Chrome. Use
`npx playwright install chromium` for Playwright's bundled browser instead.
Don't run bare `npx playwright install` — it downloads Chromium, Firefox and
WebKit (hundreds of MB you don't need).

### Run a target's suite

Every command is the same on all three platforms; only the terminal differs.
Forward slashes in the `--config` path work in PowerShell too.

**macOS / Linux — bash / zsh:**

```bash
npx playwright test --config test-target/sauce-demo/playwright.config.ts
```

**Windows — PowerShell:**

```powershell
npx playwright test --config test-target/sauce-demo/playwright.config.ts
```

**Windows — Command Prompt (cmd.exe):**

```
npx playwright test --config test-target\sauce-demo\playwright.config.ts
```

### Useful variations

```bash
# watch it run in a visible browser
npx playwright test --config test-target/sauce-demo/playwright.config.ts --headed

# Playwright UI mode: pick tests, step through, time-travel
npx playwright test --config test-target/sauce-demo/playwright.config.ts --ui

# run one test by name (matches the TC id)
npx playwright test --config test-target/sauce-demo/playwright.config.ts -g "TC-03"

# run one spec file
npx playwright test --config test-target/sauce-demo/playwright.config.ts test-scripts/browse-to-checkout.spec.ts

# slow it down so you can see what's happening
npx playwright test --config test-target/sauce-demo/playwright.config.ts --headed --debug
```

### Where the results go

Everything lands under that target's `test-results/`:

| Path | Contents |
|---|---|
| `test-results/html-report/` | Browsable HTML report — every step, timing and failure |
| `test-results/artifacts/` | Screenshots, traces and videos from failing tests |

Open the report:

```bash
npx playwright show-report test-target/sauce-demo/test-results/html-report
```

It serves the report on a local port; press `Ctrl+C` to stop. `test-results/` is
gitignored — it's regenerated on every run.

### Optional: npm shortcuts

Add a script per target to `package.json` so you don't type the path:

```json
{
  "scripts": {
    "test:sauce-demo": "playwright test --config test-target/sauce-demo/playwright.config.ts",
    "report:sauce-demo": "playwright show-report test-target/sauce-demo/test-results/html-report"
  }
}
```

Then `npm run test:sauce-demo` — identical on macOS, Linux and Windows.

---

## Sites behind bot protection

If the target shows a CAPTCHA or "Additional security check" instead of the real
page (Imperva, hCaptcha, Cloudflare), you clear it **once by hand** and the tests
reuse that clearance:

```bash
node scripts/save-auth.mjs --url https://www.example.com/page --out .auth/example.json
```

A real Chrome window opens. Solve the check in the window; the cookies are saved
to the `--out` file, and the target's `playwright.config.ts` picks them up via
`storageState`. The clearance expires after a while — when tests start hitting
the wall again, run the command again.

Such targets must run **headed** with **real Chrome** and a **single worker**;
that combination, plus the saved clearance, is what gets waved through. Details
in `references/bot-protection.md`.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Error: No tests found` | The `--config` path is wrong, or `testDir` doesn't match where the specs actually are |
| `HTML reporter output folder clashes with the tests output folder` | `outputDir` and the HTML `outputFolder` overlap — keep `artifacts/` and `html-report/` as siblings |
| `browserType.launch: Chromium distribution 'chrome' is not found` | Google Chrome isn't installed — run `npx playwright install chrome`, or switch the config to `chromium` |
| `strict mode violation: locator resolved to 2 elements` | A hidden duplicate of the markup exists (mobile variant, drawer, template) — scope the locator to the visible container |
| Tests suddenly hit a security wall | The saved clearance expired — re-run the auth helper. If it started mid-run, the site is rate-limiting: raise `pacing.min_seconds_between_navigations` and let it cool down before retrying |
| Paced tests fail with "Test timeout of 30000ms exceeded" | The config's `timeout` doesn't allow for the pacing gaps — raise it |
| Pacing seems to have no effect | The spec is importing `test` from `@playwright/test` instead of `./pacing.fixture`, or `workers` is above 1 |
| A test fails after the site changed | The locator no longer matches. Re-run the skill so it re-reads the live page, rather than guessing at a new selector |

---

## Files in this skill

| File | Purpose |
|---|---|
| `SKILL.md` | The instructions Claude follows |
| `README.md` | This guide, for humans |
| `assets/config.yaml.example` | Template for a target's `config.yaml` |
| `assets/playwright.config.ts` | Template for a target's Playwright config |
| `assets/pacing.fixture.ts` | Spaces out page loads so the suite browses at a human pace |
| `assets/README.template.md` | Template for the run guide written beside the specs |
| `assets/save-auth.mjs` | Helper for saving a bot-protection clearance |
| `references/bot-protection.md` | The full CAPTCHA / storageState pattern |
