import { useState, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'

function fmt(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function CodeClock() {
  const { state, dispatch } = useSimulator()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!state.codeStartTime) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [state.codeStartTime])

  const elapsed = state.codeStartTime ? now - state.codeStartTime : null

  return (
    <div className="flex items-center gap-2">
      <div className={`font-mono text-lg font-bold ${
        elapsed !== null ? 'text-ecg-red' : 'text-ecg-gray'
      }`}>
        {elapsed !== null ? fmt(elapsed) : '--:--'}
      </div>
      <div className="flex gap-1">
        {state.codeStartTime ? (
          <button
            onClick={() => dispatch({ type: 'STOP_CODE' })}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-ecg-red text-ecg-red rounded hover:bg-ecg-red hover:text-white transition-colors"
          >
            STOP
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'START_CODE' })}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-ecg-green text-ecg-green rounded hover:bg-ecg-green hover:text-black transition-colors"
          >
            CODE
          </button>
        )}
      </div>
    </div>
  )
}
