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
function fmtDateLong(ms) {
  return new Date(ms).toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function relTime(base, t) {
  return base ? fmtClock((t - base) / 1000) : '—'
}
function memberList(s) {
  return s.teamMembers?.filter(Boolean) || (s.studentName ? [s.studentName] : [])
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

// ── HTML Report Export ────────────────────────────────────────────────────────

function downloadHTML(sessions) {
  const exportDate = new Date().toLocaleString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  // group by primary student
  const groups = {}
  for (const s of sessions) {
    const k = s.studentName || 'Unnamed'
    ;(groups[k] ||= []).push(s)
  }

  function rt(base, t) {
    if (!base) return '—'
    return fmtClock((t - base) / 1000)
  }

  function summaryRows() {
    return sessions.map(s => {
      const members = memberList(s).join(', ') || '—'
      const cpt = s.metrics?.cprFractionPct
      const cptOk = cpt != null && cpt >= 60
      return `
        <tr>
          <td>${esc(members)}</td>
          <td>${esc(s.scenarioName || s.finalRhythm || '—')}</td>
          <td class="nowrap">${esc(fmtDateLong(s.savedAt))}</td>
          <td class="center mono">${fmtClock(s.durationSec || 0)}</td>
          <td class="center ${s.rosc ? 'green' : 'red'} bold">${s.rosc ? 'Yes' : 'No'}</td>
          <td class="center mono">${s.shocks ?? 0}</td>
          <td class="center bold ${cpt == null ? '' : cptOk ? 'green' : 'red'}">${cpt != null ? cpt + '%' : '—'}</td>
          <td class="note-cell">${esc(s.notes || '')}</td>
        </tr>`
    }).join('')
  }

  function sessionCard(s) {
    const members = memberList(s)
    const base = s.eventLog?.[0]?.time ?? null
    const cpt = s.metrics?.cprFractionPct

    const badgeClass = s.rosc ? 'badge-green' : s.shocks > 0 ? 'badge-yellow' : 'badge-red'
    const badgeText = s.rosc ? '✓ ROSC' : s.shocks > 0 ? `${s.shocks} Shock${s.shocks !== 1 ? 's' : ''}` : 'No ROSC'

    const medsBlock = s.medications?.length ? `
      <div class="block">
        <div class="block-title">Medications Administered</div>
        <table class="inner-table">
          <thead><tr><th>Drug</th><th>Dose</th></tr></thead>
          <tbody>${[...s.medications].reverse().map(m =>
            `<tr><td>${esc(m.drug)}</td><td>${esc(m.dose)}</td></tr>`
          ).join('')}</tbody>
        </table>
      </div>` : ''

    const causesBlock = s.reversibleCauses?.length ? `
      <div class="block">
        <div class="block-title">Reversible Causes Flagged</div>
        <div class="badges">${s.reversibleCauses.map(c =>
          `<span class="cause-badge">${esc(causeLabel(c))}</span>`
        ).join('')}</div>
      </div>` : ''

    const notesBlock = s.notes ? `
      <div class="block">
        <div class="block-title">Instructor Notes</div>
        <p class="notes-text">${esc(s.notes).replace(/\n/g, '<br>')}</p>
      </div>` : ''

    const timelineBlock = s.eventLog?.length ? `
      <div class="block">
        <div class="block-title">Event Timeline</div>
        <div class="timeline">${s.eventLog.map(e => `
          <div class="tl-row">
            <span class="tl-time">${rt(base, e.time)}</span>
            <span class="tl-label">${esc(e.label)}</span>
            ${e.detail ? `<span class="tl-detail">· ${esc(e.detail)}</span>` : ''}
          </div>`).join('')}
        </div>
      </div>` : ''

    const qualityBlock = s.metrics ? `
      <div class="quality-row">
        <div class="q-cell">
          <span class="q-label">Time to CPR</span>
          <span class="q-val">${fmtSec(s.metrics.timeToCompression)}</span>
        </div>
        <div class="q-cell">
          <span class="q-label">Time to 1st Shock</span>
          <span class="q-val">${fmtSec(s.metrics.timeToShock)}</span>
        </div>
        <div class="q-cell">
          <span class="q-label">Time to 1st Epi</span>
          <span class="q-val">${fmtSec(s.metrics.timeToEpi)}</span>
        </div>
        <div class="q-cell">
          <span class="q-label">CPR Fraction</span>
          <span class="q-val ${cpt == null ? '' : cpt < 60 ? 'bad' : 'good'}">
            ${cpt != null ? cpt + '%' : '—'}${cpt != null ? (cpt < 60 ? ' ⚠' : ' ✓') : ''}
          </span>
        </div>
        <div class="q-cell">
          <span class="q-label">Interruptions</span>
          <span class="q-val">${s.metrics.interruptions ?? 0}</span>
        </div>
      </div>` : ''

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${esc(s.scenarioName || s.finalRhythm || 'Session')}</div>
            <div class="card-sub">
              ${esc(fmtDateLong(s.savedAt))}
              ${members.length > 1 ? ' &nbsp;·&nbsp; Team: ' + esc(members.join(', ')) : ''}
            </div>
          </div>
          <span class="outcome-badge ${badgeClass}">${badgeText}</span>
        </div>

        <div class="stat-row">
          <div class="stat-cell">
            <span class="stat-label">Duration</span>
            <span class="stat-val">${fmtClock(s.durationSec || 0)}</span>
          </div>
          <div class="stat-cell">
            <span class="stat-label">Shocks</span>
            <span class="stat-val">${s.shocks ?? 0}</span>
          </div>
          <div class="stat-cell">
            <span class="stat-label">CPR Cycles</span>
            <span class="stat-val">${s.cprCycles ?? 0}</span>
          </div>
          <div class="stat-cell">
            <span class="stat-label">ROSC</span>
            <span class="stat-val ${s.rosc ? 'good' : 'bad'}">${s.rosc ? 'Yes' : 'No'}</span>
          </div>
        </div>

        ${qualityBlock}
        ${causesBlock}
        ${medsBlock}
        ${notesBlock}
        ${timelineBlock}
      </div>`
  }

  function studentSection(student, list) {
    return `
      <section class="student-section">
        <div class="student-header">
          <h2>${esc(student)}</h2>
          <span class="session-count">${list.length} session${list.length !== 1 ? 's' : ''}</span>
        </div>
        ${list.map(sessionCard).join('\n')}
      </section>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ACLS Report — ${new Date().toLocaleDateString()}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f1f5f9; color: #0f172a; line-height: 1.5; padding: 32px 24px;
}
a { color: inherit; }

/* ── Report header ── */
.rpt-header {
  background: #0f172a; color: #fff; border-radius: 14px;
  padding: 24px 32px; margin-bottom: 32px;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
}
.rpt-title { font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.rpt-title .accent { color: #10b981; }
.rpt-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.rpt-kpi { text-align: right; }
.kpi-val { font-size: 36px; font-weight: 900; color: #10b981; line-height: 1; }
.kpi-lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }

/* ── Section wrapper ── */
.section { margin-bottom: 40px; }
.section-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em;
  color: #64748b; margin-bottom: 12px;
}

/* ── Summary table ── */
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
thead tr { background: #f8fafc; }
th { padding: 11px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; }
td { padding: 11px 14px; font-size: 12px; border-top: 1px solid #f1f5f9; vertical-align: top; }
tbody tr:hover { background: #f8fafc; }
.center { text-align: center; }
.nowrap { white-space: nowrap; }
.mono { font-variant-numeric: tabular-nums; font-family: 'SF Mono', monospace; }
.bold { font-weight: 700; }
.green { color: #16a34a; }
.red { color: #dc2626; }
.note-cell { font-size: 11px; color: #64748b; max-width: 200px; }

/* ── Student section ── */
.student-section { margin-bottom: 52px; }
.student-header {
  display: flex; align-items: baseline; gap: 10px;
  padding-bottom: 10px; margin-bottom: 18px;
  border-bottom: 2px solid #0f172a;
}
.student-header h2 { font-size: 22px; font-weight: 800; }
.session-count { font-size: 12px; color: #94a3b8; }

/* ── Session card ── */
.card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 18px;
}
.card-header {
  padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
}
.card-title { font-size: 16px; font-weight: 700; }
.card-sub { font-size: 11px; color: #94a3b8; margin-top: 3px; }
.outcome-badge {
  flex-shrink: 0; font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .06em; padding: 5px 14px; border-radius: 99px;
}
.badge-green { background: #dcfce7; color: #166534; }
.badge-red   { background: #fee2e2; color: #991b1b; }
.badge-yellow{ background: #fef3c7; color: #92400e; }

/* ── Session stat row ── */
.stat-row {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid #f1f5f9;
}
.stat-cell { padding: 14px 20px; text-align: center; border-right: 1px solid #f1f5f9; }
.stat-cell:last-child { border-right: none; }
.stat-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 4px; }
.stat-val { display: block; font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.stat-val.good { color: #16a34a; }
.stat-val.bad  { color: #dc2626; }

/* ── Quality metrics row ── */
.quality-row {
  display: grid; grid-template-columns: repeat(5, 1fr);
  background: #f8fafc; border-bottom: 1px solid #f1f5f9;
}
.q-cell { padding: 12px 16px; text-align: center; border-right: 1px solid #e2e8f0; }
.q-cell:last-child { border-right: none; }
.q-label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
.q-val { display: block; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.q-val.good { color: #16a34a; }
.q-val.bad  { color: #dc2626; }

/* ── Inner blocks (meds, notes, timeline, causes) ── */
.block { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
.block:last-child { border-bottom: none; }
.block-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 8px; }
.inner-table { width: auto; box-shadow: none; border-radius: 0; }
.inner-table th, .inner-table td { padding: 5px 20px 5px 0; font-size: 12px; border: none; border-top: 1px solid #f1f5f9; }
.inner-table thead tr { background: none; }
.inner-table th { border-bottom: 1px solid #e2e8f0; border-top: none; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
.cause-badge { background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; }
.notes-text { font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6; }
.timeline { display: flex; flex-direction: column; gap: 5px; }
.tl-row { display: flex; gap: 14px; font-size: 12px; align-items: baseline; }
.tl-time { font-family: 'SF Mono', monospace; font-weight: 700; color: #64748b; min-width: 40px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.tl-label { color: #0f172a; font-weight: 500; }
.tl-detail { color: #94a3b8; }

/* ── Print ── */
@media print {
  body { background: white; padding: 0; font-size: 11px; }
  .rpt-header { border-radius: 0; margin: 0 0 24px; }
  .student-section { page-break-before: always; }
  .student-section:first-of-type { page-break-before: avoid; }
  .card { box-shadow: none; border: 1px solid #e2e8f0; page-break-inside: avoid; margin-bottom: 12px; }
  table { box-shadow: none; border: 1px solid #e2e8f0; }
}
</style>
</head>
<body>

<header class="rpt-header">
  <div>
    <div class="rpt-title">CM <span class="accent">Simulator</span> &mdash; ACLS Report</div>
    <div class="rpt-sub">Exported ${esc(exportDate)} &nbsp;&middot;&nbsp; ${sessions.length} session${sessions.length !== 1 ? 's' : ''} &nbsp;&middot;&nbsp; ${Object.keys(groups).length} student${Object.keys(groups).length !== 1 ? 's' : ''}</div>
  </div>
  <div class="rpt-kpi">
    <div class="kpi-val">${sessions.filter(s => s.rosc).length} / ${sessions.length}</div>
    <div class="kpi-lbl">ROSC outcomes</div>
  </div>
</header>

<section class="section">
  <div class="section-title">Session Overview</div>
  <table>
    <thead>
      <tr>
        <th>Student(s)</th><th>Scenario</th><th>Date &amp; Time</th>
        <th>Duration</th><th>ROSC</th><th>Shocks</th><th>CPR %</th><th>Notes</th>
      </tr>
    </thead>
    <tbody>${summaryRows()}</tbody>
  </table>
</section>

${Object.entries(groups).map(([student, list]) => studentSection(student, list)).join('\n')}

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `acls-report-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Modal ─────────────────────────────────────────────────────────────────────

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

  return (
    <div className="space-y-4">
      {/* Team Members */}
      <div>
        <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Team Members</label>
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
                  onClick={() => setTeamMembers(prev => prev.filter((_, j) => j !== i))}
                  className="text-ecg-gray hover:text-ecg-red text-xl leading-none px-2 min-h-[44px]"
                >×</button>
              )}
            </div>
          ))}
        </div>
        {teamMembers.length < 6 && (
          <button
            onClick={() => setTeamMembers(prev => [...prev, ''])}
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

  const groups = {}
  for (const s of sessions) {
    const k = s.studentName || 'Unnamed'
    ;(groups[k] ||= []).push(s)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ecg-gray font-mono">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => downloadHTML(sessions)}
          className="text-[10px] font-bold text-ecg-green border border-ecg-green/50 rounded px-2.5 py-1 hover:bg-ecg-green/10 transition-colors uppercase tracking-widest"
        >
          Export Report
        </button>
      </div>

      {Object.entries(groups).map(([student, list]) => (
        <div key={student}>
          <div className="text-[11px] text-ecg-green font-mono uppercase tracking-widest mb-1.5">
            {student} <span className="text-ecg-gray">· {list.length}</span>
          </div>
          <div className="space-y-1">
            {list.map(s => {
              const members = memberList(s)
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
                      {members.length > 1 && <span className="ml-1">· {members.length} members</span>}
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
  const allMembers = memberList(s)

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
        <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">
          {allMembers.length > 1 ? 'Team Members' : 'Student'}
        </div>
        {allMembers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {allMembers.map((name, i) => (
              <span key={i} className="text-[11px] font-bold text-ink bg-surface2 border border-ecg-border rounded-lg px-2 py-1">
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
