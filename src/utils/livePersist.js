// Auto-persist the in-progress simulator session to the browser so closing
// the tab / app (or a crash) doesn't lose the current code. This is separate
// from the explicit "Sessions" save (which is per-user and cloud-backed) —
// it's a local, offline-friendly resume.
const KEY = 'cm_sim_live_state_v1'

export function loadLiveState(initialState) {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return initialState

    // Merge over defaults so fields added in a future build still get sane
    // values, and reset a few transient flags that shouldn't survive a reload.
    return {
      ...initialState,
      ...saved,
      vitals: { ...initialState.vitals, ...saved.vitals },
      defib:  { ...initialState.defib,  ...saved.defib, charging: false, charged: false },
      pacer:  { ...initialState.pacer,  ...saved.pacer },
      cpr:    { ...initialState.cpr,    ...saved.cpr },
      instructorOpen: false,
    }
  } catch {
    return initialState
  }
}

export function saveLiveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable (private mode) — nothing to do
  }
}

export function clearLiveState() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
