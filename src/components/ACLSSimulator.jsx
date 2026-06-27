import { useSimulator } from '../context/SimulatorContext'
import MonitorScreen from './MonitorScreen'
import DefibrillatorPanel from './DefibrillatorPanel'
import PacerPanel from './PacerPanel'
import MedLogPanel from './MedLogPanel'
import CodeClock from './CodeClock'
import InstructorPanel from './InstructorPanel'

export default function ACLSSimulator() {
  const { state, dispatch } = useSimulator()

  return (
    <div className="flex flex-col h-full bg-monitor-bg select-none overflow-hidden">

      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between px-3 py-1 bg-surface border-b border-ecg-border shrink-0">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface2 border border-ecg-border text-ecg-gray hover:text-white hover:border-ecg-green transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <span className="text-ecg-green">☰</span> INSTRUCTOR
        </button>

        <div className="flex items-center gap-3">
          {state.scenarioName && (
            <span className="text-xs text-ecg-amber font-mono tracking-wide">{state.scenarioName}</span>
          )}
          <span className="text-xs text-ecg-gray font-mono">
            SHOCKS: <span className="text-ecg-red font-bold">{state.defib.shocksDelivered}</span>
          </span>
        </div>

        <CodeClock />
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: MONITOR + MED LOG ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <MonitorScreen />
          <MedLogPanel />
        </div>

        {/* ── RIGHT: DEFIB + PACER ── */}
        <div className="flex flex-col w-56 shrink-0 border-l border-ecg-border">
          <DefibrillatorPanel />
          <PacerPanel />
        </div>

      </div>

      {/* ── INSTRUCTOR SLIDE-IN PANEL ── */}
      {state.instructorOpen && <InstructorPanel />}

    </div>
  )
}
