// spec: specs/cart-checkout-confirmation.md#1.1
// seed: precondition — logged in as standard_user, reusing
// specs/saucedemo-login.md#1.1 / tests/auth/standard-login.spec.ts's
// loginPage.loginAs() rather than re-specifying login steps here.
import { test, expect } from '../../src/fixtures/base';
import users from '../data/users.json';
import checkout from '../data/checkout.json';

function parseMoney(text: string): number {
  const match = text.match(/\$(\d+\.\d{2})/);
  if (!match) throw new Error(`no $amount found in "${text}"`);
  return Number(match[1]);
}

test.describe('Cart, checkout & confirmation', () => {
  test('logged-in user adds two items, checks out, and confirms the order @smoke @critical', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    test.info().annotations.push(
      { type: 'spec', description: 'specs/cart-checkout-confirmation.md#1.1' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-02' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-03' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-04' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-05' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-06' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-07' },
      { type: 'owner', description: 'qa-guild' },
    );

    const [itemA, itemB] = checkout.cartItems;

    // 1. Add "Sauce Labs Backpack" to the cart
    await loginPage.goto();
    await loginPage.loginAs(users.standard);
    await inventoryPage.addToCartByName(itemA.name);
    await expect(inventoryPage.removeButtonFor(itemA.name)).toBeVisible();

    // 2. Add "Sauce Labs Bike Light" to the cart
    await inventoryPage.addToCartByName(itemB.name);
    await expect(inventoryPage.removeButtonFor(itemB.name)).toBeVisible();
    await expect(inventoryPage.cartLink).toHaveAccessibleName('Cart, 2 items');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    // 3. Open the cart and review its contents
    const cartPage = await inventoryPage.goToCart();
    await expect(page).toHaveURL(/\/cart\.html/);
    await expect(cartPage.rows).toHaveCount(2);
    await expect(cartPage.rowFor(itemA.name)).toBeVisible();
    await expect(cartPage.priceFor(itemA.name)).toHaveText(`$${itemA.price.toFixed(2)}`);
    await expect(cartPage.quantityFor(itemA.name)).toHaveText('1');
    await expect(cartPage.rowFor(itemB.name)).toBeVisible();
    await expect(cartPage.priceFor(itemB.name)).toHaveText(`$${itemB.price.toFixed(2)}`);
    await expect(cartPage.quantityFor(itemB.name)).toHaveText('1');
    await expect(cartPage.checkoutButton).toBeVisible();
    await expect(cartPage.continueShoppingButton).toBeVisible();

    // 4. Start checkout
    const checkoutInfoPage = await cartPage.checkout();
    await expect(page).toHaveURL(/\/checkout-step-one\.html/);

    // 5. Fill checkout information and continue
    const overviewPage = await checkoutInfoPage.fillAndContinue(checkout.customerInfo);
    await expect(page).toHaveURL(/\/checkout-step-two\.html/);

    // 6. Read the computed overview values
    await expect(overviewPage.rows).toHaveCount(2);
    await expect(overviewPage.priceFor(itemA.name)).toHaveText(`$${itemA.price.toFixed(2)}`);
    await expect(overviewPage.priceFor(itemB.name)).toHaveText(`$${itemB.price.toFixed(2)}`);
    await expect(overviewPage.paymentInfo).toHaveText(checkout.payment);
    await expect(overviewPage.shippingInfo).toHaveText(checkout.shipping);
    await expect(overviewPage.itemTotal).toHaveText('Item total: $39.98');
    await expect(overviewPage.tax).toHaveText('Tax: $3.20');
    await expect(overviewPage.total).toHaveText('Total: $43.18');

    const scrapedItemTotal = parseMoney(await overviewPage.priceFor(itemA.name).innerText())
      + parseMoney(await overviewPage.priceFor(itemB.name).innerText());
    const expectedTax = Math.round(scrapedItemTotal * 0.08 * 100) / 100;
    const expectedTotal = Math.round((scrapedItemTotal + expectedTax) * 100) / 100;
    expect(parseMoney(await overviewPage.itemTotal.innerText())).toBeCloseTo(scrapedItemTotal, 2);
    expect(parseMoney(await overviewPage.tax.innerText())).toBeCloseTo(expectedTax, 2);
    expect(parseMoney(await overviewPage.total.innerText())).toBeCloseTo(expectedTotal, 2);

    // 7. Finish the order
    const completePage = await overviewPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html/);
    await expect(completePage.header).toHaveText('Thank you for your order!');
    await expect(completePage.body).toBeVisible();
    await expect(inventoryPage.cartLink).toHaveAccessibleName('Cart, empty');

    // 8. Return to products
    await completePage.backToProducts();
    await expect(page).toHaveURL(/\/inventory\.html/);

    // 9. Confirm the cart is empty
    const emptiedCartPage = await inventoryPage.goToCart();
    await expect(page).toHaveURL(/\/cart\.html/);
    await expect(emptiedCartPage.rows).toHaveCount(0);
    await expect(inventoryPage.cartLink).toHaveAccessibleName('Cart, empty');
  });
});
