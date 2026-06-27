import { useState, useEffect, useMemo } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { saveSession, loadSessions, deleteSession, usingCloud } from '../utils/sessionStore'
import { causeLabel } from '../data/reversibleCauses'
import { computeMetrics, fmtSec } from '../utils/metrics'

function fmtClock(sec) {
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
function fmtDate(ms) {
  return new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function relTime(base, t) {
  return base ? fmtClock((t - base) / 1000) : '—'
}

function buildPayload(state, studentName, notes) {
  const start = state.codeStartTime ?? (state.eventLog[0]?.time ?? Date.now())
  const durationSec = Math.round((Date.now() - start) / 1000)
  return {
    studentName: studentName.trim(),
    notes: notes.trim(),
    scenarioName: state.scenarioName || null,
    finalRhythm: state.currentRhythm,
    rosc: state.rosc,
    shocks: state.defib.shocksDelivered,
    cprCycles: state.cpr.cycleCount,
    durationSec,
    metrics: computeMetrics(state),
    vitals: { ...state.vitals },
    medications: [...state.medications],
    rhythmHistory: [...state.rhythmHistory],
    reversibleCauses: [...state.reversibleCauses],
    eventLog: [...state.eventLog],
  }
}

export default function SessionsModal({ onClose }) {
  const { state } = useSimulator()
  const [tab, setTab] = useState('save')
  const [studentName, setStudentName] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  async function refresh() {
    setLoading(true)
    try { setSessions(await loadSessions()) }
    catch (e) { setStatus('Load error: ' + e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [])

  const knownStudents = useMemo(
    () => [...new Set(sessions.map(s => s.studentName).filter(Boolean))],
    [sessions]
  )

  async function handleSave() {
    if (!studentName.trim()) { setStatus('Enter a student name first.'); return }
    setBusy(true); setStatus('')
    try {
      await saveSession(buildPayload(state, studentName, notes))
      setStatus('Session saved.')
      setNotes('')
      await refresh()
    } catch (e) {
      setStatus('Save failed: ' + e.message)
    } finally { setBusy(false) }
  }

  async function handleDelete(id) {
    try { await deleteSession(id); if (selected?.id === id) setSelected(null); await refresh() }
    catch (e) { setStatus('Delete failed: ' + e.message) }
  }

  const tabCls = (t) => `flex-1 min-h-[44px] rounded-lg border text-xs font-bold uppercase tracking-wide transition-colors ${
    tab === t ? 'bg-surface2 text-ink border-ecg-green' : 'border-ecg-border text-ecg-gray hover:text-ink'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Student Sessions</h2>
            <p className="text-[10px] text-ecg-gray font-mono">
              {usingCloud ? 'Saving to cloud (Firebase)' : 'Saving on this device (local)'}
            </p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-3 shrink-0">
          <button className={tabCls('save')} onClick={() => setTab('save')}>Save Current</button>
          <button className={tabCls('browse')} onClick={() => setTab('browse')}>Browse{sessions.length ? ` (${sessions.length})` : ''}</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {tab === 'save' ? (
            <SaveTab
              state={state} studentName={studentName} setStudentName={setStudentName}
              notes={notes} setNotes={setNotes} knownStudents={knownStudents}
              onSave={handleSave} busy={busy} status={status}
            />
          ) : (
            <BrowseTab
              sessions={sessions} loading={loading} selected={selected}
              setSelected={setSelected} onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-ecg-border/40 text-[12px]">
      <span className="text-ecg-gray">{label}</span>
      <span className="text-ink font-mono text-right">{children}</span>
    </div>
  )
}

function SaveTab({ state, studentName, setStudentName, notes, setNotes, knownStudents, onSave, busy, status }) {
  const start = state.codeStartTime ?? (state.eventLog[0]?.time)
  const dur = start ? Math.round((Date.now() - start) / 1000) : 0

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Student</label>
        <input
          list="known-students"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
          placeholder="Student name…"
          className="mt-1 w-full bg-surface2 border border-ecg-border rounded-lg px-3 min-h-[44px] text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green"
        />
        <datalist id="known-students">
          {knownStudents.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>

      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Instructor Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Debrief notes, performance, areas to improve…"
          className="mt-1 w-full bg-surface2 border border-ecg-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green resize-none"
        />
      </div>

      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">This Session</label>
        <div className="mt-1">
          <Field label="Scenario">{state.scenarioName || '—'}</Field>
          <Field label="Final rhythm">{state.currentRhythm}</Field>
          <Field label="Duration">{fmtClock(dur)}</Field>
          <Field label="Shocks">{state.defib.shocksDelivered}</Field>
          <Field label="CPR cycles">{state.cpr.cycleCount}</Field>
          <Field label="Medications">{state.medications.length}</Field>
          <Field label="Causes flagged">
            {state.reversibleCauses.length ? state.reversibleCauses.map(causeLabel).join(', ') : '—'}
          </Field>
        </div>
      </div>

      {status && <p className="text-[11px] text-ecg-amber">{status}</p>}

      <button
        onClick={onSave}
        disabled={busy}
        className="w-full min-h-[48px] rounded-lg font-bold text-sm uppercase tracking-widest border-2 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black active:scale-95 disabled:opacity-40 transition-all"
      >
        {busy ? 'Saving…' : 'Save Session'}
      </button>
    </div>
  )
}

function BrowseTab({ sessions, loading, selected, setSelected, onDelete }) {
  if (loading) return <p className="text-xs text-ecg-gray py-6 text-center">Loading…</p>
  if (!sessions.length) return <p className="text-xs text-ecg-gray py-6 text-center">No saved sessions yet.</p>

  if (selected) return <SessionDetail s={selected} onBack={() => setSelected(null)} onDelete={onDelete} />

  // group by student
  const groups = {}
  for (const s of sessions) {
    const k = s.studentName || 'Unnamed'
    ;(groups[k] ||= []).push(s)
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([student, list]) => (
        <div key={student}>
          <div className="text-[11px] text-ecg-green font-mono uppercase tracking-widest mb-1.5">
            {student} <span className="text-ecg-gray">· {list.length}</span>
          </div>
          <div className="space-y-1">
            {list.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-ecg-border bg-surface2 hover:border-ecg-green text-left transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[12px] text-ink font-bold truncate">{s.scenarioName || s.finalRhythm}</div>
                  <div className="text-[10px] text-ecg-gray font-mono">{fmtDate(s.savedAt)}</div>
                </div>
                <div className="text-[10px] text-ecg-gray font-mono text-right shrink-0">
                  {fmtClock(s.durationSec || 0)} · {s.shocks ?? 0} shk
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SessionDetail({ s, onBack, onDelete }) {
  const base = s.eventLog?.[0]?.time ?? null
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[11px] text-ecg-gray hover:text-ink font-mono">‹ Back</button>
        <button
          onClick={() => onDelete(s.id)}
          className="text-[10px] font-bold text-ecg-red border border-ecg-red/50 rounded px-2 py-1 hover:bg-ecg-red/10"
        >
          Delete
        </button>
      </div>

      <div>
        <div className="text-sm font-bold text-ink">{s.studentName}</div>
        <div className="text-[10px] text-ecg-gray font-mono">{fmtDate(s.savedAt)}</div>
      </div>

      <div>
        <Field label="Scenario">{s.scenarioName || '—'}</Field>
        <Field label="Final rhythm">{s.finalRhythm}</Field>
        <Field label="ROSC">{s.rosc ? 'Yes' : 'No'}</Field>
        <Field label="Duration">{fmtClock(s.durationSec || 0)}</Field>
        <Field label="Shocks">{s.shocks ?? 0}</Field>
        <Field label="CPR cycles">{s.cprCycles ?? 0}</Field>
        {s.metrics && <>
          <Field label="Time to CPR">{fmtSec(s.metrics.timeToCompression)}</Field>
          <Field label="Time to 1st shock">{fmtSec(s.metrics.timeToShock)}</Field>
          <Field label="Time to 1st epi">{fmtSec(s.metrics.timeToEpi)}</Field>
          <Field label="CPR fraction">{s.metrics.cprFractionPct != null ? s.metrics.cprFractionPct + '%' : '—'}</Field>
          <Field label="Interruptions">{s.metrics.interruptions ?? 0}</Field>
        </>}
        <Field label="Causes">
          {s.reversibleCauses?.length ? s.reversibleCauses.map(causeLabel).join(', ') : '—'}
        </Field>
      </div>

      {s.notes && (
        <div>
          <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">Notes</div>
          <p className="text-[12px] text-ink whitespace-pre-wrap">{s.notes}</p>
        </div>
      )}

      {s.medications?.length > 0 && (
        <div>
          <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">Medications</div>
          {[...s.medications].reverse().map((m, i) => (
            <div key={i} className="flex justify-between text-[11px] font-mono py-0.5 border-b border-ecg-border/40">
              <span className="text-ink">{m.drug}</span>
              <span className="text-ecg-gray">{m.dose}</span>
            </div>
          ))}
        </div>
      )}

      {s.eventLog?.length > 0 && (
        <div>
          <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">Timeline</div>
          {s.eventLog.map((e, i) => (
            <div key={i} className="flex gap-2 text-[11px] font-mono py-0.5">
              <span className="text-ecg-gray w-12 shrink-0">{relTime(base, e.time)}</span>
              <span className="text-ink">{e.label}{e.detail ? <span className="text-ecg-gray"> · {e.detail}</span> : null}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
