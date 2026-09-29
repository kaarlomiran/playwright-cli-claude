---
name: pom-framework
description: Page Object Model conventions for this Playwright TypeScript
  repo. Use whenever writing, refactoring or repairing specs, page objects,
  fixtures or test data.
---

# POM Framework Skill

## Non-negotiables
1. SPEC (test) files import `{ test, expect }` from `src/fixtures/base.ts` —
   NEVER from `@playwright/test` directly. Page objects, fixtures and
   `*.setup.ts` project-setup files are exempt and may import from
   `@playwright/test` directly.
2. Page objects live in `src/pages/`, extend `BasePage`, one class per
   page, filename = class name.
3. Locators are declared as `readonly` class fields. No locators inside
   spec files.
4. Locator priority: getByRole → getByLabel → getByPlaceholder →
   getByTestId. NO CSS, NO XPath, NO nth-child.
5. No `waitForTimeout`, no `page.waitFor*` sleeps. Use web-first
   assertions (`expect(locator).toBeVisible()`).
6. Assertions live in specs, not in page objects. Page objects return
   the next page object or a value.
7. Credentials and payloads come from `tests/data/*.json`. No literals
   in specs.
8. Every test title carries tags: @smoke | @regression | @critical.
9. Wrap multi-action page-object methods in `test.step()` so the trace
   and report read as business steps.

## This app's known gotcha
SauceDemo exposes test hooks as `data-test="..."`, not Playwright's
default `data-testid="..."`. `playwright.config.ts` sets
`use.testIdAttribute: 'data-test'` globally — don't work around it
locator-by-locator. Discovered by a failing `getByTestId('title')` during
initial setup (2026-09-29); see `debug/reports/` if a heal report was
filed for it.

## Adding a page object
- ASK before creating a new file under `src/pages/`.
- Verify every locator against the live app before committing it. Use
  the playwright-cli skill's own Plan/Generate/Heal mechanic
  (`.claude/skills/playwright-cli/references/test-generation.md`):
  run the seed test with `--debug=cli` in the background, `attach` to
  it, and use `snapshot` / `find` to confirm the real accessible name —
  don't guess from HTML you haven't seen.
- Re-export nothing: specs reach pages through fixtures
  (`src/fixtures/base.ts`).

## References
- references/page-objects.md — class template + naming
- references/fixtures.md — extending the base fixture
- references/test-data.md — JSON shape and loading rules
