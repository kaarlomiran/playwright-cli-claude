Summary: 
- This is a simple set up for playwright-cli project that uses traces, and playwright dashboard to create test plans and test execution reports via the actual app and not halluciante.
- By adding input test scope from a test mgt tool like azure dev ops or jira, and one prompt it will generate test plans and generate test reports.
- When qa enginner analyzes that the recently generated test cases, test plans merit a test automation script, it will only require a separate prompt and it will re use the same snapshot tree it used to navigate and generate test automation script. The Test Automation Report will be generated separately again with traces too.
- I will add the prompts later and add more commands to check playwright/traces to investigate any bugs or variances that the playwright-cli had captured
- Updates to follow on integrating playwright/dashboard and playwright/annotations that will be useful for test executions
- Updates to follow to resolve action failed runs

---


----
# QA Automation Playbook

**Author:** km  
**Last updated:** Sep 30, 2026  
**Repo:** [github.com/kaarlomiran/playwright-cli-claude](https://github.com/kaarlomiran/playwright-cli-claude)

## Contents

1. [Overview](#overview)
2. [Step 1 — Create a test plan](#step-1--create-a-test-plan)
3. [Step 2 — First test execution and test summary](#step-2--first-test-execution-and-test-summary)
4. [Step 3 — Generate test automation scripts](#step-3--generate-test-automation-scripts)
5. [Step 4 — Run the automation and re-check the test summary](#step-4--run-the-automation-and-re-check-the-test-summary)
6. [Prompts used](#prompts-used)
7. [Using Playwright traces](#using-playwright-traces)
8. [Using test reports — local and published](#using-test-reports--local-and-published)
9. [Command cheat sheet](#command-cheat-sheet)

## Overview

```text
Plan ──▶ Generate ──▶ Run ──┬──▶ (green) ──▶ CI publishes report
                            │
                            └──▶ (red) ──▶ Heal ──▶ Run again
```

Reading: `debug/INDEX.md`, the JUnit XML and the HTML report regenerate on every run, pass or fail. Only a red run detours through Heal before the retry. `playwright-cli` drives Plan and the locator-verification part of Generate; `@playwright/test` (via `npm test` / `npm run test:evidence`) drives Run; CI republishes whatever the latest run produced to GitHub Pages regardless of outcome.

Everything above is a post-run artifact — something you read after the fact. `npx playwright cli show` is the one exception: a live dashboard onto a session that's running right now, with full remote control. See [Monitor](#command-cheat-sheet) in the cheat sheet.

## Step 1 — Create a test plan

A test plan is never written from memory or from a ticket alone — it comes from actually driving the live app with `playwright-cli` and writing down what's really there. The exact prompt is in [Prompt 1 — Planner](#prompts-used).

1. Launch a seed test paused for live exploration (a seed just navigates and logs in, then stops):

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/auth/standard-login.spec.ts --debug=cli
# background; prints a session name like tw-fa90e5
```

2. Attach and drive the paused browser:

```bash
npx playwright cli attach tw-fa90e5
npx playwright cli -s=tw-fa90e5 resume
npx playwright cli -s=tw-fa90e5 --raw snapshot
npx playwright cli -s=tw-fa90e5 find "Remove"
npx playwright cli -s=tw-fa90e5 --raw eval "el => el.getAttribute('data-test')" e35
npx playwright cli -s=tw-fa90e5 click e35
```

Every command prints the equivalent Playwright TypeScript — that's the raw material for the automation script written in Step 3.

Optional: instead of driving the session blind through `-s=tw-fa90e5 snapshot`/`find`/`click`, open a live view of it:

```bash
npx playwright cli show --port 4949
# open http://localhost:4949 — click into the session's viewport to
# take control, Escape releases it back
```

`--host` defaults to localhost. Don't widen it without your team's normal remote-access controls already in place (VPN, SSH tunnel) — it hands out full mouse/keyboard control of a session that may already be signed in. `npx playwright cli show --kill` when done; it runs as a background daemon and won't stop on its own.

3. Close the session and write the numbered plan to `specs/<feature>.md`: one group per feature area, each scenario with a file path, priority, tags, numbered steps, and `- expect:` bullets that become assertions later.

```bash
npx playwright cli -s=tw-fa90e5 close
```

Real example from this session: [specs/cart-checkout-confirmation.md](https://github.com/kaarlomiran/playwright-cli-claude/blob/main/specs/cart-checkout-confirmation.md) — every `data-test` id and computed total in it was confirmed live, including one case where the plan's source ticket assumed a feature (a PDF receipt) that turned out to actually exist.

## Step 2 — First test execution and test summary

Before generating a full automation script, run whatever already exists for the scenario (even just the seed) to confirm the plan matches reality, and read the run summary rather than trusting the plan on faith.

```bash
npm test                       # quick pass/fail, terminal only
npx playwright test tests/auth/standard-login.spec.ts --trace on
```

`debug/INDEX.md` is the run manifest — a custom reporter (`src/reporters/evidence.ts`) regenerates it after every single run, pass or fail, linking each test to its trace, video, screenshot, tags and spec/ticket annotations:

```markdown
# Evidence index

Run: 2026-09-29T16:32:21.464Z · 1 passed, 0 failed

| test | status | trace | video | screenshot | tags | annotations |
|---|---|---|---|---|---|---|
| chromium › auth/standard-login.spec.ts › ... | PASSED | debug/traces/.../trace.zip | debug/videos/....webm | debug/screenshots/....png | @smoke @critical | spec:specs/saucedemo-login.md#1.1 |
```

Once a scenario is confirmed, its plan entry gets a status marker so the plan and the code stay traceable to each other: `**Status:** GENERATED, PASSING (verified 2026-09-29).`

## Step 3 — Generate test automation scripts

Generating turns a plan scenario into a real Playwright test, one scenario at a time — never batch-generated unreviewed. Every locator is re-verified live with the same `playwright-cli` mechanic as Step 1 before it's written into code, even when the plan already documents it. The exact prompt is in [Prompt 2 — Generator](#prompts-used).

Page Object Model rules this repo enforces:

- Specs import `{ test, expect }` from `src/fixtures/base.ts`, never `@playwright/test` directly.
- Page objects extend `BasePage`, live in `src/pages/`, one class per file — **ask before creating a new one**.
- Locators: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByTestId`. No CSS, no XPath.
- Multi-action page-object methods wrap in `this.step('business verb', ...)` so the trace reads as business steps.
- Test data comes from `tests/data/*.json`, never literals in specs.

Real example from this session: generating `tests/checkout/add-two-items-checkout-and-confirm.spec.ts` added four new page objects (`CartPage`, `CheckoutInformationPage`, `CheckoutOverviewPage`, `CheckoutCompletePage`), registered them in `src/fixtures/base.ts`, and added `tests/data/checkout.json` for the customer info and cart items — all verified against the live DOM first:

```bash
npx playwright cli -s=tw-8112e5 --raw eval "() => document.querySelector('[data-test=\"item-quantity\"]')?.textContent" 
```

Then run the new spec on its own before folding it into the suite:

```bash
npx playwright test tests/checkout/add-two-items-checkout-and-confirm.spec.ts --trace on
```

## Step 4 — Run the automation and re-check the test summary

```bash
npm test                  # playwright test — fast pass/fail
npm run test:evidence     # playwright test --trace on, full evidence pass
npm run test:smoke        # only @smoke-tagged tests
npx playwright test --headed          # visible browser, whole suite
npx playwright test <file> --headed   # visible browser, one file
```

`test:evidence` looked redundant on paper (trace/video already default to `'on'` in `playwright.config.ts`), but the script that shipped with this repo actually had two real bugs, both caught by running it rather than trusting it: `--video on` isn't a real CLI flag on the installed Playwright version, and `--reporter=list,html` was silently replacing the config's whole reporter array — dropping JUnit and the custom evidence reporter that writes `debug/INDEX.md`. Fixed to plain `playwright test --trace on`.

After a real run, three places carry the same result at different levels of detail:

| Report | Where | Best for |
| --- | --- | --- |
| `debug/INDEX.md` | repo, committed | quick scan, links every artifact per test |
| `debug/reports/junit-results.xml` | repo, committed | CI dashboards, machine-readable |
| `playwright-report/` (HTML) | gitignored, local | `npm run dashboard` — visual, embeds traces/videos |

Real result from this session's final batch run: **3 passed, 0 failed** across login, checkout, and the PDF-receipt scenario.

## Prompts used

Two prompts drive the pipeline. Replace the `<placeholders>` with your own ticket, area and scenario names. The Planner prompt explores the live app and writes the test plan, and the Generator prompt turns that plan into automation scripts.

### Prompt 1 — Planner (test plan, execution and summary)

```text
Act as the Planner from the playwright-cli test-generation skill.

INPUT — read these before opening any browser:
1. tickets/<your-file>.md   — acceptance criteria (the oracle for "correct")
2. sessions/*.md            — if an exploration session exists for this area,
                               read it next; plan ONLY its AUTOMATE rows

Explore https://www.saucedemo.com using playwright-cli (not MCP,
not raw @playwright/test code).

Plan only what tickets/<your-file>.md's Acceptance criteria section
covers. Do not invent scenarios beyond it.

Rules:
- Read-only exploration. Do NOT write any test code.
- Cite source: tickets/<your-file>#AB<id> on every scenario.
- If the ticket's acceptance criteria and a session report disagree
  about expected behaviour, STOP and report the disagreement — do
  not silently pick one.
- Save the plan to specs/<area>.md
- Two-part scenario numbers (1.1, 1.2, ...)
- Each scenario: priority, tags, preconditions, steps, expected
  assertions — assertions must be specific, not "page loaded"
- Record the exact accessible names / test ids you observed

Approach:
1. playwright-cli open <url> --headed
2. playwright-cli snapshot to get element refs
3. Walk each acceptance-criterion, noting real behaviour
4. Consolidate into the plan file, then close the session
```

### Prompt 2 — Generator (test automation scripts, single plan)

```text
Act as the Generator from the playwright-cli test-generation skill.
Follow the pom-framework skill for all conventions.

INPUT: specs/Testkm_SampleTestScopeRequirements.md — implement every
scenario in this plan, in order, one at a time.

For EACH scenario:
1. Use playwright-cli (open → snapshot) to verify every locator
   against the live app before writing it. Resolve locators from
   debug/snapshots/*.yaml first if a matching one exists; only fall
   back to a live snapshot for what the YAML doesn't cover.
2. ASK before creating any new file under src/pages/.
3. Wrap page-object actions in test.step() so the trace reads as
   business steps.
4. Save the spec at tests/<area>/<scenario-slug>.spec.ts
5. Annotate the test: test.info().annotations.push(
     { type: 'spec', description: 'specs/Testkm_SampleTestScopeRequirements.md#<id>' },
     { type: 'ticket', description: 'tickets/<file>#AB<id>' },  // if this
       // scenario cites a ticket source in the plan — carry the citation through
     { type: 'owner', description: 'qa-guild' },
   );
6. Run: npx playwright test tests/<area>/<scenario-slug>.spec.ts --trace on --video on
7. Fix and re-run until green. Never weaken an assertion to pass, never
   add waitForTimeout, never skip/fixme a failure — if it looks like a
   real app bug rather than a locator issue, STOP that scenario and
   report it instead of forcing it green.
8. Report: files created, locators used, final run output.
9. Move to the NEXT scenario only after this one is green — do not
   batch-generate the whole file unreviewed.

When all scenarios are done, report a summary table: scenario id |
spec file | status | source citation. Run npx playwright test
--reporter=./src/reporters/evidence.ts afterward so debug/INDEX.md
reflects the full batch.
```

### Prompt 2b — Generator, two-plan variant (as run in this session)

Same contract as Prompt 2, but it implements two plan files in order (login first, then checkout) and cites the source ticket on every scenario.

```text
Act as the Generator from the playwright-cli test-generation skill.
Follow the pom-framework skill for all conventions.

INPUT — implement every scenario in these plans, one plan at a time,
one scenario at a time within each:
1. specs/saucedemo-login.md
2. specs/cart-checkout-confirmation.md

Both plans were generated by the Planner from
tickets/Testkm_SampleTestScopeRequirements.md — cite that ticket on
every scenario from either file (see step 5).

For EACH scenario, in each plan in order:
1. Use playwright-cli (open → snapshot) to verify every locator
   against the live app before writing it. Resolve locators from
   debug/snapshots/*.yaml first if a matching one exists; only fall
   back to a live snapshot for what the YAML doesn't cover.
2. ASK before creating any new file under src/pages/.
3. Wrap page-object actions in test.step() so the trace reads as
   business steps.
4. Save the spec at tests/<area>/<scenario-slug>.spec.ts
   — saucedemo-login.md scenarios go under tests/auth/
   — cart-checkout-confirmation.md scenarios go under tests/checkout/
5. Annotate the test:
   test.info().annotations.push(
     { type: 'spec',   description: 'specs/<plan-file>#<id>' },
     { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#AB<id>' },
     { type: 'owner',  description: 'qa-guild' },
   );
6. Run: npx playwright test tests/<area>/<scenario-slug>.spec.ts --trace on --video on
7. Fix and re-run until green. Never weaken an assertion to pass, never
   add waitForTimeout, never skip/fixme a failure — if it looks like a
   real app bug rather than a locator issue, STOP that scenario and
   report it instead of forcing it green.
8. Report: files created, locators used, final run output.
9. Move to the NEXT scenario only after this one is green — do not
   batch-generate either file unreviewed.

Finish specs/saucedemo-login.md completely before starting
specs/cart-checkout-confirmation.md — checkout scenarios likely
depend on being logged in via the standard_user storage-state
session (§03), which the login scenarios are what exercise and
verify in the first place.

When both plans are done, report one summary table covering all
scenarios from both files: scenario id | plan file | spec file |
status | ticket citation. Then run
npx playwright test --reporter=./src/reporters/evidence.ts
so debug/INDEX.md reflects the full batch.
```

## Using Playwright traces

A trace captures the full DOM snapshot before/after every action, screenshots, network activity and console logs — step-by-step, unlike a video's continuous playback. `trace: 'on'` in `playwright.config.ts` keeps one for every test, passing or failing, so a later investigation can always read either.

```bash
# open a specific trace (GUI, human eyes only — an agent can't read this view)
npx playwright show-trace debug/traces/<test-dir>/trace.zip

# always grabs the newest one
npm run trace:last
```

For an agent (or anyone scripting a check), the text-first path is faster than the GUI:

1. **`debug/reports/junit-results.xml`** or the terminal's `list` reporter — which test, which assertion, what line.
2. **`debug/traces/<test-dir>/error-context.md`** — Playwright auto-generates this on failure: the exact error, an aria-snapshot of the page at the moment of failure, and the failing line marked in the test source. This is usually all that's needed.
3. Only if that's not enough, open the full trace GUI.

For live debugging instead of reading a past failure, the same `playwright-cli` mechanic from Step 1 pauses a *running* test:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/checkout/confirmation-page-pdf-receipt.spec.ts --debug=cli
npx playwright cli attach tw-XXXX
npx playwright cli -s=tw-XXXX snapshot   # DOM state right now
npx playwright cli -s=tw-XXXX console    # app-side JS errors
npx playwright cli -s=tw-XXXX requests   # failed/wrong network calls
npx playwright cli show --port 4949      # or watch/drive it visually instead
```

## Using test reports — local and published

Two different things both get called "the dashboard" in this repo — worth keeping straight:

```bash
npm run dashboard              # = playwright show-report — POST-RUN, static HTML report
npx playwright cli show --port 4949   # LIVE view of a session running right now
```

The HTML report is a static, self-contained view with traces, videos and screenshots embedded per test — the easiest thing to demo on a call, but it's gitignored (regenerated every run, not meant to be committed).

To make it a real published URL instead of a local-only artifact, `.github/workflows/playwright.yml` runs the suite on every push to `main`, uploads the report and full `debug/` evidence as build artifacts (kept even on a failing run, so a red run's evidence is never hidden), and deploys the HTML report to GitHub Pages:

```bash
# one-time repo setup (or do it via Settings -> Pages -> Source: GitHub Actions)
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
```

Real, live result from this session: [github.com/kaarlomiran/playwright-cli-claude](https://github.com/kaarlomiran/playwright-cli-claude), publishing to [kaarlomiran.github.io/playwright-cli-claude](https://kaarlomiran.github.io/playwright-cli-claude/) on every push to `main`.

One real CI bug worth flagging for any team adapting this: the workflow originally set `env: BASE_URL: ${{ vars.BASE_URL }}`. With no such repo variable configured, that resolves to an *empty string*, not unset — and `playwright.config.ts`'s `process.env.BASE_URL ?? 'default'` only falls back on `null`/`undefined`, not `''`. Every `page.goto()` broke in CI until the override was removed.

## Command cheat sheet

**Plan — explore live, write the spec**

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test <seed-file> --debug=cli   # background
npx playwright cli attach tw-XXXX
npx playwright cli -s=tw-XXXX resume
npx playwright cli -s=tw-XXXX snapshot
npx playwright cli -s=tw-XXXX find "<text>"
npx playwright cli -s=tw-XXXX click <ref>
npx playwright cli -s=tw-XXXX fill <ref> "<value>"
npx playwright cli -s=tw-XXXX eval "el => el.getAttribute('data-test')" <ref>
npx playwright cli -s=tw-XXXX close
```

**Monitor — watch or take over a live session**

Not yet aliased in `package.json` — worth adding the same way as `trace:last`: `"watch": "playwright cli show --port 4949"`.

```bash
npx playwright cli show --port 4949    # fixed port, easy to bookmark
npx playwright cli show --port 0       # random free port instead
npx playwright cli show --annotate     # live annotation mode — unverified:
                                        # check debug/ for what it actually writes
npx playwright cli show --kill         # stop the dashboard daemon — it does
                                        # not stop on its own
# --host defaults to localhost; only widen it with your team's normal
# remote-access controls already in place — full mouse/keyboard control
# of a possibly-signed-in session is not something to expose casually
```

**Generate — verify locators, write the spec + page objects**

```bash
npx playwright cli generate-locator <ref>
npx playwright test <new-spec-file> --trace on   # run once on its own before folding into the suite
```

**Run — the suite**

```bash
npm test                       # quick pass/fail
npm run test:evidence          # full trace+video+report pass
npm run test:smoke             # @smoke only
npx playwright test --headed   # visible browser
npx playwright test <file>:<line> --debug   # step through one test
```

**Reports & evidence**

```bash
npm run dashboard        # open the HTML report
npm run trace:last       # open the newest trace.zip
cat debug/INDEX.md       # run manifest
```

**Heal — diagnose a failure**

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test <file>:<line> --debug=cli
npx playwright cli attach tw-XXXX
npx playwright cli -s=tw-XXXX console
npx playwright cli -s=tw-XXXX requests
npx playwright cli show --port 4949   # watch it live instead of only reading output
```

**Publish (CI)**

```bash
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow   # one-time
gh run list --repo <owner>/<repo> --limit 3
gh run view <run-id> --repo <owner>/<repo> --log-failed
```
