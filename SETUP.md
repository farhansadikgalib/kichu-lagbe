# Fresh-clone setup

Everything the repo does **not** ship (gitignored) and how to restore it.

## 1. Install dependencies

```bash
npm install
```

Requires Node 20+.

## 2. Environment — required

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

If the project is already linked to Vercel (step 3), pull the stored values instead:

```bash
npx vercel env pull .env.local
```

## 3. Vercel link — only if deploying from this clone

The `.vercel/` folder is not committed. Link once, then deploys and env pulls work:

```bash
npx vercel link        # pick the existing "deliveryhobe" project
npx vercel deploy --prod
```

## 4. Database

Pointing at the existing Aiven database? It is already migrated and seeded — but
apply pending schema changes after pulling (`npm run db:push`, or `db:migrate`
if the database was set up with migrations). The latest change drops the
`delivery_areas` table and the `area_id` / `area_name` order columns: delivery is
one flat charge stored in `app_settings` (`deliveryCharge`), editable under
Admin → Delivery.

For a brand-new empty database:

```bash
npm run db:push   # create schema
npm run db:seed   # demo data + accounts
```

### Local Postgres instead of Aiven

```bash
createdb kichulagbe
```

Then set in `.env.local` — `sslmode=disable` matters, since a local server
usually has TLS off while the hosted one requires it:

```
DATABASE_URL="postgres://<you>@localhost:5432/kichulagbe?sslmode=disable"
```

Then run `npm run db:push` and `npm run db:seed` as above.

Demo users (all `Password123!`): admin@kichulagbe.com, rider@kichulagbe.com,
customer@kichulagbe.com.

## 5. Run

```bash
npm run dev
```

With the server running, the end-to-end API suite exercises auth, catalog,
coupons, the full order lifecycle, and role guards:

```bash
node tests/integration.mjs
```

## Notes

- `secrets/` is local-only and currently unused by code (Google sign-in uses
  `FIREBASE_PROJECT_ID` from env, not the service-account JSON).
- The PWA service worker only registers in production builds, so DevTools shows
  no service worker under `npm run dev` — that's intentional.
