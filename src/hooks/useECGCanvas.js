import { useEffect, useRef } from 'react'
import { RHYTHMS, PIXELS_PER_SEC, beatLenPx, afibBeatLen } from '../data/rhythms'

function seededRng(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return Math.abs(x - Math.floor(x))
}

// 3rd-Degree Block: independent atrial (75 bpm) + ventricular (35 bpm) rates
function thirdDegreeY(t) {
  const pCL   = beatLenPx(75)
  const qrsCL = beatLenPx(35)
  const pPh   = (t % pCL)   / pCL
  const qrsPh = (t % qrsCL) / qrsCL

  const p = pPh > 0.08 && pPh < 0.18
    ? 0.15 * Math.sin((pPh - 0.08) / 0.10 * Math.PI)
    : 0

  let q = 0
  if (qrsPh > 0.06 && qrsPh < 0.26)
    q = 0.65 * Math.sin((qrsPh - 0.06) / 0.20 * Math.PI)
  else if (qrsPh > 0.30 && qrsPh < 0.50)
    q = -0.18 * Math.sin((qrsPh - 0.30) / 0.20 * Math.PI)

  return p + q
}

export function useECGCanvas(canvasRef, rhythmId, options = {}) {
  // Keep the latest dynamic options in a ref so the animation loop can read
  // live values (HR, pacer, sync, pause) without tearing down and restarting
  // — that's what lets a rate change update the trace smoothly mid-stream.
  const optsRef = useRef(options)
  optsRef.current = options

  const stateRef = useRef({})
  const rafRef   = useRef(null)

  const { width = 0, height = 0, dpr = 1 } = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!width || !height) return

    // Work in CSS pixel space — scale ctx to match physical pixels.
    const W     = width
    const H     = height
    const MID   = H / 2
    const SCALE = H * 0.38

    const rhythm = RHYTHMS[rhythmId] || RHYTHMS.NSR

    // Effective heart rate: a positive HR override drives the displayed rate,
    // otherwise fall back to the rhythm's native rate. Chaos (VF/asystole/
    // torsades) and dual (3°) rhythms carry their own timing.
    function effectiveRate() {
      const hr = optsRef.current.hr
      return (typeof hr === 'number' && hr > 0) ? hr : rhythm.rate
    }
    function baseBeatLen() {
      if (rhythm.type === 'chaos' || rhythm.type === 'dual') return PIXELS_PER_SEC
      return beatLenPx(effectiveRate())
    }

    const s = stateRef.current
    // t — the trace's "paper position" in CSS px (advances with real time).
    s.t         = 0
    s.beatNum   = 0
    s.beatStart = 0
    s.beatLen   = baseBeatLen()
    s.prevY     = null
    s.lastTime  = null   // timestamp of previous animation frame
    s.carryPhys = 0      // sub-pixel scroll remainder carried between frames
    s.syncP0    = null   // sync R-peak detection: two-samples-ago {y, t}
    s.syncP1    = null   // sync R-peak detection: previous sample {y, t}

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, W, H)
    drawGrid(ctx, W, H)

    function drawGrid(c, w, h) {
      c.save()
      c.strokeStyle = 'rgba(0,70,45,0.5)'
      c.lineWidth = 0.5
      for (let gx = 0; gx < w; gx += 40) {
        c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, h); c.stroke()
      }
      for (let gy = 0; gy < h; gy += 20) {
        c.beginPath(); c.moveTo(0, gy); c.lineTo(w, gy); c.stroke()
      }
      c.restore()
    }

    function nextBeatLen(beatNum) {
      if (rhythm.type === 'chaos' || rhythm.type === 'dual') return PIXELS_PER_SEC
      const base = beatLenPx(effectiveRate())
      if (rhythm.type === 'irregular')
        return afibBeatLen(base, beatNum, rhythm.rateVariability)
      if (rhythm.rateVariability > 0) {
        const rng = seededRng(beatNum * 19 + 7)
        return base * (1 - rhythm.rateVariability / 2 + rhythm.rateVariability * rng)
      }
      return base
    }

    // Pure-ish function of t (monotonically increasing). The beat-stepping
    // state only ever advances forward, so calling this with a steadily rising
    // t — as the loop does — keeps irregular rhythms reproducible.
    function rhythmY(t) {
      if (rhythm.type === 'dual')  return thirdDegreeY(t)
      if (rhythm.type === 'chaos') return rhythm.waveform(0, t)

      while (t >= s.beatStart + s.beatLen) {
        s.beatStart += s.beatLen
        s.beatNum++
        s.beatLen = nextBeatLen(s.beatNum)
      }

      const x = Math.max(0, Math.min(0.9999, (t - s.beatStart) / s.beatLen))
      return rhythm.waveform(x, t, s.beatNum)
    }

    function getY(t) {
      const o = optsRef.current
      const pacing   = o.pacerActive
      const captured = pacing && o.pacerOutput >= o.captureThreshold
      if (pacing) {
        const pacerCL = beatLenPx(Math.max(30, o.pacerRate))
        const ph = t % pacerCL
        if (ph < 2) return 1.05
        if (captured) {
          if (ph >= 2  && ph < 18) return 0.72 * Math.sin((ph - 2)  / 16 * Math.PI)
          if (ph >= 22 && ph < 42) return -0.18 * Math.sin((ph - 22) / 20 * Math.PI)
          return 0
        }
      }
      return rhythmY(t)
    }

    // Seed the first connecting point so the trace is continuous from frame 1.
    s.prevY = MID - getY(0) * SCALE

    function draw(now) {
      rafRef.current = requestAnimationFrame(draw)
      const o = optsRef.current

      // Time-based stepping: how far the paper should advance is a function of
      // real elapsed time, so the rhythm runs at the correct speed on a 60 Hz
      // phone and a 120 Hz ProMotion iPad alike.
      if (s.lastTime == null) s.lastTime = now
      let dt = (now - s.lastTime) / 1000
      s.lastTime = now

      if (o.isRunning === false) return
      if (dt > 0.25) dt = 0.25  // tab was backgrounded — don't fast-forward

      // Scroll by a whole number of physical pixels and carry the remainder,
      // so the scrolled image and the freshly drawn trace stay pixel-aligned
      // at any device pixel ratio (this is what removes the "scatter").
      s.carryPhys += PIXELS_PER_SEC * dpr * dt
      let stepPhys = Math.floor(s.carryPhys)
      if (stepPhys <= 0) return
      s.carryPhys -= stepPhys
      const maxPhys = Math.ceil(W * dpr)
      if (stepPhys > maxPhys) stepPhys = maxPhys

      const stepCss = stepPhys / dpr
      const tEnd    = s.t + stepCss

      // Shift the existing trace left by exactly stepPhys physical pixels.
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(canvas, -stepPhys, 0)
      ctx.restore()

      // Repaint the freshly exposed strip on the right (CSS px space).
      const stripX = W - stepCss
      ctx.fillStyle = '#050810'
      ctx.fillRect(stripX, 0, stepCss + 1, H)

      // Horizontal grid across the strip.
      ctx.strokeStyle = 'rgba(0,70,45,0.5)'
      ctx.lineWidth = 0.5
      for (let gy = 0; gy < H; gy += 20) {
        ctx.beginPath(); ctx.moveTo(stripX, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
      // Vertical grid lines (every 40 px of paper) that fall inside the strip.
      for (let gx = Math.ceil(s.t / 40) * 40; gx <= tEnd; gx += 40) {
        const x = W - (tEnd - gx)
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }

      // Draw the trace one physical-pixel column at a time. A continuous
      // polyline means no gaps regardless of how many columns advanced this
      // frame, so the waveform never looks broken up.
      ctx.strokeStyle = '#00e5a0'
      ctx.lineWidth   = 1.5
      ctx.shadowColor = '#00e5a0'
      ctx.shadowBlur  = 4
      ctx.beginPath()
      ctx.moveTo(stripX, s.prevY)

      const markers = []
      let lastY = s.prevY
      for (let i = 1; i <= stepPhys; i++) {
        const subT = s.t + i / dpr
        const y    = getY(subT)
        const x    = stripX + i / dpr
        lastY      = MID - y * SCALE
        ctx.lineTo(x, lastY)

        // Sync mode: flag a 3-point local maximum (the R-peak). World time is
        // stored so the marker lands at the right column even when the peak
        // straddles a frame boundary.
        if (o.syncMode) {
          const p0 = s.syncP0, p1 = s.syncP1
          if (p0 && p1 && p1.y > 0.45 && p1.y > p0.y && p1.y >= y) {
            markers.push({ x: W - (tEnd - p1.t), y: MID - p1.y * SCALE })
          }
          s.syncP0 = p1
          s.syncP1 = { y, t: subT }
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Sync R-peak markers, painted after the trace so they sit on top.
      if (markers.length) {
        ctx.save()
        ctx.fillStyle = '#ffffff'
        const hw = 4, th = 8
        for (const m of markers) {
          const tipY = m.y - 4
          ctx.beginPath()
          ctx.moveTo(m.x - hw, tipY - th)
          ctx.lineTo(m.x + hw, tipY - th)
          ctx.lineTo(m.x,      tipY)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }

      s.prevY = lastY
      s.t     = tEnd
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }

  // Restart only when the rhythm or the canvas geometry changes; all other
  // params are read live from optsRef so rate/pacer tweaks stay smooth.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhythmId, width, height, dpr])
}
