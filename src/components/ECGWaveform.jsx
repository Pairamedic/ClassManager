import { useRef, useEffect, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useECGCanvas } from '../hooks/useECGCanvas'

export default function ECGWaveform() {
  const { state } = useSimulator()
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Fit canvas to container; signal hook once we have real dimensions
  useEffect(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    function resize() {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      canvas.width  = w
      canvas.height = h
      setCanvasReady(r => !r)  // toggle to re-trigger hook
    }

    // Fire once synchronously in case layout is already known
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useECGCanvas(canvasRef, state.currentRhythm, {
    pacerActive:      state.pacer.active,
    pacerRate:        state.pacer.rate,
    pacerOutput:      state.pacer.output,
    captureThreshold: state.pacer.captureThreshold,
    isRunning:        state.isRunning,
    // canvasReady included so hook restarts when canvas is resized
    _canvasReady:     canvasReady,
  })

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#050810' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
