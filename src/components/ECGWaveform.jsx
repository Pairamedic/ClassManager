import { useRef, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useECGCanvas } from '../hooks/useECGCanvas'

export default function ECGWaveform() {
  const { state } = useSimulator()
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)

  // Size canvas to container on mount and resize
  useEffect(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const w   = el.offsetWidth
      const h   = el.offsetHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
    }

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
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
