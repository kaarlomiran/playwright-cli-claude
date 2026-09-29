# Test Scope: Sauce Demo – Add to Cart, Checkout & Order Confirmation

**Application under test:** https://www.saucedemo.com/inventory.html
**Test type:** End-to-end functional (UI automation ready – Playwright / Claude Code)
**Author:** QA
**Date:** 2026-09-30

---

## 1. Objective

Verify that a logged-in user can add two items to the cart, that the cart contents and pricing are correct, that checkout calculates the correct subtotal, tax and total, that the order is confirmed, and that the order receipt PDF (if available) downloads with correct contents.

---

## 2. Important Notes / Assumptions

> **PDF download is not a native Sauce Demo feature.** The standard Sauce Demo site ends on the "Thank you for your order!" page (`/checkout-complete.html`) and does **not** provide a PDF receipt or a payment-processing step. Section 7 (PDF validation) is therefore written as **conditional**:
> - If the environment under test provides a PDF download, execute TC-08 and TC-09.
> - If not, mark TC-08 and TC-09 as **Blocked / Not Applicable** and raise it as a requirement gap.
> - As an alternative, the tester may generate the PDF via browser print-to-PDF of the confirmation page (`page.pdf()` in Playwright, Chromium only) and validate that file instead.

- "Payment confirmed" is validated through the **Payment Information** (`SauceCard #31337`), **Shipping Information** (`Free Pony Express Delivery!`) and the **order complete** message, since no real payment gateway exists.
- Tax rate on Sauce Demo is **8%**, rounded to 2 decimals.
- Prices are static and are used as expected values below.

---

## 3. In Scope

| # | Area |
|---|------|
| 1 | Login with a valid user |
| 2 | Add two products to the cart from the inventory page |
| 3 | Cart badge count |
| 4 | Cart page: correct items, names, quantities, prices |
| 5 | Checkout information form (step one) |
| 6 | Checkout overview (step two): item list, subtotal, tax, total |
| 7 | Order completion / confirmation |
| 8 | PDF receipt download and content validation (conditional) |

## 4. Out of Scope

- Performance, load, security and accessibility testing
- Cross-browser matrix (run on Chromium by default)
- Negative login scenarios and locked-out / problem / glitch users
- Real payment gateway integration
- Sorting and filtering on the inventory page

---

## 5. Test Data

**Credentials**

| Field | Value |
|-------|-------|
| Username | `standard_user` |
| Password | `secret_sauce` |

**Products selected for the test**

| Item | Price |
|------|-------|
| Sauce Labs Backpack | $29.99 |
| Sauce Labs Bike Light | $9.99 |

**Checkout information**

| Field | Value |
|-------|-------|
| First Name | `Test` |
| Last Name | `User` |
| Zip/Postal Code | `12345` |

**Expected calculations**

| Line | Calculation | Expected |
|------|-------------|----------|
| Item total (subtotal) | 29.99 + 9.99 | **$39.98** |
| Tax (8%) | 39.98 × 0.08 = 3.1984 | **$3.20** |
| Total | 39.98 + 3.20 | **$43.18** |

---

## 6. Preconditions

1. Browser launched with a clean session (no cookies / local storage).
2. Site is reachable at https://www.saucedemo.com/.
3. Cart is empty at the start of the test.
4. A writable download directory is configured for the automation run.

---

## 7. Test Cases

### TC-01 – Login
| | |
|---|---|
| **Steps** | 1. Open https://www.saucedemo.com/ <br> 2. Enter `standard_user` / `secret_sauce` <br> 3. Click **Login** |
| **Expected** | URL is `/inventory.html`; "Products" title visible; 6 products displayed; cart badge not shown |

### TC-02 – Add two items to cart
| | |
|---|---|
| **Steps** | 1. On the inventory page click **Add to cart** for *Sauce Labs Backpack* <br> 2. Click **Add to cart** for *Sauce Labs Bike Light* |
| **Expected** | Both buttons change to **Remove**; cart badge shows **2** |

### TC-03 – Validate cart contents
| | |
|---|---|
| **Steps** | 1. Click the cart icon <br> 2. Review the cart list |
| **Expected** | URL is `/cart.html`; exactly **2** items listed: <br> • Sauce Labs Backpack – $29.99 – Qty 1 <br> • Sauce Labs Bike Light – $9.99 – Qty 1 <br> No other items present; **Checkout** and **Continue Shopping** buttons visible |

### TC-04 – Start checkout and enter customer information
| | |
|---|---|
| **Steps** | 1. Click **Checkout** <br> 2. Enter First Name, Last Name, Zip <br> 3. Click **Continue** |
| **Expected** | URL is `/checkout-step-one.html` then `/checkout-step-two.html`; no validation errors |

