# Demo Credentials — KichuLagbe

Seeded demo accounts and codes for local development and the live demo.
Re-created every time you run `npm run db:seed`.

> These are **demo** credentials only. Real secrets (`DATABASE_URL`,
> `SESSION_SECRET`, Firebase keys) live in `.env.local`, which is gitignored and
> never committed.

**Live app:** https://kichulagbe.vercel.app

## Demo login accounts

All three share the same password: **`Password123!`**

| Role     | Email                    | Password       | Can access            |
| -------- | ------------------------ | -------------- | --------------------- |
| Admin    | `admin@kichulagbe.com`   | `Password123!` | `/admin`, `/rider`, storefront |
| Rider    | `rider@kichulagbe.com`   | `Password123!` | `/rider`, storefront  |
| Customer | `customer@kichulagbe.com`| `Password123!` | storefront only       |

## Demo coupons

| Code        | Discount        | Min order | Status                          |
| ----------- | --------------- | --------- | ------------------------------- |
| `WELCOME10` | 10% off         | ৳200      | Active                          |
| `FORMULA`   | ৳20 flat off    | ৳150      | Expired (2026-03-15) — for testing the "expired" path |

## Notes

- Passwords are hashed with bcrypt on seed; the plaintext above is only the
  seed input.
- Google sign-in (Firebase) is separate and needs the `NEXT_PUBLIC_FIREBASE_*`
  values in `.env.local`.
- To reset all demo data to this state: `npm run db:seed`.
