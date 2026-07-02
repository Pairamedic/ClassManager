export const LEAD_NAMES = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6']

export const DEFAULT_LEAD_PROFILES = {
  'I':   { amp: 0.60, inv: false, st: 0 },
  'II':  { amp: 1.00, inv: false, st: 0 },
  'III': { amp: 0.50, inv: false, st: 0 },
  'aVR': { amp: 0.70, inv: true,  st: 0 },
  'aVL': { amp: 0.40, inv: false, st: 0 },
  'aVF': { amp: 0.70, inv: false, st: 0 },
  'V1':  { amp: 0.50, inv: true,  st: 0 },
  'V2':  { amp: 0.65, inv: false, st: 0 },
  'V3':  { amp: 0.85, inv: false, st: 0 },
  'V4':  { amp: 1.05, inv: false, st: 0 },
  'V5':  { amp: 0.95, inv: false, st: 0 },
  'V6':  { amp: 0.75, inv: false, st: 0 },
}

const SCENARIO_LEAD_OVERRIDES = {
  'Anterior STEMI': {
    'V1':  { amp: 0.55, inv: false, st: 2 },
    'V2':  { amp: 0.80, inv: false, st: 4 },
    'V3':  { amp: 1.00, inv: false, st: 5 },
    'V4':  { amp: 1.20, inv: false, st: 4 },
    'V5':  { amp: 0.95, inv: false, st: 2 },
    'V6':  { amp: 0.75, inv: false, st: 1 },
    'aVR': { amp: 0.65, inv: true,  st: -2 },
  },
  'Inferior STEMI': {
    'II':  { amp: 1.00, inv: false, st: 4 },
    'III': { amp: 0.60, inv: false, st: 5 },
    'aVF': { amp: 0.75, inv: false, st: 4 },
    'I':   { amp: 0.55, inv: false, st: -2 },
    'aVL': { amp: 0.40, inv: false, st: -2 },
  },
}

// STEMI localization by coronary territory. Each map raises ST in the involved
// leads (st is in the same units as DEFAULT_LEAD_PROFILES) and drops it in the
// reciprocal leads; unspecified fields fall back to the default profile.
// Posterior is inferred from anterior ST depression + tall R (no V7–V9 here).
export const STEMI_TERRITORIES = {
  none:          {},
  septal:        { V1: { st: 4 }, V2: { st: 4 }, V3: { st: 2 } },
  anterior:      { V2: { st: 3 }, V3: { st: 5 }, V4: { st: 5 }, V5: { st: 2 } },
  anteroseptal:  { V1: { st: 4 }, V2: { st: 5 }, V3: { st: 5 }, V4: { st: 4 }, aVR: { st: -2 } },
  lateral:       { I: { st: 3 }, aVL: { st: 3 }, V5: { st: 4 }, V6: { st: 4 }, III: { st: -2 }, aVF: { st: -2 } },
  anterolateral: { V3: { st: 4 }, V4: { st: 5 }, V5: { st: 4 }, V6: { st: 3 }, I: { st: 3 }, aVL: { st: 3 } },
  highlateral:   { I: { st: 4 }, aVL: { st: 4 }, III: { st: -3 }, aVF: { st: -2 } },
  inferior:      { II: { st: 4 }, III: { st: 5 }, aVF: { st: 4 }, I: { st: -2 }, aVL: { st: -2 } },
  inferolateral: { II: { st: 4 }, III: { st: 4 }, aVF: { st: 4 }, V5: { st: 3 }, V6: { st: 3 }, aVL: { st: -2 } },
  posterior:     { V1: { st: -3, amp: 0.75, inv: false }, V2: { st: -4, amp: 0.95, inv: false }, V3: { st: -3 }, II: { st: 3 }, III: { st: 3 }, aVF: { st: 3 } },
  rv:            { II: { st: 3 }, III: { st: 4 }, aVF: { st: 3 }, V1: { st: 3 }, I: { st: -2 }, aVL: { st: -2 } },
}

// Ordered list for the UI toggle, with the involved leads shown as a hint.
export const STEMI_TERRITORY_LIST = [
  { key: 'none',          label: 'None',          leads: 'no injury pattern' },
  { key: 'septal',        label: 'Septal',        leads: 'V1–V2' },
  { key: 'anterior',      label: 'Anterior',      leads: 'V3–V4' },
  { key: 'anteroseptal',  label: 'Anteroseptal',  leads: 'V1–V4' },
  { key: 'lateral',       label: 'Lateral',       leads: 'I, aVL, V5–V6' },
  { key: 'anterolateral', label: 'Anterolateral', leads: 'V3–V6, I, aVL' },
  { key: 'highlateral',   label: 'High Lateral',  leads: 'I, aVL' },
  { key: 'inferior',      label: 'Inferior',      leads: 'II, III, aVF' },
  { key: 'inferolateral', label: 'Inferolateral', leads: 'II, III, aVF, V5–V6' },
  { key: 'posterior',     label: 'Posterior',     leads: 'V1–V3 ↓ (reciprocal)' },
  { key: 'rv',            label: 'Right Ventricular', leads: 'II, III, aVF, V1' },
]

// A chosen STEMI territory wins over any scenario-name override; falling back to
// the legacy scenario override keeps existing STEMI scenarios working.
export function getLeadProfiles(rhythmId, scenarioName, stemiTerritory) {
  const overrides = (stemiTerritory && STEMI_TERRITORIES[stemiTerritory])
    || SCENARIO_LEAD_OVERRIDES[scenarioName]
    || {}
  const profiles = {}
  for (const lead of LEAD_NAMES) {
    profiles[lead] = { ...DEFAULT_LEAD_PROFILES[lead], ...(overrides[lead] || {}) }
  }
  return profiles
}
