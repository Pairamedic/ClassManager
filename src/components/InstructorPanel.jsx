import { useState, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHM_LIST } from '../data/rhythms'
import { SCENARIOS, SCENARIO_GROUPS } from '../data/scenarios'
import { REVERSIBLE_CAUSES } from '../data/reversibleCauses'
import { firebaseReady, fbSaveScenario, fbLoadScenarios, fbDeleteScenario } from '../firebase'
import StudentsPanel from './StudentsPanel'

// ── Scenario parser ───────────────────────────────────────────────────────────
const RHYTHM_ALIASES = {
  nsr: 'NSR', 'normal sinus': 'NSR', 'sinus rhythm': 'NSR', 'normal': 'NSR',
  'sinus brady': 'SINUS_BRADY', 'sinusbradycardia': 'SINUS_BRADY', 'bradycardia': 'SINUS_BRADY', 'sinus bradycardia': 'SINUS_BRADY',
  'sinus tach': 'SINUS_TACH', 'sinustach': 'SINUS_TACH', 'sinus tachycardia': 'SINUS_TACH',
  svt: 'SVT', 'supraventricular': 'SVT', 'supraventricular tachycardia': 'SVT', 'psvt': 'SVT',
  afib: 'AFIB', 'a fib': 'AFIB', 'atrial fibrillation': 'AFIB', 'af': 'AFIB',
  aflutter: 'AFLUTTER', 'a flutter': 'AFLUTTER', 'atrial flutter': 'AFLUTTER',
  vtach: 'VTACH', 'v tach': 'VTACH', 'ventricular tachycardia': 'VTACH', 'vt': 'VTACH',
  vfib: 'VFIB', 'v fib': 'VFIB', 'ventricular fibrillation': 'VFIB', 'vf': 'VFIB',
  torsades: 'TORSADES', 'tdp': 'TORSADES', 'torsades de pointes': 'TORSADES',
  asystole: 'ASYSTOLE', 'flatline': 'ASYSTOLE',
  pea: 'PEA', 'pulseless electrical activity': 'PEA', 'pulseless electrical': 'PEA',
  agonal: 'AGONAL', 'agonal rhythm': 'AGONAL',
  junctional: 'JUNCTIONAL', 'junctional rhythm': 'JUNCTIONAL',
  idioventricular: 'IDIOVENTRICULAR', 'idioventricular rhythm': 'IDIOVENTRICULAR',
  wenckebach: 'WENCKEBACH', 'mobitz1': 'WENCKEBACH', 'mobitz i': 'WENCKEBACH', 'second degree type i': 'WENCKEBACH',
  mobitz2: 'MOBITZ2', 'mobitz ii': 'MOBITZ2', 'mobitz 2': 'MOBITZ2', 'second degree type ii': 'MOBITZ2',
  'first degree': 'FIRST_DEGREE', '1st degree': 'FIRST_DEGREE', 'first degree av block': 'FIRST_DEGREE',
  'third degree': 'THIRD_DEGREE', '3rd degree': 'THIRD_DEGREE', 'complete block': 'THIRD_DEGREE', 'complete av block': 'THIRD_DEGREE',
  stemi: 'NSR_STEMI', 'nsr stemi': 'NSR_STEMI',
  wpw: 'WPW', 'wolff parkinson white': 'WPW',
}

function matchRhythm(raw) {
  const key = raw.toLowerCase().trim().replace(/[-_]/g, ' ')
  if (RHYTHM_ALIASES[key]) return RHYTHM_ALIASES[key]
  // Try direct ID match (e.g. user types "VFIB", "NSR")
  const upper = raw.trim().toUpperCase().replace(/ /g, '_')
  if (RHYTHM_LIST.find(r => r.id === upper)) return upper
  return null
}

function parseScenarioText(text) {
  const result = { vitals: {}, rhythm: null, name: null, description: null, vitalsHidden: null }
  const lines = text.split('\n')
  const descLines = []

  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.+)$/)
    if (!m) {
      const trimmed = line.trim()
      if (trimmed) descLines.push(trimmed)
      continue
    }
    const [, rawKey, rawVal] = m
    const key = rawKey.trim().toLowerCase().replace(/[-_\s]+/g, '')
    const val = rawVal.trim()

    if (key === 'name' || key === 'scenario') { result.name = val; continue }
    if (key === 'description' || key === 'desc' || key === 'hx' || key === 'history') { result.description = val; continue }
    if (key === 'rhythm' || key === 'ecg' || key === 'ekg') {
      result.rhythm = matchRhythm(val)
      continue
    }
    if (key === 'vitalshidden' || key === 'hidevitals') {
      result.vitalsHidden = val.toLowerCase() === 'true' || val === '1'
      continue
    }

    // BP: 120/80 or BP: 120 (systolic only)
    if (key === 'bp' || key === 'bloodpressure' || key === 'sbp') {
      const bp = val.match(/^(\d+)\s*\/\s*(\d+)$/)
      if (bp) { result.vitals.sbp = Number(bp[1]); result.vitals.dbp = Number(bp[2]) }
      else if (/^\d+$/.test(val)) result.vitals.sbp = Number(val)
      continue
    }
    if (key === 'dbp' || key === 'diastolic') { if (/^\d+$/.test(val)) result.vitals.dbp = Number(val); continue }
    if (key === 'hr' || key === 'heartrate' || key === 'pulse') { if (/^\d+$/.test(val)) result.vitals.hr = Number(val); continue }
    if (key === 'spo2' || key === 'o2sat' || key === 'sat' || key === 'spo') { if (/^\d+/.test(val)) result.vitals.spo2 = parseInt(val); continue }
    if (key === 'etco2' || key === 'co2' || key === 'etco') { if (/^\d+/.test(val)) result.vitals.etco2 = parseInt(val); continue }
    if (key === 'temp' || key === 'temperature') { if (/[\d.]+/.test(val)) result.vitals.temp = parseFloat(val); continue }

    // Unrecognized key lines treated as part of description
    descLines.push(line.trim())
  }

  if (!result.description && descLines.length) result.description = descLines.join(' ')
  return result
}

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
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* STUDENTS & GRADEBOOK */}
          <CollapsibleSection title="Students & Gradebook">
            <StudentsPanel />
          </CollapsibleSection>

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

          {/* SCENARIO BUILDER */}
          <CollapsibleSection title="Scenario Builder">
            <ScenarioBuilder dispatch={dispatch} close={close} />
          </CollapsibleSection>

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

