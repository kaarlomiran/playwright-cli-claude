import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutCompletePage } from './CheckoutCompletePage';

/**
 * Page object for /checkout-step-two.html. Locators verified against the
 * live app with playwright-cli (open -> snapshot -> eval) on 2026-09-30.
 */
export class CheckoutOverviewPage extends BasePage {
  readonly rows: Locator = this.page.getByTestId('inventory-item');
  readonly paymentInfo: Locator = this.page.getByTestId('payment-info-value');
  readonly shippingInfo: Locator = this.page.getByTestId('shipping-info-value');
  readonly itemTotal: Locator = this.page.getByTestId('subtotal-label');
  readonly tax: Locator = this.page.getByTestId('tax-label');
  readonly total: Locator = this.page.getByTestId('total-label');
  readonly finishButton: Locator = this.page.getByTestId('finish');

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-two.html');
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  priceFor(productName: string): Locator {
    return this.rowFor(productName).getByTestId('inventory-item-price');
  }

  async finish(): Promise<CheckoutCompletePage> {
    return this.step('finish order', async () => {
      await this.finishButton.click();
      return new CheckoutCompletePage(this.page);
    });
  }
}
