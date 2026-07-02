import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'
import { playMetronomeClick, playAlertBeep, resumeAudio } from '../utils/audio'
import { feedbackTap, feedbackBump } from '../utils/feedback'
import { getZone, DEFAULT_ZONE, BROSELOW_ZONES } from '../data/broselowTape'
import BroselowTapeModal from './BroselowTapeModal'

const CYCLE_SEC = 120          // AHA 2-minute CPR cycle
const METRONOME_BPM = 110      // target 100-120/min
const EPI_MIN = 3 * 60         // epinephrine q3-5 min window
const EPI_MAX = 5 * 60

function mmss(sec) {
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function CodeStatusBar() {
  const { state, dispatch } = useSimulator()
  const { cpr, metronomeOn, medications } = state
  const [now, setNow] = useState(Date.now())
  const alertedRef = useRef(false)
  const beatRef = useRef(0)

  // 1s tick for countdown displays
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const [beatFlash, setBeatFlash] = useState(false)

  // Metronome: fire clicks + visual flash while CPR is active
  useEffect(() => {
    if (!cpr.active || !metronomeOn) { setBeatFlash(false); return }
    beatRef.current = 0
    const interval = 60000 / METRONOME_BPM
    const id = setInterval(() => {
      playMetronomeClick(beatRef.current % 30 === 0)
      setBeatFlash(true)
      setTimeout(() => setBeatFlash(false), interval * 0.35)
      beatRef.current++
    }, interval)
    return () => clearInterval(id)
  }, [cpr.active, metronomeOn])

  // Cycle countdown + rhythm-check alert
  const cycleRemaining = cpr.active && cpr.cycleStart != null
    ? CYCLE_SEC - (now - cpr.cycleStart) / 1000
    : CYCLE_SEC

  useEffect(() => {
    if (cpr.active && cycleRemaining <= 0 && !alertedRef.current) {
      alertedRef.current = true
      playAlertBeep()
      setTimeout(playAlertBeep, 250)
    }
    if (cycleRemaining > 1) alertedRef.current = false
  }, [cpr.active, cycleRemaining])

  // ── Drug timing ──
  const lastEpi = medications.find(m => m.drug === 'Epinephrine')
  const epiSince = lastEpi ? (now - lastEpi.time) / 1000 : null
  const amioCount = medications.filter(m => m.drug === 'Amiodarone').length

  let epiState = 'none', epiText = 'Epi: not given'
  if (epiSince != null) {
    if (epiSince < EPI_MIN) { epiState = 'wait'; epiText = `Epi: next in ${mmss(EPI_MIN - epiSince)}` }
    else if (epiSince <= EPI_MAX) { epiState = 'due'; epiText = 'Epi: DUE NOW' }
    else { epiState = 'over'; epiText = `Epi: OVERDUE (${mmss(epiSince)})` }
  }

  const epiColor = {
    none: 'text-ecg-gray border-ecg-border',
    wait: 'text-ecg-blue border-ecg-blue/60',
    due: 'text-ecg-green border-ecg-green animate-pulse',
    over: 'text-ecg-red border-ecg-red animate-pulse',
  }[epiState]

  const isPals = state.mode === 'PALS'
  const amioDoseMg = isPals ? getZone(state.broselowZone || DEFAULT_ZONE).doses.amiodarone.mg : 300
  const amioText = amioCount === 0 ? `Amio: ${amioDoseMg} mg next`
    : amioCount === 1 && !isPals ? 'Amio: 150 mg next'
    : amioCount < 3 && isPals ? `Amio: ${amioDoseMg} mg next`
    : 'Amio: max given'

  // ── ETCO2 CPR-quality / ROSC cue (during arrest) ──
  const isArrest = RHYTHMS[state.currentRhythm]?.pulse === false
  const etco2 = state.vitals.etco2
  let etco2Cue = null
  if (isArrest && cpr.active) {
    if (etco2 < 10) etco2Cue = { text: 'ETCO₂ low — improve CPR', cls: 'text-ecg-red border-ecg-red' }
    else if (etco2 >= 35) etco2Cue = { text: 'ETCO₂ rising — check pulse', cls: 'text-ecg-green border-ecg-green' }
    else etco2Cue = { text: `ETCO₂ ${etco2}`, cls: 'text-ecg-gray border-ecg-border' }
  }

  const checkDue = cpr.active && cycleRemaining <= 0

  function start() { resumeAudio(); feedbackBump(); dispatch({ type: 'START_CPR' }) }
  function stop() { feedbackBump(); dispatch({ type: 'STOP_CPR' }) }
  function rhythmCheck() { resumeAudio(); feedbackTap(); dispatch({ type: 'CPR_RHYTHM_CHECK' }) }

  return (
    <div className="flex items-stretch gap-2 px-2 py-1.5 bg-surface border-t border-ecg-border shrink-0 overflow-x-auto"
         style={{ touchAction: 'manipulation' }}>

      {/* CPR control */}
      {!cpr.active ? (
        <button
          onClick={start}
          className="px-4 min-h-[44px] rounded font-bold text-xs tracking-widest uppercase border-2 border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black active:scale-95 transition-all whitespace-nowrap"
        >
          ▶ START CPR
        </button>
      ) : (
        <button
          onClick={stop}
          className="px-4 min-h-[44px] rounded font-bold text-xs tracking-widest uppercase border-2 border-ecg-red text-ecg-red bg-surface2 hover:bg-ecg-red hover:text-white active:scale-95 transition-all whitespace-nowrap"
        >
          ■ PAUSE CPR
        </button>
      )}

      {/* Visual beat flash */}
      {cpr.active && metronomeOn && (
        <div className={`flex items-center justify-center w-12 min-h-[44px] rounded border-2 font-bold text-lg transition-all duration-75 ${
          beatFlash
            ? 'border-ecg-green bg-ecg-green text-black scale-105'
            : 'border-ecg-green/40 bg-surface2 text-ecg-green/40'
        }`}>
          ↓
        </div>
      )}

      {/* Cycle timer */}
      <div className={`flex flex-col items-center justify-center px-3 rounded border min-w-[88px] ${
        checkDue ? 'border-ecg-red bg-red-900/20 animate-pulse' : 'border-ecg-border bg-surface2'
      }`}>
        <span className="text-[8px] text-ecg-gray font-mono uppercase tracking-widest leading-none">CPR cycle</span>
        <span className={`text-xl font-bold font-mono leading-tight ${checkDue ? 'text-ecg-red' : 'text-ink'}`}>
          {mmss(cycleRemaining)}
        </span>
        <span className="text-[8px] text-ecg-gray font-mono leading-none">cycle {cpr.cycleCount}</span>
      </div>

      {/* Rhythm check button */}
      <button
        onClick={rhythmCheck}
        disabled={!cpr.active}
        className={`px-3 min-h-[44px] rounded font-bold text-[11px] tracking-widest uppercase border-2 transition-all active:scale-95 whitespace-nowrap ${
          checkDue
            ? 'border-ecg-amber text-black bg-ecg-amber'
            : cpr.active
              ? 'border-ecg-amber text-ecg-amber bg-surface2 hover:bg-ecg-amber hover:text-black'
              : 'border-ecg-border text-ecg-border bg-surface2 cursor-not-allowed'
        }`}
      >
        ✔ RHYTHM<br/>CHECK
      </button>

      {/* Metronome toggle */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_METRONOME' })}
        className={`px-3 min-h-[44px] rounded font-bold text-[10px] tracking-widest uppercase border transition-colors whitespace-nowrap ${
          metronomeOn
            ? 'border-ecg-green text-ecg-green bg-surface2'
            : 'border-ecg-border text-ecg-gray bg-surface2'
        }`}
      >
        ♪ {METRONOME_BPM}<br/>{metronomeOn ? 'ON' : 'OFF'}
      </button>

      {/* Broselow zone selector (PALS only) — fills the open space on the bar */}
      {isPals && <ZoneStepper />}

      <div className="flex-1 min-w-2" />

      {/* Drug timing reminders */}
      <div className="flex items-center gap-2">
        <div className={`flex flex-col items-center justify-center px-3 min-h-[44px] rounded border font-mono ${epiColor}`}>
          <span className="text-[8px] uppercase tracking-widest leading-none opacity-70">Epinephrine</span>
          <span className="text-[11px] font-bold leading-tight">{epiText.replace('Epi: ', '')}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-3 min-h-[44px] rounded border border-ecg-border text-ecg-gray bg-surface2 font-mono">
          <span className="text-[8px] uppercase tracking-widest leading-none opacity-70">Amiodarone</span>
          <span className="text-[11px] font-bold leading-tight">{amioText.replace('Amio: ', '')}</span>
        </div>
        {etco2Cue && (
          <div className={`flex items-center justify-center px-3 min-h-[44px] rounded border font-mono text-[11px] font-bold text-center leading-tight ${etco2Cue.cls}`}>
            {etco2Cue.text}
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Broselow zone control shown on the CPR bar in PALS mode. Steppers move
// through adjacent zones for quick adjustment; tapping the pill opens the full
// Broselow tape. Each zone shows its age band and weight.
function ZoneStepper() {
  const { state, dispatch } = useSimulator()
  const [showModal, setShowModal] = useState(false)

  const key = state.broselowZone || DEFAULT_ZONE
  const idx = Math.max(0, BROSELOW_ZONES.findIndex(z => z.key === key))
  const zone = getZone(key)

  function step(delta) {
    const next = BROSELOW_ZONES[Math.min(BROSELOW_ZONES.length - 1, Math.max(0, idx + delta))]
    if (next && next.key !== zone.key) {
      feedbackTap()
      dispatch({ type: 'SET_BROSELOW_ZONE', zone: next.key, applyDefaults: true })
    }
  }

  return (
    <>
      <div className="flex items-stretch gap-1 shrink-0">
        <button
          onClick={() => step(-1)}
          disabled={idx === 0}
          title="Smaller / younger zone"
          className="px-2 min-h-[44px] rounded border border-ecg-border text-ecg-gray bg-surface2 font-bold hover:text-ink hover:border-ecg-gray disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
        >◀</button>

        <button
          onClick={() => setShowModal(true)}
          title="Broselow zone — tap for the full tape"
          className="flex items-center gap-2 px-3 min-h-[44px] rounded border-2 border-ecg-border bg-surface2 hover:border-ecg-gray active:scale-95 transition-all"
          style={{ backgroundColor: `${zone.hex}18` }}
        >
          <span className="w-3 h-3 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: zone.hex }} />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-bold text-ink">{zone.label}</span>
            <span className="text-[8px] text-ecg-gray font-mono whitespace-nowrap">{zone.ageLabel} · {zone.weightKg}kg</span>
          </span>
        </button>

        <button
          onClick={() => step(1)}
          disabled={idx === BROSELOW_ZONES.length - 1}
          title="Larger / older zone"
          className="px-2 min-h-[44px] rounded border border-ecg-border text-ecg-gray bg-surface2 font-bold hover:text-ink hover:border-ecg-gray disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
        >▶</button>
      </div>

      {showModal && <BroselowTapeModal onClose={() => setShowModal(false)} />}
    </>
  )
}
