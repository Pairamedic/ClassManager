import { useEffect, useRef, useState } from 'react'
import { realtimeReady, rtSubscribeState, rtSendCommand } from '../firebase'
import { RHYTHM_LIST } from '../data/rhythms'
import { SCENARIOS } from '../data/scenarios'
import { REVERSIBLE_CAUSES } from '../data/reversibleCauses'

const VITALS_FIELDS = [
  { key: 'hr',    label: 'HR',    unit: 'bpm',  min: 0,  max: 300, step: 5 },
  { key: 'sbp',   label: 'SBP',   unit: 'mmHg', min: 0,  max: 250, step: 5 },
  { key: 'dbp',   label: 'DBP',   unit: 'mmHg', min: 0,  max: 180, step: 5 },
  { key: 'spo2',  label: 'SpO2',  unit: '%',    min: 50, max: 100, step: 1 },
  { key: 'etco2', label: 'EtCO2', unit: 'mmHg', min: 0,  max: 80,  step: 1 },
  { key: 'temp',  label: 'Temp',  unit: '°F',   min: 88, max: 108, step: 0.1 },
]

const RHYTHM_GROUPS = [
  { label: 'Normal / Monitoring',     cat: 'normal'  },
  { label: 'Bradycardia / AV Blocks', cat: 'brady'   },
  { label: 'Tachycardia',             cat: 'tachy'   },
  { label: 'Shockable Arrest',        cat: 'shock'   },
  { label: 'Non-Shockable Arrest',    cat: 'noshock' },
]

const CAT_COLOR = {
  normal: 'text-ecg-green', brady: 'text-ecg-blue', tachy: 'text-ecg-amber',
  shock: 'text-ecg-red', noshock: 'text-ecg-amber',
}

