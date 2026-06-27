import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
}

export const firebaseReady = !!(cfg.apiKey && cfg.projectId)

let _db = null
function db() {
  if (!firebaseReady) throw new Error('Firebase not configured — add VITE_FIREBASE_* to .env')
  if (!_db) {
    const app = getApps().length ? getApps()[0] : initializeApp(cfg)
    _db = getFirestore(app)
  }
  return _db
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
