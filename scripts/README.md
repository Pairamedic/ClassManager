# Content seeding

The medical content catalog (scenarios, algorithms, reversible causes) lives in
Firestore under the `acls_content` collection, **not** in the app bundle. This is
deliberate: a clone of the front-end ships with no content and is an empty shell.

`seed-data/` holds the source-of-truth content. `seed-content.mjs` uploads it to
Firestore using the Firebase Admin SDK.

This tooling has its **own** `package.json` and is intentionally isolated from
the app: installing `firebase-admin` at the repo root re-resolves the web app's
`@firebase/*` packages and bloats the production bundle, so it lives here instead.

## One-time setup

1. Install the admin SDK inside this directory (not the repo root):

   ```sh
   cd scripts && npm install
   ```

2. Get a service-account key: Firebase Console → Project Settings →
   Service accounts → **Generate new private key**. Save the JSON somewhere
   outside the repo (never commit it — it grants full project access).

## Seeding / updating content

```sh
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  node scripts/seed-content.mjs
```

Re-run any time you edit files in `seed-data/` — it overwrites the catalog
documents in place. The running app picks up the new content on next load.

## Notes

- Admin writes bypass Firestore security rules, which is why `acls_content` stays
  client-read-only in `firestore.rules`.
- The app requires a configured Firebase project to show any content (there is no
  bundled fallback — that is the point). For local development, point `.env` at a
  real project, or run the Firestore emulator with this collection seeded.