export default function RemoteControl({ room, onExit }) {
  const [snap, setSnap] = useState(null)
  const [tab, setTab] = useState('rhythm')
  const throttleRef = useRef({})

  useEffect(() => {
    if (!room || !realtimeReady) return
    let unsub
    try { unsub = rtSubscribeState(room, setSnap) } catch {}
    return () => { try { unsub && unsub() } catch {} }
  }, [room])

  const send = (action) => { try { rtSendCommand(room, action) } catch {} }
  const sendVital = (key, value) => {
    const now = Date.now()
    if (now - (throttleRef.current[key] || 0) < 120) return
    throttleRef.current[key] = now
    send({ type: 'SET_VITALS', vitals: { [key]: Number(value) } })
  }

  if (!realtimeReady) {
    return (
      <Shell room={room} onExit={onExit} connected={false}>
        <p className="text-sm text-ecg-amber p-4 leading-relaxed">
          Remote control needs Firebase Realtime Database. Add
          <span className="font-mono"> VITE_FIREBASE_DATABASE_URL </span>
          to your environment and redeploy.
        </p>
      </Shell>
    )
  }

  const connected = !!snap
  const v = snap?.vitals || {}

  return (
    <Shell room={room} onExit={onExit} connected={connected} snap={snap}>
      {/* tab bar */}
      <div className="flex gap-1 px-3 py-2 sticky top-[92px] z-10 bg-monitor-bg">
        {['rhythm', 'vitals', 'scenario', 'code'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-h-[40px] rounded-lg border text-[11px] font-bold uppercase tracking-wide ${
              tab === t ? 'bg-surface2 text-ink border-ecg-green' : 'border-ecg-border text-ecg-gray'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-4">
        {tab === 'rhythm' && RHYTHM_GROUPS.map(({ label, cat }) => (
          <div key={cat}>
            <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest mb-1">{label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {RHYTHM_LIST.filter(r => r.category === cat).map(r => (
                <button
                  key={r.id}
                  onClick={() => send({ type: 'SET_RHYTHM', rhythm: r.id })}
                  className={`min-h-[48px] px-2 rounded-lg border text-[12px] font-bold text-left ${
                    snap?.currentRhythm === r.id
                      ? `border-current bg-surface2 ${CAT_COLOR[cat]}`
                      : 'border-ecg-border text-ecg-gray bg-surface2'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {tab === 'vitals' && (
          <>
            {VITALS_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-3 py-1">
                <span className="text-[11px] text-ecg-gray font-mono w-14 uppercase shrink-0">{f.label}</span>
                <input
                  type="range" min={f.min} max={f.max} step={f.step}
                  defaultValue={v[f.key] ?? f.min}
                  onChange={e => sendVital(f.key, e.target.value)}
                  className="flex-1 h-7"
                />
                <span className="text-[12px] text-ink font-mono w-12 text-right shrink-0">{v[f.key]}</span>
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <BigToggle label="Hide vitals from student" on={snap?.vitalsHidden} onClick={() => send({ type: 'TOGGLE_VITALS_HIDDEN' })} />
              <BigToggle label="Hide rhythm label" on={snap?.labelHidden} onClick={() => send({ type: 'TOGGLE_LABEL_HIDDEN' })} />
              <BigToggle label="Pause waveform" on={snap ? !snap.isRunning : false} onClick={() => send({ type: 'SET_RUNNING', value: !(snap?.isRunning) })} />
            </div>
          </>
        )}

        {tab === 'scenario' && (
          <div className="grid grid-cols-1 gap-1.5">
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => send({ type: 'LOAD_SCENARIO', scenario: sc })}
                className="text-left px-3 min-h-[56px] rounded-lg border border-ecg-border bg-surface2 active:border-ecg-amber"
              >
                <div className="text-[13px] font-bold text-ink">{sc.name}</div>
                <div className="text-[10px] text-ecg-gray">{sc.description}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'code' && (
          <>
            <button
              onClick={() => send({ type: 'DECLARE_ROSC' })}
              disabled={snap?.rosc}
              className={`w-full min-h-[52px] rounded-lg border-2 font-bold uppercase tracking-widest ${
                snap?.rosc ? 'border-ecg-green text-ecg-green bg-ecg-green/10' : 'border-ecg-green text-ecg-green bg-surface2'
              }`}
            >
              {snap?.rosc ? '✔ ROSC Declared' : 'Declare ROSC'}
            </button>

            <div>
              <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest mb-1">Reversible Causes (H’s &amp; T’s)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {REVERSIBLE_CAUSES.map(c => {
                  const on = snap?.reversibleCauses?.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => send({ type: 'TOGGLE_REVERSIBLE_CAUSE', id: c.id })}
                      className={`min-h-[44px] px-2 rounded-lg border text-[11px] font-bold text-left ${
                        on ? 'border-ecg-amber text-ecg-amber bg-surface2' : 'border-ecg-border text-ecg-gray bg-surface2'
                      }`}
                    >
                      {on ? '✓ ' : ''}{c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest mb-1">
                Pacer capture threshold: {snap?.captureThreshold ?? '—'} mA
              </div>
              <input
                type="range" min={0} max={200} step={5}
                defaultValue={snap?.captureThreshold ?? 60}
                onChange={e => send({ type: 'SET_CAPTURE_THRESHOLD', threshold: e.target.value })}
                className="w-full h-7"
              />
            </div>
          </>
        )}
      </div>
    </Shell>
  )
}

function Shell({ room, onExit, connected, snap, children }) {
  return (
    <div className="min-h-full bg-monitor-bg text-ink">
      {/* sticky status header */}
      <div className="sticky top-0 z-20 bg-surface border-b border-ecg-border px-3 py-2">
        <div className="flex items-center justify-between">
          <button onClick={onExit} className="text-[11px] text-ecg-gray">‹ Exit</button>
          <div className="text-[11px] font-mono text-ecg-gray">
            Room <span className="text-ink font-bold tracking-widest">{room}</span>
          </div>
          <span className={`text-[10px] font-bold ${connected ? 'text-ecg-green' : 'text-ecg-amber'}`}>
            {connected ? '● LINKED' : '○ waiting'}
          </span>
        </div>
        {snap && (
          <div className="flex items-center justify-between mt-1.5 text-[12px] font-mono">
            <span className="font-bold text-ink truncate">{snap.currentRhythm}{snap.rosc ? ' · ROSC' : ''}</span>
            <span className="text-ecg-gray">
              HR {snap.vitals?.hr} · {snap.vitals?.sbp}/{snap.vitals?.dbp} · SpO₂ {snap.vitals?.spo2} · CO₂ {snap.vitals?.etco2}
            </span>
          </div>
        )}
        {snap && (
          <div className="flex gap-3 mt-1 text-[10px] text-ecg-gray font-mono">
            <span>Shocks <span className="text-ecg-red font-bold">{snap.shocks ?? 0}</span></span>
            <span>CPR {snap.cprActive ? 'on' : 'off'} ({snap.cprCycles ?? 0})</span>
            <span>Meds {snap.medCount ?? 0}{snap.lastMed ? ` · ${snap.lastMed.drug}` : ''}</span>
            {snap.padsConnected && <span className="text-ecg-green">pads</span>}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function BigToggle({ label, on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-3 min-h-[48px] rounded-lg border text-[12px] font-bold ${
        on ? 'border-ecg-amber text-ecg-amber' : 'border-ecg-border text-ecg-gray'
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{on ? 'ON' : 'OFF'}</span>
    </button>
  )
}
