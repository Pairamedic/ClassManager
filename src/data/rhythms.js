// Pixels scrolled per second — sets paper speed and all cycle lengths
export const PIXELS_PER_SEC = 200

// Seeded PRNG for reproducible Afib RR variation
function seededRng(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return Math.abs(x - Math.floor(x))
}

// Standard PQRST waveform with configurable parameters
// x = 0..1 position within one beat cycle
function pqrst(x, opts = {}) {
  const {
    pAmp   = 0.15,  // P wave amplitude (0 = no P wave)
    pS     = 0.05,  pE  = 0.15,   // P wave x range
    prE    = 0.25,                 // end of PR segment (QRS onset)
    qAmp   = 0.08,
    rAmp   = 0.90,
    rWide  = false,               // wide QRS (ventricular)
    sAmp   = 0.12,
    stElev = 0,
    stLen  = 0.10,
    tAmp   = 0.25,
    tLen   = 0.20,
    tInv   = false,
  } = opts

  // P wave
  if (pAmp > 0 && x >= pS && x < pE)
    return pAmp * Math.sin((x - pS) / (pE - pS) * Math.PI)

  // PR segment
  if (pAmp > 0 && x >= pE && x < prE) return 0

  // QRS complex
  const qS  = prE
  const qE  = qS  + 0.025
  const rS  = qE
  const rW  = rWide ? 0.16 : 0.07
  const rP  = rS + rW * 0.5
  const rE  = rS + rW
  const sE  = rE  + 0.03
  const stE = sE  + stLen
  const tE  = stE + tLen

  if (x >= qS && x < qE) return -qAmp * (x - qS) / 0.025
  if (x >= rS && x < rE)
    return x < rP
      ? (x - rS) / (rP - rS) * rAmp
      : (rE - x) / (rE - rP) * rAmp
  if (x >= rE && x < sE)
    return -sAmp * Math.sin((x - rE) / 0.03 * Math.PI)
  if (x >= sE && x < stE) return stElev
  if (x >= stE && x < tE)
    return (tInv ? -Math.abs(tAmp) : Math.abs(tAmp)) * Math.sin((x - stE) / tLen * Math.PI)

  return 0
}

// Wide bizarre QRS for ventricular rhythms
function wideQRS(x, { amp = 0.75, startX = 0.10, notch = false } = {}) {
  const endX = startX + 0.20
  const tS   = endX
  const tE   = tS + 0.18

  if (x >= startX && x < endX) {
    const t = (x - startX) / 0.20
    if (notch) return amp * (Math.sin(t * Math.PI) + 0.25 * Math.sin(t * 3 * Math.PI))
    return amp * Math.sin(t * Math.PI)
  }
  if (x >= tS && x < tE)
    return -0.20 * Math.sin((x - tS) / (tE - tS) * Math.PI)
  return 0
}

