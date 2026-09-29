# Annotations, steps and attachments (real @playwright/test APIs)

These are standard Playwright, unaffected by the playwright-cli CLI gap
described in SKILL.md — they come from `@playwright/test` itself.

## test.step() — business-readable steps in the trace/report
```ts
await this.step('log in as standard_user', async () => {
  await this.username.fill(user.username);
  await this.password.fill(user.password);
  await this.loginButton.click();
});
```
(`BasePage.step()` wraps `test.step()` — see src/pages/BasePage.ts.)

## test.info().annotations — metadata that surfaces in the HTML report
```ts
test.info().annotations.push({ type: 'spec', description: 'specs/saucedemo-login.md#1.1' });
```
The evidence reporter (src/reporters/evidence.ts) also writes these into
debug/INDEX.md's annotations column.

## testInfo.attach() — attach a file to a test's report entry
```ts
await testInfo.attach('session-video', { path: videoPath, contentType: 'video/webm' });
```

## error-context.md — automatic, no code required
Playwright writes this file next to trace.zip for every FAILED test,
with zero configuration. It's the fastest agent-readable diagnostic —
read it before opening any GUI. See trace-debug/SKILL.md Mechanic B.
