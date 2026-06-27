// Derive AHA code-quality metrics from the unified event log.
// All times are seconds from the start of the code (or first event).

export function computeMetrics(state, endTime = Date.now()) {
  const log = state.eventLog || []
  const start = state.codeStartTime ?? log[0]?.time ?? null

  const firstOf = (pred) => {
    const e = log.find(pred)
    return e && start != null ? Math.round((e.time - start) / 1000) : null
  }

  const timeToCompression = firstOf(e => e.type === 'cpr' && e.label === 'CPR started')
  const timeToShock = firstOf(e => e.type === 'shock')
  const timeToEpi = firstOf(e => e.type === 'med' && e.label === 'Epinephrine')

  // CPR fraction: sum active intervals between "CPR started" and the next pause/stop.
  let activeMs = 0
  let activeFrom = null
  for (const e of log) {
    if (e.type === 'cpr' && e.label === 'CPR started') {
      activeFrom = e.time
    } else if (activeFrom != null && (
      (e.type === 'cpr' && e.label === 'CPR paused') ||
      (e.type === 'code' && e.label === 'Code stopped') ||
      e.type === 'rosc'
    )) {
      activeMs += e.time - activeFrom
      activeFrom = null
    }
  }
  if (activeFrom != null) activeMs += endTime - activeFrom // still running at save

  const codeMs = start != null ? Math.max(1, endTime - start) : 0
  const cprFractionPct = codeMs ? Math.min(100, Math.round((activeMs / codeMs) * 100)) : null

  const interruptions = log.filter(e => e.type === 'cpr' && e.label === 'CPR paused').length

  return { timeToCompression, timeToShock, timeToEpi, cprFractionPct, interruptions }
}

export function fmtSec(sec) {
  if (sec == null) return '—'
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
