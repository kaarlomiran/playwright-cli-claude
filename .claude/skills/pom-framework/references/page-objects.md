# Page object template

```ts
// src/pages/ExamplePage.ts
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExamplePage extends BasePage {
  readonly someField: Locator = this.page.getByRole('textbox', { name: 'Some Field' });
  readonly submit: Locator = this.page.getByRole('button', { name: 'Submit' });

  async goto(): Promise<void> {
    await this.page.goto('/example');
  }

  async submitForm(value: string): Promise<void> {
    await this.step('submit example form', async () => {
      await this.someField.fill(value);
      await this.submit.click();
    });
  }
}
```

Rules:
- Extend `BasePage`; implement `goto()`.
- Locators are `readonly` fields, resolved in the constructor context
  (they're lazy — no page access happens until used).
- Methods that return a new page return the concrete page object type,
  not `void` and not `Promise<any>`.
- Multi-step methods (2+ actions) wrap in `this.step('<business verb>', ...)`.
- One class per file. Filename matches the class name exactly.
