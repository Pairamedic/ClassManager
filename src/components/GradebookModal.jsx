import { useState, useEffect, useMemo } from 'react'
import { loadSessions } from '../utils/sessionStore'

// The 14 AHA ACLS required rhythms, grouped by category
const REQUIRED_RHYTHMS = [
  { id: 'NSR',          label: 'NSR',          short: 'NSR',       cat: 'normal'  },
  { id: 'SINUS_BRADY',  label: 'Sinus Brady',  short: 'SB',        cat: 'brady'   },
  { id: 'FIRST_DEGREE', label: '1° AV Block',  short: '1°',        cat: 'brady'   },
  { id: 'WENCKEBACH',   label: 'Wenckebach',   short: 'W',         cat: 'brady'   },
  { id: 'MOBITZ2',      label: 'Mobitz II',    short: 'M2',        cat: 'brady'   },
  { id: 'THIRD_DEGREE', label: '3° AV Block',  short: '3°',        cat: 'brady'   },
  { id: 'SVT',          label: 'SVT',          short: 'SVT',       cat: 'tachy'   },
  { id: 'AFIB',         label: 'A-Fib',        short: 'AF',        cat: 'tachy'   },
  { id: 'AFLUTTER',     label: 'A-Flutter',    short: 'AFL',       cat: 'tachy'   },
  { id: 'VTACH',        label: 'VTach',        short: 'VT',        cat: 'tachy'   },
  { id: 'VFIB',         label: 'V-Fib',        short: 'VF',        cat: 'shock'   },
  { id: 'TORSADES',     label: 'Torsades',     short: 'TdP',       cat: 'shock'   },
  { id: 'ASYSTOLE',     label: 'Asystole',     short: 'Asy',       cat: 'noshock' },
  { id: 'PEA',          label: 'PEA',          short: 'PEA',       cat: 'noshock' },
]

const CAT_COLOR = {
  normal:  { header: 'bg-ecg-green/20 text-ecg-green',   cell: 'bg-ecg-green/20 text-ecg-green',   dot: 'bg-ecg-green'   },
  brady:   { header: 'bg-ecg-blue/20 text-ecg-blue',     cell: 'bg-ecg-blue/20 text-ecg-blue',     dot: 'bg-ecg-blue'    },
  tachy:   { header: 'bg-ecg-amber/20 text-ecg-amber',   cell: 'bg-ecg-amber/20 text-ecg-amber',   dot: 'bg-ecg-amber'   },
  shock:   { header: 'bg-ecg-red/20 text-ecg-red',       cell: 'bg-ecg-red/20 text-ecg-red',       dot: 'bg-ecg-red'     },
  noshock: { header: 'bg-ecg-amber/20 text-ecg-amber',   cell: 'bg-ecg-amber/20 text-ecg-amber',   dot: 'bg-ecg-amber'   },
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })
}

function getMembers(session) {
  return session.teamMembers?.filter(Boolean).length
    ? session.teamMembers.filter(Boolean)
    : session.studentName ? [session.studentName] : []
}

// Build student → { rhythmId → latestSavedAt } map
function buildMatrix(sessions) {
  const map = new Map()
  for (const s of sessions) {
    const members = getMembers(s)
    const rhythmsSeen = new Set()
    if (Array.isArray(s.rhythmHistory)) {
      for (const { rhythm } of s.rhythmHistory) if (rhythm) rhythmsSeen.add(rhythm)
    }
    if (s.finalRhythm) rhythmsSeen.add(s.finalRhythm)

    for (const member of members) {
      if (!map.has(member)) map.set(member, new Map())
      const sm = map.get(member)
      for (const rhythmId of rhythmsSeen) {
        if (!sm.has(rhythmId) || s.savedAt > sm.get(rhythmId)) {
          sm.set(rhythmId, s.savedAt)
        }
      }
    }
  }
  return map
}

