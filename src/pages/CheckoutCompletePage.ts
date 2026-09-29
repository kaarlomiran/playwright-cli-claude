import { Download, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { InventoryPage } from './InventoryPage';

/**
 * Page object for /checkout-complete.html. Locators verified against the
 * live app with playwright-cli (open -> snapshot -> eval) on 2026-09-30.
 */
export class CheckoutCompletePage extends BasePage {
  readonly header: Locator = this.page.getByTestId('complete-header');
  readonly body: Locator = this.page.getByText(
    'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  );
  readonly backHomeButton: Locator = this.page.getByTestId('back-to-products');
  readonly generatePdfButton: Locator = this.page.getByTestId('generate-pdf-order');

  async goto(): Promise<void> {
    await this.page.goto('/checkout-complete.html');
  }

  async backToProducts(): Promise<InventoryPage> {
    return this.step('return to products', async () => {
      await this.backHomeButton.click();
      return new InventoryPage(this.page);
    });
  }

  async generatePdfOrder(): Promise<Download> {
    return this.step('generate PDF order receipt', async () => {
      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        this.generatePdfButton.click(),
      ]);
      return download;
    });
  }
}
