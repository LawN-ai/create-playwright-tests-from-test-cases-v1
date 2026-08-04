---
name: creating-playwright-tests
description: Turn test cases the user already has into runnable Playwright / browser end-to-end (UI) test scripts. Use this whenever the user wants to write, generate, scaffold or run browser/UI/e2e tests from written test cases, or automate a web page — even if they don't say "Playwright" by name. Reads a per-target config.yaml (target URLs, where the test cases live, where scripts and results go) and interviews the user when it is missing. Handles awkward real-world pages (shadow DOM / web components, sites behind CAPTCHA / bot protection like Imperva, hCaptcha, Cloudflare). The deliverable is always the test scripts — this skill never writes the test cases.
---

# Creating Playwright Tests

## Overview

**The deliverable is the test scripts.** Opening a browser, reading the DOM, and getting past a security check are only means to an end: writing selectors that match the real page. Keep that work minimal and fast, and spend your effort on the tests.

**The failure mode to avoid:** sinking far more time into browser-wrangling, security workarounds, and re-verification than into the tests themselves. Simple tests should be created quickly.

## Hard rule: test cases are an INPUT — never generate them

This skill converts **existing** test cases into scripts. It does **not** invent, expand, or "helpfully fill in" test cases.

- Every generated `test()` must map to a test case the user supplied. One test case → one `test()`.
- If a test case is ambiguous, **ask** — don't resolve it by inventing behaviour to assert.
- If no test cases have been provided, **stop and ask for them** (a folder, a file, or pasted text). Do not proceed by writing your own, and do not offer a "starter set" as a substitute.
- Do not add extra tests beyond the supplied cases. If exploration reveals something obviously worth testing, mention it to the user; only add it if they say yes.
- Never write to the `test-cases/` folder. It is read-only for this skill.

Writing the *test cases* is a separate job from writing the *scripts*. Keep them separate.

## Hard rule: never write a test before you've seen the live page

