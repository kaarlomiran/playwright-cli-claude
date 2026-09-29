import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { InventoryPage } from './InventoryPage';

export class LoginPage extends BasePage {
  readonly username: Locator = this.page.getByRole('textbox', { name: 'Username' });
  readonly password: Locator = this.page.getByRole('textbox', { name: 'Password' });
  readonly loginButton: Locator = this.page.getByRole('button', { name: 'Login' });
  readonly error: Locator = this.page.getByTestId('error');

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async loginAs(user: { username: string; password: string }): Promise<InventoryPage> {
    return this.step(`log in as ${user.username}`, async () => {
      await this.username.fill(user.username);
      await this.password.fill(user.password);
      await this.loginButton.click();
      return new InventoryPage(this.page);
    });
  }
}
