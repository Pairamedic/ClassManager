import { useSimulator } from '../context/SimulatorContext'
import { RHYTHM_LIST } from '../data/rhythms'
import { SCENARIOS } from '../data/scenarios'

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
  { key: 'temp',  label: 'Temp', unit: '°F', min: 88, max: 108, step: 0.1 },
]

const RHYTHM_GROUPS = [
  { label: 'Normal / Monitoring',    cat: 'normal'  },
  { label: 'Bradycardia / AV Blocks', cat: 'brady'  },
  { label: 'Tachycardia',            cat: 'tachy'   },
  { label: 'Shockable Arrest',       cat: 'shock'   },
  { label: 'Non-Shockable Arrest',   cat: 'noshock' },
]

export default function InstructorPanel() {
  const { state, dispatch } = useSimulator()

  function close() { dispatch({ type: 'TOGGLE_INSTRUCTOR' }) }

  return (
    <div className="absolute inset-0 z-50 flex" onClick={e => e.target === e.currentTarget && close()}>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col bg-surface border-r border-ecg-border" style={{ width: 380 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-ecg-border bg-surface2 shrink-0">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Instructor Controls</h2>
          <button onClick={close} className="text-ecg-gray hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">

          {/* SCENARIOS */}
          <section>
            <SectionLabel>Quick Scenarios</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => { dispatch({ type: 'LOAD_SCENARIO', scenario: sc }); close() }}
                  className="text-left px-2 py-1.5 rounded border border-ecg-border bg-surface2 hover:border-ecg-amber transition-colors"
                >
                  <div className="text-[10px] font-bold text-white leading-tight">{sc.name}</div>
                  <div className="text-[9px] text-ecg-gray leading-tight mt-0.5">{sc.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* RHYTHM SELECTOR */}
          <section>
            <SectionLabel>Rhythm</SectionLabel>
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
          </section>

          {/* VITALS EDITOR */}
          <section>
            <SectionLabel>Vitals</SectionLabel>
            {VITALS_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-ecg-border/40">
                <span className="text-[10px] text-ecg-gray font-mono w-12 uppercase shrink-0">{f.label}</span>
                <input
                  type="range" min={f.min} max={f.max} step={f.step}
                  value={state.vitals[f.key]}
                  onChange={e => dispatch({ type: 'SET_VITALS', vitals: { [f.key]: Number(e.target.value) } })}
                  className="flex-1"
                />
                <span className="text-[10px] text-white font-mono w-16 text-right shrink-0">
                  {state.vitals[f.key]}{f.unit}
                </span>
              </div>
            ))}
          </section>

          {/* DISPLAY TOGGLES */}
          <section>
            <SectionLabel>Display</SectionLabel>
            <div className="flex flex-col gap-1">
              <Toggle label="Hide Vitals from Student" value={state.vitalsHidden}  onToggle={() => dispatch({ type: 'TOGGLE_VITALS_HIDDEN' })} />
              <Toggle label="Hide Rhythm Label"        value={state.labelHidden}   onToggle={() => dispatch({ type: 'TOGGLE_LABEL_HIDDEN' })} />
              <Toggle label="Pause Waveform"           value={!state.isRunning}    onToggle={() => dispatch({ type: 'SET_RUNNING', value: !state.isRunning })} />
            </div>
          </section>

          {/* CAPTURE THRESHOLD */}
          <section>
            <SectionLabel>Pacer Capture Threshold</SectionLabel>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={200} step={5}
                value={state.pacer.captureThreshold}
                onChange={e => dispatch({ type: 'SET_CAPTURE_THRESHOLD', threshold: e.target.value })}
                className="flex-1"
              />
              <span className="text-sm text-white font-mono w-16 text-right">
                {state.pacer.captureThreshold} mA
              </span>
            </div>
            <p className="text-[9px] text-ecg-gray mt-1">
              Pacer output must exceed this value for capture. Increase for harder scenarios.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">{children}</div>
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
