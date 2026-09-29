# Worked example: sessions/<date>-<area>.md

```markdown
# Session 2026-09-29 · Checkout

**Charter:** Explore checkout with a full cart and find ways payment
can be submitted twice.
**Tester:** <name>   **Timebox:** 60 min   **Build:** <version>
**Persona:** standard_user   **Env:** https://www.saucedemo.com
**Evidence:** debug/videos/session-checkout.webm ·
debug/traces/session-checkout.trace

## Locator inventory
| Element        | Role / name                  | Test id (data-test) |
|----------------|------------------------------|----------------------|
| Checkout CTA   | button "Checkout"             | checkout             |
| Postal code    | textbox "Zip/Postal Code"     | postalCode            |
| Finish         | button "Finish"                | finish               |

## Findings
1. BUG — double-clicking Finish submits the order twice. Video 03:12,
   trace covers the same window.
2. DATA — coupon SAVE10 is single-use per account on staging.

## Candidate scenarios
| id  | Scenario                              | Verdict     | Why |
|-----|----------------------------------------|-------------|-----|
| C1  | Happy path: 2 items -> order complete | AUTOMATE    | P0, stable |
| C2  | Double-click Finish -> one order only | AUTOMATE    | guards bug #1 |
| C3  | Confirmation email wording & layout    | MANUAL-ONLY | human judgement |

## Coverage
Covered: cart -> step one -> step two -> complete, happy path.
Not covered: tax/locale variants, guest checkout.

## Open questions for the team
- Is double-submit a known issue? Blocks C2 expected result.
```

## Verdict rubric
- **AUTOMATE**: outcome is deterministic (same input -> same output),
  the app's behaviour is intentional (not a bug you're enshrining), and
  the locators used to reach it were stable across the session.
- **MANUAL-ONLY**: correctness is a judgement call (visual polish, tone,
  a11y "feel"), needs real hardware, or depends on a third-party sandbox
  you can't control from CI.
- **DEFER**: worth automating eventually but blocked today — flaky
  feature, missing test data, or an open product decision. Always give
  a DEFER row an unblock condition, not just a shrug.
