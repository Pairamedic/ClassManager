// ECG limb-lead electrodes and placement (US / AAMI color convention).
//
// The learner must place each colored electrode on the correct limb before the
// monitor shows an ECG trace (defib pads can also drive a trace — see the
// monitor). Precordial leads (V1–V6) for a full 12-lead are a later addition.

export const ELECTRODES = [
  { color: 'white', hex: '#F8FAFC', label: 'White' },
  { color: 'black', hex: '#334155', label: 'Black' },
  { color: 'green', hex: '#22C55E', label: 'Green' },
  { color: 'red',   hex: '#EF4444', label: 'Red' },
]

export const ELECTRODE_BY_COLOR = Object.fromEntries(ELECTRODES.map(e => [e.color, e]))

// Positions as seen facing the patient: the patient's right side is on the
// viewer's left. Percentages position each slot over the torso diagram.
export const LIMB_POSITIONS = [
  { key: 'RA', label: 'Right Arm', correct: 'white', pos: { top: '16%', left: '22%' } },
  { key: 'LA', label: 'Left Arm',  correct: 'black', pos: { top: '16%', left: '78%' } },
  { key: 'RL', label: 'Right Leg', correct: 'green', pos: { top: '84%', left: '34%' } },
  { key: 'LL', label: 'Left Leg',  correct: 'red',   pos: { top: '84%', left: '66%' } },
]

export const CORRECT_LIMB = Object.fromEntries(LIMB_POSITIONS.map(p => [p.key, p.correct]))

export const LIMB_MNEMONIC =
  'White on the right · Snow over grass (RA white / RL green) · Smoke over fire (LA black / LL red)'

// Precordial (chest) leads for a full 12-lead. Each anatomical slot expects a
// specific V lead; the learner must know where V1–V6 go (hint available). Slots
// are positioned over the chest of the same torso diagram used for limb leads.
export const PRECORDIAL_SLOTS = [
  { key: 'P1', correct: 'V1', site: '4th ICS, right sternal border', pos: { top: '34%', left: '44%' } },
  { key: 'P2', correct: 'V2', site: '4th ICS, left sternal border',  pos: { top: '34%', left: '56%' } },
  { key: 'P3', correct: 'V3', site: 'midway between V2 and V4',       pos: { top: '41%', left: '60%' } },
  { key: 'P4', correct: 'V4', site: '5th ICS, midclavicular line',    pos: { top: '48%', left: '64%' } },
  { key: 'P5', correct: 'V5', site: 'anterior axillary line (V4 level)', pos: { top: '48%', left: '73%' } },
  { key: 'P6', correct: 'V6', site: 'midaxillary line (V4 level)',    pos: { top: '48%', left: '82%' } },
]

// The six chest electrodes the learner drops onto the slots above.
export const PRECORDIAL_LEADS = [
  { color: 'V1', label: 'V1', hex: '#EF4444' },
  { color: 'V2', label: 'V2', hex: '#EAB308' },
  { color: 'V3', label: 'V3', hex: '#22C55E' },
  { color: 'V4', label: 'V4', hex: '#3B82F6' },
  { color: 'V5', label: 'V5', hex: '#F97316' },
  { color: 'V6', label: 'V6', hex: '#A855F7' },
]

export const PRECORDIAL_MNEMONIC =
  'V1: 4th ICS right of sternum · V2: 4th ICS left of sternum · V3: between V2 & V4 · ' +
  'V4: 5th ICS midclavicular · V5: anterior axillary (V4 level) · V6: midaxillary (V4 level)'

export const EMPTY_LEADS = {
  RA: null, LA: null, RL: null, LL: null,
  P1: null, P2: null, P3: null, P4: null, P5: null, P6: null,
}

export function limbLeadsPlacedCount(leads) {
  if (!leads) return 0
  return LIMB_POSITIONS.filter(p => leads[p.key]).length
}

export function limbLeadsConnected(leads) {
  if (!leads) return false
  return LIMB_POSITIONS.every(p => leads[p.key] === p.correct)
}

// All four placed but at least one on the wrong limb — a lead fault the learner
// must correct (mirrors a reversed-lead alarm on a real monitor).
export function limbLeadFault(leads) {
  return limbLeadsPlacedCount(leads) === 4 && !limbLeadsConnected(leads)
}

export function precordialPlacedCount(leads) {
  if (!leads) return 0
  return PRECORDIAL_SLOTS.filter(p => leads[p.key]).length
}

export function precordialConnected(leads) {
  if (!leads) return false
  return PRECORDIAL_SLOTS.every(p => leads[p.key] === p.correct)
}

export function precordialFault(leads) {
  return precordialPlacedCount(leads) === PRECORDIAL_SLOTS.length && !precordialConnected(leads)
}

// A full 12-lead needs the limb leads AND all six chest leads placed correctly.
export function twelveLeadConnected(leads) {
  return limbLeadsConnected(leads) && precordialConnected(leads)
}
