import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutOverviewPage } from './CheckoutOverviewPage';

/**
 * Page object for /checkout-step-one.html. Locators verified against the
 * live app with playwright-cli (open -> snapshot) on 2026-09-30.
 */
export class CheckoutInformationPage extends BasePage {
  readonly firstName: Locator = this.page.getByRole('textbox', { name: 'First Name' });
  readonly lastName: Locator = this.page.getByRole('textbox', { name: 'Last Name' });
  readonly zip: Locator = this.page.getByRole('textbox', { name: 'Zip/Postal Code' });
  readonly continueButton: Locator = this.page.getByRole('button', { name: 'Continue' });

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html');
  }

  async fillAndContinue(info: {
    firstName: string;
    lastName: string;
    zip: string;
  }): Promise<CheckoutOverviewPage> {
    return this.step('fill checkout information', async () => {
      await this.firstName.fill(info.firstName);
      await this.lastName.fill(info.lastName);
      await this.zip.fill(info.zip);
      await this.continueButton.click();
      return new CheckoutOverviewPage(this.page);
    });
  }
}
