import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import MonitorScreen from './MonitorScreen'
import DefibrillatorPanel from './DefibrillatorPanel'
import PacerPanel from './PacerPanel'
import MedLogPanel from './MedLogPanel'
import CodeStatusBar from './CodeStatusBar'
import CodeClock from './CodeClock'
import InstructorPanel from './InstructorPanel'
import PrintSummary from './PrintSummary'
import AlgorithmModal from './AlgorithmModal'
import SessionsModal from './SessionsModal'
import ThemeToggle from './ThemeToggle'

function HeaderButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 min-h-[40px] text-[11px] font-bold font-mono rounded-lg border border-ecg-border text-ecg-gray bg-surface2 hover:text-ink hover:border-ecg-gray active:scale-95 transition-all uppercase tracking-widest"
    >
      {children}
    </button>
  )
}

export default function ACLSSimulator({ remoteRoom, onExitMode }) {
  const { state, dispatch } = useSimulator()
  const [showPrint, setShowPrint] = useState(false)
  const [showAlgos, setShowAlgos] = useState(false)
  const [showSessions, setShowSessions] = useState(false)

  return (
    <div
      className="flex flex-col h-full bg-monitor-bg select-none overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface border-b border-ecg-border shrink-0">
        {/* Left cluster */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
            className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg bg-surface2 border border-ecg-border text-ecg-gray hover:text-ink hover:border-ecg-green active:scale-95 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className="text-ecg-green">☰</span> Instructor
          </button>
          <HeaderButton onClick={() => setShowAlgos(true)}>Algorithms</HeaderButton>
          <HeaderButton onClick={() => setShowSessions(true)}>Sessions</HeaderButton>
        </div>

        {/* Center: theme toggle + remote code + scenario */}
        <div className="flex items-center gap-3 min-w-0">
          <ThemeToggle />
          {remoteRoom && (
            <button
              onClick={onExitMode}
              title="Remote pairing code — tap to change mode"
              className="px-2 min-h-[32px] rounded-lg border border-ecg-blue/60 bg-ecg-blue/10 text-ecg-blue font-mono text-[11px] font-bold tracking-widest"
            >
              📱 {remoteRoom}
            </button>
          )}
          {state.scenarioName && (
            <span className="text-xs text-ecg-gray font-mono tracking-wide truncate hidden sm:inline">
              {state.scenarioName}
            </span>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ecg-gray font-mono whitespace-nowrap">
            Shocks <span className="text-ecg-red font-bold">{state.defib.shocksDelivered}</span>
          </span>
          <HeaderButton onClick={() => setShowPrint(true)}>Print</HeaderButton>
          <CodeClock />
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: MONITOR + STATUS + MED LOG ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <MonitorScreen />
          <CodeStatusBar />
          <MedLogPanel />
        </div>

        {/* ── RIGHT: DEFIB + PACER ── */}
        <div className="flex flex-col w-56 shrink-0 border-l border-ecg-border">
          <DefibrillatorPanel />
          <PacerPanel />
        </div>

      </div>

      {state.instructorOpen && <InstructorPanel />}
      {showPrint && <PrintSummary onClose={() => setShowPrint(false)} />}
      {showAlgos && <AlgorithmModal onClose={() => setShowAlgos(false)} />}
      {showSessions && <SessionsModal onClose={() => setShowSessions(false)} />}

    </div>
  )
}
