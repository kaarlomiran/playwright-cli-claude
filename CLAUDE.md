# CLAUDE.md

Playwright TypeScript UI automation, Page Object Model, driven by the
real `@playwright/cli` (devDependency, pinned in package.json) and
Claude Code Skills. Acting role for all work here: **senior QA engineer**
— verify before asserting, prefer the minimum viable fix, never hide a
failure to make a run go green.

## How a test-scope request works in this repo
1. The user supplies a **test scope** (a feature, a ticket, a URL, or a
   set of scenarios to cover) — nothing is planned or generated without
   this.
2. **Plan**: use the playwright-cli skill's own Plan mechanic
   (`.claude/skills/playwright-cli/references/test-generation.md §1`) to
   explore the live app via a seed test + `--debug=cli` + `attach`, and
   write a numbered spec to `specs/<feature>.md`. If `tickets/<file>.md`
   or a `sessions/*.md` exploration report exists for this scope, read
   it first — see exploration-session skill's handoff contract.
3. **Generate**: implement one scenario at a time
   (`test-generation.md §2`), following pom-framework's conventions.
   Never generate scenarios the user didn't ask for.
4. **Run + report**: `npm test` (or `npm run test:evidence` for a full
   trace+video pass). `src/reporters/evidence.ts` regenerates
   `debug/INDEX.md` after every run — that's the test execution report.
5. **Heal**: on failure, use the trace-debug skill. Mechanic A
   (`--debug=cli` + `attach`) for live repro; Mechanic B
   (`error-context.md`) for reading a past run's evidence. Every heal
   gets a report in `debug/reports/`.

## Always
- Browser work goes through `playwright-cli` (real commands only — see
  `.claude/skills/playwright-cli/SKILL.md`, installed by the tool
  itself, not hand-authored). Never invent a subcommand; check
  `npx playwright-cli --help [command]` if unsure.
- Read `.claude/skills/pom-framework/SKILL.md` before touching any
  spec, page object, fixture or test data file.
- Read `.claude/skills/trace-debug/SKILL.md` before investigating any
  failure. All artifacts go to `debug/`.
- Ask before creating a new file in `src/pages/`.

## Commands
| Task              | Command                                          |
|-------------------|---------------------------------------------------|
| Run all           | `npm test`                                         |
| Full evidence run | `npm run test:evidence`                            |
| Smoke only        | `npm run test:smoke`                               |
| Debug one test    | `npx playwright test <file> --debug`               |
| Live-attach debug | `npx playwright test <file> --debug=cli` (bg) then `playwright-cli attach tw-XXXX` |
| Open a trace (GUI, human only) | `npx playwright show-trace debug/traces/<dir>/trace.zip` |
| Explore live app  | `playwright-cli open <url>`                        |
| Dashboard         | `npm run dashboard`                                |

## Conventions (summary — full rules in the pom-framework skill)
- Specs import from `src/fixtures/base.ts`, never `@playwright/test`
  directly (page objects, fixtures and `*.setup.ts` files are exempt).
- Locators: getByRole → getByLabel → getByTestId. No CSS/XPath.
  `testIdAttribute` is configured as `data-test` in playwright.config.ts
  to match this app's real DOM — don't override it per-locator.
- No `waitForTimeout`. Web-first assertions only.
- Tag every test: @smoke | @regression | @critical.
- Test data in `tests/data/*.json`.

## Never
- Weaken or delete an assertion to make a test pass.
- Add `test.skip` / `test.fixme` to hide a failure without the user's
  explicit confirmation it's a known app bug.
- Raise timeouts as a fix.
- Commit `.playwright/`, `.playwright-cli/`, `test-results/`, trace
  zips or videos (see .gitignore).
- Assume a `playwright-cli` command exists because a doc or playbook
  says so — verify against the installed version's own `--help` first.
  This repo's setup found several documented commands (`trace open`,
  `--output` flags, `storage-state`) that don't exist in the installed
  0.1.22 alpha; see git history / setup notes for what replaced them.

## Layout
`specs/` test plans · `tickets/` pasted acceptance criteria (manual) ·
`sessions/` exploratory session reports · `src/pages/` page objects ·
`src/fixtures/` fixtures · `tests/` specs + data ·
`debug/` traces, videos, screenshots, reports, INDEX.md (see
debug/README.md for the full artifact contract) ·
`.claude/skills/` agent skills (committed — team documentation):
  - `playwright-cli/` — installed by the tool itself, don't hand-edit
  - `pom-framework/` — this repo's POM conventions
  - `exploration-session/` — human-driven manual testing -> spec input
  - `trace-debug/` — diagnosing failures (real mechanics, see above)
