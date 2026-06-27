import { createContext, useContext, useReducer } from 'react'
import { RHYTHMS } from '../data/rhythms'

const Ctx = createContext(null)

export const initialState = {
  currentRhythm: 'NSR',
  isRunning: true,

  vitals: { hr: 72, sbp: 120, dbp: 80, spo2: 98, etco2: 35, temp: 98.6 },
  vitalsHidden: false,
  labelHidden: true,

  defib: {
    padsConnected: false,
    syncMode: false,
    energy: 200,
    charged: false,
    charging: false,
    shocksDelivered: 0,
  },

  pacer: {
    active: false,
    rate: 70,
    output: 50,
    captureThreshold: 60,
  },

  cpr: {
    active: false,
    cycleStart: null,   // timestamp the current 2-min cycle began
    cycleCount: 0,      // completed rhythm-check cycles
  },
  metronomeOn: true,

  reversibleCauses: [], // array of cause ids the instructor has flagged

  rosc: false,          // return of spontaneous circulation achieved

  medications: [],
  rhythmHistory: [],
  eventLog: [],         // unified timeline: { type, label, detail, time }
  codeStartTime: null,
  instructorOpen: false,
  scenarioName: null,
}

function logEvent(state, entry) {
  return [...state.eventLog, { time: Date.now(), ...entry }].slice(-200)
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_RHYTHM': {
      const reArrest = RHYTHMS[action.rhythm]?.pulse === false
      return {
        ...state,
        currentRhythm: action.rhythm,
        rosc: reArrest ? false : state.rosc,
        rhythmHistory: [...state.rhythmHistory, { rhythm: action.rhythm, time: Date.now() }],
        eventLog: action.silent
          ? state.eventLog
          : logEvent(state, { type: 'rhythm', label: 'Rhythm', detail: action.rhythm }),
      }
    }

    case 'SET_RUNNING':
      return { ...state, isRunning: action.value }

    case 'SET_VITALS':
      return { ...state, vitals: { ...state.vitals, ...action.vitals } }

    case 'TOGGLE_VITALS_HIDDEN':
      return { ...state, vitalsHidden: !state.vitalsHidden }

    case 'TOGGLE_LABEL_HIDDEN':
      return { ...state, labelHidden: !state.labelHidden }

    case 'TOGGLE_INSTRUCTOR':
      return { ...state, instructorOpen: !state.instructorOpen }

    case 'TOGGLE_PADS':
      return {
        ...state,
        defib: { ...state.defib, padsConnected: !state.defib.padsConnected, charged: false, charging: false },
      }

    case 'TOGGLE_SYNC':
      return { ...state, defib: { ...state.defib, syncMode: !state.defib.syncMode } }

    case 'SET_ENERGY':
      return { ...state, defib: { ...state.defib, energy: action.energy, charged: false } }

    case 'START_CHARGING':
      return { ...state, defib: { ...state.defib, charging: true, charged: false } }

    case 'CHARGE_COMPLETE':
      return { ...state, defib: { ...state.defib, charging: false, charged: true } }

    case 'DELIVER_SHOCK':
      return {
        ...state,
        defib: { ...state.defib, charged: false, charging: false, shocksDelivered: state.defib.shocksDelivered + 1 },
        eventLog: logEvent(state, {
          type: 'shock',
          label: `Shock #${state.defib.shocksDelivered + 1}`,
          detail: `${state.defib.energy}J${state.defib.syncMode ? ' synchronized' : ''}`,
        }),
      }

    case 'CLEAR_CHARGED':
      return { ...state, defib: { ...state.defib, charged: false, charging: false } }

    case 'TOGGLE_PACER':
      return {
        ...state,
        pacer: { ...state.pacer, active: !state.pacer.active },
        eventLog: logEvent(state, { type: 'pacer', label: 'Pacer', detail: state.pacer.active ? 'stopped' : `on @ ${state.pacer.rate} ppm / ${state.pacer.output} mA` }),
      }

    case 'SET_PACER_RATE': {
      const rate = Math.max(30, Math.min(180, action.rate))
      return { ...state, pacer: { ...state.pacer, rate } }
    }

    case 'SET_PACER_OUTPUT': {
      const output = Math.max(0, Math.min(200, action.output))
      return { ...state, pacer: { ...state.pacer, output } }
    }

    case 'SET_CAPTURE_THRESHOLD': {
      const captureThreshold = Math.max(0, Math.min(200, Number(action.threshold)))
      return { ...state, pacer: { ...state.pacer, captureThreshold } }
    }

    // ── CPR ──────────────────────────────────────────────
    case 'START_CPR':
      return {
        ...state,
        cpr: { ...state.cpr, active: true, cycleStart: Date.now() },
        codeStartTime: state.codeStartTime ?? Date.now(),
        eventLog: logEvent(state, { type: 'cpr', label: 'CPR started' }),
      }

    case 'STOP_CPR':
      return {
        ...state,
        cpr: { ...state.cpr, active: false },
        eventLog: logEvent(state, { type: 'cpr', label: 'CPR paused' }),
      }

    case 'CPR_RHYTHM_CHECK': {
      const cycleCount = state.cpr.cycleCount + 1
      return {
        ...state,
        cpr: { ...state.cpr, cycleCount, cycleStart: Date.now() },
        eventLog: logEvent(state, { type: 'check', label: 'Rhythm check', detail: `end of cycle ${cycleCount}` }),
      }
    }

    case 'TOGGLE_METRONOME':
      return { ...state, metronomeOn: !state.metronomeOn }

    case 'DECLARE_ROSC': {
      const perfusing = RHYTHMS[state.currentRhythm]?.pulse ? state.currentRhythm : 'NSR'
      const rhythmChanged = perfusing !== state.currentRhythm
      return {
        ...state,
        rosc: true,
        currentRhythm: perfusing,
        cpr: { ...state.cpr, active: false },
        // restore a modest post-arrest perfusing state
        vitals: { ...state.vitals, hr: 88, sbp: 104, dbp: 62, spo2: 93, etco2: 38 },
        rhythmHistory: rhythmChanged
          ? [...state.rhythmHistory, { rhythm: perfusing, time: Date.now() }]
          : state.rhythmHistory,
        eventLog: logEvent(state, { type: 'rosc', label: 'ROSC achieved', detail: 'begin post-arrest care' }),
      }
    }

    // ── Reversible causes (H's & T's) ────────────────────
    case 'TOGGLE_REVERSIBLE_CAUSE': {
      const has = state.reversibleCauses.includes(action.id)
      return {
        ...state,
        reversibleCauses: has
          ? state.reversibleCauses.filter(c => c !== action.id)
          : [...state.reversibleCauses, action.id],
      }
    }

    case 'LOG_MED':
      return {
        ...state,
        medications: [{ drug: action.drug, dose: action.dose, time: Date.now() }, ...state.medications].slice(0, 60),
        eventLog: logEvent(state, { type: 'med', label: action.drug, detail: action.dose }),
      }

    case 'CLEAR_MEDS':
      return { ...state, medications: [] }

    case 'START_CODE':
      return {
        ...state,
        codeStartTime: Date.now(),
        eventLog: logEvent(state, { type: 'code', label: 'Code started' }),
      }

    case 'STOP_CODE':
      return {
        ...state,
        codeStartTime: null,
        cpr: { ...state.cpr, active: false },
        eventLog: logEvent(state, { type: 'code', label: 'Code stopped' }),
      }

    case 'RESET_SESSION':
      return {
        ...state,
        defib: { ...initialState.defib },
        pacer: { ...initialState.pacer, captureThreshold: state.pacer.captureThreshold },
        cpr: { ...initialState.cpr },
        reversibleCauses: [],
        rosc: false,
        medications: [],
        rhythmHistory: [{ rhythm: state.currentRhythm, time: Date.now() }],
        eventLog: [],
        codeStartTime: null,
      }

    case 'LOAD_SCENARIO':
      return {
        ...state,
        currentRhythm: action.scenario.rhythm,
        vitals: { ...state.vitals, ...action.scenario.vitals },
        vitalsHidden: action.scenario.vitalsHidden ?? false,
        scenarioName: action.scenario.name,
        defib: { ...initialState.defib },
        pacer: { ...initialState.pacer, captureThreshold: action.scenario.captureThreshold ?? 60 },
        cpr: { ...initialState.cpr },
        reversibleCauses: action.scenario.reversibleCauses ?? [],
        rosc: false,
        medications: [],
        codeStartTime: null,
        rhythmHistory: [{ rhythm: action.scenario.rhythm, time: Date.now() }],
        eventLog: [{ time: Date.now(), type: 'scenario', label: 'Scenario loaded', detail: action.scenario.name }],
      }

    default:
      return state
  }
}

export function SimulatorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useSimulator() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSimulator must be inside SimulatorProvider')
  return ctx
}
