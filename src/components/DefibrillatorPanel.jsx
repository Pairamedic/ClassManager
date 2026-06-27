import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'
import { playChargeSound, playShockSound, playAlertBeep, resumeAudio } from '../utils/audio'

const ENERGY_OPTIONS = [50, 100, 150, 200, 360]

export default function DefibrillatorPanel() {
  const { state, dispatch } = useSimulator()
  const { defib, currentRhythm } = state
  const rhythm = RHYTHMS[currentRhythm] || RHYTHMS.NSR
  const chargeTimerRef = useRef(null)

  const [aedMode, setAedMode] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [aedAnalysis, setAedAnalysis] = useState(null) // null | 'analyzing' | 'shock' | 'noshock'

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

  // Actual energy delivery — only reached after a CLEAR confirmation.
  function deliverShock() {
    resumeAudio()
    playShockSound()
    dispatch({ type: 'DELIVER_SHOCK' })
    setConfirmClear(false)
    setAedAnalysis(null)

    if (rhythm.shockable) {
      // Brief VF artifact → asystole → ROSC (silent transitions)
      dispatch({ type: 'SET_RHYTHM', rhythm: 'VFIB', silent: true })
      setTimeout(() => dispatch({ type: 'SET_RHYTHM', rhythm: 'ASYSTOLE', silent: true }), 400)
      setTimeout(() => dispatch({ type: 'DECLARE_ROSC' }), 3200)
    } else if (defib.syncMode && ['SVT','AFIB','AFLUTTER','VTACH','WPW'].includes(currentRhythm)) {
      // Synchronized cardioversion of a perfusing tachyarrhythmia
      setTimeout(() => dispatch({ type: 'SET_RHYTHM', rhythm: 'NSR' }), 500)
    }
  }

  function handleAnalyze() {
    if (!defib.padsConnected) return
    resumeAudio()
    setAedAnalysis('analyzing')
    if (!defib.charged && !defib.charging) {
      dispatch({ type: 'SET_ENERGY', energy: 200 })
    }
    setTimeout(() => {
      if (rhythm.shockable) {
        setAedAnalysis('shock')
        dispatch({ type: 'START_CHARGING' })
        playChargeSound()
        chargeTimerRef.current = setTimeout(() => {
          dispatch({ type: 'CHARGE_COMPLETE' })
          playAlertBeep()
        }, 1600)
      } else {
        setAedAnalysis('noshock')
      }
    }, 1800)
  }

  const canCharge = defib.padsConnected && !defib.charging && !defib.charged
  const canShock = defib.charged && defib.padsConnected

  function toggleMode() {
    setAedMode(m => !m)
    setConfirmClear(false)
    setAedAnalysis(null)
    if (defib.charged || defib.charging) dispatch({ type: 'CLEAR_CHARGED' })
  }

  return (
    <div className="flex flex-col gap-2 p-2 border-b border-ecg-border bg-surface">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest">
          {aedMode ? 'AED' : 'Defibrillator'}
        </span>
        <button
          onClick={toggleMode}
          className="text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-ecg-border text-ecg-gray hover:text-ink hover:border-ecg-gray transition-colors uppercase tracking-widest"
        >
          {aedMode ? 'Manual' : 'AED'}
        </button>
      </div>

      {/* PADS */}
      <button
        onClick={handlePads}
        className={`w-full min-h-[44px] rounded font-bold text-xs tracking-widest uppercase border transition-colors
          ${defib.padsConnected
            ? 'bg-ecg-green text-black border-ecg-green'
            : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-green hover:text-ecg-green'}`}
      >
        {defib.padsConnected ? '✔ PADS ON' : 'CONNECT PADS'}
      </button>

      {aedMode ? (
        /* ─── AED MODE ─── */
        <>
          <button
            onClick={handleAnalyze}
            disabled={!defib.padsConnected || aedAnalysis === 'analyzing'}
            className={`w-full min-h-[44px] rounded font-bold text-xs tracking-widest uppercase border transition-colors ${
              defib.padsConnected
                ? 'bg-surface2 text-ecg-blue border-ecg-blue hover:bg-ecg-blue hover:text-black'
                : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'
            }`}
          >
            {aedAnalysis === 'analyzing' ? 'ANALYZING…' : 'ANALYZE'}
          </button>

          {aedAnalysis === 'noshock' && (
            <div className="text-center text-xs font-bold py-2 rounded border border-ecg-green text-ecg-green">
              NO SHOCK ADVISED<br/>
              <span className="text-[9px] font-normal text-ecg-gray">Resume CPR</span>
            </div>
          )}
          {aedAnalysis === 'shock' && (
            <div className="text-center text-xs font-bold py-1.5 rounded border border-ecg-red text-ecg-red">
              SHOCK ADVISED
            </div>
          )}
        </>
      ) : (
        /* ─── MANUAL MODE ─── */
        <>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SYNC' })}
            className={`w-full min-h-[40px] rounded font-bold text-xs tracking-widest uppercase border transition-colors
              ${defib.syncMode
                ? 'bg-ecg-amber text-black border-ecg-amber'
                : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-amber hover:text-ecg-amber'}`}
          >
            SYNC {defib.syncMode ? 'ON' : 'OFF'}
          </button>

          <div className="grid grid-cols-5 gap-0.5">
            {ENERGY_OPTIONS.map(j => (
              <button
                key={j}
                onClick={() => dispatch({ type: 'SET_ENERGY', energy: j })}
                className={`py-2 rounded text-[10px] font-bold border transition-colors
                  ${defib.energy === j
                    ? 'bg-ecg-blue text-black border-ecg-blue'
                    : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-blue'}`}
              >
                {j}
              </button>
            ))}
          </div>
          <div className="text-center text-[10px] text-ecg-gray font-mono">{defib.energy}J</div>

          <button
            onClick={handleCharge}
            disabled={!canCharge}
            className={`w-full min-h-[44px] rounded font-bold text-sm tracking-widest uppercase border transition-all
              ${defib.charged
                ? 'bg-ecg-amber text-black border-ecg-amber'
                : defib.charging
                  ? 'bg-surface2 text-ecg-amber border-ecg-amber cursor-wait'
                  : canCharge
                    ? 'bg-surface2 text-ecg-amber border-ecg-amber hover:bg-ecg-amber hover:text-black'
                    : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'}`}
          >
            {defib.charged ? '⚡ CHARGED' : defib.charging ? 'CHARGING…' : 'CHARGE'}
          </button>
        </>
      )}

      {/* SHOCK with CLEAR confirmation (shared by both modes) */}
      {confirmClear ? (
        <div className="flex flex-col gap-1.5 p-2 rounded border-2 border-ecg-amber bg-ecg-amber/10">
          <div className="text-center text-[11px] font-bold text-ecg-amber uppercase tracking-wide leading-tight">
            ⚠ Clear — everyone clear?<br/>
            <span className="text-[9px] font-normal text-ecg-gray">"I'm clear, you're clear, oxygen clear"</span>
          </div>
          <button
            onClick={deliverShock}
            className="w-full min-h-[48px] rounded font-bold text-base tracking-widest uppercase border-2 bg-ecg-red text-white border-ecg-red hover:brightness-110 active:scale-95 transition-all"
          >
            CLEAR — SHOCK
          </button>
          <button
            onClick={() => setConfirmClear(false)}
            className="w-full min-h-[36px] rounded text-[10px] font-bold uppercase tracking-widest border border-ecg-border text-ecg-gray hover:text-ink"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => canShock && setConfirmClear(true)}
          disabled={!canShock}
          className={`w-full min-h-[52px] rounded font-bold text-base tracking-widest uppercase border-2 transition-all
            ${canShock
              ? 'bg-ecg-red text-white border-ecg-red hover:brightness-110 active:scale-95'
              : 'bg-surface2 text-ecg-border border-ecg-border cursor-not-allowed'}`}
        >
          SHOCK
        </button>
      )}
    </div>
  )
}
