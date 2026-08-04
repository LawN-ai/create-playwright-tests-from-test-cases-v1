# Playwright tests from test cases

Turns written test cases into runnable Playwright test scripts, one
self-contained folder per target site.

The work is done by the **`creating-playwright-tests`** skill — see
[.claude/skills/creating-playwright-tests/README.md](.claude/skills/creating-playwright-tests/README.md)
for the full guide: how to use the skill, how `config.yaml` works, and how to
run the generated tests yourself on macOS, Linux or Windows.

## Layout

```
test-target/
└── <target-name>/
    ├── config.yaml            the contract: URLs, paths, hard limits
    ├── playwright.config.ts   generated; paths resolve inside this folder
    ├── test-cases/            INPUT  — you write these
    ├── test-scripts/          OUTPUT — generated specs + run guide
    └── test-results/          OUTPUT — html-report/ + artifacts/ (gitignored)
```

Current targets: `sauce-demo`, `bupa-hospital`.

## Quick start

```bash
npm install
npx playwright install chrome
```

Run one target's suite:

```bash
npx playwright test --config test-target/<target-name>/playwright.config.ts
```

Open its report:

```bash
npx playwright show-report test-target/<target-name>/test-results/html-report
```

Tests are **generated** from the test cases in each target's `test-cases/`
folder — edit the cases and re-run the skill rather than hand-patching a spec,
so the two never drift apart.
