# Extending src/fixtures/base.ts

Every new page object gets a fixture entry so specs never `new` a page
object directly:

```ts
// src/fixtures/base.ts
import { ExamplePage } from '../pages/ExamplePage';

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  examplePage: ExamplePage; // add here
};

export const test = base.extend<Pages>({
  // ...existing fixtures...
  examplePage: async ({ page }, use) => {
    await use(new ExamplePage(page));
  },
});
```

Specs then destructure it from the test callback:

```ts
test('does the thing', async ({ examplePage }) => {
  await examplePage.goto();
});
```

Never import a page object directly into a spec file — that's what the
"specs import from src/fixtures/base.ts, never @playwright/test" rule
in SKILL.md is protecting.
