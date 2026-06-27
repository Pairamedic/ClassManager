import { useEffect, useRef } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { getLeadProfiles } from '../data/leadProfiles'
import { RHYTHMS } from '../data/rhythms'

const ROWS = [
  ['I',   'aVR', 'V1', 'V4'],
  ['II',  'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6'],
]

function waveY(t, { amp, inv, st }, H) {
  const dir = inv ? -1 : 1
  const mid = H * 0.52
  const scale = H * 0.38 * amp
  const stFrac = (st || 0) / 6

  let rel = 0
  if (t > 0.07 && t < 0.20)
    rel = 0.15 * Math.sin(Math.PI * (t - 0.07) / 0.13)
  else if (t > 0.25 && t < 0.28)
    rel = -0.08 * Math.sin(Math.PI * (t - 0.25) / 0.03)
  else if (t > 0.28 && t < 0.35)
    rel = Math.sin(Math.PI * (t - 0.28) / 0.07)
  else if (t > 0.35 && t < 0.40)
    rel = -0.12 * Math.sin(Math.PI * (t - 0.35) / 0.05)
  else if (t > 0.40 && t < 0.54)
    rel = stFrac * 0.4
  else if (t > 0.54 && t < 0.74)
    rel = (0.28 + stFrac * 0.3) * Math.sin(Math.PI * (t - 0.54) / 0.20)

  return mid - rel * dir * scale
}

function LeadMini({ lead, profile }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#080b0e'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#0f2010'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    const beatW = W / 2
    ctx.strokeStyle = '#00e5a0'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x < W; x++) {
      const t = (x % beatW) / beatW
      const y = waveY(t, profile, H)
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.fillStyle = '#4b5563'
    ctx.font = 'bold 9px monospace'
    ctx.fillText(lead, 3, 10)
  }, [lead, profile])

  return <canvas ref={ref} width={176} height={56} className="w-full" />
}

function RhythmStrip({ profile }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = '#080b0e'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#0f2010'
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    const beatW = W / 6
    ctx.strokeStyle = '#00e5a0'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x < W; x++) {
      const t = (x % beatW) / beatW
      const y = waveY(t, profile, H)
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#4b5563'
    ctx.font = 'bold 9px monospace'
    ctx.fillText('RHYTHM STRIP — LEAD II', 4, 11)
  }, [profile])
  return <canvas ref={ref} width={728} height={50} className="w-full" />
}

export default function TwelveLeadModal({ onClose }) {
  const { state } = useSimulator()
  const rhythm = RHYTHMS[state.currentRhythm]
  const profiles = getLeadProfiles(state.currentRhythm, state.scenarioName)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div
        className="relative z-10 bg-[#111318] border border-ecg-border rounded-lg p-3 shadow-2xl"
        style={{ width: 760 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xs font-bold text-white font-mono tracking-widest uppercase">
              12-Lead ECG
            </h2>
            <p className="text-[10px] text-ecg-gray font-mono">
              {state.scenarioName || state.currentRhythm}
              {rhythm && !rhythm.pulse && (
                <span className="ml-2 text-ecg-red font-bold">— NO PULSE RHYTHM</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {ROWS.flatMap(row =>
            row.map(lead => (
              <div key={lead} className="border border-ecg-border/30 rounded overflow-hidden">
                <LeadMini lead={lead} profile={profiles[lead]} />
              </div>
            ))
          )}
        </div>

        <div className="mt-2 border border-ecg-border/30 rounded overflow-hidden">
          <RhythmStrip profile={profiles['II']} />
        </div>

        <div className="mt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold font-mono text-ecg-gray border border-ecg-border rounded hover:text-white hover:border-ecg-gray transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
