import { useRef, useState, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useEtCO2Canvas } from '../hooks/useEtCO2Canvas'

export default function EtCO2Waveform() {
  const { state } = useSimulator()
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      if (width > 0) {
        canvas.width = Math.floor(width)
        canvas.height = 64
        setCanvasReady(v => !v)
      }
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  useEtCO2Canvas(canvasRef, {
    isRunning: state.isRunning,
    etco2: state.vitals.etco2,
    _canvasReady: canvasReady,
  })

  return (
    <div className="flex items-stretch shrink-0 border-t border-ecg-border/40" style={{ height: 64 }}>
      <div className="flex items-center justify-center bg-ecg-bg w-7 shrink-0">
        <span
          className="text-[9px] text-ecg-amber font-mono font-bold"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          CO₂
        </span>
      </div>
      <canvas ref={canvasRef} className="flex-1 block bg-[#0a0c0f]" style={{ height: 64 }} />
    </div>
  )
}