### TC-05 – Validate checkout overview (items and totals)
| | |
|---|---|
| **Steps** | 1. Review the overview page items <br> 2. Read Item total, Tax and Total labels |
| **Expected** | Only the two selected items are listed with correct names, prices and Qty 1 <br> Payment Information: **SauceCard #31337** <br> Shipping Information: **Free Pony Express Delivery!** <br> Item total: **$39.98** <br> Tax: **$3.20** <br> Total: **$43.18** <br> UI total equals the sum of the two item prices plus tax (computed independently in the test) |

### TC-06 – Finish order / payment confirmation
| | |
|---|---|
| **Steps** | Click **Finish** |
| **Expected** | URL is `/checkout-complete.html`; header **"Thank you for your order!"**; message "Your order has been dispatched, and will arrive just as fast as the pony can get there!"; cart badge cleared |

### TC-07 – Cart is emptied after order
| | |
|---|---|
| **Steps** | 1. Click **Back Home** <br> 2. Open the cart |
| **Expected** | Cart badge not displayed; cart page shows no items |

### TC-08 – Download PDF receipt *(conditional – see Section 2)*
| | |
|---|---|
| **Steps** | 1. On the confirmation page click the download-receipt control (or run `page.pdf()` on the confirmation page) <br> 2. Wait for the download event |
| **Expected** | A `.pdf` file is downloaded; file size > 0; MIME type `application/pdf`; file opens without error |

### TC-09 – Validate PDF contents *(conditional – see Section 2)*
| | |
|---|---|
| **Steps** | Extract text from the PDF (e.g. `pdf-parse`, `pdfplumber`, or `pdftotext`) and assert its contents |
| **Expected** | PDF contains: <br> • "Thank you for your order!" <br> • Item names: Sauce Labs Backpack, Sauce Labs Bike Light <br> • Item prices: $29.99, $9.99 <br> • Item total $39.98 <br> • Tax $3.20 <br> • Total **$43.18** <br> • Payment info: SauceCard #31337 <br> • Shipping: Free Pony Express Delivery! <br> The PDF values match the values captured from the checkout overview page in TC-05 |

---

## 8. Automation Notes (Playwright selectors)

| Element | Selector |
|---------|----------|
| Username | `[data-test="username"]` |
| Password | `[data-test="password"]` |
| Login button | `[data-test="login-button"]` |
| Add Backpack | `[data-test="add-to-cart-sauce-labs-backpack"]` |
| Add Bike Light | `[data-test="add-to-cart-sauce-labs-bike-light"]` |
| Cart icon / badge | `[data-test="shopping-cart-link"]` / `[data-test="shopping-cart-badge"]` |
| Cart item | `[data-test="inventory-item"]` |
| Item name / price | `[data-test="inventory-item-name"]` / `[data-test="inventory-item-price"]` |
| Checkout | `[data-test="checkout"]` |
| First / Last / Zip | `[data-test="firstName"]` / `[data-test="lastName"]` / `[data-test="postalCode"]` |
| Continue | `[data-test="continue"]` |
| Subtotal / Tax / Total | `[data-test="subtotal-label"]` / `[data-test="tax-label"]` / `[data-test="total-label"]` |
| Payment / Shipping info | `[data-test="payment-info-value"]` / `[data-test="shipping-info-value"]` |
| Finish | `[data-test="finish"]` |
| Complete header | `[data-test="complete-header"]` |
| Back Home | `[data-test="back-to-products"]` |

**Best practices**
- Compute the expected subtotal, tax and total in code from the scraped item prices rather than hard-coding, and also assert against the hard-coded expected values above.
- Parse currency by stripping the label text and `$`, then compare with 2-decimal precision.
- Capture screenshots at cart, overview and confirmation pages.
- Save downloads to a per-run folder and attach the PDF to the test report.

---

## 9. Entry & Exit Criteria

**Entry:** Site reachable, test data available, automation environment ready.
**Exit:** All in-scope test cases executed; all Critical/High defects resolved or accepted; TC-08/TC-09 marked Pass, or Blocked/N/A with the gap documented.

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Site has no PDF receipt feature | Treat as requirement gap; use print-to-PDF alternative |
| Public demo site content changes | Use `data-test` selectors and compute expected totals dynamically |
| Rounding differences | Compare with 2-decimal precision |

## 11. Traceability

| Requirement | Test Cases |
|-------------|-----------|
| Add two items to cart | TC-02 |
| Correct items in cart | TC-03 |
| Correct totals at checkout | TC-05 |
| Payment / order confirmed | TC-06 |
| PDF download | TC-08 |
| PDF content correct | TC-09 |