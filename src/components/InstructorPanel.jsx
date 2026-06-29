import { useState, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHM_LIST } from '../data/rhythms'
import { SCENARIOS, SCENARIO_GROUPS } from '../data/scenarios'
import { REVERSIBLE_CAUSES } from '../data/reversibleCauses'
import { firebaseReady, fbSaveScenario, fbLoadScenarios, fbDeleteScenario } from '../firebase'

const CATEGORY_COLORS = {
  normal:  'text-ecg-green',
  brady:   'text-ecg-blue',
  tachy:   'text-ecg-amber',
  shock:   'text-ecg-red',
  noshock: 'text-ecg-amber',
}

const VITALS_FIELDS = [
  { key: 'hr',    label: 'HR',    unit: 'bpm',  min: 0,  max: 300, step: 5   },
  { key: 'sbp',   label: 'SBP',  unit: 'mmHg', min: 0,  max: 250, step: 5   },
  { key: 'dbp',   label: 'DBP',  unit: 'mmHg', min: 0,  max: 180, step: 5   },
  { key: 'spo2',  label: 'SpO2', unit: '%',    min: 50, max: 100, step: 1   },
  { key: 'etco2', label: 'EtCO2',unit: 'mmHg', min: 0,  max: 80,  step: 1   },
  { key: 'temp',  label: 'Temp', unit: '°F',    min: 88, max: 108, step: 0.1 },
]

const RHYTHM_GROUPS = [
  { label: 'Normal / Monitoring',     cat: 'normal'  },
  { label: 'Bradycardia / AV Blocks', cat: 'brady'   },
  { label: 'Tachycardia',             cat: 'tachy'   },
  { label: 'Shockable Arrest',        cat: 'shock'   },
  { label: 'Non-Shockable Arrest',    cat: 'noshock' },
]

