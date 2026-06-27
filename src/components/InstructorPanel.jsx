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
  { key: 'hr',   label: 'HR',    unit: 'bpm',  min: 0,   max: 300, step: 5  },
  { key: 'sbp',  label: 'SBP',   unit: 'mmHg', min: 0,   max: 250, step: 5  },
  { key: 'dbp',  label: 'DBP',   unit: 'mmHg', min: 0,   max: 180, step: 5  },
  { key: 'spo2', label: 'SpO2',  unit: '%',    min: 50,  max: 100, step: 1  },
  { key: 'etco2',label: 'EtCO2', unit: 'mmHg', min: 0,   max: 80,  step: 1  },
  { key: 'temp', label: 'Temp',  unit: '°F',  min: 88,  max: 108, step: 0.1},
]

export default function InstructorPanel() {
  const { state, dispatch } = useSimulator()

  const groupedRhythms = {
    'Normal / Monitoring': RHYTHM_LIST.filter(r => r.category === 'normal'),
    'Bradycardia / AV Blocks': RHYTHM_LIST.filter(r => r.category === 'brady'),
    'Tachycardia': RHYTHM_LIST.filter(r => r.category === 'tachy'),
    'Shockable Arrest': RHYTHM_LIST.filter(r => r.category === 'shock'),
    'Non-Shockable Arrest': RHYTHM_LIST.filter(r => r.category === 'noshock'),
  }

  return (
    <div
      className="absolute inset-0 z-50 flex"
      onClick={(e) => e.target === e.currentTarget && dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div className="relative z-10 flex flex-col bg-surface border-r border-ecg-border overflow-y-auto" style={{ width: '380px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-ecg-border bg-surface2 shrink-0">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Instructor Controls</h2>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_INSTRUCTOR' })}
            className="text-ecg-gray hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {/* SCENARIOS */}
          <section>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">Quick Scenarios</div>
            <div className="grid grid-cols-2 gap-1">
              {SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => { dispatch({ type: 'LOAD_SCENARIO', scenario: sc }); dispatch({ type: 'TOGGLE_INSTRUCTOR' }) }}
                  className="text-left px-2 py-1.5 rounded border border-ecg-border bg-surface2 hover:border-ecg-amber hover:text-ecg-amber transition-colors"
                >
                  <div className="text-[10px] font-bold text-white">{sc.name}</div>
                  <div className="text-[9px] text-ecg-gray">{sc.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* RHYTHM SELECTOR */}
          <section>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">Rhythm</div>
            {Object.entries(groupedRhythms).map(([group, rhythms]) => (
              <div key={group} className="mb-2">
                <div className="text-[9px] text-ecg-gray font-mono uppercase tracking-widest mb-1">{group}</div>
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
            ))}
          </section>

          {/* VITALS EDITOR */}
          <section>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">Vitals</div>
            {VITALS_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-ecg-border/40">
                <span className="text-[10px] text-ecg-gray font-mono w-12 uppercase">{f.label}</span>
                <input
                  type="range"
                  min={f.min} max={f.max} step={f.step}
                  value={state.vitals[f.key]}
                  onChange={e => dispatch({ type: 'SET_VITALS', vitals: { [f.key]: Number(e.target.value) } })}
                  className="flex-1 accent-ecg-green"
                />
                <span className="text-[10px] text-white font-mono w-14 text-right">
                  {state.vitals[f.key]}{f.unit}
                </span>
              </div>
            ))}
          </section>

          {/* DISPLAY TOGGLES */}
          <section>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">Display</div>
            <div className="flex flex-col gap-1">
              <Toggle
                label="Hide Vitals from Student"
                value={state.vitalsHidden}
                onToggle={() => dispatch({ type: 'TOGGLE_VITALS_HIDDEN' })}
              />
              <Toggle
                label="Hide Rhythm Label"
                value={state.labelHidden}
                onToggle={() => dispatch({ type: 'TOGGLE_LABEL_HIDDEN' })}
              />
              <Toggle
                label="Pause Waveform"
                value={!state.isRunning}
                onToggle={() => dispatch({ type: 'SET_RUNNING', value: !state.isRunning })}
              />
            </div>
          </section>

          {/* CAPTURE THRESHOLD */}
          <section>
            <div className="text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-2">Pacer Capture Threshold</div>
            <div className="flex items-center gap-2">
              <input
                type="range" min={0} max={200} step={5}
                value={state.pacer.captureThreshold}
                onChange={e => dispatch({ type: 'SET_PACER_OUTPUT', output: state.pacer.captureThreshold })}
                className="flex-1 accent-ecg-green"
              />
              <input
                type="number" min={0} max={200}
                value={state.pacer.captureThreshold}
                onChange={e => dispatch({ type: 'LOAD_SCENARIO', scenario: {
                  ...SCENARIOS[0],
                  rhythm: state.currentRhythm,
                  vitals: state.vitals,
                  captureThreshold: Number(e.target.value),
                  name: state.scenarioName,
                }})}
                className="w-16 bg-surface2 border border-ecg-border rounded px-1 py-0.5 text-xs text-white font-mono text-center"
              />
              <span className="text-[10px] text-ecg-gray font-mono">mA</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

function Toggle({ label, value, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-bold tracking-wide transition-colors ${
        value
          ? 'border-ecg-amber text-ecg-amber bg-amber-900/20'
          : 'border-ecg-border text-ecg-gray hover:border-ecg-gray'
      }`}
    >
      <span>{label}</span>
      <span>{value ? 'ON' : 'OFF'}</span>
    </button>
  )
}
