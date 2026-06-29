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

function buildPayload(state, teamMembers, notes) {
  const filtered = teamMembers.filter(n => n.trim())
  const start = state.codeStartTime ?? (state.eventLog[0]?.time ?? Date.now())
  const durationSec = Math.round((Date.now() - start) / 1000)
  return {
    studentName: filtered[0] || '',
    teamMembers: filtered,
    notes: notes.trim(),
    scenarioName: state.scenarioName || null,
    finalRhythm: state.currentRhythm,
    rosc: state.rosc,
    roscTime: state.roscTime,
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

function downloadCSV(sessions) {
  const headers = [
    'Date', 'Students', 'Scenario', 'Final Rhythm', 'Duration',
    'ROSC', 'Shocks', 'CPR Cycles',
    'Time to CPR', 'Time to 1st Shock', 'Time to 1st Epi', 'CPR Fraction %',
    'Interruptions', 'Notes',
  ]
  const rows = sessions.map(s => {
    const members = (s.teamMembers?.filter(Boolean) || (s.studentName ? [s.studentName] : [])).join('; ')
    return [
      fmtDate(s.savedAt),
      members,
      s.scenarioName || '—',
      s.finalRhythm || '—',
      fmtClock(s.durationSec || 0),
      s.rosc ? 'Yes' : 'No',
      s.shocks ?? 0,
      s.cprCycles ?? 0,
      fmtSec(s.metrics?.timeToCompression),
      fmtSec(s.metrics?.timeToShock),
      fmtSec(s.metrics?.timeToEpi),
      s.metrics?.cprFractionPct != null ? s.metrics.cprFractionPct : '—',
      s.metrics?.interruptions ?? '—',
      s.notes || '',
    ]
  })
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `acls-sessions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function SessionsModal({ onClose }) {
  const { state } = useSimulator()
  const [tab, setTab] = useState('save')
  const [teamMembers, setTeamMembers] = useState([''])
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
    () => [...new Set(
      sessions.flatMap(s => s.teamMembers?.filter(Boolean) || (s.studentName ? [s.studentName] : []))
    )],
    [sessions]
  )

  async function handleSave() {
    if (!teamMembers[0]?.trim()) { setStatus('Enter at least one student name.'); return }
    setBusy(true); setStatus('')
    try {
      await saveSession(buildPayload(state, teamMembers, notes))
      setStatus('Session saved.')
      setNotes('')
      setTeamMembers([''])
      await refresh()
    } catch (e) {
      setStatus('Save failed: ' + e.message)
    } finally { setBusy(false) }
  }

  async function handleDelete(id) {
    try {
      await deleteSession(id)
      if (selected?.id === id) setSelected(null)
      await refresh()
    } catch (e) { setStatus('Delete failed: ' + e.message) }
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
          <button className={tabCls('browse')} onClick={() => setTab('browse')}>
            Browse{sessions.length ? ` (${sessions.length})` : ''}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {tab === 'save' ? (
            <SaveTab
              state={state}
              teamMembers={teamMembers} setTeamMembers={setTeamMembers}
              notes={notes} setNotes={setNotes}
              knownStudents={knownStudents}
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

function SaveTab({ state, teamMembers, setTeamMembers, notes, setNotes, knownStudents, onSave, busy, status }) {
  const start = state.codeStartTime ?? (state.eventLog[0]?.time)
  const dur = start ? Math.round((Date.now() - start) / 1000) : 0

  function updateMember(i, val) {
    setTeamMembers(prev => prev.map((n, j) => j === i ? val : n))
  }
  function addMember() {
    setTeamMembers(prev => [...prev, ''])
  }
  function removeMember(i) {
    setTeamMembers(prev => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-4">

      {/* Team Members */}
      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">
          Team Members
        </label>
        <div className="mt-1 space-y-1.5">
          {teamMembers.map((name, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input
                list="known-students"
                value={name}
                onChange={e => updateMember(i, e.target.value)}
                placeholder={i === 0 ? 'Student name…' : `Member ${i + 1}…`}
                className="flex-1 bg-surface2 border border-ecg-border rounded-lg px-3 min-h-[44px] text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green"
              />
              {i > 0 && (
                <button
                  onClick={() => removeMember(i)}
                  className="text-ecg-gray hover:text-ecg-red text-xl leading-none px-2 min-h-[44px]"
                >×</button>
              )}
            </div>
          ))}
        </div>
        {teamMembers.length < 6 && (
          <button
            onClick={addMember}
            className="mt-1.5 text-[11px] font-bold text-ecg-green/70 hover:text-ecg-green transition-colors"
          >
            + Add Member
          </button>
        )}
        <datalist id="known-students">
          {knownStudents.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Instructor Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Debrief notes, performance, areas to improve…"
          className="mt-1 w-full bg-surface2 border border-ecg-border rounded-lg px-3 py-2 text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green resize-none"
        />
      </div>

      {/* Session Summary */}
      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">This Session</label>
        <div className="mt-1">
          <Field label="Scenario">{state.scenarioName || '—'}</Field>
          <Field label="Final rhythm">{state.currentRhythm}</Field>
          <Field label="Duration">{fmtClock(dur)}</Field>
          <Field label="Shocks">{state.defib.shocksDelivered}</Field>
          <Field label="CPR cycles">{state.cpr.cycleCount}</Field>
          <Field label="ROSC">
            {state.rosc
              ? `Yes (${state.roscTime && start ? fmtClock((state.roscTime - start) / 1000) : '—'})`
              : 'No'}
          </Field>
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

  // group by primary student name
  const groups = {}
  for (const s of sessions) {
    const k = s.studentName || 'Unnamed'
    ;(groups[k] ||= []).push(s)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ecg-gray font-mono">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => downloadCSV(sessions)}
          className="text-[10px] font-bold text-ecg-green border border-ecg-green/50 rounded px-2.5 py-1 hover:bg-ecg-green/10 transition-colors uppercase tracking-widest"
        >
          Export CSV
        </button>
      </div>

      {Object.entries(groups).map(([student, list]) => (
        <div key={student}>
          <div className="text-[11px] text-ecg-green font-mono uppercase tracking-widest mb-1.5">
            {student} <span className="text-ecg-gray">· {list.length}</span>
          </div>
          <div className="space-y-1">
            {list.map(s => {
              const allMembers = s.teamMembers?.filter(Boolean) || (s.studentName ? [s.studentName] : [])
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-ecg-border bg-surface2 hover:border-ecg-green text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[12px] text-ink font-bold truncate">
                      {s.scenarioName || s.finalRhythm}
                    </div>
                    <div className="text-[10px] text-ecg-gray font-mono">
                      {fmtDate(s.savedAt)}
                      {allMembers.length > 1 && (
                        <span className="ml-1">· {allMembers.length} members</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-ecg-gray font-mono text-right shrink-0">
                    {fmtClock(s.durationSec || 0)} · {s.shocks ?? 0} shk
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function SessionDetail({ s, onBack, onDelete }) {
  const base = s.eventLog?.[0]?.time ?? null
  const allMembers = s.teamMembers?.filter(Boolean) || (s.studentName ? [s.studentName] : [])

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

      {/* Team Members */}
      <div>
        <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">
          {allMembers.length > 1 ? 'Team Members' : 'Student'}
        </div>
        {allMembers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {allMembers.map((name, i) => (
              <span
                key={i}
                className="text-[11px] font-bold text-ink bg-surface2 border border-ecg-border rounded-lg px-2 py-1"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-ecg-gray">—</span>
        )}
        <div className="text-[10px] text-ecg-gray font-mono mt-1">{fmtDate(s.savedAt)}</div>
      </div>

      <div>
        <Field label="Scenario">{s.scenarioName || '—'}</Field>
        <Field label="Final rhythm">{s.finalRhythm}</Field>
        <Field label="ROSC">
          {s.rosc
            ? `Yes${s.roscTime && s.eventLog?.[0]?.time ? ` (${relTime(s.eventLog[0].time, s.roscTime)})` : ''}`
            : 'No'}
        </Field>
        <Field label="Duration">{fmtClock(s.durationSec || 0)}</Field>
        <Field label="Shocks">{s.shocks ?? 0}</Field>
        <Field label="CPR cycles">{s.cprCycles ?? 0}</Field>
        <Field label="Causes">
          {s.reversibleCauses?.length ? s.reversibleCauses.map(causeLabel).join(', ') : '—'}
        </Field>
      </div>

      {s.metrics && (
        <div>
          <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">Quality Metrics</div>
          <Field label="Time to CPR">{fmtSec(s.metrics.timeToCompression)}</Field>
          <Field label="Time to 1st shock">{fmtSec(s.metrics.timeToShock)}</Field>
          <Field label="Time to 1st epi">{fmtSec(s.metrics.timeToEpi)}</Field>
          <Field label="CPR fraction">
            <span className={s.metrics.cprFractionPct < 60 ? 'text-ecg-red' : 'text-ecg-green'}>
              {s.metrics.cprFractionPct != null ? s.metrics.cprFractionPct + '%' : '—'}
              {s.metrics.cprFractionPct != null && s.metrics.cprFractionPct < 60 ? ' (AHA ≥60%)' : ' ✓'}
            </span>
          </Field>
          <Field label="Interruptions">{s.metrics.interruptions ?? 0}</Field>
        </div>
      )}

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
              <span className="text-ink">
                {e.label}
                {e.detail ? <span className="text-ecg-gray"> · {e.detail}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
