import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartPage } from './CartPage';

/**
 * Page object for /inventory.html. Locators verified against the live app
 * with playwright-cli (open -> snapshot) on 2026-09-29 (see
 * debug/snapshots/signin-02-landing.yaml) and extended/re-verified
 * 2026-09-30 for the add-to-cart/remove/cart-link flow.
 */
export class InventoryPage extends BasePage {
  readonly header: Locator = this.page.getByTestId('title');
  readonly productCards: Locator = this.page.locator('.inventory_item');
  readonly cartBadge: Locator = this.page.getByTestId('shopping-cart-badge');
  readonly cartLink: Locator = this.page.getByTestId('shopping-cart-link');

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  private slugFor(productName: string): string {
    return productName.toLowerCase().replace(/\s+/g, '-');
  }

  addToCartButtonFor(productName: string): Locator {
    return this.page.getByTestId(`add-to-cart-${this.slugFor(productName)}`);
  }

  removeButtonFor(productName: string): Locator {
    return this.page.getByTestId(`remove-${this.slugFor(productName)}`);
  }

  async addToCartByName(productName: string): Promise<void> {
    await this.step(`add "${productName}" to cart`, async () => {
      await this.addToCartButtonFor(productName).click();
    });
  }

  async goToCart(): Promise<CartPage> {
    return this.step('go to cart', async () => {
      await this.cartLink.click();
      return new CartPage(this.page);
    });
  }
}
