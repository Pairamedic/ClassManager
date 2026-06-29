import { useState, useEffect, useMemo } from 'react'
import { loadSessions, deleteSession } from '../utils/sessionStore'

const REQUIRED_RHYTHMS = [
  { id: 'NSR',          label: 'Normal Sinus Rhythm',       short: 'NSR',  cat: 'normal'  },
  { id: 'SINUS_BRADY',  label: 'Sinus Bradycardia',         short: 'SB',   cat: 'brady'   },
  { id: 'FIRST_DEGREE', label: '1st Degree AV Block',       short: '1°',   cat: 'brady'   },
  { id: 'WENCKEBACH',   label: 'Wenckebach (Mobitz I)',      short: 'W',    cat: 'brady'   },
  { id: 'MOBITZ2',      label: 'Mobitz II',                 short: 'M2',   cat: 'brady'   },
  { id: 'THIRD_DEGREE', label: '3rd Degree AV Block',       short: '3°',   cat: 'brady'   },
  { id: 'SVT',          label: 'SVT',                       short: 'SVT',  cat: 'tachy'   },
  { id: 'AFIB',         label: 'Atrial Fibrillation',       short: 'AF',   cat: 'tachy'   },
  { id: 'AFLUTTER',     label: 'Atrial Flutter',            short: 'AFL',  cat: 'tachy'   },
  { id: 'VTACH',        label: 'Ventricular Tachycardia',   short: 'VT',   cat: 'tachy'   },
  { id: 'VFIB',         label: 'Ventricular Fibrillation',  short: 'VF',   cat: 'shock'   },
  { id: 'TORSADES',     label: 'Torsades de Pointes',       short: 'TdP',  cat: 'shock'   },
  { id: 'ASYSTOLE',     label: 'Asystole',                  short: 'Asy',  cat: 'noshock' },
  { id: 'PEA',          label: 'PEA',                       short: 'PEA',  cat: 'noshock' },
]

const TOTAL = REQUIRED_RHYTHMS.length

const CAT_CHIP = {
  normal:  'text-ecg-green  border-ecg-green/50  bg-ecg-green/10',
  brady:   'text-ecg-blue   border-ecg-blue/50   bg-ecg-blue/10',
  tachy:   'text-ecg-amber  border-ecg-amber/50  bg-ecg-amber/10',
  shock:   'text-ecg-red    border-ecg-red/50    bg-ecg-red/10',
  noshock: 'text-ecg-amber  border-ecg-amber/50  bg-ecg-amber/10',
}

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

function getMembers(s) {
  return s.teamMembers?.filter(Boolean).length
    ? s.teamMembers.filter(Boolean)
    : s.studentName ? [s.studentName] : []
}

