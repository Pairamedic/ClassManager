import { useState } from 'react'
import { ALGORITHMS } from '../data/algorithms'

const ACCENT = {
  red: 'text-ecg-red border-ecg-red',
  blue: 'text-ecg-blue border-ecg-blue',
  amber: 'text-ecg-amber border-ecg-amber',
  green: 'text-ecg-green border-ecg-green',
}

export default function AlgorithmModal({ onClose }) {
  const [active, setActive] = useState(ALGORITHMS[0].id)
  const algo = ALGORITHMS.find(a => a.id === active)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh]">
        {/* Header + tabs */}
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">ACLS Algorithms</h2>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 shrink-0">
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              className={`grow basis-[28%] min-h-[40px] px-2 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition-colors ${
                active === a.id
                  ? `bg-surface2 ${ACCENT[a.accent]}`
                  : 'border-ecg-border text-ecg-gray hover:text-ink'
              }`}
            >
              {a.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {algo.sections.map((sec, i) => (
            <div key={i}>
              <div className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${ACCENT[algo.accent].split(' ')[0]}`}>
                {sec.heading}
              </div>
              <ol className="space-y-1">
                {sec.steps.map((step, j) => (
                  <li key={j} className="flex gap-2 text-[13px] text-ink/90 leading-snug">
                    <span className="text-ecg-gray font-mono shrink-0">{j + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="text-[10px] text-ecg-gray pt-2 border-t border-ecg-border">
            Teaching reference, AHA 2020 guidelines. Follow your program’s current protocols.
          </p>
        </div>
      </div>
    </div>
  )
}
