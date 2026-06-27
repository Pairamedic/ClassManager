import { useSimulator } from '../context/SimulatorContext'

const MEDS = [
  { drug: 'Epinephrine',  dose: '1 mg IV/IO' },
  { drug: 'Amiodarone',   dose: '300 mg IV' },
  { drug: 'Amiodarone',   dose: '150 mg IV' },
  { drug: 'Adenosine',    dose: '6 mg IV' },
  { drug: 'Adenosine',    dose: '12 mg IV' },
  { drug: 'Atropine',     dose: '0.5 mg IV' },
  { drug: 'Lidocaine',    dose: '1 mg/kg IV' },
  { drug: 'Magnesium',    dose: '2g IV (Torsades)' },
  { drug: 'Sodium Bicarb',dose: '1 mEq/kg IV' },
  { drug: 'Dopamine',     dose: '2-20 mcg/kg/min' },
]

function elapsed(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s/60)}m${String(s%60).padStart(2,'0')}s`
}

export default function MedLogPanel() {
  const { state, dispatch } = useSimulator()

  return (
    <div className="flex shrink-0 border-t border-ecg-border bg-surface" style={{ height: '112px' }}>

      {/* Drug buttons */}
      <div className="flex flex-wrap gap-1 p-2 content-start overflow-y-auto" style={{ width: '60%' }}>
        {MEDS.map((m, i) => (
          <button
            key={i}
            onClick={() => dispatch({ type: 'LOG_MED', drug: m.drug, dose: m.dose })}
            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border border-ecg-border bg-surface2 text-ecg-gray hover:border-ecg-amber hover:text-ecg-amber active:scale-95 transition-all whitespace-nowrap"
          >
            {m.drug} {m.dose}
          </button>
        ))}
      </div>

      {/* Med timeline */}
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
