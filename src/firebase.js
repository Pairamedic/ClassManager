import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy, where,
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

export const firebaseReady = !!(cfg.apiKey && cfg.projectId)

function getApp() {
  return getApps().length ? getApps()[0] : initializeApp(cfg)
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

function uid() {
  const u = auth().currentUser
  if (!u) throw new Error('Not signed in')
  return u.uid
}

// ── Auth ──────────────────────────────────────────────────
export function subscribeAuth(callback) {
  if (!firebaseReady) { callback(null); return () => {} }
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
  return fbSignOut(auth())
}

// ── Scenario storage (scoped per authenticated user) ──────
export async function fbSaveScenario(payload) {
  const ref = await addDoc(collection(db(), 'acls_scenarios'), {
    ...payload,
    uid: uid(),
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadScenarios() {
  const snap = await getDocs(
    query(
      collection(db(), 'acls_scenarios'),
      where('uid', '==', uid()),
      orderBy('savedAt', 'desc'),
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteScenario(id) {
  await deleteDoc(doc(db(), 'acls_scenarios', id))
}

// ── Student simulation sessions (scoped per authenticated user) ──
export async function fbSaveSession(payload) {
  const ref = await addDoc(collection(db(), 'acls_sessions'), {
    ...payload,
    uid: uid(),
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadSessions() {
  const snap = await getDocs(
    query(
      collection(db(), 'acls_sessions'),
      where('uid', '==', uid()),
      orderBy('savedAt', 'desc'),
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteSession(id) {
  await deleteDoc(doc(db(), 'acls_sessions', id))
}