function buildStudentMap(sessions) {
  const map = new Map()
  for (const s of sessions) {
    const members = getMembers(s)
    const seen = new Set()
    if (Array.isArray(s.rhythmHistory)) s.rhythmHistory.forEach(({ rhythm }) => rhythm && seen.add(rhythm))
    if (s.finalRhythm) seen.add(s.finalRhythm)

    for (const name of members) {
      if (!map.has(name)) map.set(name, { rhythmsDone: new Map(), sessionIds: new Set(), sessionCount: 0 })
      const st = map.get(name)
      st.sessionIds.add(s.id)
      st.sessionCount++
      for (const id of seen) {
        if (!st.rhythmsDone.has(id) || s.savedAt > st.rhythmsDone.get(id))
          st.rhythmsDone.set(id, s.savedAt)
      }
    }
  }
  return map
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtDur(sec) {
  if (!sec) return '—'
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function exportStudentHTML(name, data, allSessions) {
  const studentSessions = allSessions.filter(s => getMembers(s).includes(name))
    .sort((a, b) => b.savedAt - a.savedAt)
  const done = REQUIRED_RHYTHMS.filter(r => data.rhythmsDone.has(r.id))
  const pct  = Math.round((done.length / TOTAL) * 100)
  const date = new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })

  const rhythmRows = REQUIRED_RHYTHMS.map(r => {
    const d = data.rhythmsDone.get(r.id)
    const color = d ? '#19c08a' : '#555'
    return `<tr>
      <td>${esc(r.label)}</td>
      <td style="text-align:center;color:${color};font-weight:bold">${d ? '✓' : '·'}</td>
      <td style="text-align:center;color:#8b949e">${d ? fmtDate(d) : '—'}</td>
    </tr>`
  }).join('')

  const sessionRows = studentSessions.map(s => `<tr>
    <td>${esc(fmtDate(s.savedAt))}</td>
    <td>${esc(s.scenarioName || s.finalRhythm || '—')}</td>
    <td style="text-align:center">${fmtDur(s.durationSec)}</td>
    <td style="text-align:center;color:${s.rosc ? '#19c08a' : '#8b949e'}">${s.rosc ? '✓ ROSC' : '—'}</td>
    <td style="color:#8b949e">${esc(s.notes || '—')}</td>
  </tr>`).join('')

  const barColor = pct === 100 ? '#19c08a' : pct >= 70 ? '#e3a008' : '#f85149'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>ACLS Competency — ${esc(name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, Arial, sans-serif; background: #0d1117; color: #e6edf3; padding: 32px 24px; max-width: 860px; margin: auto; }
  header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; border-bottom: 1px solid #30363d; padding-bottom: 20px; }
  h1 { font-size: 22px; color: #19c08a; margin-bottom: 4px; }
  .subtitle { color: #8b949e; font-size: 12px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid; }
  .badge-ok { background: #19c08a22; color: #19c08a; border-color: #19c08a55; }
  .badge-warn { background: #e3a00822; color: #e3a008; border-color: #e3a00855; }
  .badge-bad  { background: #f8514922; color: #f85149; border-color: #f8514955; }
  .progress-wrap { margin-top: 8px; background: #21262d; border-radius: 4px; height: 8px; width: 200px; }
  .progress-fill { height: 8px; border-radius: 4px; background: ${barColor}; width: ${pct}%; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #8b949e; margin: 28px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #161b22; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #8b949e; border-bottom: 1px solid #30363d; }
  tbody td { padding: 7px 12px; border-bottom: 1px solid #21262d; font-size: 13px; }
  tbody tr:hover td { background: #161b22; }
  .footer { margin-top: 32px; color: #555; font-size: 11px; border-top: 1px solid #21262d; padding-top: 12px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>${esc(name)}</h1>
    <div class="subtitle">ACLS Competency Report &nbsp;·&nbsp; Generated ${esc(date)}</div>
    <div style="margin-top:10px">
      <span class="badge ${pct===100?'badge-ok':pct>=70?'badge-warn':'badge-bad'}">${done.length} / ${TOTAL} rhythms</span>
    </div>
    <div class="progress-wrap"><div class="progress-fill"></div></div>
    <div style="color:#8b949e;font-size:12px;margin-top:4px">${pct}% complete &nbsp;·&nbsp; ${data.sessionCount} session${data.sessionCount!==1?'s':''}</div>
  </div>
</header>

<h2>Rhythm Competency Checklist</h2>
<table>
  <thead><tr><th>Rhythm</th><th style="text-align:center">Status</th><th style="text-align:center">Date Completed</th></tr></thead>
  <tbody>${rhythmRows}</tbody>
</table>

<h2>Session History</h2>
<table>
  <thead><tr><th>Date</th><th>Scenario / Rhythm</th><th style="text-align:center">Duration</th><th style="text-align:center">Outcome</th><th>Notes</th></tr></thead>
  <tbody>${sessionRows}</tbody>
</table>

<div class="footer">CM Simulator &nbsp;·&nbsp; ACLS Training Platform</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `ACLS_${name.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.html`,
  })
  a.click()
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentsPanel() {
  const [sessions, setSessions]         = useState(null)
  const [search, setSearch]             = useState('')
  const [sortBy, setSortBy]             = useState('completion')
  const [expanded, setExpanded]         = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  async function load() {
    try { setSessions(await loadSessions()) }
    catch { setSessions([]) }
  }

  useEffect(() => { load() }, [])

  const studentMap = useMemo(() => sessions ? buildStudentMap(sessions) : new Map(), [sessions])

  const students = useMemo(() => {
    let list = [...studentMap.entries()].map(([name, data]) => ({
      name, data,
      count: REQUIRED_RHYTHMS.filter(r => data.rhythmsDone.has(r.id)).length,
    }))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    return sortBy === 'name'
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [studentMap, search, sortBy])

  async function handleDelete(name, data) {
    setDeleting(true)
    try {
      // Delete any session where this student is the ONLY member — avoids
      // wiping sessions that also belong to other students.
      const solo = (sessions || []).filter(s => {
        const m = getMembers(s)
        return m.includes(name) && m.length === 1
      })
      for (const s of solo) await deleteSession(s.id)
      await load()
      setConfirmDelete(null)
      if (expanded === name) setExpanded(null)
    } finally { setDeleting(false) }
  }

  if (sessions === null) return <div className="text-[10px] text-ecg-gray py-2">Loading…</div>

  if (!students.length && !search) {
    return (
      <div className="text-[10px] text-ecg-gray text-center py-4 leading-relaxed">
        No sessions yet.<br />Sessions appear here after you power off and save.
      </div>
    )
  }

  const complete   = students.filter(s => s.count === TOTAL).length
  const inProgress = students.filter(s => s.count > 0 && s.count < TOTAL).length

  return (
    <div className="space-y-2">

      {/* Search + sort */}
      <div className="flex gap-1.5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student…"
          className="flex-1 bg-surface border border-ecg-border rounded px-2 py-1.5 text-[11px] text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green"
        />
        <button
          onClick={() => setSortBy(s => s === 'name' ? 'completion' : 'name')}
          className="px-2 py-1.5 text-[9px] font-bold font-mono uppercase tracking-widest border border-ecg-border text-ecg-gray rounded hover:border-ecg-gray transition-colors whitespace-nowrap"
        >
          {sortBy === 'name' ? 'A–Z' : '% Done'}
        </button>
      </div>

      {/* Summary row */}
      <div className="flex gap-3 text-[9px] font-mono">
        <span><span className="text-ecg-green font-bold">{complete}</span> <span className="text-ecg-gray">complete</span></span>
        <span><span className="text-ecg-amber font-bold">{inProgress}</span> <span className="text-ecg-gray">in progress</span></span>
        <span><span className="text-ecg-gray font-bold">{students.length - complete - inProgress}</span> <span className="text-ecg-gray">not started</span></span>
      </div>

      {!students.length && (
        <div className="text-[10px] text-ecg-gray text-center py-2">No students match.</div>
      )}

      {/* Student cards */}
      <div className="space-y-1">
        {students.map(({ name, data, count }) => {
          const pct = Math.round((count / TOTAL) * 100)
          const isOpen = expanded === name
          const isConfirm = confirmDelete === name

          return (
            <div key={name} className="border border-ecg-border rounded-lg overflow-hidden">

              {/* Header row */}
              <button
                onClick={() => setExpanded(e => e === name ? null : name)}
                className="w-full flex items-center gap-2 px-2.5 py-2 bg-surface2 hover:bg-surface transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-ink truncate">{name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-14 h-1 rounded-full bg-ecg-border overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${pct===100?'bg-ecg-green':pct>=70?'bg-ecg-amber':'bg-ecg-red/60'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-ecg-gray">{count}/{TOTAL}</span>
                    {count === TOTAL && <span className="text-[8px] text-ecg-green font-bold">✓ Complete</span>}
                  </div>
                </div>
                <span className="text-[9px] text-ecg-gray font-mono shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-2.5 py-2.5 border-t border-ecg-border bg-surface space-y-2.5">

                  {/* Rhythm chips */}
                  <div className="flex flex-wrap gap-1">
                    {REQUIRED_RHYTHMS.map(r => {
                      const date = data.rhythmsDone.get(r.id)
                      return (
                        <div
                          key={r.id}
                          title={date ? `${r.label} — ${fmtDate(date)}` : r.label}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold font-mono leading-none ${
                            date ? CAT_CHIP[r.cat] : 'text-ecg-border border-ecg-border/30'
                          }`}
                        >
                          {date ? '✓' : '·'} {r.short}
                        </div>
                      )
                    })}
                  </div>

                  <div className="text-[9px] text-ecg-gray font-mono">
                    {data.sessionCount} session{data.sessionCount !== 1 ? 's' : ''} &nbsp;·&nbsp; hover chips to see dates
                  </div>

                  {/* Actions */}
                  {isConfirm ? (
                    <div className="space-y-1.5">
                      <div className="text-[9px] text-ecg-amber leading-snug">
                        Delete solo sessions for <span className="font-bold text-ink">{name}</span>?<br/>
                        Sessions shared with other students are kept.
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(name, data)}
                          disabled={deleting}
                          className="flex-1 py-1.5 text-[9px] font-bold border border-ecg-red text-ecg-red rounded hover:bg-ecg-red hover:text-black transition-colors disabled:opacity-40"
                        >
                          {deleting ? '…' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-1.5 text-[9px] font-bold border border-ecg-border text-ecg-gray rounded hover:border-ecg-gray transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => exportStudentHTML(name, data, sessions)}
                        className="flex-1 py-1.5 text-[9px] font-bold border border-ecg-green/60 text-ecg-green rounded hover:bg-ecg-green/10 transition-colors"
                      >
                        ↓ Export Report
                      </button>
                      <button
                        onClick={() => setConfirmDelete(name)}
                        className="px-3 py-1.5 text-[9px] font-bold border border-ecg-red/40 text-ecg-red/50 rounded hover:border-ecg-red hover:text-ecg-red transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Export all */}
      {students.length > 1 && (
        <button
          onClick={() => students.forEach(({ name, data }) => exportStudentHTML(name, data, sessions))}
          className="w-full py-2 text-[10px] font-bold border border-ecg-border text-ecg-gray rounded-lg hover:border-ecg-gray hover:text-ink transition-colors"
        >
          ↓ Export All Students
        </button>
      )}
    </div>
  )
}
