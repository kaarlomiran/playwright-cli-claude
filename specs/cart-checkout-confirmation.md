# Cart, Checkout & Order Confirmation Test Plan

source: tickets/Testkm_SampleTestScopeRequirements.md

## Application overview
SauceDemo checkout journey: a logged-in `standard_user` adds two products
to the cart, reviews the cart, enters checkout information, reviews the
computed overview (item total / tax / total), finishes the order, and
lands on a confirmation page. A PDF order receipt is also available on
the confirmation page (see Disagreement below).

## Exploration method
Live, read-only walkthrough via `playwright-cli` against
https://www.saucedemo.com/ on 2026-09-29/30, one action at a time,
verifying every accessible name / `data-test` id and every computed
value in `tickets/Testkm_SampleTestScopeRequirements.md` against the
real DOM. No test code was written during this pass.

## Disagreement — ticket assumption vs. live app (RESOLVED 2026-09-30, see below)
`tickets/Testkm_SampleTestScopeRequirements.md` §2 states: *"PDF download
is not a native Sauce Demo feature... does not provide a PDF receipt"*
and instructs marking TC-08/TC-09 **Blocked/N/A** unless the environment
proves otherwise.

**The live app does provide it.** The confirmation page has a real
`button "Generate PDF order"` (`data-test="generate-pdf-order"`) that
fires a genuine browser `download` event and produces a real PDF. Per
the ticket's own conditional logic ("if the environment... provides a
PDF download, execute TC-08 and TC-09"), TC-08 is now in scope.

**But TC-09's expected PDF content doesn't fully match the real PDF
either.** Captured PDF (`.playwright-cli/swag-labs-order-*.pdf`)
contains:

| Ticket (TC-09) expects | Real PDF contains |
|---|---|
| "Thank you for your order!" | ✅ present, verbatim |
| Item names: Sauce Labs Backpack, Sauce Labs Bike Light | ✅ present |
| Item prices: $29.99, $9.99 | ✅ present |
| Item total $39.98 / Tax $3.20 / Total $43.18 | ✅ present, all three |
| **Payment info: SauceCard #31337** | ❌ not present anywhere in the PDF |
| **Shipping: Free Pony Express Delivery!** | ❌ not present — PDF has "SHIP TO: Test User / 12345" instead (the checkout-form name+zip, not the shipping *method* text) |
| *(not requested by ticket)* | PDF also has an "Order Date" line, not mentioned in TC-09 |

**Resolved 2026-09-30:** you chose to correct TC-09's assertions to
match the real PDF content rather than keep the ticket's literal
(unmet) expectations or split them into a deliberately-failing block.
Scenario 1.2 below reflects that decision. The gap between the ticket's
expectation and the app's real PDF content is still worth raising with
whoever owns the ticket/product — this plan documents it but doesn't
file it anywhere.

## Other observations (not acceptance-criteria, logged for awareness only)
- 4 third-party console errors on every page (`events.backtrace.io`
  telemetry endpoint returning 401) — unrelated to app functionality,
  not an assertion target, out of scope per ticket §4.

## Test scenarios

### 1. Cart, checkout & confirmation

**Precondition for both scenarios below:** logged in as `standard_user`
— reuse `specs/saucedemo-login.md#1.1` / `tests/auth/standard-login.spec.ts`
rather than re-specifying login steps here.

