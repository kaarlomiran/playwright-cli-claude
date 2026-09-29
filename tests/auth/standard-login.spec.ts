// spec: specs/saucedemo-login.md#1.1 (worked example from initial framework setup)
import { test, expect } from '../../src/fixtures/base';
import users from '../data/users.json';

test.describe('SauceDemo login', () => {
  test('standard user logs in and lands on inventory @smoke @critical', async ({
    page,
    loginPage,
  }) => {
    test.info().annotations.push({ type: 'spec', description: 'specs/saucedemo-login.md#1.1' });

    await loginPage.goto();
    const inventory = await loginPage.loginAs(users.standard);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.header).toHaveText('Products');
    await expect(inventory.productCards).toHaveCount(6);
  });
});
