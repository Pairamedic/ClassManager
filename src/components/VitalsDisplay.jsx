import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'

function VitalBox({ label, value, unit, color = 'text-ecg-green', hidden }) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-1 border-r border-ecg-border last:border-r-0">
      <span className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold font-mono ${color} leading-none`}>
        {hidden ? '--' : value}
      </span>
      <span className="text-[10px] text-ecg-gray font-mono">{unit}</span>
    </div>
  )
}

export default function VitalsDisplay() {
  const { state } = useSimulator()
  const { vitals: v, vitalsHidden: h, currentRhythm } = state
  const rhythm = RHYTHMS[currentRhythm] || RHYTHMS.NSR

  // Show HR from rhythm rate or vitals override
  const displayHR = rhythm.pulse ? (v.hr || rhythm.rate) : 0

  return (
    <div className="flex shrink-0 bg-surface border-t border-ecg-border">
      <VitalBox
        label="HR"
        value={displayHR}
        unit="bpm"
        color={displayHR > 100 ? 'text-ecg-amber' : displayHR < 60 ? 'text-ecg-blue' : 'text-ecg-green'}
        hidden={h}
      />
      <VitalBox
        label="BP"
        value={h ? '--' : `${v.sbp}/${v.dbp}`}
        unit="mmHg"
        color="text-ecg-green"
        hidden={false}
      />
      <VitalBox label="SpO2"  value={`${v.spo2}%`}  unit="%"   color={v.spo2 < 94 ? 'text-ecg-red' : 'text-ecg-green'} hidden={h} />
      <VitalBox label="EtCO2" value={v.etco2}        unit="mmHg" color="text-ecg-amber" hidden={h} />
      <VitalBox label="TEMP"  value={`${v.temp}°F`}  unit="°F"  color="text-ecg-gray"  hidden={h} />
    </div>
  )
}
