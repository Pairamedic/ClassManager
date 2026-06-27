import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'
import { resumeAudio } from '../utils/audio'

export default function PacerPanel() {
  const { state, dispatch } = useSimulator()
  const { pacer, currentRhythm, defib } = state
  const rhythm  = RHYTHMS[currentRhythm] || RHYTHMS.NSR
  const captured = pacer.active && pacer.output >= pacer.captureThreshold
  const canPace  = defib.padsConnected || pacer.active  // PAM: pads required before pacing unlocks

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
          <span className={`text-xl font-bold font-mono leading-none ${highlight ? 'text-ecg-green' : 'text-ink'}`}>
            {value}<span className="text-[10px] text-ecg-gray ml-0.5">{unit}</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <button onClick={onUp}   className="w-7 h-6 bg-surface2 border border-ecg-border rounded text-ink font-bold text-sm hover:border-ecg-green hover:text-ecg-green active:scale-95">▲</button>
          <button onClick={onDown} className="w-7 h-6 bg-surface2 border border-ecg-border rounded text-ink font-bold text-sm hover:border-ecg-red hover:text-ecg-red active:scale-95">▼</button>
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
            ? 'text-ecg-green border-ecg-green bg-ecg-green/10'
            : 'text-ecg-red border-ecg-red bg-ecg-red/10'
        }`}>
          {captured ? '✔ CAPTURE' : 'NO CAPTURE'}
        </div>
      )}

      {/* Capture threshold hint */}
      <div className="text-[9px] text-ecg-gray font-mono text-center">
        Threshold: {pacer.captureThreshold} mA
      </div>

      {/* PACE button — requires pads connected (PAM Requirement 2) */}
      <button
        onClick={() => { if (canPace) { resumeAudio(); dispatch({ type: 'TOGGLE_PACER' }) } }}
        disabled={!canPace}
        className={`w-full min-h-[44px] rounded font-bold text-sm tracking-widest uppercase border-2 transition-all active:scale-95 ${
          pacer.active
            ? 'bg-ecg-green text-black border-ecg-green'
            : canPace
              ? 'bg-surface2 text-ecg-green border-ecg-green hover:bg-ecg-green hover:text-black'
              : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'
        }`}
      >
        {pacer.active ? '■ STOP PACING' : '▶ PACE'}
      </button>
      {!canPace && (
        <div className="text-[9px] text-ecg-amber font-mono text-center">Connect pads to pace</div>
      )}
    </div>
  )
}