export default function GradebookModal({ onClose }) {
  const [sessions, setSessions] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('completion') // 'name' | 'completion'

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  const matrix = useMemo(() => sessions ? buildMatrix(sessions) : new Map(), [sessions])

  const students = useMemo(() => {
    let list = [...matrix.entries()].map(([name, done]) => ({
      name,
      done,
      count: REQUIRED_RHYTHMS.filter(r => done.has(r.id)).length,
    }))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    return list
  }, [matrix, search, sort])

  const total = REQUIRED_RHYTHMS.length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-monitor-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-ecg-border shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Competency Gradebook</h2>
          <span className="text-[10px] text-ecg-gray font-mono">AHA ACLS · 14 Required Rhythms</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student…"
            className="bg-surface2 border border-ecg-border rounded-lg px-3 py-1.5 text-[12px] text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green w-40"
          />
          <button
            onClick={() => setSort(s => s === 'name' ? 'completion' : 'name')}
            className="px-2.5 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border border-ecg-border text-ecg-gray bg-surface2 rounded-lg hover:border-ecg-gray transition-colors whitespace-nowrap"
          >
            Sort: {sort === 'name' ? 'Name' : '% Done'}
          </button>
          <button
            onClick={onClose}
            className="text-ecg-gray hover:text-ink text-2xl leading-none px-2"
          >×</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-surface2 border-b border-ecg-border shrink-0 overflow-x-auto">
        {[
          { cat: 'normal', label: 'Normal' },
          { cat: 'brady',  label: 'Bradycardia' },
          { cat: 'tachy',  label: 'Tachycardia' },
          { cat: 'shock',  label: 'Shockable Arrest' },
          { cat: 'noshock',label: 'Non-Shockable Arrest' },
        ].map(({ cat, label }) => (
          <div key={cat} className="flex items-center gap-1.5 shrink-0">
            <div className={`w-2.5 h-2.5 rounded-sm ${CAT_COLOR[cat].dot}`} />
            <span className="text-[10px] text-ecg-gray font-mono">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-[10px] text-ecg-gray font-mono shrink-0">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {sessions === null ? (
          <div className="flex items-center justify-center h-full text-ecg-gray text-sm font-mono">Loading…</div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="text-4xl opacity-20">📋</div>
            <p className="text-ecg-gray text-sm">
              {search ? 'No students match that name.' : 'No sessions saved yet. Run sessions to track competency.'}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px] font-mono">
            <thead className="sticky top-0 z-10">
              {/* Category grouping row */}
              <tr>
                <th className="sticky left-0 z-20 bg-surface border-b border-r border-ecg-border px-3 py-2 text-left" rowSpan={2}>
                  <span className="text-[10px] text-ecg-green uppercase tracking-widest">Student</span>
                </th>
                {Object.entries(
                  REQUIRED_RHYTHMS.reduce((acc, r) => {
                    ;(acc[r.cat] ||= []).push(r)
                    return acc
                  }, {})
                ).map(([cat, rhythms]) => (
                  <th
                    key={cat}
                    colSpan={rhythms.length}
                    className={`border-b border-ecg-border px-1 py-1 text-center text-[9px] uppercase tracking-widest font-bold ${CAT_COLOR[cat].header}`}
                  >
                    {cat === 'normal' ? 'Normal' : cat === 'brady' ? 'Brady' : cat === 'tachy' ? 'Tachy' : cat === 'shock' ? 'Shockable' : 'Non-Shock'}
                  </th>
                ))}
                <th className="border-b border-l border-ecg-border px-3 py-2 text-center bg-surface">
                  <span className="text-[10px] text-ecg-gray uppercase tracking-widest">Done</span>
                </th>
              </tr>
              {/* Rhythm column headers */}
              <tr>
                {REQUIRED_RHYTHMS.map(r => (
                  <th
                    key={r.id}
                    title={r.label}
                    className={`border-b border-ecg-border px-1 py-1.5 text-center text-[9px] font-bold tracking-wide ${CAT_COLOR[r.cat].header}`}
                  >
                    {r.short}
                  </th>
                ))}
                <th className="border-b border-l border-ecg-border bg-surface" />
              </tr>
            </thead>

            <tbody>
              {students.map((student, si) => {
                const pct = Math.round((student.count / total) * 100)
                return (
                  <tr
                    key={student.name}
                    className={`border-b border-ecg-border/40 hover:bg-surface2/40 transition-colors ${si % 2 === 0 ? '' : 'bg-surface2/20'}`}
                  >
                    {/* Student name (sticky) */}
                    <td className="sticky left-0 z-10 bg-surface border-r border-ecg-border px-3 py-2 whitespace-nowrap">
                      <div className="font-bold text-ink text-[12px]">{student.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 rounded-full bg-ecg-border overflow-hidden" style={{ width: 56 }}>
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-ecg-green' : pct >= 70 ? 'bg-ecg-amber' : 'bg-ecg-red/60'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-ecg-gray">{pct}%</span>
                      </div>
                    </td>

                    {/* Rhythm cells */}
                    {REQUIRED_RHYTHMS.map(r => {
                      const date = student.done.get(r.id)
                      const done = date != null
                      return (
                        <td
                          key={r.id}
                          title={done ? `${r.label} — ${fmtDate(date)}` : r.label}
                          className="px-1 py-2 text-center"
                        >
                          {done ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-base leading-none ${CAT_COLOR[r.cat].cell.split(' ')[1]}`}>✓</span>
                              <span className="text-[8px] text-ecg-gray leading-none">{fmtDate(date)}</span>
                            </div>
                          ) : (
                            <span className="text-ecg-border text-base leading-none">·</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Completion count */}
                    <td className="border-l border-ecg-border px-3 py-2 text-center whitespace-nowrap">
                      <span className={`font-bold text-[13px] ${student.count === total ? 'text-ecg-green' : 'text-ink'}`}>
                        {student.count}
                      </span>
                      <span className="text-ecg-gray text-[10px]">/{total}</span>
                      {student.count === total && (
                        <div className="text-[8px] text-ecg-green uppercase tracking-widest">Complete</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer summary */}
      {students.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-2 bg-surface border-t border-ecg-border shrink-0 text-[10px] font-mono text-ecg-gray">
          <span>
            <span className="text-ecg-green font-bold">{students.filter(s => s.count === total).length}</span> fully complete
          </span>
          <span>
            <span className="text-ink font-bold">{students.filter(s => s.count > 0 && s.count < total).length}</span> in progress
          </span>
          <span>
            <span className="text-ecg-gray font-bold">{students.filter(s => s.count === 0).length}</span> not started
          </span>
          <span className="ml-auto text-ecg-gray/50">
            Rhythm credited when it appears in a session's rhythm history
          </span>
        </div>
      )}
    </div>
  )
}
