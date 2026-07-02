import { useSimulator } from '../context/SimulatorContext'
import { STEMI_TERRITORY_LIST } from '../data/leadProfiles'
import { feedbackTap } from '../utils/feedback'

// Toggle the STEMI injury territory shown on the 12-lead. Used in both the
// 12-lead modal and the instructor panel.
export default function StemiTerritoryToggle({ compact = false }) {
  const { state, dispatch } = useSimulator()
  const active = state.stemiTerritory || 'none'

  function select(key) {
    feedbackTap()
    dispatch({ type: 'SET_STEMI_TERRITORY', territory: key })
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {STEMI_TERRITORY_LIST.map(t => {
        const on = active === t.key
        return (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            title={t.leads}
            className={`flex flex-col items-start rounded border px-1.5 py-1 text-left transition-colors active:scale-95 ${
              on
                ? 'border-ecg-red text-ecg-red bg-ecg-red/10'
                : 'border-ecg-border text-ecg-gray bg-surface2 hover:border-ecg-gray hover:text-ink'
            }`}
          >
            <span className="text-[10px] font-bold leading-tight">{t.label}</span>
            {!compact && <span className="text-[8px] font-mono opacity-80 leading-tight">{t.leads}</span>}
          </button>
        )
      })}
    </div>
  )
}