// === RHYTHM LIBRARY ===
export const RHYTHMS = {

  // ── NORMAL / MONITORING ─────────────────────────────────────────────────────

  NSR: {
    id: 'NSR', label: 'Normal Sinus Rhythm',
    rate: 75, rateVariability: 0.04,
    type: 'cycle', shockable: false, pulse: true, category: 'normal',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: stOffset }),
  },

  NSR_PVCS: {
    id: 'NSR_PVCS', label: 'NSR with PVCs',
    rate: 72, rateVariability: 0.03,
    type: 'pattern', patternLen: 5,
    shockable: false, pulse: true, category: 'normal',
    captureThreshold: 60,
    waveform: (x, _t, beatNum, stOffset = 0) =>
      beatNum % 5 === 4
        ? wideQRS(x, { amp: 0.90, startX: 0.05 })
        : pqrst(x, { stElev: stOffset }),
  },

  NSR_PACS: {
    id: 'NSR_PACS', label: 'NSR with PACs',
    rate: 70, rateVariability: 0.03,
    type: 'pattern', patternLen: 6,
    shockable: false, pulse: true, category: 'normal',
    captureThreshold: 60,
    waveform: (x, _t, beatNum, stOffset = 0) =>
      beatNum % 6 === 5
        ? pqrst(x, { pAmp: 0.22, pS: 0.02, pE: 0.11, prE: 0.21, stElev: stOffset })
        : pqrst(x, { stElev: stOffset }),
  },

  NSR_STEMI: {
    id: 'NSR_STEMI', label: 'NSR + ST Elevation (STEMI)',
    rate: 78, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'normal',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: 0.30 + stOffset, stLen: 0.12, tAmp: 0.35, tLen: 0.18 }),
  },

  NSR_ST_DEP: {
    id: 'NSR_ST_DEP', label: 'NSR + ST Depression',
    rate: 75, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'normal',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: -0.18 + stOffset, stLen: 0.12, tInv: true, tAmp: 0.15 }),
  },

  // ── BRADY / PACING ──────────────────────────────────────────────────────────

  SINUS_BRADY: {
    id: 'SINUS_BRADY', label: 'Sinus Bradycardia',
    rate: 45, rateVariability: 0.05,
    type: 'cycle', shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: stOffset }),
  },

  FIRST_DEGREE: {
    id: 'FIRST_DEGREE', label: '1st Degree AV Block',
    rate: 65, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    // Long PR: prE pushed to 0.38 (~0.28s at 65bpm)
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { prE: 0.38, stElev: stOffset }),
  },

  WENCKEBACH: {
    id: 'WENCKEBACH', label: '2nd Degree Type I (Wenckebach)',
    rate: 65, rateVariability: 0,
    type: 'pattern', patternLen: 4,
    shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    // Beats 0-2: QRS with progressively longer PR; beat 3: P only (dropped)
    waveform: (x, _t, beatNum, stOffset = 0) => {
      const n = beatNum % 4
      if (n === 3) {
        // Dropped beat — P wave only
        return x >= 0.05 && x < 0.15
          ? 0.15 * Math.sin((x - 0.05) / 0.10 * Math.PI)
          : 0
      }
      const prEnds = [0.26, 0.33, 0.40]
      return pqrst(x, { prE: prEnds[n], stElev: stOffset })
    },
  },

  MOBITZ2: {
    id: 'MOBITZ2', label: '2nd Degree Type II (Mobitz)',
    rate: 60, rateVariability: 0,
    type: 'pattern', patternLen: 3,
    shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    // 3:2 — beats 0,1: QRS with constant PR; beat 2: P only
    waveform: (x, _t, beatNum, stOffset = 0) => {
      if (beatNum % 3 === 2) {
        return x >= 0.05 && x < 0.15
          ? 0.15 * Math.sin((x - 0.05) / 0.10 * Math.PI)
          : 0
      }
      return pqrst(x, { stElev: stOffset })
    },
  },

  THIRD_DEGREE: {
    id: 'THIRD_DEGREE', label: '3rd Degree (Complete) Block',
    rate: 35, rateVariability: 0,
    type: 'dual',
    atrialRate: 75, ventRate: 35,
    shockable: false, pulse: true, category: 'brady',
    captureThreshold: 40,
    // Handled specially in canvas hook using absolute offset
    waveform: (_x, _t) => 0,
  },

  JUNCTIONAL: {
    id: 'JUNCTIONAL', label: 'Junctional Rhythm',
    rate: 50, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => {
      // Inverted P just before QRS
      const invP = x >= 0.17 && x < 0.25
        ? -0.09 * Math.sin((x - 0.17) / 0.08 * Math.PI)
        : 0
      return invP + pqrst(x, { pAmp: 0, prE: 0.25, stElev: stOffset })
    },
  },

  IDIOVENTRICULAR: {
    id: 'IDIOVENTRICULAR', label: 'Idioventricular Rhythm',
    rate: 30, rateVariability: 0.05,
    type: 'cycle', shockable: false, pulse: true, category: 'brady',
    captureThreshold: 60,
    waveform: (x) => wideQRS(x, { amp: 0.60, startX: 0.12, notch: true }),
  },

  // ── TACHY / CARDIOVERSION ───────────────────────────────────────────────────

  SINUS_TACH: {
    id: 'SINUS_TACH', label: 'Sinus Tachycardia',
    rate: 128, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stLen: 0.06, tLen: 0.14, stElev: stOffset }),
  },

  SINUS_TACH_STEMI: {
    id: 'SINUS_TACH_STEMI', label: 'Sinus Tach + ST Elevation',
    rate: 122, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: 0.30 + stOffset, stLen: 0.07, tLen: 0.13, tAmp: 0.32 }),
  },

  SVT: {
    id: 'SVT', label: 'SVT',
    rate: 188, rateVariability: 0.01,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => {
      const qrs = pqrst(x, { pAmp: 0, prE: 0.05, stLen: 0.05, tLen: 0.12, stElev: stOffset })
      // Retrograde P buried in end of T wave
      const retroP = x > 0.32 && x < 0.40
        ? -0.08 * Math.sin((x - 0.32) / 0.08 * Math.PI)
        : 0
      return qrs + retroP
    },
  },

  AFIB: {
    id: 'AFIB', label: 'Atrial Fibrillation',
    rate: 108, rateVariability: 0.38,
    type: 'irregular', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, t, _beatNum, stOffset = 0) => {
      const fib = 0.045 * Math.sin(t * 0.19 + x * 41)
                + 0.030 * Math.sin(t * 0.13 + x * 67)
                + 0.020 * Math.sin(t * 0.31 + x * 23)
      return fib + pqrst(x, { pAmp: 0, prE: 0.08, stLen: 0.08, tLen: 0.15, stElev: stOffset })
    },
  },

  AFLUTTER: {
    id: 'AFLUTTER', label: 'Atrial Flutter',
    rate: 150, rateVariability: 0.01,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) => {
      // 2:1 flutter: 2 sawtooth waves per QRS
      const halfX = (x * 2) % 1
      const flutter = x > 0.22 ? 0.12 * (1 - 2 * halfX) : 0  // sawtooth, suppressed near QRS
      const qrs = pqrst(x, { pAmp: 0, prE: 0.05, stLen: 0.04, tLen: 0.10, stElev: stOffset })
      return flutter + qrs
    },
  },

  WPW: {
    id: 'WPW', label: 'WPW (Wolff-Parkinson-White)',
    rate: 95, rateVariability: 0.03,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x) => {
      // Short PR, delta wave (slurred R upstroke), wide QRS
      const p = x >= 0.05 && x < 0.13
        ? 0.14 * Math.sin((x - 0.05) / 0.08 * Math.PI)
        : 0
      let qrs = 0
      if      (x >= 0.14 && x < 0.22) qrs = (x - 0.14) / 0.08 * 0.40          // delta wave
      else if (x >= 0.22 && x < 0.29) qrs = 0.40 + (x - 0.22) / 0.07 * 0.50  // R up
      else if (x >= 0.29 && x < 0.40) qrs = 0.90 - (x - 0.29) / 0.11 * 0.90  // R down
      else if (x >= 0.40 && x < 0.42) qrs = -0.12 * Math.sin((x - 0.40) / 0.02 * Math.PI) // S
      else if (x >= 0.44 && x < 0.62) qrs = 0.22 * Math.sin((x - 0.44) / 0.18 * Math.PI) // T
      return p + qrs
    },
  },

  PEDIATRIC_SVT: {
    id: 'PEDIATRIC_SVT', label: 'Pediatric SVT',
    rate: 258, rateVariability: 0.01,
    type: 'cycle', shockable: false, pulse: true, category: 'tachy',
    captureThreshold: 60,
    waveform: (x, _t, _beatNum, stOffset = 0) =>
      pqrst(x, { pAmp: 0, prE: 0.05, stLen: 0.03, tLen: 0.09, tAmp: 0.18, stElev: stOffset }),
  },

  VTACH: {
    id: 'VTACH', label: 'Ventricular Tachycardia',
    rate: 160, rateVariability: 0.01,
    type: 'cycle', shockable: true, pulse: false, category: 'tachy',
    captureThreshold: 60,
    waveform: (x) => wideQRS(x, { amp: 0.82, startX: 0.05 }),
  },

  // ── SHOCKABLE ARREST ────────────────────────────────────────────────────────

  VFIB: {
    id: 'VFIB', label: 'Ventricular Fibrillation',
    rate: 0, rateVariability: 0,
    type: 'chaos', shockable: true, pulse: false, category: 'shock',
    captureThreshold: 999,
    waveform: (_x, t) =>
        0.55 * Math.sin(t * 0.047 + 1.3)
      + 0.30 * Math.sin(t * 0.071 + 0.7)
      + 0.20 * Math.sin(t * 0.031 + 2.1)
      + 0.15 * Math.sin(t * 0.113 + 0.4)
      + 0.10 * Math.sin(t * 0.093 + 1.8),
  },

  TORSADES: {
    id: 'TORSADES', label: 'Torsades de Pointes',
    rate: 0, rateVariability: 0,
    type: 'chaos', shockable: true, pulse: false, category: 'shock',
    captureThreshold: 999,
    waveform: (_x, t) => {
      const env = 0.70 * Math.sin(t * 0.0035)
      return env * (Math.sin(t * 0.13) + 0.40 * Math.sin(t * 0.11 + 1.2))
           + 0.15 * Math.sin(t * 0.31 + 0.8)
    },
  },

  // ── NON-SHOCKABLE ARREST ────────────────────────────────────────────────────

  ASYSTOLE: {
    id: 'ASYSTOLE', label: 'Asystole',
    rate: 0, rateVariability: 0,
    type: 'chaos', shockable: false, pulse: false, category: 'noshock',
    captureThreshold: 999,
    waveform: (_x, t) => 0.012 * Math.sin(t * 0.31) + 0.008 * Math.sin(t * 0.57),
  },

  PEA: {
    id: 'PEA', label: 'PEA (Pulseless Electrical Activity)',
    rate: 70, rateVariability: 0.05,
    type: 'cycle', shockable: false, pulse: false, category: 'noshock',
    captureThreshold: 999,
    waveform: (x, _t, _beatNum, stOffset = 0) => pqrst(x, { stElev: stOffset }),
  },

  AGONAL: {
    id: 'AGONAL', label: 'Agonal Rhythm',
    rate: 10, rateVariability: 0.20,
    type: 'cycle', shockable: false, pulse: false, category: 'noshock',
    captureThreshold: 999,
    waveform: (x) => wideQRS(x, { amp: 0.38, startX: 0.18 }),
  },
}

export const RHYTHM_LIST = Object.values(RHYTHMS)

// Compute normal beat length in pixels
export function beatLenPx(rate) {
  return (60 / rate) * PIXELS_PER_SEC
}

// Seeded RR variation for AFIB
export function afibBeatLen(baseLen, beatNum, variability) {
  const rng = seededRng(beatNum * 37 + 19)
  return baseLen * (1 - variability + 2 * variability * rng)
}
