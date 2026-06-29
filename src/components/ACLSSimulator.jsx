import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../firebase'
import { saveSession } from '../utils/sessionStore'
import { computeMetrics } from '../utils/metrics'
import { clearLiveState } from '../utils/livePersist'
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
      className="px-2.5 min-h-[40px] text-[11px] font-bold font-mono rounded-lg border active:scale-95 transition-all uppercase tracking-widest border-ecg-border text-ecg-gray bg-surface2 hover:text-ink hover:border-ecg-gray"
    >
      {children}
    </button>
  )
}

function EkgMark({ dim }) {
  return (
    <svg width="26" height="16" viewBox="0 0 52 32" fill="none" className="shrink-0" aria-hidden="true">
      <polyline
        points="0,18 14,18 17,15 20,18 24,18 27,22 31,4 35,28 39,18 52,18"
        stroke="rgb(25 192 138)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        opacity={dim ? 0.25 : 1}
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
  const [showPowerOff, setShowPowerOff] = useState(false)

  return (
    <div
      className="flex flex-col h-full bg-monitor-bg select-none overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between gap-2 px-2 sm:px-3 py-1.5 bg-surface border-b border-ecg-border shrink-0 flex-wrap">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          {window.opener && (
            <button
              onClick={() => window.close()}
              className="flex items-center gap-1 px-2.5 min-h-[40px] text-[11px] font-bold font-mono rounded-lg border border-ecg-border text-ecg-gray bg-surface2 hover:text-ink hover:border-ecg-gray active:scale-95 transition-all uppercase tracking-widest"
              title="Close and return to Class Manager"
            >
              ← CM
            </button>
          )}
          {state.powered && (
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

        <div className="flex items-center gap-2 min-w-0 order-1 sm:order-2">
          <EkgMark dim={!state.powered} />
          <span className="text-sm font-bold text-ink tracking-wide whitespace-nowrap">
            CM <span className="text-ecg-green">Simulator</span>
          </span>
          {state.powered && state.scenarioName && (
            <span className="text-xs text-ecg-gray font-mono tracking-wide truncate hidden md:inline">
              · {state.scenarioName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 order-3">
          <ThemeToggle />
          {state.powered && (
            <span className="text-xs text-ecg-gray font-mono whitespace-nowrap hidden sm:inline">
              Shocks <span className="text-ecg-red font-bold">{state.defib.shocksDelivered}</span>
            </span>
          )}
          <HeaderButton onClick={() => setShowPrint(true)}>Print</HeaderButton>
          {state.powered && <CodeClock />}

          {/* Power button — green when on, click to power off */}
          <button
            onClick={() => state.powered ? setShowPowerOff(true) : null}
            title={state.powered ? 'Power Off' : 'Power Off (turn on from main screen)'}
            className={`flex items-center justify-center w-9 h-9 rounded-full border-2 font-bold text-base transition-all active:scale-95 ${
              state.powered
                ? 'border-ecg-green bg-ecg-green/20 text-ecg-green hover:border-ecg-red hover:bg-ecg-red/20 hover:text-ecg-red cursor-pointer'
                : 'border-ecg-border bg-surface2 text-ecg-gray cursor-default opacity-40'
            }`}
          >
            ⏻
          </button>

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

      {/* ── SCENARIO DESCRIPTION BANNER ── */}
      {state.powered && state.scenarioDescription && (
        <ScenarioDescriptionBanner
          name={state.scenarioName}
          description={state.scenarioDescription}
          onDismiss={() => dispatch({ type: 'DISMISS_SCENARIO_DESCRIPTION' })}
        />
      )}

      {/* ── BODY: power-off screen or running simulator ── */}
      {!state.powered ? (
        <PowerOnScreen />
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">

          <div className="flex flex-col w-full lg:flex-1 min-w-0 lg:min-h-0">
            <div className="flex flex-col h-[44vh] lg:h-auto lg:flex-1 lg:min-h-0">
              <MonitorScreen />
            </div>
            <CodeStatusBar />
            <MedLogPanel />
          </div>

          <div className="flex flex-row lg:flex-col lg:w-56 shrink-0 border-t lg:border-t-0 lg:border-l border-ecg-border">
            <div className="flex-1 min-w-0 flex flex-col border-r lg:border-r-0 border-ecg-border"><DefibrillatorPanel /></div>
            <div className="flex-1 min-w-0 flex flex-col lg:flex-1"><PacerPanel /></div>
          </div>

        </div>
      )}

      {/* ── MODALS & OVERLAYS ── */}
      {state.instructorOpen && <InstructorPanel />}
      {showPrint     && <PrintSummary    onClose={() => setShowPrint(false)} />}
      {showAlgos     && <AlgorithmModal  onClose={() => setShowAlgos(false)} />}
      {showSessions  && <SessionsModal   onClose={() => setShowSessions(false)} />}
      {showPowerOff && (
        <PowerOffDialog
          state={state}
          dispatch={dispatch}
          onClose={() => setShowPowerOff(false)}
        />
      )}

      {state.pendingScenarioIntro && (
        <ScenarioIntroModal
          intro={state.pendingScenarioIntro}
          onBegin={() => dispatch({ type: 'CONFIRM_SCENARIO_INTRO' })}
        />
      )}
    </div>
  )
}

// ── Power-on screen (name entry) ──────────────────────────────────────────────

function PowerOnScreen() {
  const { dispatch } = useSimulator()
  const [members, setMembers] = useState(['', ''])

  function updateMember(i, val) {
    setMembers(prev => prev.map((n, j) => j === i ? val : n))
  }

  function handlePowerOn() {
    const filtered = members.filter(n => n.trim())
    dispatch({ type: 'POWER_ON', teamMembers: filtered })
  }

  const canStart = members.some(n => n.trim())

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-monitor-bg gap-8 p-6">

      {/* Branding */}
      <div className="flex flex-col items-center gap-3 opacity-30">
        <svg width="72" height="40" viewBox="0 0 96 54" fill="none">
          <polyline
            points="0,27 20,27 24,21 30,27 38,27 44,37 52,6 60,48 68,27 96,27"
            stroke="rgb(25 192 138)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <div className="text-[14px] font-bold text-ecg-gray tracking-[0.3em] font-mono uppercase">CM Simulator</div>
        <div className="text-[10px] text-ecg-gray tracking-[0.25em] font-mono uppercase">ACLS Training Monitor</div>
      </div>

      {/* Name entry card */}
      <div className="w-full max-w-sm bg-surface border border-ecg-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Who is participating?</h2>
          <p className="text-[11px] text-ecg-gray mt-1">Enter team member names before powering on. These are saved with the session.</p>
        </div>

        <div className="space-y-2">
          {members.map((name, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input
                value={name}
                onChange={e => updateMember(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && i === members.length - 1 && members.length < 6)
                    setMembers(prev => [...prev, ''])
                  else if (e.key === 'Enter' && canStart)
                    handlePowerOn()
                }}
                placeholder={i === 0 ? 'Student / team member 1…' : `Team member ${i + 1}…`}
                autoFocus={i === 0}
                className="flex-1 bg-surface2 border border-ecg-border rounded-lg px-3 min-h-[44px] text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green"
              />
              {i >= 2 && (
                <button
                  onClick={() => setMembers(prev => prev.filter((_, j) => j !== i))}
                  className="text-ecg-gray hover:text-ecg-red text-xl leading-none px-1.5 min-h-[44px]"
                >×</button>
              )}
            </div>
          ))}
        </div>

        {members.length < 6 && (
          <button
            onClick={() => setMembers(prev => [...prev, ''])}
            className="text-[11px] font-bold text-ecg-green/60 hover:text-ecg-green transition-colors"
          >
            + Add Member
          </button>
        )}

        <button
          onClick={handlePowerOn}
          disabled={!canStart}
          className="w-full min-h-[52px] rounded-xl font-bold text-sm uppercase tracking-widest border-2 flex items-center justify-center gap-2.5 transition-all active:scale-95 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="text-lg">⏻</span> Power On
        </button>

        <p className="text-[10px] text-ecg-gray text-center">
          You can also skip names and power on to start immediately.
        </p>
      </div>

      <button
        onClick={() => dispatch({ type: 'POWER_ON', teamMembers: [] })}
        className="text-[11px] text-ecg-gray/50 hover:text-ecg-gray underline transition-colors"
      >
        Skip — power on without names
      </button>
    </div>
  )
}

// ── Power-off confirmation dialog ─────────────────────────────────────────────

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function PowerOffDialog({ state, dispatch, onClose }) {
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [done, setDone] = useState(false)

  const start = state.codeStartTime ?? state.eventLog?.[0]?.time
  const dur = start ? Math.round((Date.now() - start) / 1000) : 0
  const members = state.teamMembers?.length ? state.teamMembers : []

  async function handleSaveAndOff() {
    setBusy(true)
    setStatus('')
    try {
      await saveSession({
        studentName: members[0] || '',
        teamMembers: members,
        notes: notes.trim(),
        scenarioName: state.scenarioName || null,
        finalRhythm: state.currentRhythm,
        rosc: state.rosc,
        roscTime: state.roscTime,
        shocks: state.defib.shocksDelivered,
        cprCycles: state.cpr.cycleCount,
        durationSec: dur,
        metrics: computeMetrics(state),
        vitals: { ...state.vitals },
        medications: [...state.medications],
        rhythmHistory: [...state.rhythmHistory],
        reversibleCauses: [...state.reversibleCauses],
        eventLog: [...state.eventLog],
      })
      clearLiveState()
      setDone(true)
      setTimeout(() => dispatch({ type: 'POWER_OFF' }), 1000)
    } catch (e) {
      setStatus('Save failed: ' + e.message)
      setBusy(false)
    }
  }

  function handleOffNoSave() {
    clearLiveState()
    dispatch({ type: 'POWER_OFF' })
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85">
        <div className="bg-surface border border-ecg-border rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center gap-4">
          <div className="text-5xl text-ecg-green">✓</div>
          <div className="text-ink font-bold text-center">Session saved. Powering off…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85">
      <div className="bg-surface border border-ecg-border rounded-2xl shadow-2xl max-w-md w-full">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ecg-border">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Power Off</h2>
            <p className="text-[10px] text-ecg-gray font-mono mt-0.5">
              {state.scenarioName || 'Session'} · {fmt(dur)}
            </p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Session stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Duration', value: fmt(dur) },
              { label: 'Shocks',   value: state.defib.shocksDelivered },
              { label: 'ROSC',     value: state.rosc ? 'Yes' : 'No', color: state.rosc ? 'text-ecg-green' : 'text-ecg-red' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface2 border border-ecg-border rounded-lg p-3 text-center">
                <div className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest mb-1">{label}</div>
                <div className={`text-lg font-bold font-mono ${color || 'text-ink'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Participants (read-only — set at power-on) */}
          <div>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1.5">Participants</div>
            {members.length === 0 ? (
              <p className="text-[11px] text-ecg-gray italic">No names entered at startup.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {members.map((name, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full border border-ecg-border bg-surface2 text-[11px] text-ink font-mono">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Debrief Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Performance, areas to improve…"
              className="mt-1 w-full bg-surface2 border border-ecg-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green resize-none"
            />
          </div>

          {status && <p className="text-[11px] text-ecg-amber">{status}</p>}

          <button
            onClick={handleSaveAndOff}
            disabled={busy}
            className="w-full min-h-[52px] rounded-xl font-bold text-sm uppercase tracking-widest border-2 flex items-center justify-center gap-2 transition-all active:scale-95 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-40"
          >
            <span className="text-lg">⏻</span> {busy ? 'Saving…' : 'Save & Power Off'}
          </button>

          <button
            onClick={handleOffNoSave}
            className="w-full text-[11px] text-ecg-gray hover:text-ecg-red transition-colors py-1"
          >
            Power off without saving
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Scenario description banner (student-facing) ─────────────────────────────

function ScenarioDescriptionBanner({ name, description, onDismiss }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="shrink-0 border-b border-ecg-border bg-surface2/80 backdrop-blur-sm">
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-ecg-green shrink-0">Scenario</span>
              {name && <span className="text-[11px] font-bold text-ink truncate">{name}</span>}
              <span className="text-[9px] text-ecg-gray font-mono ml-auto shrink-0">{expanded ? '▲' : '▼'}</span>
            </div>
            {!expanded && (
              <p className="text-[11px] text-ecg-gray leading-snug mt-0.5 line-clamp-1">{description}</p>
            )}
          </button>
          {expanded && (
            <p className="text-[12px] text-ink leading-relaxed mt-1 pr-2">{description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-ecg-gray hover:text-ink text-lg leading-none mt-0.5 px-1 transition-colors"
        >×</button>
      </div>
    </div>
  )
}

// ── Scenario intro overlay ────────────────────────────────────────────────────

function ScenarioIntroModal({ intro, onBegin }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/85">
      <div className="bg-surface border border-ecg-border rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-6">
        <div className="text-center space-y-3">
          <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Incoming Scenario</div>
          <h2 className="text-xl font-bold text-ink">{intro.name}</h2>
          {intro.description && (
            <p className="text-base text-ecg-gray leading-relaxed">{intro.description}</p>
          )}
        </div>
        <button
          onClick={onBegin}
          className="w-full min-h-[52px] rounded-xl font-bold text-sm uppercase tracking-widest border-2 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black active:scale-95 transition-all"
        >
          Begin
        </button>
      </div>
    </div>
  )
}
