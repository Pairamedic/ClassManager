import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import ECGWaveform from './ECGWaveform'
import EtCO2Waveform from './EtCO2Waveform'
import VitalsDisplay from './VitalsDisplay'
import TwelveLeadModal from './TwelveLeadModal'
import BroselowTapeModal from './BroselowTapeModal'
import { RHYTHMS } from '../data/rhythms'
import { getZone, DEFAULT_ZONE } from '../data/broselowTape'

export default function MonitorScreen() {
  const { state } = useSimulator()
  const rhythm = RHYTHMS[state.currentRhythm] || RHYTHMS.NSR
  const [show12Lead, setShow12Lead] = useState(false)
  const [showBroselow, setShowBroselow] = useState(false)
  const isPals = state.mode === 'PALS'
  const zone = isPals ? getZone(state.broselowZone || DEFAULT_ZONE) : null

  const categoryColors = {
    normal:  'text-ecg-green',
    brady:   'text-ecg-blue',
    tachy:   'text-ecg-amber',
    shock:   'text-ecg-red',
    noshock: 'text-ecg-amber',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-ecg-bg">

      {/* Rhythm label bar */}
      <div className="flex items-center justify-between px-3 pt-1 shrink-0">
        <span className="text-xs text-ecg-gray font-mono uppercase tracking-widest">LEAD II</span>
        {!state.labelHidden && (
          <span className={`text-xs font-bold font-mono uppercase tracking-widest ${categoryColors[rhythm.category] || 'text-white'}`}>
            {rhythm.label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {!rhythm.pulse && (
            <span className="text-xs font-bold text-ecg-red">NO PULSE</span>
          )}
          {rhythm.shockable && (
            <span className="text-xs font-bold text-ecg-red">SHOCKABLE</span>
          )}
          {isPals && (
            <button
              onClick={() => setShowBroselow(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold font-mono px-2.5 py-1 rounded border border-ecg-border text-ecg-gray hover:text-ink hover:border-ecg-gray transition-colors uppercase tracking-widest"
            >
              <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: zone.hex }} />
              {zone.label} · {zone.weightKg}kg
            </button>
          )}
          <button
            onClick={() => setShow12Lead(true)}
            className="text-[10px] font-bold font-mono px-2.5 py-1 rounded border border-ecg-border text-ecg-gray hover:text-ecg-green hover:border-ecg-green transition-colors uppercase tracking-widest"
          >
            12-LEAD
          </button>
        </div>
      </div>

      {/* ROSC / post-arrest banner */}
      {state.rosc && (
        <div className="mx-3 mt-1 px-3 py-1.5 rounded border border-ecg-green bg-ecg-green/10 shrink-0">
          <span className="text-[11px] font-bold text-ecg-green uppercase tracking-widest">✔ ROSC</span>
          <span className="text-[10px] text-ecg-gray ml-2">
            Begin post-arrest care — 12-lead, SpO₂ 92–98%, avoid hypotension, targeted temp.
          </span>
        </div>
      )}

      {/* ECG Canvas */}
      <ECGWaveform />

      {/* EtCO2 Canvas */}
      <EtCO2Waveform />

      {/* Vitals row */}
      <VitalsDisplay />

      {show12Lead && <TwelveLeadModal onClose={() => setShow12Lead(false)} />}
      {showBroselow && <BroselowTapeModal onClose={() => setShowBroselow(false)} />}
    </div>
  )
}
