import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import {
  getDatabase, ref as dbRef, onValue, set as dbSet,
  push as dbPush, remove as dbRemove, onChildAdded,
} from 'firebase/database'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || '',
}

export const firebaseReady = !!(cfg.apiKey && cfg.projectId)
// Realtime control (phone ↔ monitor) additionally needs a Realtime Database URL.
export const realtimeReady = firebaseReady && !!cfg.databaseURL

function app() {
  return getApps().length ? getApps()[0] : initializeApp(cfg)
}

let _db = null
function db() {
  if (!firebaseReady) throw new Error('Firebase not configured — add VITE_FIREBASE_* to .env')
  if (!_db) _db = getFirestore(app())
  return _db
}

let _rtdb = null
function rtdb() {
  if (!realtimeReady) throw new Error('Realtime Database not configured — add VITE_FIREBASE_DATABASE_URL to .env')
  if (!_rtdb) _rtdb = getDatabase(app())
  return _rtdb
}

export async function fbSaveScenario(payload) {
  const ref = await addDoc(collection(db(), 'acls_scenarios'), {
    ...payload,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadScenarios() {
  const snap = await getDocs(
    query(collection(db(), 'acls_scenarios'), orderBy('savedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteScenario(id) {
  await deleteDoc(doc(db(), 'acls_scenarios', id))
}

// ── Student simulation sessions ──
export async function fbSaveSession(payload) {
  const ref = await addDoc(collection(db(), 'acls_sessions'), {
    ...payload,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadSessions() {
  const snap = await getDocs(
    query(collection(db(), 'acls_sessions'), orderBy('savedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteSession(id) {
  await deleteDoc(doc(db(), 'acls_sessions', id))
}

// ── Realtime remote control (room = pairing code) ──
// The monitor (iPad) publishes a status snapshot; the remote (phone) reads it.
export function rtPublishState(room, snapshot) {
  return dbSet(dbRef(rtdb(), `rooms/${room}/state`), snapshot)
}

export function rtSubscribeState(room, cb) {
  const r = dbRef(rtdb(), `rooms/${room}/state`)
  return onValue(r, snap => cb(snap.val()))   // returns an unsubscribe fn
}

// The remote pushes reducer actions onto a queue; the monitor applies + clears them.
export function rtSendCommand(room, action) {
  return dbPush(dbRef(rtdb(), `rooms/${room}/commands`), { ...action, _ts: Date.now() })
}

export function rtSubscribeCommands(room, cb) {
  const r = dbRef(rtdb(), `rooms/${room}/commands`)
  return onChildAdded(r, snap => {
    const action = snap.val()
    cb(action)
    dbRemove(dbRef(rtdb(), `rooms/${room}/commands/${snap.key}`))
  })
}
