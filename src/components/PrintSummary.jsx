import { useSimulator } from '../context/SimulatorContext'

function fmt(ms, base) {
  const s = Math.floor((ms - base) / 1000)
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function PrintSummary({ onClose }) {
  const { state } = useSimulator()
  const now = Date.now()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative z-10 bg-white text-gray-900 rounded-lg p-6 shadow-2xl overflow-y-auto"
        style={{ width: 680, maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <div>
            <h1 className="text-lg font-bold">ACLS Code Summary</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(now).toLocaleString()}
              {state.codeStartTime
                ? ` — Code duration: ${fmt(now, state.codeStartTime)}`
                : ' — Code not timed'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Scenario</h2>
            <p className="text-sm">{state.scenarioName || '—'}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Final Rhythm</h2>
            <p className="text-sm">{state.currentRhythm}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Shocks Delivered</h2>
            <p className="text-sm font-bold">{state.defib.shocksDelivered}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Vitals at Close</h2>
            <p className="text-xs">
              HR {state.vitals.hr} · BP {state.vitals.sbp}/{state.vitals.dbp} ·
              SpO₂ {state.vitals.spo2}% · EtCO₂ {state.vitals.etco2}
            </p>
          </div>
        </div>

        {state.rhythmHistory?.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 border-b pb-1">Rhythm History</h2>
            <table className="w-full text-xs">
              <tbody>
                {state.rhythmHistory.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-0.5 pr-3 font-mono text-gray-500 w-16">
                      {state.codeStartTime ? fmt(r.time, state.codeStartTime) : '—'}
                    </td>
                    <td className="py-0.5">{r.rhythm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state.medications.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 border-b pb-1">Medications</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-1 font-normal w-16">Time</th>
                  <th className="pb-1 font-normal">Drug</th>
                  <th className="pb-1 font-normal">Dose</th>
                </tr>
              </thead>
              <tbody>
                {[...state.medications].reverse().map((m, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-0.5 font-mono text-gray-500">
                      {state.codeStartTime ? fmt(m.time, state.codeStartTime) : '—'}
                    </td>
                    <td className="py-0.5">{m.drug}</td>
                    <td className="py-0.5">{m.dose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded hover:bg-gray-700 transition-colors"
          >
            Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-xs rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
