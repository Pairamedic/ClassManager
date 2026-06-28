import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useRoom } from '../context/RoomContext'
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
import RoomModal from './RoomModal'
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

export default function ACLSSimulator({ remoteRoom, onExitMode }) {
  const { state, dispatch } = useSimulator()
  const { roomCode, role, connected } = useRoom()
  const { user } = useAuth()
  const [showPrint, setShowPrint] = useState(false)
  const [showAlgos, setShowAlgos] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showRoom, setShowRoom] = useState(false)

  const isStudent = role === 'student'
  const isInstructor = role === 'instructor'

  return (
    <div
      className="flex flex-col h-full bg-monitor-bg select-none overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── STUDENT BANNER ── */}
      {isStudent && (
        <div className={`shrink-0 px-3 py-1 text-center text-[10px] font-mono font-bold uppercase tracking-widest ${
          connected ? 'bg-ecg-green/15 text-ecg-green border-b border-ecg-green/30' : 'bg-ecg-amber/15 text-ecg-amber border-b border-ecg-amber/30'
        }`}>
          {connected ? `Room ${roomCode} · Instructor connected` : `Room ${roomCode} · Connecting…`}
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface border-b border-ecg-border shrink-0">
        {/* Left cluster */}
        <div className="flex items-center gap-2">
          {/* Hide instructor button in student mode */}
          {!isStudent && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
              className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg bg-surface2 border border-ecg-border text-ecg-gray hover:text-ink hover:border-ecg-green active:scale-95 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <span className="text-ecg-green">☰</span> Instructor
            </button>
          )}
          <HeaderButton onClick={() => setShowAlgos(true)}>Algorithms</HeaderButton>
          <HeaderButton onClick={() => setShowSessions(true)}>Sessions</HeaderButton>
        </div>

        {/* Center: scenario label + room badge */}
        <div className="flex items-center gap-2 min-w-0">
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
          {/* Room badge — click to open room modal */}
          {roomCode ? (
            <button
              onClick={() => setShowRoom(true)}
              className={`px-2 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                isInstructor
                  ? 'border-ecg-amber text-ecg-amber bg-ecg-amber/10'
                  : 'border-ecg-green text-ecg-green bg-ecg-green/10'
              }`}
            >
              {isInstructor ? '▲' : '▼'} {roomCode}
            </button>
          ) : (
            <button
              onClick={() => setShowRoom(true)}
              className="px-2 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-widest border border-ecg-border text-ecg-gray bg-surface2 hover:border-ecg-gray transition-colors"
            >
              Room
            </button>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-ecg-gray font-mono whitespace-nowrap">
            Shocks <span className="text-ecg-red font-bold">{state.defib.shocksDelivered}</span>
          </span>
          <HeaderButton onClick={() => setShowPrint(true)}>Print</HeaderButton>
          <CodeClock />
          {/* Student exit button */}
          {isStudent && onExitMode && (
            <button
              onClick={onExitMode}
              title="Exit to Class Manager"
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-ecg-border bg-surface2 text-ecg-gray text-[11px] hover:text-ink hover:border-ecg-gray transition-colors"
            >
              ✕
            </button>
          )}
          {/* User avatar + sign out (non-student) */}
          {user && !isStudent && (
            <button
              onClick={() => signOut()}
              title={`Signed in as ${user.email}\nTap to sign out`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-ecg-green/20 border border-ecg-green/40 text-ecg-green text-[11px] font-bold uppercase hover:bg-ecg-red/20 hover:border-ecg-red/40 hover:text-ecg-red transition-colors"
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </button>
          )}
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

      {state.instructorOpen && !isStudent && <InstructorPanel />}
      {showPrint    && <PrintSummary   onClose={() => setShowPrint(false)} />}
      {showAlgos    && <AlgorithmModal onClose={() => setShowAlgos(false)} />}
      {showSessions && <SessionsModal  onClose={() => setShowSessions(false)} />}
      {showRoom     && <RoomModal      onClose={() => setShowRoom(false)} />}
    </div>
  )
}
