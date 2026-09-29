// spec: specs/cart-checkout-confirmation.md#1.2
// seed: precondition — same as #1.1 through step 7 (order finished, on
// /checkout-complete.html), reproduced here independently since each
// scenario must start from a clean state rather than chain onto #1.1.
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { test, expect } from '../../src/fixtures/base';
import users from '../data/users.json';
import checkout from '../data/checkout.json';

test.describe('Cart, checkout & confirmation', () => {
  test('confirmation page PDF order receipt downloads with correct contents @regression', async ({
    loginPage,
    inventoryPage,
  }) => {
    test.info().annotations.push(
      { type: 'spec', description: 'specs/cart-checkout-confirmation.md#1.2' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-08' },
      { type: 'ticket', description: 'tickets/Testkm_SampleTestScopeRequirements.md#TC-09' },
      { type: 'owner', description: 'qa-guild' },
    );

    const [itemA, itemB] = checkout.cartItems;

    await loginPage.goto();
    await loginPage.loginAs(users.standard);
    await inventoryPage.addToCartByName(itemA.name);
    await inventoryPage.addToCartByName(itemB.name);
    const cartPage = await inventoryPage.goToCart();
    const checkoutInfoPage = await cartPage.checkout();
    const overviewPage = await checkoutInfoPage.fillAndContinue(checkout.customerInfo);
    const completePage = await overviewPage.finish();

    // 1. Generate the PDF order receipt and await the download
    const download = await completePage.generatePdfOrder();
    const downloadPath = await download.path();
    expect(downloadPath, 'download did not produce a local file').not.toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const fileSize = fs.statSync(downloadPath!).size;
    expect(fileSize).toBeGreaterThan(0);

    // 2. Extract text from the downloaded PDF and assert its contents
    const parser = new PDFParse({ data: fs.readFileSync(downloadPath!) });
    const { text } = await parser.getText();

    expect(text).toContain('Thank you for your order!');
    expect(text).toContain(itemA.name);
    expect(text).toContain(itemB.name);
    expect(text).toContain(`$${itemA.price.toFixed(2)}`);
    expect(text).toContain(`$${itemB.price.toFixed(2)}`);
    expect(text).toContain('$39.98');
    expect(text).toContain('$3.20');
    expect(text).toContain('$43.18');
    expect(text).toMatch(/Order Date/);
    // The confirmation PDF's "SHIP TO" label renders with letter-spacing
    // CSS, so pdf-parse extracts it as "S H I P TO" rather than "Ship To" —
    // verified against the real downloaded PDF on 2026-09-30.
    expect(text).toMatch(/S\s*H\s*I\s*P\s*TO/);
    expect(text).toContain(`${checkout.customerInfo.firstName} ${checkout.customerInfo.lastName}`);
    expect(text).toContain(checkout.customerInfo.zip);

    // Deliberately NOT asserted (per specs/cart-checkout-confirmation.md's
    // "Disagreement" section, resolved 2026-09-30): the real PDF does not
    // contain payment ("SauceCard #31337") or shipping-method
    // ("Free Pony Express Delivery!") text at all, despite the ticket's
    // TC-09 expecting them. That's a product/ticket gap, not a test bug.
  });
});
