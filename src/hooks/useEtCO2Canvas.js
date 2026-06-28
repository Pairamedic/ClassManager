import { useEffect, useRef } from 'react'

const PPS = 80
const CYCLE_PX = (PPS * 60) / 12  // 400 CSS px/breath at 12 bpm

function capnoY(cyclePos, etco2, H) {
  const t = cyclePos / CYCLE_PX
  const base    = H - 4
  const plateau = H - 4 - (etco2 / 80) * (H - 8)
  if (t < 0.08) return base
  if (t < 0.22) return base - (base - plateau) * ((t - 0.08) / 0.14)
  if (t < 0.68) return plateau
  if (t < 0.82) return plateau + (base - plateau) * ((t - 0.68) / 0.14)
  return base
}

export function useEtCO2Canvas(canvasRef, { isRunning, etco2 = 35, _canvasReady } = {}) {
  const offsetRef   = useRef(0)  // paper position in CSS px
  const lastTimeRef = useRef(null)
  const carryRef    = useRef(0)  // sub-pixel scroll remainder

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.width || !canvas.height) return

    const dpr = window.devicePixelRatio || 1
    const W   = canvas.width  / dpr   // CSS px
    const H   = canvas.height / dpr   // CSS px

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf
    lastTimeRef.current = null

    function frame(now) {
      raf = requestAnimationFrame(frame)

      // Advance by real elapsed time so the waveform scrolls at the same speed
      // on 60 Hz and 120 Hz displays, and scroll by whole physical pixels so
      // the trace stays aligned at any device pixel ratio.
      if (lastTimeRef.current == null) lastTimeRef.current = now
      let dt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      if (isRunning === false) return
      if (dt > 0.25) dt = 0.25

      carryRef.current += PPS * dpr * dt
      let stepPhys = Math.floor(carryRef.current)
      if (stepPhys <= 0) return
      carryRef.current -= stepPhys
      const maxPhys = Math.ceil(W * dpr)
      if (stepPhys > maxPhys) stepPhys = maxPhys

      const stepCss = stepPhys / dpr
      offsetRef.current += stepCss

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(canvas, -stepPhys, 0)
      ctx.restore()

      const clearX = W - stepCss
      ctx.fillStyle = '#0a0c0f'
      ctx.fillRect(clearX, 0, stepCss + 1, H)

      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const offset = offsetRef.current
      let first = true
      for (let i = 0; i <= stepPhys; i++) {
        const x  = clearX + i / dpr
        const t  = offset - (W - x)
        const cp = ((t % CYCLE_PX) + CYCLE_PX) % CYCLE_PX
        const y  = capnoY(cp, etco2, H)
        if (first) { ctx.moveTo(x, y); first = false }
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef, isRunning, etco2, _canvasReady])
}
