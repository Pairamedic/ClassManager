import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import {
  ELECTRODES, ELECTRODE_BY_COLOR, LIMB_POSITIONS, LIMB_MNEMONIC,
  PRECORDIAL_SLOTS, PRECORDIAL_LEADS, PRECORDIAL_MNEMONIC,
  limbLeadsConnected, limbLeadFault, limbLeadsPlacedCount,
  precordialConnected, precordialFault, precordialPlacedCount,
} from '../data/leads'
import { feedbackTap, feedbackSuccess, feedbackFault } from '../utils/feedback'

// Torso outline shared by both boards. Limb slots sit at the extremities; chest
// slots cluster over the left chest.
function Torso({ children }) {
  return (
    <div className="relative mx-auto w-60 h-64 rounded-2xl border border-ecg-border bg-surface2/60">
      <div className="absolute left-1/2 top-3 -translate-x-1/2 w-14 h-14 rounded-full border-2 border-ecg-border/70" />
      <div className="absolute left-1/2 top-[62px] -translate-x-1/2 w-24 h-36 rounded-2xl border-2 border-ecg-border/70" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[9px] text-ecg-gray font-mono uppercase tracking-widest">Facing patient</span>
      {children}
    </div>
  )
}

// One placement board (limb or chest). `palette` items carry { color, label, hex }
// where `color` is the value stored on the slot; a slot is correct when its
// stored value equals its `correct`.
function Board({ positions, palette, kind, selected, setSelected }) {
  const { state, dispatch } = useSimulator()
  const leads = state.leads
  const selPos = positions.find(p => p.key === selected) || positions[0]

  function place(value) {
    feedbackTap()
    dispatch({ type: 'PLACE_ELECTRODE', position: selected, color: value })
    const next = positions.find(p => p.key !== selected && !leads[p.key])
    if (next && leads[selected] == null) setSelected(next.key)
  }

  return (
    <>
      <Torso>
        {positions.map(p => {
          const val = leads[p.key]
          const isSel = selected === p.key
          const correct = val === p.correct
          const ring = isSel
            ? 'border-ecg-blue ring-2 ring-ecg-blue/40'
            : val ? (correct ? 'border-ecg-green' : 'border-ecg-red') : 'border-ecg-border'
          const swatch = val ? (ELECTRODE_BY_COLOR[val]?.hex || palette.find(e => e.color === val)?.hex) : null
          return (
            <button
              key={p.key}
              onClick={() => { feedbackTap(); setSelected(p.key) }}
              style={{ top: p.pos.top, left: p.pos.left }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 rounded-lg border-2 bg-surface transition-all active:scale-95 ${ring} ${kind === 'limb' ? 'w-16 px-1 py-1.5' : 'w-9 h-9 justify-center'}`}
            >
              <span
                className="rounded-full border border-black/30 shrink-0 flex items-center justify-center text-[8px] font-bold text-black"
                style={{
                  width: kind === 'limb' ? 24 : 20,
                  height: kind === 'limb' ? 24 : 20,
                  backgroundColor: swatch || 'transparent',
                  borderStyle: val ? 'solid' : 'dashed',
                }}
              >
                {kind === 'chest' && val ? val : ''}
              </span>
              {kind === 'limb' && (
                <>
                  <span className="text-[9px] font-bold text-ink leading-none">{p.key}</span>
                  <span className="text-[8px] text-ecg-gray leading-none">{p.label}</span>
                </>
              )}
            </button>
          )
        })}
      </Torso>

      <div>
        <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest mb-1.5 text-center">
          {kind === 'limb' ? 'Electrodes' : 'Chest leads'} — placing on{' '}
          <span className="text-ecg-blue font-bold">{kind === 'limb' ? selPos.label : selPos.site}</span>
        </div>
        <div className={`grid gap-2 ${kind === 'limb' ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {palette.map(e => (
            <button
              key={e.color}
              onClick={() => place(e.color)}
              className="flex flex-col items-center gap-1 rounded-lg border-2 border-ecg-border bg-surface2 px-1 py-2 hover:border-ecg-blue active:scale-95 transition-all"
            >
              <span
                className="rounded-full border border-black/30 flex items-center justify-center text-[9px] font-bold text-black"
                style={{ width: 22, height: 22, backgroundColor: e.hex }}
              >
                {kind === 'chest' ? e.label : ''}
              </span>
              {kind === 'limb' && <span className="text-[9px] font-bold text-ink">{e.label}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function LeadsModal({ onClose, initialTab = 'limb' }) {
  const { state, dispatch } = useSimulator()
  const leads = state.leads
  const [tab, setTab] = useState(initialTab)
  const [selLimb, setSelLimb] = useState('RA')
  const [selChest, setSelChest] = useState('P1')
  const [showHint, setShowHint] = useState(false)

  const limbOk = limbLeadsConnected(leads)
  const limbBad = limbLeadFault(leads)
  const preOk = precordialConnected(leads)
  const preBad = precordialFault(leads)

  // Fire outcome haptics on the rising edge of each board's connected/fault
  // state, independent of which tab is showing.
  const prev = useRef({ limbOk, limbBad, preOk, preBad })
  useEffect(() => {
    const q = prev.current
    if ((limbOk && !q.limbOk) || (preOk && !q.preOk)) feedbackSuccess()
    else if ((limbBad && !q.limbBad) || (preBad && !q.preBad)) feedbackFault()
    prev.current = { limbOk, limbBad, preOk, preBad }
  }, [limbOk, limbBad, preOk, preBad])

  function reset() {
    feedbackTap()
    dispatch({ type: 'RESET_LEADS' })
    setSelLimb('RA'); setSelChest('P1')
  }

  const isLimb = tab === 'limb'
  const placed = isLimb ? limbLeadsPlacedCount(leads) : precordialPlacedCount(leads)
  const total = isLimb ? 4 : 6
  const ok = isLimb ? limbOk : preOk
  const bad = isLimb ? limbBad : preBad

  const status = ok
    ? { text: isLimb ? '✔ Limb leads connected' : '✔ Chest leads connected', cls: 'text-ecg-green border-ecg-green bg-ecg-green/10' }
    : bad
      ? { text: '⚠ Lead fault — electrode(s) in the wrong spot', cls: 'text-ecg-red border-ecg-red bg-ecg-red/10' }
      : { text: `Place all ${isLimb ? 'four limb electrodes' : 'six chest leads'} (${placed}/${total})`, cls: 'text-ecg-gray border-ecg-border bg-surface2' }

  const Tab = ({ id, label, done }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 min-h-[36px] rounded-lg border-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
        tab === id ? 'border-ecg-blue text-ecg-blue bg-ecg-blue/10' : 'border-ecg-border text-ecg-gray hover:text-ink'
      }`}
    >
      {done ? '✔ ' : ''}{label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">ECG Leads</h2>
            <p className="text-[11px] text-ecg-gray mt-0.5">Tap a spot, then tap the electrode that belongs there.</p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <div className="flex gap-2 px-4 pt-3 shrink-0">
          <Tab id="limb" label="Limb (4)" done={limbOk} />
          <Tab id="chest" label="Chest V1–V6" done={preOk} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLimb ? (
            <Board positions={LIMB_POSITIONS} palette={ELECTRODES} kind="limb" selected={selLimb} setSelected={setSelLimb} />
          ) : (
            <Board positions={PRECORDIAL_SLOTS} palette={PRECORDIAL_LEADS} kind="chest" selected={selChest} setSelected={setSelChest} />
          )}

          <div className={`text-center text-[11px] font-bold py-2 rounded border ${status.cls}`}>
            {status.text}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setShowHint(h => !h)} className="text-[10px] font-bold text-ecg-gray hover:text-ink transition-colors">
              {showHint ? 'Hide hint' : 'Show placement hint'}
            </button>
            <button onClick={reset} className="text-[10px] font-bold text-ecg-gray hover:text-ecg-red transition-colors">
              Reset all electrodes
            </button>
          </div>
          {showHint && (
            <p className="text-[10px] text-ecg-amber font-mono leading-relaxed border-t border-ecg-border pt-2">
              {isLimb ? LIMB_MNEMONIC : PRECORDIAL_MNEMONIC}
            </p>
          )}

          {isLimb && limbOk && !preOk && (
            <button
              onClick={() => setTab('chest')}
              className="w-full min-h-[44px] rounded-lg font-bold text-sm uppercase tracking-widest border-2 border-ecg-blue text-ecg-blue bg-surface2 hover:bg-ecg-blue hover:text-black active:scale-95 transition-all"
            >
              Next — Chest leads →
            </button>
          )}
          {ok && (
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
