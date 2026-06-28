import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy, setDoc, getDoc, onSnapshot,
} from 'firebase/firestore'
import {
  getDatabase, ref as dbRef, onValue, set as dbSet,
  push as dbPush, remove as dbRemove, onChildAdded,
} from 'firebase/database'
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
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || '',
}

export const firebaseReady = !!(cfg.apiKey && cfg.projectId)
export const realtimeReady = firebaseReady && !!cfg.databaseURL

function getApp() {
  return getApps().length ? getApps()[0] : initializeApp(cfg)
}

let _db = null
function db() {
  if (!firebaseReady) throw new Error('Firebase not configured — add VITE_FIREBASE_* to .env')
  if (!_db) _db = getFirestore(getApp())
  return _db
}

let _rtdb = null
function rtdb() {
  if (!realtimeReady) throw new Error('Realtime Database not configured — add VITE_FIREBASE_DATABASE_URL to .env')
  if (!_rtdb) _rtdb = getDatabase(getApp())
  return _rtdb
}

let _auth = null
function auth() {
  if (!firebaseReady) throw new Error('Firebase not configured')
  if (!_auth) _auth = getAuth(getApp())
  return _auth
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

// ── Scenario storage ──────────────────────────────────────
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

// ── Live rooms (instructor → student real-time sync) ──────
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateRoomCode() {
  return Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('')
}

function serializeInstructorState(state) {
  return {
    currentRhythm:    state.currentRhythm,
    vitals:           { ...state.vitals },
    vitalsHidden:     state.vitalsHidden,
    labelHidden:      state.labelHidden,
    isRunning:        state.isRunning,
    scenarioName:     state.scenarioName || null,
    reversibleCauses: [...state.reversibleCauses],
    captureThreshold: state.pacer.captureThreshold,
    rosc:             state.rosc,
    roscTime:         state.roscTime || null,
    updatedAt:        Date.now(),
  }
}

export async function createRoom(code, state) {
  await setDoc(doc(db(), 'rooms', code), {
    instructor: serializeInstructorState(state),
    createdAt: Date.now(),
  })
}

export async function roomExists(code) {
  const snap = await getDoc(doc(db(), 'rooms', code))
  return snap.exists()
}

export function subscribeRoom(code, onChange) {
  return onSnapshot(doc(db(), 'rooms', code), snap => {
    if (snap.exists()) onChange(snap.data().instructor)
  })
}

export async function pushInstructorState(code, state) {
  await setDoc(doc(db(), 'rooms', code), {
    instructor: serializeInstructorState(state),
  }, { merge: true })
}

// ── Student simulation sessions ───────────────────────────
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

// ── Realtime remote control (RTDB phone ↔ monitor) ───────
export function rtPublishState(room, snapshot) {
  return dbSet(dbRef(rtdb(), `rooms/${room}/state`), snapshot)
}

export function rtSubscribeState(room, cb) {
  const r = dbRef(rtdb(), `rooms/${room}/state`)
  return onValue(r, snap => cb(snap.val()))
}

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
