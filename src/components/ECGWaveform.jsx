import { useRef, useEffect, useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useECGCanvas } from '../hooks/useECGCanvas'
import { getLeadProfiles } from '../data/leadProfiles'

export default function ECGWaveform() {
  const { state } = useSimulator()
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const [dims, setDims] = useState({ width: 0, height: 0, dpr: 1 })

  // Lead II is what the main strip shows, so pull its ST offset from whatever
  // STEMI territory (or legacy scenario override) is active — the same source
  // the 12-lead modal reads — so picking a territory shows up here too.
  const leadIIProfile = getLeadProfiles(state.currentRhythm, state.scenarioName, state.stemiTerritory)['II']
  const stOffset = (leadIIProfile.st || 0) / 6 * 0.4

  // Size the backing store to physical pixels from committed layout, and only
  // publish real (non-zero) sizes so the very first draw is crisp at full DPR.
  useEffect(() => {
    const el     = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    function resize() {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      const dpr = window.devicePixelRatio || 1
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
      setDims(prev =>
        (prev.width === w && prev.height === h && prev.dpr === dpr) ? prev : { width: w, height: h, dpr }
      )
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
    syncMode:         state.defib.syncMode,
    hr:               state.vitals.hr,
    stOffset,
    width:            dims.width,
    height:           dims.height,
    dpr:              dims.dpr,
  })

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 relative overflow-hidden"
      style={{ background: '#050810' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* SYNC label as a React overlay — never drawn on the scrolling canvas */}
      {state.defib.syncMode && (
        <div className="absolute top-2 left-2 text-[11px] font-bold font-mono text-white bg-black/50 px-1.5 py-0.5 rounded pointer-events-none">
          SYNC
        </div>
      )}
    </div>
  )
}
