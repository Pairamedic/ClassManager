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

export const EMPTY_LEADS = { RA: null, LA: null, RL: null, LL: null }

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
