import { initializeApp, getApps } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, where,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
}

// Force fully-offline operation regardless of any Firebase config that may be
// present in the bundle. Set VITE_OFFLINE=1 (see .env.offline) to build a
// local-only version that never touches Google's servers — the resilient
// fallback for "if Firebase ever goes down." When it's off, the app behaves
// exactly as before and uses the cloud whenever a config is present.
const forceOffline =
  import.meta.env.VITE_OFFLINE === '1' || import.meta.env.VITE_OFFLINE === 'true'

// Offline when explicitly forced, or when no Firebase config was provided.
export const offlineMode = forceOffline || !(cfg.apiKey && cfg.projectId)
export const firebaseReady = !offlineMode

// Synthetic single-user identity used in offline mode so the app opens straight
// into the simulator with no login wall. `isLocal` lets the UI hide sign-out.
const LOCAL_USER = { uid: 'local', displayName: 'Local', email: 'local', isLocal: true }

// reCAPTCHA v3 site key for App Check. When set, only requests originating
// from the real, attested app are accepted by Firebase — a clone that copies
// the public Firebase config cannot talk to this backend.
const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY || ''

function getApp() {
  if (getApps().length) return getApps()[0]
  const app = initializeApp(cfg)
  if (appCheckKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    })
  }
  return app
}

let _db = null
function db() {
  if (!firebaseReady) throw new Error('Firebase not configured — add VITE_FIREBASE_* to .env')
  if (!_db) _db = getFirestore(getApp())
  return _db
}

let _auth = null
function auth() {
  if (!firebaseReady) throw new Error('Firebase not configured')
  if (!_auth) _auth = getAuth(getApp())
  return _auth
}

// Resolve the signed-in user's uid, or throw. Every stored document is scoped
// to its owner, so writes/reads without an authenticated user are rejected
// here before they ever reach Firestore (where the rules would reject them too).
function requireUid() {
  const u = auth().currentUser
  if (!u) throw new Error('You must be signed in to do that.')
  return u.uid
}

// ── Auth ──────────────────────────────────────────────────
export function subscribeAuth(callback) {
  // Offline: hand back the local user so the app skips the login screen.
  if (!firebaseReady) { callback(LOCAL_USER); return () => {} }
  return onAuthStateChanged(auth(), callback)
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth(), email, password)
}

export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth(), email, password)
  if (displayName) await updateProfile(cred.user, { displayName })
  return cred
}

export async function signOut() {
  // No account to sign out of when running offline.
  if (!firebaseReady) return
  return fbSignOut(auth())
}

// ── Shared content catalog ────────────────────────────────
// The scenario / algorithm / reversible-cause catalog lives server-side in the
// `acls_content` collection instead of the JS bundle, so a clone that copies
// the front-end ships with no content. Readable by any signed-in user;
// writable only out-of-band by the seed script (see scripts/seed-content.mjs).
export async function fbLoadContent() {
  requireUid()
  // One round trip for the whole catalog (a handful of small docs). Note: the
  // Firestore modular SDK pulls its full sync engine into the bundle (~40 kB
  // gzipped) once content is fetched this way — acceptable for a cached PWA and
  // useful for offline. Revisit with the REST API or a lite client if size matters.
  const snap = await getDocs(query(collection(db(), 'acls_content')))
  const out = {}
  snap.forEach(d => { out[d.id] = d.data() })
  return out
}

// ── Scenario storage ──────────────────────────────────────
export async function fbSaveScenario(payload) {
  const uid = requireUid()
  const ref = await addDoc(collection(db(), 'acls_scenarios'), {
    ...payload,
    uid,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadScenarios() {
  const uid = requireUid()
  // Sort client-side rather than orderBy() in the query — combining an
  // equality filter with an orderBy on a different field requires a
  // composite index, which isn't guaranteed to exist in every project.
  const snap = await getDocs(
    query(collection(db(), 'acls_scenarios'), where('uid', '==', uid))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.savedAt - a.savedAt)
}

export async function fbDeleteScenario(id) {
  requireUid()
  await deleteDoc(doc(db(), 'acls_scenarios', id))
}

// ── Student simulation sessions ───────────────────────────
export async function fbSaveSession(payload) {
  const uid = requireUid()
  const ref = await addDoc(collection(db(), 'acls_sessions'), {
    ...payload,
    uid,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadSessions() {
  const uid = requireUid()
  // Sort client-side (see fbLoadScenarios) to avoid depending on a
  // composite index for uid + savedAt.
  const snap = await getDocs(
    query(collection(db(), 'acls_sessions'), where('uid', '==', uid))
  )
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.savedAt - a.savedAt)
}

export async function fbDeleteSession(id) {
  requireUid()
  await deleteDoc(doc(db(), 'acls_sessions', id))
}
