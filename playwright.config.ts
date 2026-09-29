import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  outputDir: './debug/traces', // per-test artifacts land here (see README callout in debug/)
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'debug/reports/junit-results.xml' }],
    ['./src/reporters/evidence.ts'], // writes debug/INDEX.md
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    // SauceDemo's DOM uses data-test="..." rather than Playwright's
    // default data-testid="..." — verified via error-context.md on a
    // failing getByTestId() during initial framework setup (2026-09-29).
    testIdAttribute: 'data-test',
    // 'on' keeps a trace for EVERY test, passing and failing, so a Healer
    // run can read either. Switch to 'retain-on-failure' via the CLI flag
    // (not this config) if CI artifact size becomes a problem.
    trace: 'on',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    screenshot: 'on',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add a 'firefox' project once `npx playwright install firefox` has run.
  ],
});
