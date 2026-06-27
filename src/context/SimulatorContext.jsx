import { createContext, useContext, useReducer } from 'react'

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

  medications: [],
  codeStartTime: null,
  instructorOpen: false,
  scenarioName: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_RHYTHM':
      return { ...state, currentRhythm: action.rhythm }

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
      }

    case 'CLEAR_CHARGED':
      return { ...state, defib: { ...state.defib, charged: false, charging: false } }

    case 'TOGGLE_PACER':
      return { ...state, pacer: { ...state.pacer, active: !state.pacer.active } }

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

    case 'LOG_MED':
      return {
        ...state,
        medications: [{ drug: action.drug, dose: action.dose, time: Date.now() }, ...state.medications].slice(0, 60),
      }

    case 'CLEAR_MEDS':
      return { ...state, medications: [] }

    case 'START_CODE':
      return { ...state, codeStartTime: Date.now() }

    case 'STOP_CODE':
      return { ...state, codeStartTime: null }

    case 'LOAD_SCENARIO':
      return {
        ...state,
        currentRhythm: action.scenario.rhythm,
        vitals: { ...state.vitals, ...action.scenario.vitals },
        vitalsHidden: action.scenario.vitalsHidden ?? false,
        scenarioName: action.scenario.name,
        defib: { ...initialState.defib },
        pacer: { ...initialState.pacer, captureThreshold: action.scenario.captureThreshold ?? 60 },
        medications: [],
        codeStartTime: null,
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
