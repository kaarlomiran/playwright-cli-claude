# Test data shape

`tests/data/*.json` — one file per domain concept (users, products,
coupons...). Flat, named keys, no arrays-of-objects unless the spec
genuinely iterates them.

```json
{
  "standard": { "username": "standard_user", "password": "secret_sauce" }
}
```

Import directly in the spec (JSON imports are enabled via
`resolveJsonModule` in tsconfig.json):

```ts
import users from '../data/users.json';
...
await loginPage.loginAs(users.standard);
```

When a DATA finding surfaces during an exploration session (see the
exploration-session skill), add it here with a comment citing the
session file, e.g. `// coupon SAVE10 is single-use — see
sessions/2026-09-18-checkout.md`.
