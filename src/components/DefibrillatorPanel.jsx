import { useEffect, useRef } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'
import { playChargeSound, playShockSound, playAlertBeep, resumeAudio } from '../utils/audio'

const ENERGY_OPTIONS = [50, 100, 150, 200, 360]

export default function DefibrillatorPanel() {
  const { state, dispatch } = useSimulator()
  const { defib, currentRhythm, pacer } = state
  const rhythm = RHYTHMS[currentRhythm] || RHYTHMS.NSR
  const chargeTimerRef = useRef(null)

  // Clean up charge timer on unmount
  useEffect(() => () => clearTimeout(chargeTimerRef.current), [])

  function handlePads() {
    resumeAudio()
    dispatch({ type: 'TOGGLE_PADS' })
  }

  function handleCharge() {
    if (!defib.padsConnected || defib.charging || defib.charged) return
    resumeAudio()
    dispatch({ type: 'START_CHARGING' })
    playChargeSound()
    chargeTimerRef.current = setTimeout(() => {
      dispatch({ type: 'CHARGE_COMPLETE' })
      playAlertBeep()
    }, 1600)
  }

  function handleShock() {
    if (!defib.charged || !defib.padsConnected) return
    resumeAudio()
    playShockSound()
    dispatch({ type: 'DELIVER_SHOCK' })

    if (rhythm.shockable) {
      // Brief VF artifact → asystole → NSR
      dispatch({ type: 'SET_RHYTHM', rhythm: 'VFIB' })
      setTimeout(() => dispatch({ type: 'SET_RHYTHM', rhythm: 'ASYSTOLE' }), 400)
      setTimeout(() => dispatch({ type: 'SET_RHYTHM', rhythm: 'NSR' }), 3200)
    } else if (defib.syncMode && ['SVT','AFIB','AFLUTTER','VTACH','WPW'].includes(currentRhythm)) {
      // Synchronized cardioversion
      setTimeout(() => dispatch({ type: 'SET_RHYTHM', rhythm: 'NSR' }), 500)
    }
  }

  const canCharge  = defib.padsConnected && !defib.charging && !defib.charged
  const canShock   = defib.charged && defib.padsConnected

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-ecg-border bg-surface">
      <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest text-center">Defibrillator</div>

      {/* PADS */}
      <button
        onClick={handlePads}
        className={`w-full py-2 rounded font-bold text-xs tracking-widest uppercase border transition-colors
          ${defib.padsConnected
            ? 'bg-ecg-green text-black border-ecg-green'
            : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-green hover:text-ecg-green'}`}
      >
        {defib.padsConnected ? '✔ PADS ON' : 'CONNECT PADS'}
      </button>

      {/* SYNC */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SYNC' })}
        className={`w-full py-1.5 rounded font-bold text-xs tracking-widest uppercase border transition-colors
          ${defib.syncMode
            ? 'bg-ecg-amber text-black border-ecg-amber'
            : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-amber hover:text-ecg-amber'}`}
      >
        SYNC {defib.syncMode ? 'ON' : 'OFF'}
      </button>

      {/* ENERGY */}
      <div className="grid grid-cols-5 gap-0.5">
        {ENERGY_OPTIONS.map(j => (
          <button
            key={j}
            onClick={() => dispatch({ type: 'SET_ENERGY', energy: j })}
            className={`py-1 rounded text-[10px] font-bold border transition-colors
              ${defib.energy === j
                ? 'bg-ecg-blue text-black border-ecg-blue'
                : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-blue'}`}
          >
            {j}
          </button>
        ))}
      </div>
      <div className="text-center text-[10px] text-ecg-gray font-mono">{defib.energy}J</div>

      {/* CHARGE */}
      <button
        onClick={handleCharge}
        disabled={!canCharge}
        className={`w-full py-2.5 rounded font-bold text-sm tracking-widest uppercase border transition-all
          ${defib.charged
            ? 'bg-ecg-amber text-black border-ecg-amber animate-pulse'
            : defib.charging
              ? 'bg-surface2 text-ecg-amber border-ecg-amber cursor-wait'
              : canCharge
                ? 'bg-surface2 text-ecg-amber border-ecg-amber hover:bg-ecg-amber hover:text-black'
                : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'}`}
      >
        {defib.charged ? '⚡ CHARGED' : defib.charging ? 'CHARGING…' : 'CHARGE'}
      </button>

      {/* SHOCK */}
      <button
        onClick={handleShock}
        disabled={!canShock}
        className={`w-full py-3 rounded font-bold text-base tracking-widest uppercase border-2 transition-all
          ${canShock
            ? 'bg-ecg-red text-white border-ecg-red hover:brightness-110 active:scale-95'
            : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'}`}
      >
        SHOCK
      </button>
    </div>
  )
}
