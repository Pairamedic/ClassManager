import { useEffect, useRef } from 'react'

const PPS = 80
const SPEED = PPS / 60
const CYCLE_PX = (PPS * 60) / 12  // 400 px/breath at 12 bpm

function capnoY(cyclePos, etco2, H) {
  const t = cyclePos / CYCLE_PX
  const base = H - 4
  const plateau = H - 4 - (etco2 / 80) * (H - 8)
  if (t < 0.08) return base
  if (t < 0.22) return base - (base - plateau) * ((t - 0.08) / 0.14)
  if (t < 0.68) return plateau
  if (t < 0.82) return plateau + (base - plateau) * ((t - 0.68) / 0.14)
  return base
}

export function useEtCO2Canvas(canvasRef, { isRunning, etco2 = 35, _canvasReady } = {}) {
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.width || !canvas.height) return

    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    let raf

    function frame() {
      if (isRunning !== false) offsetRef.current += SPEED

      ctx.drawImage(canvas, -SPEED, 0)

      const clearX = W - Math.ceil(SPEED) - 2
      ctx.fillStyle = '#0a0c0f'
      ctx.fillRect(clearX, 0, W - clearX, H)

      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.5
      ctx.beginPath()

      let first = true
      for (let px = clearX; px < W; px++) {
        const t = offsetRef.current - (W - 1 - px)
        const cp = ((t % CYCLE_PX) + CYCLE_PX) % CYCLE_PX
        const y = capnoY(cp, etco2, H)
        if (first) { ctx.moveTo(px, y); first = false }
        else ctx.lineTo(px, y)
      }
      ctx.stroke()

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef, isRunning, etco2, _canvasReady])
}
