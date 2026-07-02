// Broselow-style length/weight-based color zones for pediatric emergency dosing.
// Weight ranges, ETT sizes, and defib energies are standard PALS teaching
// approximations for simulation/training use — not calibrated for clinical dosing.

function round(n) {
  return n < 10 ? Math.round(n * 10) / 10 : Math.round(n)
}

function dose(weightKg, mgPerKg, max, min) {
  let mg = weightKg * mgPerKg
  if (max != null) mg = Math.min(mg, max)
  if (min != null) mg = Math.max(mg, min)
  return round(mg)
}

const BASE_ZONES = [
  { key: 'grey',   label: 'Grey',   hex: '#9CA3AF', ageLabel: 'Newborn – 3 mo', lengthCm: [46, 66],  weightRangeKg: [3, 5],   weightKg: 4,    ettSize: 3.5, ettDepthCm: 10   },
  { key: 'pink',   label: 'Pink',   hex: '#F472B6', ageLabel: '3–6 mo',         lengthCm: [67, 75],  weightRangeKg: [6, 7],   weightKg: 6.5,  ettSize: 3.5, ettDepthCm: 10.5 },
  { key: 'red',    label: 'Red',    hex: '#EF4444', ageLabel: '6–12 mo',        lengthCm: [76, 84],  weightRangeKg: [8, 9],   weightKg: 8.5,  ettSize: 4.0, ettDepthCm: 11   },
  { key: 'purple', label: 'Purple', hex: '#A855F7', ageLabel: '1–2 yr',         lengthCm: [85, 98],  weightRangeKg: [10, 11], weightKg: 10.5, ettSize: 4.0, ettDepthCm: 12   },
  { key: 'yellow', label: 'Yellow', hex: '#EAB308', ageLabel: '2–4 yr',         lengthCm: [99, 109], weightRangeKg: [12, 14], weightKg: 13,   ettSize: 4.5, ettDepthCm: 13.5 },
  { key: 'white',  label: 'White',  hex: '#F8FAFC', ageLabel: '4–6 yr',         lengthCm: [110, 121],weightRangeKg: [15, 18], weightKg: 16.5, ettSize: 5.0, ettDepthCm: 14.5 },
  { key: 'blue',   label: 'Blue',   hex: '#3B82F6', ageLabel: '6–8 yr',         lengthCm: [122, 131],weightRangeKg: [19, 23], weightKg: 21,   ettSize: 5.5, ettDepthCm: 15.5 },
  { key: 'orange', label: 'Orange', hex: '#F97316', ageLabel: '8–11 yr',        lengthCm: [132, 140],weightRangeKg: [24, 29], weightKg: 26.5, ettSize: 6.0, ettDepthCm: 17   },
  { key: 'green',  label: 'Green',  hex: '#22C55E', ageLabel: '11–12 yr',       lengthCm: [141, 155],weightRangeKg: [30, 36], weightKg: 33,   ettSize: 6.5, ettDepthCm: 18   },
]

export const BROSELOW_ZONES = BASE_ZONES.map(z => {
  const w = z.weightKg
  return {
    ...z,
    defibJoules: {
      initial: Math.round(w * 2),
      subsequent: Math.round(w * 4),
    },
    doses: {
      epinephrine:      { mg: dose(w, 0.01, 1),     text: 'mg/kg IV/IO, max 1 mg (q3–5min)',        mgPerKg: 0.01 },
      amiodarone:       { mg: dose(w, 5, 300),      text: 'mg/kg IV/IO bolus, max 300 mg',           mgPerKg: 5    },
      atropine:         { mg: dose(w, 0.02, 0.5, 0.1), text: 'mg/kg IV/IO, min 0.1 mg, max 0.5 mg',  mgPerKg: 0.02 },
      adenosineFirst:   { mg: dose(w, 0.1, 6),      text: 'mg/kg rapid IV push, max 6 mg (1st dose)', mgPerKg: 0.1  },
      adenosineSecond:  { mg: dose(w, 0.2, 12),     text: 'mg/kg rapid IV push, max 12 mg (2nd dose)', mgPerKg: 0.2 },
      lidocaine:        { mg: dose(w, 1, 100),      text: 'mg/kg IV/IO',                              mgPerKg: 1    },
      magnesium:        { mg: dose(w, 50, 2000),    text: 'mg/kg IV (Torsades), max 2 g',             mgPerKg: 50   },
      sodiumBicarb:     { mEq: dose(w, 1, 50),      text: 'mEq/kg IV/IO',                             mgPerKg: 1    },
    },
  }
})

export const BROSELOW_ZONES_BY_KEY = Object.fromEntries(BROSELOW_ZONES.map(z => [z.key, z]))

export const DEFAULT_ZONE = 'yellow'

export function getZone(key) {
  return BROSELOW_ZONES_BY_KEY[key] || BROSELOW_ZONES_BY_KEY[DEFAULT_ZONE]
}
