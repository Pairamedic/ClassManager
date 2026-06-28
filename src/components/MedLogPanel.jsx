import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'

const MEDS = [
  { drug: 'Epinephrine',   dose: '1 mg IV/IO' },
  { drug: 'Amiodarone',    dose: '300 mg IV' },
  { drug: 'Amiodarone',    dose: '150 mg IV' },
  { drug: 'Adenosine',     dose: '6 mg IV' },
  { drug: 'Adenosine',     dose: '12 mg IV' },
  { drug: 'Atropine',      dose: '1 mg IV' },
  { drug: 'Lidocaine',     dose: '1 mg/kg IV' },
  { drug: 'Magnesium',     dose: '2g IV (Torsades)' },
  { drug: 'Sodium Bicarb', dose: '1 mEq/kg IV' },
  { drug: 'Dopamine',      dose: '2-20 mcg/kg/min' },
]

function elapsed(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

export default function MedLogPanel() {
  const { state, dispatch } = useSimulator()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const selected = MEDS[selectedIdx]

  function giveMed() {
    dispatch({ type: 'LOG_MED', drug: selected.drug, dose: selected.dose })
  }

  return (
    <div className="flex shrink-0 border-t border-ecg-border bg-surface" style={{ minHeight: '88px', maxHeight: '120px' }}>

      {/* ── Left: med picker ── */}
      <div className="flex flex-col justify-center gap-2 p-2 shrink-0" style={{ width: '52%' }}>
        <select
          value={selectedIdx}
          onChange={e => setSelectedIdx(Number(e.target.value))}
          className="w-full rounded-lg border border-ecg-border bg-surface2 text-ink text-xs font-mono px-2 py-2 focus:outline-none focus:border-ecg-amber appearance-none cursor-pointer"
          style={{ minHeight: '36px' }}
        >
          {MEDS.map((m, i) => (
            <option key={i} value={i}>
              {m.drug} — {m.dose}
            </option>
          ))}
        </select>

        <button
          onClick={giveMed}
          className="w-full rounded-lg border-2 border-ecg-amber bg-ecg-amber/10 text-ecg-amber font-bold text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-ecg-amber/20"
          style={{ minHeight: '36px' }}
        >
          Give {selected.drug}
        </button>
      </div>

      {/* ── Right: med log ── */}
      <div className="flex-1 border-l border-ecg-border overflow-y-auto p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest">Med Log</span>
          {state.medications.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'CLEAR_MEDS' })}
              className="text-[9px] text-ecg-gray hover:text-ecg-red transition-colors"
            >
              CLEAR
            </button>
          )}
        </div>
        {state.medications.length === 0 ? (
          <div className="text-[10px] text-ecg-border font-mono">No medications logged</div>
        ) : (
          state.medications.map((m, i) => (
            <div key={i} className="flex justify-between text-[10px] font-mono py-0.5 border-b border-ecg-border/40 last:border-b-0">
              <span className="text-ecg-amber font-bold">{m.drug}</span>
              <span className="text-ecg-gray mx-2">{m.dose}</span>
              <span className="text-ecg-gray">{elapsed(m.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
