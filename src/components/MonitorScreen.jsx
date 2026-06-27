import { useSimulator } from '../context/SimulatorContext'
import ECGWaveform from './ECGWaveform'
import VitalsDisplay from './VitalsDisplay'
import { RHYTHMS } from '../data/rhythms'

export default function MonitorScreen() {
  const { state } = useSimulator()
  const rhythm = RHYTHMS[state.currentRhythm] || RHYTHMS.NSR

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
            <span className="text-xs font-bold text-ecg-red animate-pulse">NO PULSE</span>
          )}
          {rhythm.shockable && (
            <span className="text-xs font-bold text-ecg-red">SHOCKABLE</span>
          )}
        </div>
      </div>

      {/* ECG Canvas */}
      <ECGWaveform />

      {/* Vitals row */}
      <VitalsDisplay />

    </div>
  )
}
