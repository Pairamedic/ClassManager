import { useSimulator } from '../context/SimulatorContext'
import { BROSELOW_ZONES, getZone, DEFAULT_ZONE } from '../data/broselowTape'

export default function BroselowTapeModal({ onClose }) {
  const { state, dispatch } = useSimulator()
  const activeKey = state.broselowZone || DEFAULT_ZONE
  const zone = getZone(activeKey)

  function selectZone(key) {
    dispatch({ type: 'SET_BROSELOW_ZONE', zone: key, applyDefaults: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh]">
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Broselow Tape</h2>
            <p className="text-[11px] text-ecg-gray mt-0.5">Select the length/color zone to set weight-based vitals and drug doses.</p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Zone selector */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {BROSELOW_ZONES.map(z => {
              const active = z.key === activeKey
              return (
                <button
                  key={z.key}
                  onClick={() => selectZone(z.key)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-1.5 py-2 transition-all active:scale-95 ${
                    active ? 'border-ink' : 'border-ecg-border hover:border-ecg-gray'
                  }`}
                  style={{ backgroundColor: `${z.hex}22` }}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/20"
                    style={{ backgroundColor: z.hex }}
                  />
                  <span className="text-[10px] font-bold text-ink">{z.label}</span>
                  <span className="text-[9px] text-ink/70 font-mono leading-tight text-center">{z.ageLabel}</span>
                  <span className="text-[9px] text-ecg-gray font-mono">{z.weightRangeKg[0]}–{z.weightRangeKg[1]} kg</span>
                </button>
              )
            })}
          </div>

          {/* Selected zone detail */}
          <div className="rounded-xl border border-ecg-border bg-surface2 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: zone.hex }} />
              <span className="text-sm font-bold text-ink">{zone.label} Zone</span>
              <span className="text-[11px] text-ecg-gray font-mono">
                {zone.ageLabel} · {zone.weightRangeKg[0]}–{zone.weightRangeKg[1]} kg · {zone.lengthCm[0]}–{zone.lengthCm[1]} cm
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Est. Weight" value={`${zone.weightKg} kg`} />
              <Stat label="ETT Size" value={`${zone.ettSize} mm`} />
              <Stat label="ETT Depth" value={`${zone.ettDepthCm} cm`} />
              <Stat label="Defib (1st)" value={`${zone.defibJoules.initial} J`} />
              <Stat label="Defib (2nd+)" value={`${zone.defibJoules.subsequent} J`} />
            </div>

            <div>
              <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1.5">Drug Doses</div>
              <div className="space-y-1">
                <DoseRow label="Epinephrine" value={`${zone.doses.epinephrine.mg} mg`} note={zone.doses.epinephrine.text} />
                <DoseRow label="Amiodarone" value={`${zone.doses.amiodarone.mg} mg`} note={zone.doses.amiodarone.text} />
                <DoseRow label="Atropine" value={`${zone.doses.atropine.mg} mg`} note={zone.doses.atropine.text} />
                <DoseRow label="Adenosine (1st)" value={`${zone.doses.adenosineFirst.mg} mg`} note={zone.doses.adenosineFirst.text} />
                <DoseRow label="Adenosine (2nd)" value={`${zone.doses.adenosineSecond.mg} mg`} note={zone.doses.adenosineSecond.text} />
                <DoseRow label="Lidocaine" value={`${zone.doses.lidocaine.mg} mg`} note={zone.doses.lidocaine.text} />
                <DoseRow label="Magnesium" value={`${zone.doses.magnesium.mg} mg`} note={zone.doses.magnesium.text} />
                <DoseRow label="Sodium Bicarb" value={`${zone.doses.sodiumBicarb.mEq} mEq`} note={zone.doses.sodiumBicarb.text} />
              </div>
            </div>

            <p className="text-[10px] text-ecg-gray pt-2 border-t border-ecg-border">
              Teaching approximation for simulation use — not calibrated for clinical dosing decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface border border-ecg-border rounded-lg p-2.5 text-center">
      <div className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-bold font-mono text-ink">{value}</div>
    </div>
  )
}

function DoseRow({ label, value, note }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px] font-mono py-1 border-b border-ecg-border/40 last:border-b-0">
      <span className="text-ink font-bold shrink-0">{label}</span>
      <span className="text-ecg-gray text-right">
        <span className="text-ecg-amber font-bold">{value}</span> — {note}
      </span>
    </div>
  )
}
