// Seed the Firestore `acls_content` catalog from the local source-of-truth in
// scripts/seed-data/. This is the one place the content exists in plain form —
// the app bundle no longer ships it, so a clone of the front-end has no content.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
//     node scripts/seed-content.mjs
//
// The service-account credentials are a Firebase Admin key (Firebase Console →
// Project Settings → Service accounts → Generate new private key). Admin writes
// bypass security rules, which is why the rules can keep `acls_content`
// read-only for clients. Re-running overwrites the catalog documents in place.

import admin from 'firebase-admin'
import { SCENARIOS, SCENARIO_GROUPS } from './seed-data/scenarios.js'
import { ALGORITHMS } from './seed-data/algorithms.js'
import { REVERSIBLE_CAUSES } from './seed-data/reversibleCauses.js'

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase Admin service-account JSON path.'
  )
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.applicationDefault() })
const db = admin.firestore()

const docs = {
  scenarios:        { groups: SCENARIO_GROUPS, items: SCENARIOS },
  algorithms:       { items: ALGORITHMS },
  reversibleCauses: { items: REVERSIBLE_CAUSES },
}

const seededAt = Date.now()

for (const [id, data] of Object.entries(docs)) {
  await db.collection('acls_content').doc(id).set({ ...data, seededAt })
  const count = data.items?.length ?? 0
  console.log(`✓ acls_content/${id} — ${count} item(s)`)
}

console.log('Done.')
process.exit(0)