#### 1.1 add-two-items-checkout-and-confirm
**File:** `tests/checkout/add-two-items-checkout-and-confirm.spec.ts`
**Priority:** P0   **Tags:** @smoke @critical
**Preconditions:** Logged in as `standard_user`, cart empty, on
`/inventory.html`.
**Steps:**
  1. Click **Add to cart** for "Sauce Labs Backpack" (`data-test="add-to-cart-sauce-labs-backpack"`).
     - expect: button becomes **Remove**
  2. Click **Add to cart** for "Sauce Labs Bike Light" (`data-test="add-to-cart-sauce-labs-bike-light"`).
     - expect: button becomes **Remove**
     - expect: cart icon accessible name is exactly `"Cart, 2 items"`, badge (`data-test="shopping-cart-badge"`) text is `"2"`
  3. Click the cart icon (`data-test="shopping-cart-link"`).
     - expect: URL is `/cart.html`
     - expect: exactly 2 rows (`data-test="inventory-item"`): "Sauce Labs Backpack" $29.99 qty 1, "Sauce Labs Bike Light" $9.99 qty 1
     - expect: **Checkout** and **Continue Shopping** buttons visible
  4. Click **Checkout** (`data-test="checkout"`).
     - expect: URL is `/checkout-step-one.html`
  5. Fill First Name = `Test`, Last Name = `User`, Zip = `12345`
     (`data-test="firstName"`/`"lastName"`/`"postalCode"`), click
     **Continue** (`data-test="continue"`).
     - expect: URL is `/checkout-step-two.html`, no validation errors
  6. On the overview page, read the computed values.
     - expect: exactly 2 line items, same names/prices/qty as step 3
     - expect: Payment Information text is exactly `"SauceCard #31337"`
     - expect: Shipping Information text is exactly `"Free Pony Express Delivery!"`
     - expect: item-total label reads `"Item total: $39.98"`
     - expect: tax label reads `"Tax: $3.20"`
     - expect: total label reads `"Total: $43.18"`
     - expect (computed, not hardcoded): scraped item prices summed = item-total; item-total × 0.08 rounded to 2dp = tax; item-total + tax = total
  7. Click **Finish** (`data-test="finish"`).
     - expect: URL is `/checkout-complete.html`
     - expect: heading (level 2) reads exactly `"Thank you for your order!"`
     - expect: body text is `"Your order has been dispatched, and will arrive just as fast as the pony can get there!"`
     - expect: cart icon accessible name is `"Cart, empty"` (badge cleared)
  8. Click **Back Home** (`data-test="back-to-products"`).
     - expect: URL is `/inventory.html`
  9. Click the cart icon (`data-test="shopping-cart-link"`).
     - expect: URL is `/cart.html`, zero `data-test="inventory-item"` rows, cart icon reads `"Cart, empty"`

**Status:** GENERATED, PASSING (verified 2026-09-30).

#### 1.2 confirmation-page-pdf-receipt
**File:** `tests/checkout/confirmation-page-pdf-receipt.spec.ts`
**Priority:** P1 (was P-conditional in the ticket; now real per live-app check)   **Tags:** @regression
**Preconditions:** Same as 1.1 through step 7 (order finished, on
`/checkout-complete.html`).
**Steps:**
  1. Click **Generate PDF order** (`data-test="generate-pdf-order"`)
     and await the `download` event.
     - expect: a `.pdf` file downloads, file size > 0
  2. Extract text from the downloaded PDF.
     - expect: contains "Thank you for your order!"
     - expect: contains item names "Sauce Labs Backpack", "Sauce Labs Bike Light"
     - expect: contains item prices "$29.99", "$9.99"
     - expect: contains "$39.98" (item total), "$3.20" (tax), "$43.18" (total)
     - expect: contains an "Order Date" line
     - expect: contains "Ship To" with the checkout form's First Name +
       Last Name ("Test User") and Zip ("12345")
     - **Deliberately NOT asserted** (corrected per your decision
       2026-09-30): "SauceCard #31337" and "Free Pony Express
       Delivery!" — the ticket (TC-09) expected these in the PDF, but
       the real PDF doesn't carry payment/shipping-method text at all.
       If the PDF should include them, that's a product gap to raise
       with SauceDemo/the ticket author, not something to assert here.

**Note on PDF text extraction:** the confirmation page's "SHIP TO" label
renders with letter-spacing CSS; `pdf-parse` extracts it as `S H I P TO`
rather than `Ship To`. The generated test matches this with a
whitespace-tolerant regex rather than the literal ticket casing —
confirmed against the real downloaded PDF on 2026-09-30.

**Status:** GENERATED, PASSING (verified 2026-09-30).

## Traceability
| Ticket requirement | Ticket TC | Scenario here |
|---|---|---|
| Add two items to cart | TC-02 | 1.1 steps 1-2 |
| Correct items in cart | TC-03 | 1.1 step 3 |
| Checkout info form | TC-04 | 1.1 steps 4-5 |
| Correct totals at checkout | TC-05 | 1.1 step 6 |
| Payment / order confirmed | TC-06 | 1.1 step 7 |
| Cart emptied after order | TC-07 | 1.1 steps 8-9 |
| PDF download | TC-08 | 1.2 step 1 |
| PDF content correct | TC-09 | 1.2 step 2 (assertions corrected to match real PDF — see Disagreement) |