function ScenarioBuilder({ dispatch, close }) {
  const [text, setText] = useState('')
  const [applied, setApplied] = useState(false)

  const parsed = text.trim() ? parseScenarioText(text) : null
  const hasContent = parsed && (
    parsed.rhythm || parsed.name || parsed.description ||
    Object.keys(parsed.vitals).length > 0 || parsed.vitalsHidden != null
  )

  function apply() {
    if (!parsed) return
    if (parsed.rhythm) dispatch({ type: 'SET_RHYTHM', rhythm: parsed.rhythm })
    if (Object.keys(parsed.vitals).length) dispatch({ type: 'SET_VITALS', vitals: parsed.vitals })
    // vitalsHidden handled via LOAD_SCENARIO-style: we just set via SET_VITALS_HIDDEN if needed
    if (parsed.vitalsHidden != null) {
      dispatch({ type: 'SET_VITALS_HIDDEN', value: parsed.vitalsHidden })
    }
    if (parsed.name || parsed.description) {
      dispatch({ type: 'SET_SCENARIO_META', name: parsed.name ?? undefined, description: parsed.description ?? undefined })
    }
    setApplied(true)
    setTimeout(() => setApplied(false), 1800)
    close()
  }

  return (
    <div className="space-y-2">
      <p className="text-[9px] text-ecg-gray leading-relaxed">
        Type your scenario using <span className="text-ink font-mono">Key: Value</span> pairs.
        Unrecognized lines become the student description. Supported keys:
        <span className="text-ecg-green font-mono"> HR BP SpO2 EtCO2 Temp Rhythm Name Description</span>
      </p>
      <div className="text-[9px] text-ecg-gray font-mono bg-surface rounded px-2 py-1.5 border border-ecg-border/40 whitespace-pre leading-relaxed select-all">{`Name: Symptomatic Brady — 80yo F\nDescription: Near-syncope, dizzy.\nHR: 38\nBP: 88/60\nSpO2: 93\nRhythm: Sinus Brady`}</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={7}
        placeholder={'Name: ...\nDescription: ...\nHR: 72\nBP: 120/80\nSpO2: 98\nEtCO2: 35\nRhythm: NSR'}
        className="w-full bg-surface2 border border-ecg-border rounded px-2.5 py-2 text-[11px] font-mono text-ink placeholder-ecg-gray/50 focus:outline-none focus:border-ecg-green resize-none"
        spellCheck={false}
      />

      {/* Live preview */}
      {parsed && (
        <div className="border border-ecg-border/40 rounded bg-surface p-2 space-y-1 text-[10px] font-mono">
          {parsed.name       && <div><span className="text-ecg-gray">Name: </span><span className="text-ink">{parsed.name}</span></div>}
          {parsed.description && <div><span className="text-ecg-gray">Desc: </span><span className="text-ecg-amber">{parsed.description}</span></div>}
          {parsed.rhythm     && <div><span className="text-ecg-gray">Rhythm: </span><span className="text-ecg-green">{parsed.rhythm}</span></div>}
          {parsed.rhythm === null && text.match(/rhythm\s*:/i) && (
            <div className="text-ecg-red">Rhythm not recognized</div>
          )}
          {Object.entries(parsed.vitals).map(([k, v]) => (
            <div key={k}><span className="text-ecg-gray">{k.toUpperCase()}: </span><span className="text-ink">{v}</span></div>
          ))}
          {!hasContent && <div className="text-ecg-gray">Nothing recognized yet</div>}
        </div>
      )}

      <button
        onClick={apply}
        disabled={!hasContent}
        className="w-full min-h-[40px] rounded border font-bold text-[11px] uppercase tracking-widest transition-colors border-ecg-green text-ecg-green bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
      >
        {applied ? '✓ Applied' : 'Apply to Monitor'}
      </button>
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
