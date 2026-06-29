import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'

function map(sbp, dbp) {
  return Math.round(dbp + (sbp - dbp) / 3)
}

function VitalTile({ label, children, color = 'text-ecg-green', hidden, className = '' }) {
  return (
    <div className={`flex flex-col justify-between p-2 border-r border-ecg-border last:border-r-0 min-w-0 ${className}`}>
      <span className="text-[9px] font-mono uppercase tracking-widest text-ecg-gray leading-none">{label}</span>
      <div className={`font-bold font-mono leading-none ${color}`}>
        {hidden ? (
          <span className="text-ecg-gray text-2xl">--</span>
        ) : children}
      </div>
    </div>
  )
}

export default function VitalsDisplay() {
  const { state } = useSimulator()
  const { vitals: v, vitalsHidden: h, currentRhythm } = state
  const rhythm = RHYTHMS[currentRhythm] || RHYTHMS.NSR

  const displayHR = rhythm.pulse ? (v.hr || rhythm.rate) : 0
  const hrColor = displayHR === 0 ? 'text-ecg-red' : displayHR > 100 ? 'text-ecg-amber' : displayHR < 60 ? 'text-ecg-blue' : 'text-ecg-green'
  const spo2Color = v.spo2 < 90 ? 'text-ecg-red' : v.spo2 < 94 ? 'text-ecg-amber' : 'text-ecg-blue'
  const bpColor = v.sbp === 0 ? 'text-ecg-red' : v.sbp < 90 ? 'text-ecg-amber' : 'text-ecg-green'

  return (
    <div className="flex shrink-0 bg-surface border-t border-ecg-border" style={{ minHeight: 72 }}>

      {/* HR */}
      <VitalTile label="HR" color={hrColor} hidden={h} className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl">{displayHR}</span>
          <span className="text-[11px] text-ecg-gray font-mono">bpm</span>
        </div>
      </VitalTile>

      {/* NIBP */}
      <VitalTile label="NIBP" color={bpColor} hidden={h} className="flex-[1.4]">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl">{v.sbp}</span>
          <span className="text-xl text-ecg-gray">/</span>
          <span className="text-2xl">{v.dbp}</span>
          <span className="text-[10px] text-ecg-gray font-mono ml-1">
            ({map(v.sbp, v.dbp)})
          </span>
        </div>
        <span className="text-[9px] text-ecg-gray font-mono">mmHg</span>
      </VitalTile>

      {/* SpO2 */}
      <VitalTile label="SpO₂" color={spo2Color} hidden={h} className="flex-1">
        <div className="flex items-baseline gap-0.5">
          <span className="text-4xl">{v.spo2}</span>
          <span className="text-base">%</span>
        </div>
      </VitalTile>

      {/* EtCO2 */}
      <VitalTile label="EtCO₂" color="text-ecg-amber" hidden={h} className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl">{v.etco2}</span>
          <span className="text-[11px] text-ecg-gray font-mono">mmHg</span>
        </div>
      </VitalTile>

      {/* Temp */}
      <VitalTile label="Temp" color="text-ecg-gray" hidden={h} className="flex-1">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl">{v.temp.toFixed(1)}</span>
          <span className="text-base">°F</span>
        </div>
      </VitalTile>

    </div>
  )
}
