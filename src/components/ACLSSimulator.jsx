import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../firebase'
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

function HeaderButton({ onClick, children, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 min-h-[40px] text-[11px] font-bold font-mono rounded-lg border active:scale-95 transition-all uppercase tracking-widest ${
        highlight
          ? 'border-ecg-amber text-ecg-amber bg-ecg-amber/10 hover:bg-ecg-amber/20'
          : 'border-ecg-border text-ecg-gray bg-surface2 hover:text-ink hover:border-ecg-gray'
      }`}
    >
      {children}
    </button>
  )
}

// Small inline EKG mark for the wordmark
function EkgMark() {
  return (
    <svg width="26" height="16" viewBox="0 0 52 32" fill="none" className="shrink-0" aria-hidden="true">
      <polyline
        points="0,18 14,18 17,15 20,18 24,18 27,22 31,4 35,28 39,18 52,18"
        stroke="rgb(25 192 138)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ACLSSimulator() {
  const { state, dispatch } = useSimulator()
  const { user } = useAuth()
  const [showPrint, setShowPrint] = useState(false)
  const [showAlgos, setShowAlgos] = useState(false)
  const [showSessions, setShowSessions] = useState(false)

  return (
    <div
      className="flex flex-col h-full bg-monitor-bg select-none overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1.5 bg-surface border-b border-ecg-border shrink-0 flex-wrap">
        {/* Left cluster */}
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
            className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg bg-surface2 border border-ecg-border text-ecg-gray hover:text-ink hover:border-ecg-green active:scale-95 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className="text-ecg-green">☰</span> Instructor
          </button>
          <HeaderButton onClick={() => setShowAlgos(true)}>Algorithms</HeaderButton>
          <HeaderButton onClick={() => setShowSessions(true)}>Sessions</HeaderButton>
        </div>

        {/* Center: wordmark + scenario label */}
        <div className="flex items-center gap-2 min-w-0 order-1 sm:order-2">
          <EkgMark />
          <span className="text-sm font-bold text-ink tracking-wide whitespace-nowrap">
            CM <span className="text-ecg-green">Simulator</span>
          </span>
          {state.scenarioName && (
            <span className="text-xs text-ecg-gray font-mono tracking-wide truncate hidden md:inline">
              · {state.scenarioName}
            </span>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 order-3">
          <ThemeToggle />
          <span className="text-xs text-ecg-gray font-mono whitespace-nowrap hidden sm:inline">
            Shocks <span className="text-ecg-red font-bold">{state.defib.shocksDelivered}</span>
          </span>
          <HeaderButton onClick={() => setShowPrint(true)}>Print</HeaderButton>
          <CodeClock />
          {user && (
            <button
              onClick={() => signOut()}
              title={`Signed in as ${user.email}\nTap to sign out`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-ecg-green/20 border border-ecg-green/40 text-ecg-green text-[11px] font-bold uppercase hover:bg-ecg-red/20 hover:border-ecg-red/40 hover:text-ecg-red transition-colors shrink-0"
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN BODY ──
          Large screens: monitor left, defib/pacer in a fixed right rail (no scroll).
          Small screens: everything stacks at natural heights and the body scrolls. */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">

        {/* ── MONITOR + STATUS + MED LOG ── */}
        <div className="flex flex-col w-full lg:flex-1 min-w-0 lg:min-h-0">
          {/* Fixed-height monitor on mobile so the canvas has room; fills the rail on desktop. */}
          <div className="flex flex-col h-[44vh] lg:h-auto lg:flex-1 lg:min-h-0">
            <MonitorScreen />
          </div>
          <CodeStatusBar />
          <MedLogPanel />
        </div>

        {/* ── DEFIB + PACER ── */}
        <div className="flex flex-row lg:flex-col lg:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-ecg-border">
          <div className="flex-1 min-w-0 flex flex-col border-r lg:border-r-0 border-ecg-border"><DefibrillatorPanel /></div>
          <div className="flex-1 min-w-0 flex flex-col lg:flex-1"><PacerPanel /></div>
        </div>

      </div>

      {state.instructorOpen && <InstructorPanel />}
      {showPrint    && <PrintSummary   onClose={() => setShowPrint(false)} />}
      {showAlgos    && <AlgorithmModal onClose={() => setShowAlgos(false)} />}
      {showSessions && <SessionsModal  onClose={() => setShowSessions(false)} />}
    </div>
  )
}
