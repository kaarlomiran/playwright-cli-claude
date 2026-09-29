import { test, type Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  abstract goto(): Promise<void>;

  /** Annotate a step so it lands in the trace and the HTML report. */
  protected async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return await test.step(name, fn);
  }
}
