---
name: trace-debug
description: Diagnose failing or flaky Playwright tests. Use for any
  failing test, flaky test, or "why did this happen" investigation.
  All artifacts go to debug/.
---

# Trace & Debug Skill

## Important: this is NOT the playwright-cli `trace open/actions/action`
workflow you may have seen described elsewhere. That command family does
not exist in the installed `@playwright/cli` (verified against
`--help` on 2026-09-29). There is no CLI command that reads a trace back
as text. Use the two real mechanics below instead.

## Artifact contract (never deviate)
| kind        | path                                        |
|-------------|----------------------------------------------|
| traces      | debug/traces/<test-dir>/trace.zip (from @playwright/test's own `trace: 'on'`) |
| videos      | debug/videos/<slug>.webm                      |
| screenshots | debug/screenshots/<slug>.png                  |
| reports     | debug/reports/<role>-<slug>-<date>.md         |
| run index   | debug/INDEX.md (regenerated every run by src/reporters/evidence.ts) |
Never write artifacts to the repo root or to `test-results/`.

## Mechanic A — live debugging (preferred; use this first)
This is the playwright-cli skill's own Plan/Generate/Heal engine
(`.claude/skills/playwright-cli/references/playwright-tests.md`). It
pauses a *real, running* test and lets you drive the live page:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test <file> --debug=cli   # run in background
# wait for the "Debugging Instructions" line and a session name like tw-abcdef
playwright-cli attach tw-abcdef
playwright-cli resume            # let it run up to (or past) the failing step
playwright-cli snapshot          # what does the DOM actually look like?
playwright-cli console           # app-side JS errors?
playwright-cli requests          # a failed or wrong network call?
```
Every playwright-cli action prints the equivalent Playwright TypeScript —
that's what you paste back into the fix. Stop the background test run
when done; rerun the single test to confirm green.

## Mechanic B — reading an already-failed run's evidence (no live repro)
When you only have artifacts from a past run (CI, or a teammate's
report), read them in this order — no GUI needed for any of it:

1. **`debug/reports/junit-results.xml`** or the `list` reporter output —
   which test, which assertion, what line.
2. **`debug/traces/<test-dir>/error-context.md`** — Playwright generates
   this automatically on failure. It's already agent-readable text: the
   exact error, an aria (accessibility) snapshot of the page at the
   moment of failure, and the test source with the failing line marked.
   **This is usually all you need.** (This is how the initial
   `getByTestId('title')` / `data-test` mismatch was diagnosed during
   framework setup — see debug/reports/ if a report was filed for it.)
3. If `error-context.md` isn't enough, the human can open the full
   trace GUI: `npx playwright show-trace debug/traces/<test-dir>/trace.zip`
   — but you (the agent) cannot read a GUI, so ask the human to look and
   describe what they see, or fall back to Mechanic A and reproduce live.

## Reporting
Every investigation ends with a Markdown report in `debug/reports/`
containing: classification (locator drift | UI restructure | timing |
real regression), root cause with evidence (error-context.md excerpt or
attach output), fix applied, an intent-preservation checklist, and two
consecutive green run results.

## Hard rules
- Never weaken or delete an assertion to make a test pass.
- Never add `waitForTimeout` or raise a timeout as a fix.
- Never `test.skip`/`test.fixme` a failure without the user confirming
  it's a real, known app bug — and cite that confirmation in the report.
- If the root cause is a real application bug (not a test problem),
  STOP and report it. Do not change the test to hide it.

## References
- references/annotations.md — test.step, annotations, attachments
