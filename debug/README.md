# debug/ — artifact workspace

Everything here is generated. `debug/snapshots/`, `debug/reports/` and
`debug/INDEX.md` are committed (small text, reviewable as a diff);
`debug/traces/`, `debug/videos/`, `debug/screenshots/` are gitignored
(large binaries — see .gitignore).

| folder | what | written by |
|---|---|---|
| `snapshots/` | Named YAML page-state snapshots (the locator ledger) | `playwright-cli snapshot --filename ...` |
| `traces/` | `<test-dir>/trace.zip` + `error-context.md` per test (pass or fail) | `@playwright/test` (trace: 'on' in playwright.config.ts) |
| `videos/` | Per-test `.webm` (copied out of Playwright's per-test outputDir) | `src/reporters/evidence.ts` |
| `screenshots/` | Per-test `.png` (copied out the same way) | `src/reporters/evidence.ts` |
| `reports/` | Heal reports, JUnit XML for CI | trace-debug skill / `junit` reporter |
| `INDEX.md` | Run manifest — the first file any prompt should point at | `src/reporters/evidence.ts`, regenerated every run |

See `.claude/skills/trace-debug/SKILL.md` for how these get read back
during a failure investigation — `error-context.md` is usually the
fastest path, not the trace.zip GUI viewer.
