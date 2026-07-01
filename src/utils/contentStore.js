// Content catalog loader with an offline fallback, mirroring the pattern in
// sessionStore.js: use Firestore when Firebase is configured, otherwise serve
// the locally-bundled catalog so the app works with no backend.
import { firebaseReady, fbLoadContent } from '../firebase'
import { OFFLINE_CONTENT } from '../data/offlineContent'

export async function loadContent() {
  if (!firebaseReady) return OFFLINE_CONTENT

  const content = await fbLoadContent()
  // The catalog is seeded out-of-band (scripts/seed-content.mjs) and can be
  // missing or partially seeded (e.g. a fresh project, or a doc that failed
  // to upload). Fall back per-key to the bundled catalog rather than
  // silently showing an empty Quick Scenarios / Algorithms / Causes list.
  return {
    scenarios:        content.scenarios?.items?.length  ? content.scenarios        : OFFLINE_CONTENT.scenarios,
    algorithms:       content.algorithms?.items?.length  ? content.algorithms       : OFFLINE_CONTENT.algorithms,
    reversibleCauses: content.reversibleCauses?.items?.length ? content.reversibleCauses : OFFLINE_CONTENT.reversibleCauses,
  }
}
