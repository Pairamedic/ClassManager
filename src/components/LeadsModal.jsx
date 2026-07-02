import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import {
  ELECTRODES, ELECTRODE_BY_COLOR, LIMB_POSITIONS, LIMB_MNEMONIC,
  limbLeadsConnected, limbLeadFault, limbLeadsPlacedCount,
} from '../data/leads'
import { feedbackTap, feedbackSuccess, feedbackFault } from '../utils/feedback'

// Place each colored electrode on the correct limb. Tap a limb slot to select
// it, then tap an electrode; correct placement locks green, a full-but-wrong set
// reads LEAD FAULT. Correct all four to connect the monitor.
export default function LeadsModal({ onClose }) {
  const { state, dispatch } = useSimulator()
  const leads = state.leads
  const [selected, setSelected] = useState('RA')
  const [showHint, setShowHint] = useState(false)

  const connected = limbLeadsConnected(leads)
  const fault = limbLeadFault(leads)
  const placed = limbLeadsPlacedCount(leads)

  // Outcome haptics fire on the transition into connected / fault, not on repaint.
  const prev = useRef({ connected, fault })
  useEffect(() => {
    if (connected && !prev.current.connected) feedbackSuccess()
    else if (fault && !prev.current.fault) feedbackFault()
    prev.current = { connected, fault }
  }, [connected, fault])

  function place(color) {
    feedbackTap()
    dispatch({ type: 'PLACE_ELECTRODE', position: selected, color })
    // Advance to the next still-empty slot for quick sequential placement.
    const next = LIMB_POSITIONS.find(p => p.key !== selected && !leads[p.key])
    if (next && leads[selected] == null) setSelected(next.key)
  }

  function reset() {
    feedbackTap()
    dispatch({ type: 'RESET_LEADS' })
    setSelected('RA')
  }

  const status = connected
    ? { text: '✔ Limb leads connected', cls: 'text-ecg-green border-ecg-green bg-ecg-green/10' }
    : fault
      ? { text: '⚠ Lead fault — electrode(s) on the wrong limb', cls: 'text-ecg-red border-ecg-red bg-ecg-red/10' }
      : { text: `Place all four limb electrodes (${placed}/4)`, cls: 'text-ecg-gray border-ecg-border bg-surface2' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">ECG Limb Leads</h2>
            <p className="text-[11px] text-ecg-gray mt-0.5">Tap a limb, then tap the electrode that belongs there.</p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Patient torso with four limb slots */}
          <div className="relative mx-auto w-56 h-64 rounded-2xl border border-ecg-border bg-surface2/60">
            {/* simple body outline */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-ecg-border/70" />
            <div className="absolute left-1/2 top-[72px] -translate-x-1/2 w-20 h-32 rounded-2xl border-2 border-ecg-border/70" />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[9px] text-ecg-gray font-mono uppercase tracking-widest">Facing patient</span>

            {LIMB_POSITIONS.map(p => {
              const color = leads[p.key]
              const el = color ? ELECTRODE_BY_COLOR[color] : null
              const isSel = selected === p.key
              const correct = color === p.correct
              const ring = isSel
                ? 'border-ecg-blue ring-2 ring-ecg-blue/40'
                : color
                  ? (correct ? 'border-ecg-green' : 'border-ecg-red')
                  : 'border-ecg-border'
              return (
                <button
                  key={p.key}
                  onClick={() => { feedbackTap(); setSelected(p.key) }}
                  style={{ top: p.pos.top, left: p.pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 w-16 rounded-lg border-2 bg-surface px-1 py-1.5 transition-all active:scale-95 ${ring}`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/30 shrink-0"
                    style={{ backgroundColor: el ? el.hex : 'transparent', borderStyle: el ? 'solid' : 'dashed' }}
                  />
                  <span className="text-[9px] font-bold text-ink leading-none">{p.key}</span>
                  <span className="text-[8px] text-ecg-gray leading-none">{p.label}</span>
                </button>
              )
            })}
          </div>

          {/* Electrode palette */}
          <div>
            <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest mb-1.5 text-center">
              Electrodes — placing on <span className="text-ecg-blue font-bold">{LIMB_POSITIONS.find(p => p.key === selected)?.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ELECTRODES.map(e => (
                <button
                  key={e.color}
                  onClick={() => place(e.color)}
                  className="flex flex-col items-center gap-1 rounded-lg border-2 border-ecg-border bg-surface2 px-1 py-2 hover:border-ecg-blue active:scale-95 transition-all"
                >
                  <span className="w-6 h-6 rounded-full border border-black/30" style={{ backgroundColor: e.hex }} />
                  <span className="text-[9px] font-bold text-ink">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className={`text-center text-[11px] font-bold py-2 rounded border ${status.cls}`}>
            {status.text}
          </div>

          {/* Hint / reset */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowHint(h => !h)}
              className="text-[10px] font-bold text-ecg-gray hover:text-ink transition-colors"
            >
              {showHint ? 'Hide hint' : 'Show placement hint'}
            </button>
            <button
              onClick={reset}
              className="text-[10px] font-bold text-ecg-gray hover:text-ecg-red transition-colors"
            >
              Reset electrodes
            </button>
          </div>
          {showHint && (
            <p className="text-[10px] text-ecg-amber font-mono leading-relaxed border-t border-ecg-border pt-2">
              {LIMB_MNEMONIC}
            </p>
          )}

          {connected && (
            <button
              onClick={onClose}
              className="w-full min-h-[44px] rounded-lg font-bold text-sm uppercase tracking-widest border-2 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black active:scale-95 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
