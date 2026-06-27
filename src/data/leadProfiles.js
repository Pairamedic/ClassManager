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

export function getLeadProfiles(rhythmId, scenarioName) {
  const overrides = SCENARIO_LEAD_OVERRIDES[scenarioName] || {}
  const profiles = {}
  for (const lead of LEAD_NAMES) {
    profiles[lead] = { ...DEFAULT_LEAD_PROFILES[lead], ...(overrides[lead] || {}) }
  }
  return profiles
}
