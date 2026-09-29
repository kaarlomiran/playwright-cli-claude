import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutInformationPage } from './CheckoutInformationPage';

/**
 * Page object for /cart.html. Locators verified against the live app with
 * playwright-cli (open -> snapshot -> eval) on 2026-09-30.
 */
export class CartPage extends BasePage {
  readonly rows: Locator = this.page.getByTestId('inventory-item');
  readonly checkoutButton: Locator = this.page.getByTestId('checkout');
  readonly continueShoppingButton: Locator = this.page.getByTestId('continue-shopping');

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  priceFor(productName: string): Locator {
    return this.rowFor(productName).getByTestId('inventory-item-price');
  }

  quantityFor(productName: string): Locator {
    return this.rowFor(productName).getByTestId('item-quantity');
  }

  async checkout(): Promise<CheckoutInformationPage> {
    return this.step('proceed to checkout', async () => {
      await this.checkoutButton.click();
      return new CheckoutInformationPage(this.page);
    });
  }
}