Do **not** write a single line of test code until you have **opened the real page in a browser and recorded the actual selectors and expected values** for every test case (workflow step 3). Exploring uses a browser you already have (the VS Code integrated browser or your agent's browser tool) — **Playwright does not need to be installed to explore or to write.** Playwright is only required later, to *run* the tests (step 5).

Every selector and assertion must come from what you **observed in the live DOM** — never from the test-case wording, a screenshot, an old test, memory, or **how a control "usually" works.** The test-case text tells you *what to verify*; only the live page tells you *how* (the real roles, accessible names, option values, headings, URLs). A test written before you've seen the page is guesswork — it will use wrong selectors and fail.

**This includes the control's *type* and how to drive it.** The accessibility tree is an abstraction, not the DOM: a labelled `generic`/group is not proof of a native `<select>`. Do not assume a "dropdown" is a native combobox and reach for `selectOption` — confirm the real tag/role/attributes first (see the Dropdowns gotcha). Verifying selectors but assuming the interaction method is the same failure in a different place.

The numbered workflow below is an **order, not a menu**: step 3 (see the page) gates step 4 (write). If you catch yourself about to type `getByRole(...)`, `selectOption(...)`, `toHaveText(...)` etc. without having confirmed that exact role/name/value on the live page — **stop and go look first.**

Efficient does not mean skipping this. "Efficient" = see the page **once**, gather everything, then write. It never means writing from assumptions.

## Stop and self-check before writing any locator

The moment you read the test case, your training hands you a plausible-looking test. **That instinct is the failure mode** — it produces selectors that match a *typical* page, not *this* one. Training data is never evidence about the page in front of you; only the live DOM is. A test that looks right but was never checked against the page is the single most common way this task fails.

Before writing a locator, ALL of these must be true. If any is false, go back to the page:

- [ ] I opened **this** URL in a browser during **this** session.
- [ ] I read the **real element** (tag + role + key attributes) for the control I'm targeting — not just its accessibility label.
- [ ] I can point to the **exact tool output** where I saw it (I am not recalling it from memory or training).
- [ ] I confirmed whether each dropdown is a native `<select>` or a custom widget.

If you're about to type a class, role, attribute, or option value from memory, or because "that's how these usually look" — **stop. You're assuming.** Go read the DOM.

## Folder layout (one folder per target site)

Each target site gets a self-contained folder. Nothing about one target leaks into another, so the same project can hold many unrelated sites.

```
<target-folder>/                 e.g. test-target/sauce-demo/
├── config.yaml                  the contract for this target (see below)
├── playwright.config.ts         generated in step 5; testDir + results point inside this folder
├── test-cases/                  INPUT  — supplied by the user; NEVER write here
├── test-scripts/                OUTPUT — the generated .spec.ts files + their run guide
└── test-results/                OUTPUT — HTML report and run artifacts (gitignored)
    ├── html-report/
    └── artifacts/
```

Folder names come from `config.yaml`. The defaults are `test-cases`, `test-scripts`, `test-results`; use whatever the config says. **Generated scripts always go in the `test_scripts` folder — never beside the test cases, and never in a project-level `tests/` folder.**

## The contract: config.yaml

Before doing anything else, look for `config.yaml` in the target folder (the template is `assets/config.yaml.example`, which mirrors the `.env.example` pattern: the `.example` file is never a real target's values).

**If `config.yaml` exists:** read it and treat it as the contract for the run. Respect `boundary.never_past` and `out_of_scope` absolutely — they are hard limits on what the tests may do, not suggestions.

**Every field in the file is one this workflow acts on** — `target_name` and `spec_file` name the spec (step 4) and its run guide (step 7), `paths.*` decide what gets read and written, `target_urls` bound exploration (step 3), `boundary.*` are hard limits, `test_data_rules` is the only source of form input (step 4), `browser.*` and `pacing.*` configure the runner (step 5). If you find a field nothing here consumes, say so instead of quietly honouring it — an unread field is a comment pretending to be configuration. Equally, don't invent new fields without adding the step that uses them.

**Bot protection is deliberately not a config field.** Assume a site is open and only build headed + `storageState` if a wall actually appears (see "Don't pre-build security infrastructure" and `references/bot-protection.md`). That decision comes from observation, not declaration.

**If it does not exist:** interview the user for whatever they haven't already told you, then offer to save their answers as `config.yaml` so the next run doesn't ask again:

1. **Which folder holds the test cases?** (and which files in it are in scope)
2. **Target URLs** — the base URL and the specific pages the cases exercise, if the test cases don't already state them.
3. **Where should the generated scripts and results go?** (default: `test-scripts/` and `test-results/` beside the test cases), and **what should the spec be called** (default `<target_name>.spec.ts`).
4. **Browser** — real Chrome or bundled Chromium; headed or headless.
5. **Hard limits** — anything the tests must never do (log in, create an account, submit a payment or a real application).
6. **Test data rules** — what may be typed into forms. Ask even if the cases look read-only; it's the difference between made-up details and a real person's.
7. **Pacing** — how gently to browse. Default to `min_seconds_between_navigations: 10` and `slow_mo_ms: 500` unless the user wants it faster; a site you don't own deserves the polite default.

Never assume any of these. In particular, never assume the save location.

## Pace yourself — browse like a person, not a script

A real visitor loads a page, looks at it, then moves on. A browser that fires ten
full page loads in ten seconds is the single clearest bot signal there is, and it
gets you rate-limited or served a security wall — often part-way through a run,
which looks like flaky tests but isn't.

`config.yaml`'s `pacing` block governs **both** your own exploration and the
generated suite. Honour it in step 3 as well as step 5:

- **Space out full page loads** by `pacing.min_seconds_between_navigations`. This is the one that matters — navigations, not reads.
- **Prefer in-page interaction over reloading.** Reading the DOM, taking snapshots and inspecting elements are free — do many of those per page load, not the reverse. Gather everything about a page in one visit rather than returning to it.
- **Never retry a security wall.** If a challenge appears, stop, tell the user, and read `references/bot-protection.md`. Reloading into it makes the block harder and longer.
- **Back off when you see trouble** — a slow response, a partial page, a challenge. Wait longer, don't push harder.

Pacing is not the same as being slow to finish: gather facts in one thorough pass
per page, then write. Being *unhurried per page load* and being *efficient
overall* are the same discipline.

## Work efficiently

- **One browser session.** Open the page **once** and, in that single session, collect everything you need for **all** the test cases: exact accessible names, roles, option values, headings, and whether any action changes the URL. Then close it. Don't reopen the browser per control or per check.
- **Write, then validate once.** Write all the test code from your notes, then do **at most one** run to confirm it passes. Don't loop open → check → close → open.
- **Don't pre-build security infrastructure.** Only deal with CAPTCHA / storageState **if the page actually blocks you.** If it loads fine, skip all of it and use a plain config.
- **Use a headed (visible) browser while exploring and building.** Open the page headful so the user can watch what you're doing and step in if needed (e.g. a CAPTCHA). This is about *your* authoring session — separate from how the finished suite runs.
- **Default the generated suite to the simple path.** For an unprotected site the finished tests can run headless for speed — no storageState, no auth helper. (Headed + storageState is only for sites that block automation; see the bot-protection reference.)

## Workflow

1. **Read the contract.** Find `config.yaml` in the target folder; if it's missing, run the interview above and offer to save it. Confirm the target folder with the user before writing anything into it.

2. **Read the supplied test cases** from the `test_cases` folder. List them back to the user as the set you're about to automate, and flag any that are ambiguous or that the boundary rules put out of reach (e.g. a case that ends in a real payment). **Do not write or extend test cases** — see the hard rule.

3. **Open the pages and explore — with a browser you already have. No Playwright needed yet.** Gathering selectors does not require Playwright. Open the URLs from `config.yaml` **headed/visible** so the user can follow along, using the first available option:
   1. the **VS Code integrated browser** (Simple Browser / built-in web view), or
   2. the **browser tool your agent/harness exposes** (a navigate/open-page tool).

   In one pass, for every test case, record the exact accessible names, roles, option values, headings/text, and whether any action changes the URL. Don't loop.
   - **Confirm the real element — the accessibility tree is an abstraction, not the DOM.** A `generic` / labelled group is **not** proof of a native control. For every element you'll drive, check its actual **tag, role, and key attributes** (inspect `outerHTML` or use the tool's element inspector — e.g. `page.locator(...).evaluate(el => el.outerHTML)`). In particular, decide whether each "dropdown" is a native `<select>` or a custom widget (see the Dropdowns gotcha), because they need *different* code, and **record how you'll drive each one.**
   - **Capture the evidence as notes — this is a required deliverable of step 3, not an optional glance.** For each control and each assertion target, write down, *copied from the tool output* (not paraphrased or remembered): the real tag, role, key attributes, and the exact option values / text. This evidence list is the **only** allowed source for the locators you write in step 4. Rule of thumb: **if you can't point to the tool output where you saw a fact, you have not observed it — go look.**
   - **Stay inside the boundary.** Never cross a `never_past` line to "check what happens" — including during exploration.
   - **Keep to the pacing contract** while you explore — space your own page loads by `pacing.min_seconds_between_navigations` and get everything you need from each page before moving on. See "Pace yourself" above.
   - **Only if neither an integrated browser nor an agent browser tool can open the page** → install Playwright (jump to step 5's commands) and use it as the fallback browser: `npx playwright open <url>`.
   - **If a CAPTCHA / bot wall blocks you →** read `references/bot-protection.md`.

4. **Write the scripts into the `test_scripts` folder** (only after step 3 — see the Hard rule), named from `config.yaml`'s **`spec_file`** — or `<target_name>.spec.ts` when `spec_file` is absent. Don't invent a third name. When `config.yaml` has a `pacing` block, first copy `assets/pacing.fixture.ts` into that folder, set its `DEFAULT_MIN_GAP_MS` from `pacing.min_seconds_between_navigations`, and have the specs `import { test, expect } from './pacing.fixture'` instead of from `@playwright/test` — otherwise the pacing contract silently does nothing. One `test()` per supplied test case, named after the case (keep its ID, e.g. `TC-03: catalog link opens the all-products collection`, so a failure points straight back to the source case).

   **Anything typed into the page comes from `test_data_rules`.** That field is the only sanctioned source of form input — names, emails, addresses, card numbers, search terms. Never substitute a real person's details, never reuse data you saw on the site, and never invent a value for a field the rules don't cover: **ask instead.** The same applies to anything you type while exploring in step 3.

   **Design the specs for few page loads.** Each `goto` costs a pacing gap, so get what a test needs from the pages it must visit rather than bouncing between them. Don't add a navigation just to reset state that a fresh browser context already gives you (cookie-based carts, for instance, start empty in every test). **Every locator and expected value must trace back to a fact you captured in step 3** — nothing invented at write-time. Add a brief `// observed: …` comment on non-obvious locators (e.g. `// observed: <select name="paying"> options WEEKLY|FORTNIGHTLY`) so the evidence is visible; if you can't write that comment from your notes, you're assuming — return to step 3. This is the main work. You do **not** need Playwright installed to write the spec files.

5. **Set up the runner.** Two parts:

   **(a) Install Playwright** — needed only to *run*, not to explore or write. If `npx playwright --version` already works and `@playwright/test` is in `package.json`, skip this. Otherwise, in the project directory, run these **exact commands** (don't paraphrase):

   ```bash
   npm init -y                      # ONLY if there is no package.json yet
   npm install -D @playwright/test  # the test runner
   npx playwright install chrome    # real Google Chrome — matches channel: 'chrome'
   ```

   - Use **`npx playwright install chrome`** (system Google Chrome). **Do NOT run bare `npx playwright install`** — it downloads Chromium + Firefox + WebKit. (Use `npx playwright install chromium` only if you deliberately want the bundled engine instead of real Chrome.)
   - Confirm the directory with the user before installing — never install into an assumed location.

   **(b) Generate the target's `playwright.config.ts`** from `assets/playwright.config.ts`, saved in the target folder so every path resolves inside it:

   ```ts
   testDir: './test-scripts',                                            // from config.yaml paths.test_scripts
   outputDir: './test-results/artifacts',                                // traces, screenshots
   reporter: [['list'], ['html', { outputFolder: './test-results/html-report', open: 'never' }]],
   workers: 1,                                                           // the pacing gap only holds within a worker
   timeout: 120_000,                                                     // pacing.test_timeout_seconds — paced tests spend time waiting
   use: {
     baseURL: '<base_url from config.yaml>',
     launchOptions: { slowMo: 500 },                                     // pacing.slow_mo_ms
   }
   ```

   Two path rules, both verified:
   - Keep `outputDir` and the HTML `outputFolder` as **separate siblings** under `test-results` — if one contains the other, Playwright fails with "HTML reporter output folder clashes with the tests output folder".
   - `testDir` / `outputDir` / `outputFolder` resolve **relative to the config file**, but `storageState` (and any `existsSync` check in the config) resolves **relative to the cwd**. Write the auth path relative to the project root and run from there. A missing `storageState` file is a hard error, so keep the `existsSync(...) ? … : undefined` guard.

6. **Run the tests and land the results in `test-results`.** Run the suite **once**, from the **project root**, with the target's config:

   ```bash
   npx playwright test --config <target-folder>/playwright.config.ts
   ```

   - Useful variations: `--headed` (watch it), `--ui` (Playwright UI mode), `-g "TC-03"` (one test), `--project=chromium`.
   - Read the output and fix **real** failures — a failure usually means the locator or expected value doesn't match the live page, so go back to your step-3 notes (or the page) rather than loosening the assertion until it passes. Never delete or weaken a test case's assertion to make it green; if the site genuinely behaves differently from the test case, report that to the user as a finding.
   - Don't re-run repeatedly. One run, fix, one confirming run.
   - Afterwards the report is at `<target-folder>/test-results/html-report`; open it with
     `npx playwright show-report <target-folder>/test-results/html-report`.
   - Make sure `test-results/` is gitignored.
   - **Report the outcome honestly** — how many passed and failed, and which. Never claim the suite passes without having read the run output.

7. **Write a run guide next to the scripts (required — don't skip).** Copy the standard template `assets/README.template.md` into the **`test_scripts` folder**, with the **same base name** as the spec from step 4 — e.g. `spec_file: checkout.spec.ts` → `test-scripts/checkout.md` — and title it after `target_name`. Fill in every placeholder and keep the section order fixed so the guide is standardised across targets. It always includes: **What's covered** (one row per test, in plain language), **Run the tests** (commands for both macOS/Linux and Windows), and **See the test report** — plus the security-check section *only* if the site needed one. Naming it after the spec and keeping it in the scripts folder deliberately avoids creating or overwriting a project-level `README.md`. If that companion doc already exists, update it rather than replacing it.

## Locator gotchas (brief)

- **Shadow DOM / web components:** elements appear in the accessibility snapshot but `document.querySelector` returns nothing. Use role/text locators (`getByRole`, `getByText`, `getByLabel`) — they pierce open shadow DOM. Content in an `<iframe>` → use `frameLocator`.
- **Navigation / URL change:** an action may change the URL, often via SPA navigation with **no full reload** (easy to miss — that's why step 3 says to note it). Assert it with `await expect(page).toHaveURL(/…/)`. Playwright auto-waits handle the *timing*; the URL assertion *verifies* it happened. Use locators (they re-resolve across navigation); avoid `ElementHandle` / `page.$()` (goes stale).
- **Hidden duplicates:** themes and frameworks often ship a second copy of the same markup (a mobile variant, an off-screen drawer, a template block) — so one visible control can match two elements and trip Playwright's strict mode. Scope locators to the visible container, or filter with `.filter({ visible: true })`.
- **Dropdowns are NOT always native `<select>` — verify the tag before choosing how to drive it.** The a11y label ("Payment frequency") and appearance tell you nothing about the interaction contract. Check the real element:
  - **Native `<select>`** → `getByRole('combobox', { name }).selectOption({ label })`. The underlying `value` may differ from the visible label (e.g. `WEEKLY` vs "Weekly").
  - **Custom widget** (a `div`/`button` with `role="button"`/`role="combobox"` + `aria-haspopup="listbox"`, often wrapping a hidden `<input>`) → **`selectOption` will throw / not work.** Drive it like a user: **click to open, then click the option.**
    ```ts
    await page.getByRole('button', { name: 'Payment frequency' }).click();
    await page.getByRole('option', { name: 'Fortnightly' }).click();
    ```
  Never infer "it's a combobox, use `selectOption`" from the label or from how such controls *usually* work — confirm the tag/attributes in step 3 first.

## Browser tool for exploring (step 3)

Use the first available: (1) the **VS Code integrated browser**, (2) **any browser/navigate tool your agent exposes** (e.g. a Chrome extension or MCP browser — a "not connected"/unavailable error means skip it), else (3) **Playwright as a fallback** once installed — `npx playwright open <url>` or `playwright-cli open --headed <url>`. Prefer an integrated/agent browser; only reach for Playwright here if you have no other way to load the page.

## If the site blocks you (bot protection)

Only relevant when you actually hit a CAPTCHA / "Additional security check" wall. The short version: run **headed** with real Chrome and reuse a saved `storageState` (the user solves the CAPTCHA once). **You must never solve or bypass CAPTCHAs yourself.** Full pattern, seeding trick, and templates: **`references/bot-protection.md`**, `assets/playwright.config.ts`, `assets/save-auth.mjs`.

## Never assume

- **Test cases** → they are supplied, never generated. Missing or unclear → ask.
- **Install location / save location** → read `config.yaml`, or confirm with the user.
- **Spec filename** → `spec_file`, else `<target_name>.spec.ts`. Don't invent one.
- **Form input** → only what `test_data_rules` allows; if it doesn't cover a field, ask.
- **Selectors, option values, headings, URL changes** → read them from the live page in your single exploration pass.
- **A control's type and how to drive it** (native `<select>` vs custom widget) → confirm the real tag/role/attributes; don't infer it from the a11y label or from how the control "usually" behaves.

## Common mistakes

| Mistake | Fix |
|---|---|
| Writing or "rounding out" test cases because none were given, or adding extras | Test cases are an input — ask for them; automate exactly the supplied set |
| Hammering the site with back-to-back page loads while exploring | Honour `pacing.min_seconds_between_navigations`; read a lot per load, load rarely |
| Copying `pacing.fixture.ts` but still importing `test` from `@playwright/test` | The import is what activates pacing — import from `./pacing.fixture` |
| Paced tests failing on the 30s default timeout | Raise `timeout` in the config; waiting is most of a paced test's runtime |
| Retrying into a security wall until it "works" | Stop at the first challenge, tell the user, read `references/bot-protection.md` |
| Writing generated specs beside the test cases or into a project-level `tests/` | Scripts go in the target's `test-scripts` folder, per `config.yaml` |
| Ignoring `config.yaml`, or assuming paths/URLs when it's absent | Read the contract first; if missing, interview and offer to save it |
| Naming the spec something other than `spec_file` / `<target_name>.spec.ts` | The contract names the file; the run guide takes its base name |
| Typing invented test data into a form | Only `test_data_rules` values; not covered → ask, don't improvise |
| Crossing a `never_past` line (login, payment, real submission) to see what happens | Boundaries are hard limits, in exploration as well as in tests |
| Spending more effort on browser/security than on the tests | The test code is the deliverable — gather facts once, then write |
| Repeatedly opening/closing the browser to re-check | One session for all facts; one run to validate |
| Building headed + storageState + auth helper for a site that isn't blocked | Use a plain headless config unless a wall actually appears |
| Writing ANY test code before opening the page and observing the live DOM | Hard rule: explore first (step 3) — it gates writing (step 4) |
| Installing Playwright before exploring, thinking it's needed to gather info | Explore with the integrated/agent browser; install Playwright later (step 5), only to run |
| Writing selectors from the test-case text, a screenshot, memory, or training patterns | Selectors come only from observed live-DOM tool output — every locator must trace to a step-3 note |
| `document.querySelector` finds nothing → "element doesn't exist" | It's shadow DOM — use `getByRole`/`getByText` |
| Strict-mode violation on an obviously unique control | A hidden duplicate exists — scope to the visible container |
| Trusting the a11y label/role instead of the real element | The a11y tree is an abstraction — check the actual tag + attributes (`aria-haspopup`, hidden `<input>`) |
| Assuming a "dropdown" is a native `<select>` and using `selectOption` | Verify the tag; custom ARIA widgets need click-to-open then click the option |
| Missing that an action changed the URL (SPA nav, no reload) | Note `page.url()` before/after in step 3; assert `toHaveURL` |
| HTML report folder nested inside `outputDir` (or vice versa) | Keep `html-report/` and `artifacts/` as siblings under `test-results/` |
| Weakening an assertion until the test goes green | Re-check the page; if the site really differs from the test case, report it as a finding |
| Claiming the tests work without running them | Run once; read the pass/fail output and report it honestly |
| Running bare `npx playwright install` (downloads Chromium + Firefox + WebKit) | Scope it: `npx playwright install chrome` (system Chrome) or `... chromium` |
| Skipping the run guide, or writing a root `README.md` that overwrites an existing one | Write a companion `<same-name-as-spec>.md` in the `test-scripts` folder |
