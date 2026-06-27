import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'
import { resumeAudio } from '../utils/audio'

export default function PacerPanel() {
  const { state, dispatch } = useSimulator()
  const { pacer, currentRhythm } = state
  const rhythm  = RHYTHMS[currentRhythm] || RHYTHMS.NSR
  const captured = pacer.active && pacer.output >= pacer.captureThreshold

  function step(field, action, delta) {
    resumeAudio()
    dispatch({ type: action, [field]: state.pacer[field] + delta })
  }

  function Stepper({ label, value, unit, onDown, onUp, highlight }) {
    return (
      <div className={`flex items-center justify-between gap-1 py-1 border rounded px-2 ${
        highlight ? 'border-ecg-green' : 'border-ecg-border'
      }`}>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest">{label}</span>
          <span className={`text-xl font-bold font-mono leading-none ${highlight ? 'text-ecg-green' : 'text-white'}`}>
            {value}<span className="text-[10px] text-ecg-gray ml-0.5">{unit}</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <button onClick={onUp}   className="w-7 h-6 bg-surface2 border border-ecg-border rounded text-white font-bold text-sm hover:border-ecg-green hover:text-ecg-green active:scale-95">▲</button>
          <button onClick={onDown} className="w-7 h-6 bg-surface2 border border-ecg-border rounded text-white font-bold text-sm hover:border-ecg-red hover:text-ecg-red active:scale-95">▼</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2 flex-1 bg-surface">
      <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest text-center">Transcutaneous Pacer</div>

      <Stepper
        label="Rate"
        value={pacer.rate}
        unit="ppm"
        onUp={() => step('rate', 'SET_PACER_RATE', 10)}
        onDown={() => step('rate', 'SET_PACER_RATE', -10)}
        highlight={pacer.active}
      />

      <Stepper
        label="Output"
        value={pacer.output}
        unit="mA"
        onUp={() => step('output', 'SET_PACER_OUTPUT', 10)}
        onDown={() => step('output', 'SET_PACER_OUTPUT', -10)}
        highlight={captured}
      />

      {/* Capture indicator */}
      {pacer.active && (
        <div className={`text-center text-xs font-bold tracking-widest py-1 rounded border ${
          captured
            ? 'text-ecg-green border-ecg-green bg-green-900/30'
            : 'text-ecg-red border-ecg-red bg-red-900/20 animate-pulse'
        }`}>
          {captured ? '✔ CAPTURE' : 'NO CAPTURE'}
        </div>
      )}

      {/* Capture threshold hint */}
      <div className="text-[9px] text-ecg-gray font-mono text-center">
        Threshold: {pacer.captureThreshold} mA
      </div>

      {/* PACE button */}
      <button
        onClick={() => { resumeAudio(); dispatch({ type: 'TOGGLE_PACER' }) }}
        className={`w-full py-2.5 rounded font-bold text-sm tracking-widest uppercase border-2 transition-all active:scale-95 ${
          pacer.active
            ? 'bg-ecg-green text-black border-ecg-green'
            : 'bg-surface2 text-ecg-green border-ecg-green hover:bg-ecg-green hover:text-black'
        }`}
      >
        {pacer.active ? '■ STOP PACING' : '▶ PACE'}
      </button>
    </div>
  )
}
