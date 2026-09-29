# SauceDemo Login Test Plan

## Application overview
SauceDemo (https://www.saucedemo.com) is a public Playwright/QA training
app. One shared password (`secret_sauce`); the username selects one of
six deliberately different behaviours (see tests/data/users.json).

## Status
Only scenario 1.1 below is generated so far (the initial framework
worked example). Further scenarios in this plan — and any other
feature — are added only when the user supplies a test-scope request.

## Test scenarios

### 1. Login

**Seed:** none yet — `loginPage.goto()` navigates directly (see
pom-framework skill if a shared seed/fixture becomes worth adding).

#### 1.1 standard-user-can-login
**File:** `tests/auth/standard-login.spec.ts`
**Priority:** P0   **Tags:** @smoke @critical
**Preconditions:** Logged out, on the login page (`/`).
**Steps:**
  1. Type `standard_user` into the Username field (role textbox, name "Username").
  2. Type `secret_sauce` into the Password field (role textbox, name "Password").
  3. Click the Login button (role button, name "Login").
     - expect: page URL becomes `/inventory.html`
     - expect: header (`data-test="title"`) reads "Products"
     - expect: exactly 6 product cards visible (`.inventory_item`)

**Status:** GENERATED, PASSING (verified 2026-09-29).

**Note on locators:** the header is `getByTestId('title')`, not a
`heading` role element — SauceDemo doesn't expose it semantically. Also
note `testIdAttribute: 'data-test'` is set globally in
playwright.config.ts (SauceDemo's real attribute, not Playwright's
default `data-testid`). Both were discovered by running the generated
test and reading `error-context.md`, not assumed from documentation.