export default function InstructorPanel({ onEndSession }) {
  const { state, dispatch } = useSimulator()
  const [cloudScenarios, setCloudScenarios] = useState([])
  const [saveName, setSaveName] = useState('')
  const [fbStatus, setFbStatus] = useState('')
  const [fbLoading, setFbLoading] = useState(false)

  function close() { dispatch({ type: 'TOGGLE_INSTRUCTOR' }) }

  async function loadCloud() {
    try {
      const data = await fbLoadScenarios()
      setCloudScenarios(data)
    } catch (e) {
      setFbStatus('Load error: ' + e.message)
    }
  }

  useEffect(() => {
    if (firebaseReady) loadCloud()
  }, [])

  async function handleSave() {
    if (!saveName.trim()) return
    setFbLoading(true)
    setFbStatus('')
    try {
      await fbSaveScenario({
        name: saveName.trim(),
        rhythm: state.currentRhythm,
        vitals: { ...state.vitals },
        captureThreshold: state.pacer.captureThreshold,
        description: `${state.currentRhythm} · HR ${state.vitals.hr}`,
      })
      setFbStatus('Saved!')
      setSaveName('')
      await loadCloud()
    } catch (e) {
      setFbStatus('Save failed: ' + e.message)
    } finally {
      setFbLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await fbDeleteScenario(id)
      await loadCloud()
    } catch (e) {
      setFbStatus('Delete failed: ' + e.message)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex" onClick={e => e.target === e.currentTarget && close()}>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col bg-surface border-r border-ecg-border" style={{ width: 380 }}>

        {/* Panel header */}
        <div className="flex items-center justify-between p-3 border-b border-ecg-border bg-surface2 shrink-0">
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Instructor Controls</h2>
          <button onClick={close} className="text-ecg-gray hover:text-ink text-xl leading-none">×</button>
        </div>

        {/* Quick actions — always visible, never inside a collapsible */}
        <div className="flex gap-2 px-3 py-2.5 border-b border-ecg-border shrink-0">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_LABEL_HIDDEN' })}
            className={`flex-1 min-h-[40px] rounded-lg border font-bold text-xs uppercase tracking-widest transition-colors ${
              state.labelHidden
                ? 'border-ecg-green text-ecg-green bg-ecg-green/10 hover:bg-ecg-green/20'
                : 'border-ecg-amber text-ecg-amber bg-ecg-amber/10 hover:bg-ecg-amber/20'
            }`}
          >
            {state.labelHidden ? 'Reveal Rhythm' : 'Hide Rhythm'}
          </button>
          {onEndSession && (
            <button
              onClick={onEndSession}
              className="flex-1 min-h-[40px] rounded-lg border border-ecg-red/60 text-ecg-red bg-ecg-red/5 hover:bg-ecg-red/20 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              End Session
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* QUICK SCENARIOS — grouped by AHA category */}
          <CollapsibleSection title="Quick Scenarios">
            {SCENARIO_GROUPS.map(group => {
              const groupScenarios = SCENARIOS.filter(sc => sc.group === group.key)
              if (!groupScenarios.length) return null
              return (
                <div key={group.key} className="mb-3 last:mb-0">
                  <div className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest mb-1 pb-0.5 border-b border-ecg-border/40">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {groupScenarios.map(sc => (
                      <button
                        key={sc.id}
                        onClick={() => { dispatch({ type: 'LOAD_SCENARIO', scenario: sc }); close() }}
                        className="text-left px-2 py-1.5 rounded border border-ecg-border bg-surface2 hover:border-ecg-amber transition-colors"
                      >
                        <div className="text-[10px] font-bold text-ink leading-tight">{sc.name}</div>
                        <div className="text-[9px] text-ecg-gray leading-tight mt-0.5">{sc.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </CollapsibleSection>

          {/* CLOUD SCENARIOS */}
          {firebaseReady && (
            <CollapsibleSection title="Cloud Scenarios">
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="Scenario name…"
                  className="flex-1 bg-surface2 border border-ecg-border rounded px-2 py-1 text-[11px] text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green"
                />
                <button
                  onClick={handleSave}
                  disabled={fbLoading || !saveName.trim()}
                  className="px-2.5 py-1 text-[10px] font-bold text-ecg-green border border-ecg-green/60 rounded bg-ecg-green/10 hover:bg-ecg-green/20 disabled:opacity-40 transition-colors"
                >
                  {fbLoading ? '…' : 'SAVE'}
                </button>
              </div>
              {fbStatus && <p className="text-[9px] text-ecg-amber mb-2">{fbStatus}</p>}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cloudScenarios.length === 0 ? (
                  <p className="text-[9px] text-ecg-gray">No saved scenarios</p>
                ) : cloudScenarios.map(sc => (
                  <div key={sc.id} className="flex items-center gap-1 px-2 py-1.5 border border-ecg-border rounded bg-surface2">
                    <span className="flex-1 text-[10px] text-ink truncate">{sc.name}</span>
                    <button
                      onClick={() => { dispatch({ type: 'LOAD_SCENARIO', scenario: sc }); close() }}
                      className="text-[9px] font-bold text-ecg-green border border-ecg-green/50 rounded px-1.5 py-0.5 hover:bg-ecg-green/10"
                    >LOAD</button>
                    <button
                      onClick={() => handleDelete(sc.id)}
                      className="text-[9px] font-bold text-ecg-red border border-ecg-red/50 rounded px-1.5 py-0.5 hover:bg-ecg-red/10"
                    >DEL</button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* RHYTHM SELECTOR */}
          <CollapsibleSection title="Rhythm">
            {RHYTHM_GROUPS.map(({ label, cat }) => {
              const rhythms = RHYTHM_LIST.filter(r => r.category === cat)
              return (
                <div key={cat} className="mb-2">
                  <div className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest mb-1">{label}</div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {rhythms.map(r => (
                      <button
                        key={r.id}
                        onClick={() => dispatch({ type: 'SET_RHYTHM', rhythm: r.id })}
                        className={`text-left px-2 py-1.5 rounded border text-[10px] font-bold transition-colors ${
                          state.currentRhythm === r.id
                            ? `border-current bg-surface2 ${CATEGORY_COLORS[r.category]}`
                            : 'border-ecg-border text-ecg-gray bg-surface2 hover:border-ecg-gray'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </CollapsibleSection>

          {/* VITALS EDITOR */}
          <CollapsibleSection title="Vitals">
            {VITALS_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-ecg-border/40">
                <span className="text-[10px] text-ecg-gray font-mono w-12 uppercase shrink-0">{f.label}</span>
                <input
                  type="range" min={f.min} max={f.max} step={f.step}
                  value={state.vitals[f.key]}
                  onChange={e => dispatch({ type: 'SET_VITALS', vitals: { [f.key]: Number(e.target.value) } })}
                  className="flex-1"
                />
                <span className="text-[10px] text-ink font-mono w-16 text-right shrink-0">
                  {state.vitals[f.key]}{f.unit}
                </span>
              </div>
            ))}
          </CollapsibleSection>

          {/* DISPLAY TOGGLES */}
          <CollapsibleSection title="Display">
            <div className="flex flex-col gap-1">
              <Toggle label="Hide Vitals from Student" value={state.vitalsHidden} onToggle={() => dispatch({ type: 'TOGGLE_VITALS_HIDDEN' })} />
              <Toggle label="Pause Waveform"           value={!state.isRunning}   onToggle={() => dispatch({ type: 'SET_RUNNING', value: !state.isRunning })} />
            </div>
          </CollapsibleSection>

          {/* CODE OUTCOME */}
          <CollapsibleSection title="Code Outcome">
            <button
              onClick={() => dispatch({ type: 'DECLARE_ROSC' })}
              disabled={state.rosc}
              className={`w-full min-h-[44px] rounded border-2 font-bold text-xs uppercase tracking-widest transition-colors ${
                state.rosc
                  ? 'border-ecg-green text-ecg-green bg-ecg-green/10 cursor-default'
                  : 'border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black'
              }`}
            >
              {state.rosc ? '✔ ROSC Declared' : 'Declare ROSC'}
            </button>
            <p className="text-[9px] text-ecg-gray mt-1">
              Restores a perfusing rhythm and post-arrest vitals; prompts post-arrest care.
            </p>
          </CollapsibleSection>

          {/* REVERSIBLE CAUSES (H's & T's) */}
          <CollapsibleSection title="Reversible Causes (H's & T's)">
            <p className="text-[9px] text-ecg-gray mb-2">
              Flag the cause(s) present in this scenario — shown in the debrief / saved session.
            </p>
            <div className="grid grid-cols-2 gap-0.5">
              {REVERSIBLE_CAUSES.map(c => {
                const on = state.reversibleCauses.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => dispatch({ type: 'TOGGLE_REVERSIBLE_CAUSE', id: c.id })}
                    className={`flex items-center gap-1.5 text-left px-2 py-1.5 rounded border text-[10px] font-bold transition-colors ${
                      on
                        ? 'border-ecg-amber text-ecg-amber bg-surface2'
                        : 'border-ecg-border text-ecg-gray bg-surface2 hover:border-ecg-gray'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border text-[8px] shrink-0 ${
                      on ? 'border-ecg-amber bg-ecg-amber text-black' : 'border-ecg-gray'
                    }`}>
                      {on ? '✓' : ''}
                    </span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </CollapsibleSection>

          {/* PACER CAPTURE THRESHOLD */}
          <CollapsibleSection title="Pacer Capture Threshold">
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={200} step={5}
                value={state.pacer.captureThreshold}
                onChange={e => dispatch({ type: 'SET_CAPTURE_THRESHOLD', threshold: e.target.value })}
                className="flex-1"
              />
              <span className="text-sm text-ink font-mono w-16 text-right">
                {state.pacer.captureThreshold} mA
              </span>
            </div>
            <p className="text-[9px] text-ecg-gray mt-1">
              Pacer output must exceed this value for capture. Increase for harder scenarios.
            </p>
          </CollapsibleSection>

        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="border border-ecg-border/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-surface2 hover:bg-surface transition-colors"
      >
        <span className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">{title}</span>
        <span className="text-ecg-gray text-[10px] font-mono">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </section>
  )
}

function Toggle({ label, value, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-bold tracking-wide transition-colors ${
        value
          ? 'border-ecg-amber text-ecg-amber'
          : 'border-ecg-border text-ecg-gray hover:border-ecg-gray'
      }`}
    >
      <span>{label}</span>
      <span className="font-mono">{value ? 'ON' : 'OFF'}</span>
    </button>
  )
}
