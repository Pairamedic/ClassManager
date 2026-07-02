import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import ECGWaveform from './ECGWaveform'
import EtCO2Waveform from './EtCO2Waveform'
import VitalsDisplay from './VitalsDisplay'
import TwelveLeadModal from './TwelveLeadModal'
import BroselowTapeModal from './BroselowTapeModal'
import { RHYTHMS } from '../data/rhythms'
import { getZone, DEFAULT_ZONE } from '../data/broselowTape'
import { limbLeadsConnected } from '../data/leads'

export default function MonitorScreen() {
  const { state } = useSimulator()
  const rhythm = RHYTHMS[state.currentRhythm] || RHYTHMS.NSR
  const [show12Lead, setShow12Lead] = useState(false)
  const [showBroselow, setShowBroselow] = useState(false)
  const isPals = state.mode === 'PALS'
  const zone = isPals ? getZone(state.broselowZone || DEFAULT_ZONE) : null

  // The ECG trace needs a signal source: limb leads OR defib pads (a "paddles"
  // view). Without either, the monitor shows LEAD FAULT. A full 12-lead needs
  // the limb leads specifically.
  const limbOn = limbLeadsConnected(state.leads)
  const hasTrace = limbOn || state.defib.padsConnected

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
        {!hasTrace ? (
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-ecg-red animate-pulse">
            Lead Fault
          </span>
        ) : !state.labelHidden && (
          <span className={`text-xs font-bold font-mono uppercase tracking-widest ${categoryColors[rhythm.category] || 'text-white'}`}>
            {rhythm.label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {hasTrace && !rhythm.pulse && (
            <span className="text-xs font-bold text-ecg-red">NO PULSE</span>
          )}
          {hasTrace && rhythm.shockable && (
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
            onClick={() => limbOn && setShow12Lead(true)}
            disabled={!limbOn}
            title={limbOn ? '' : 'Connect limb leads first'}
            className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded border uppercase tracking-widest transition-colors ${
              limbOn
                ? 'border-ecg-border text-ecg-gray hover:text-ecg-green hover:border-ecg-green'
                : 'border-ecg-border/50 text-ecg-border cursor-not-allowed'
            }`}
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

      {/* ECG Canvas — or a LEAD FAULT placeholder when no signal source */}
      {hasTrace ? <ECGWaveform /> : <LeadFault />}

      {/* EtCO2 Canvas */}
      <EtCO2Waveform />

      {/* Vitals row */}
      <VitalsDisplay />

      {show12Lead && <TwelveLeadModal onClose={() => setShow12Lead(false)} />}
      {showBroselow && <BroselowTapeModal onClose={() => setShowBroselow(false)} />}
    </div>
  )
}

// Shown in the ECG slot when neither limb leads nor pads provide a signal.
function LeadFault() {
  return (
    <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col items-center justify-center" style={{ background: '#050810' }}>
      {/* flat "lead off" baseline with a small wandering step */}
      <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
        <polyline points="0,52 30,52 33,48 36,52 70,52 73,55 76,52 100,52"
          fill="none" stroke="#ef4444" strokeWidth="0.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative z-10 text-center px-4">
        <div className="text-ecg-red font-bold font-mono uppercase tracking-widest text-sm animate-pulse">Lead Fault</div>
        <div className="text-ecg-gray font-mono text-[11px] mt-1">Connect limb leads (or defib pads) to view the ECG</div>
      </div>
    </div>
  )
}
