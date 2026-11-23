---
name: flaky-monitor
description: Detect, classify and report flaky Playwright UI tests. Use after any test run, when a test passed only
  on retry, when CI is intermittently red, or when asked to check test stability or write FLAKY_REPORT.md.
---

# Flaky Monitor

## Inputs

- `debug/reports/results.json` - Playwright JSON reporter output for the latest run
- `debug/reports/history/flaky-history.json` - rolling window of the last 20 runs (created by the script)

## Procedure

1. Run `npm run flaky` (= `tsx .claude/skills/flaky-monitor/scripts/analyze-flaky.ts`).
2. Read `debug/reports/FLAKY_REPORT.md`. Tests that passed on retry are "flaky"; tests that
   fail in some history runs but not others are "unstable".
3. For every flaky/unstable/failed test, reproduce and diagnose using the **trace-debug** skill
   (Mechanic A for live repro, Mechanic B for reading `debug/traces/<dir>/error-context.md` from
   a past run) — don't guess at the cause from the report alone.
4. Classify the root cause (pick one):
   - locator/timing: a `getByRole`/`getByTestId` resolved to the wrong/stale element, or raced
     an animation/async render (check the trace's DOM snapshot before/after the failing action)
   - test isolation: a prior test in the same file/worker left state behind (this repo has no
     shared `storageState` today — see proj-storage-state-auth-setup memory — so this usually
     means a page object or fixture leaking state between tests)
   - network/third-party: SauceDemo itself slow or erroring (check `debug/traces/<dir>` network tab)
   - data drift: a hard-coded expectation (count, price, label) that the live app no longer matches
   - assertion too strict: exact text match where a web-first/soft assertion would be correct
5. Fill in "Suspected cause" and "Suggested fix" under each issue in `debug/reports/FLAKY_REPORT.md`.
   Keep the report format; do not delete the generated tables.
6. Propose fixes as diffs in the report. Only edit spec/page-object files if the user asks.

## Rules

- Never "fix" flakiness by adding `waitForTimeout`, sleeps, or raising retries/timeouts — CLAUDE.md's
  "Never" section already bans this; the same rule applies here. Fix the cause, or quarantine with
  `test.fixme()` plus the user's explicit confirmation it's a known app bug.
- Tests tagged `@known-issue` are excluded from flaky stats. Mention them once, do not file duplicates.
- Never put credentials or tokens in the report (this repo's test accounts are in
  `tests/data/users.json` and are not secrets, but don't echo session cookies/tokens either way).
