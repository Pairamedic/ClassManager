import { useState, useRef, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { RHYTHMS } from '../data/rhythms'

function map(sbp, dbp) {
  return Math.round(dbp + (sbp - dbp) / 3)
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

// Auto-focusing inline editor used when a vital tile is tapped.
function VitalInput({ value, onChange, onCommit, onCancel, width = 'w-16', text = 'text-3xl', mode = 'numeric' }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <input
      ref={ref}
      value={value}
      inputMode={mode}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); onCommit() }
        else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
      className={`${width} ${text} bg-surface2 border border-ecg-green rounded px-1 py-0 font-bold font-mono text-ink text-center focus:outline-none`}
    />
  )
}

function VitalTile({ label, children, color = 'text-ecg-green', hidden, editable, isEditing, onEdit, className = '' }) {
  // Whole tile becomes the tap target. Rendered as a real <button> so taps
  // fire reliably on touch devices (iOS Safari ignores click on plain divs).
  const clickable = editable && !hidden && !isEditing

  const inner = (
    <>
      <span className="text-[9px] font-mono uppercase tracking-widest text-ecg-gray leading-none">{label}</span>
      {/* Fixed-height value row so every tile's number sits on the same baseline.
          min-w-0 + overflow-hidden keep a wide reading (e.g. blood pressure) from
          spilling into the neighbouring tile on narrow screens. */}
      <div className={`flex items-baseline h-9 min-w-0 overflow-hidden font-bold font-mono leading-none ${color}`}>
        {hidden ? (
          <span className="text-2xl sm:text-3xl lg:text-4xl">--</span>
        ) : children}
      </div>
    </>
  )

  const base = `flex flex-col justify-between p-2 border-r border-ecg-border last:border-r-0 min-w-0 ${className}`

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onEdit}
        title="Tap to edit"
        className={`${base} text-left cursor-pointer hover:bg-ecg-green/5 transition-colors`}
      >
        {inner}
      </button>
    )
  }

  return <div className={base}>{inner}</div>
}

export default function VitalsDisplay() {
  const { state, dispatch } = useSimulator()
  const { vitals: v, vitalsHidden: h, currentRhythm } = state
  const rhythm = RHYTHMS[currentRhythm] || RHYTHMS.NSR

  const [editing, setEditing] = useState(null) // 'hr' | 'bp' | 'spo2' | 'etco2' | 'temp'
  const [draft, setDraft] = useState('')

  const displayHR = rhythm.pulse ? (v.hr || rhythm.rate) : 0
  const hrColor = displayHR === 0 ? 'text-ecg-red' : displayHR > 100 ? 'text-ecg-amber' : displayHR < 60 ? 'text-ecg-blue' : 'text-ecg-green'
  const spo2Color = v.spo2 < 90 ? 'text-ecg-red' : v.spo2 < 94 ? 'text-ecg-amber' : 'text-ecg-blue'
  const bpColor = v.sbp === 0 ? 'text-ecg-red' : v.sbp < 90 ? 'text-ecg-amber' : 'text-ecg-green'

  function startEdit(field, initial) {
    if (h) return
    setDraft(String(initial))
    setEditing(field)
  }
  function cancel() { setEditing(null) }

  function commit() {
    const d = draft.trim()
    switch (editing) {
      case 'hr': {
        const n = parseInt(d, 10)
        if (!isNaN(n)) dispatch({ type: 'SET_HR', hr: clamp(n, 0, 300) })
        break
      }
      case 'bp': {
        const m = d.match(/^(\d+)\s*\/\s*(\d+)$/)
        if (m) dispatch({ type: 'SET_VITALS', vitals: { sbp: clamp(+m[1], 0, 300), dbp: clamp(+m[2], 0, 250) } })
        else if (/^\d+$/.test(d)) dispatch({ type: 'SET_VITALS', vitals: { sbp: clamp(+d, 0, 300) } })
        break
      }
      case 'spo2': {
        const n = parseInt(d, 10)
        if (!isNaN(n)) dispatch({ type: 'SET_VITALS', vitals: { spo2: clamp(n, 0, 100) } })
        break
      }
      case 'etco2': {
        const n = parseInt(d, 10)
        if (!isNaN(n)) dispatch({ type: 'SET_VITALS', vitals: { etco2: clamp(n, 0, 150) } })
        break
      }
      case 'temp': {
        const n = parseFloat(d)
        if (!isNaN(n)) dispatch({ type: 'SET_VITALS', vitals: { temp: clamp(n, 70, 115) } })
        break
      }
    }
    setEditing(null)
  }

  const editorProps = {
    value: draft,
    onChange: setDraft,
    onCommit: commit,
    onCancel: cancel,
  }

  return (
    <div className="flex shrink-0 bg-surface border-t border-ecg-border" style={{ minHeight: 72 }}>

      {/* HR */}
      <VitalTile label="HR" color={hrColor} hidden={h} className="flex-1" editable isEditing={editing === 'hr'} onEdit={() => startEdit('hr', displayHR)}>
        {editing === 'hr' ? (
          <VitalInput {...editorProps} width="w-16" />
        ) : (
          <>
            <span className="text-2xl sm:text-3xl lg:text-4xl">{displayHR}</span>
            <span className="text-[11px] text-ecg-gray font-mono ml-1">bpm</span>
          </>
        )}
      </VitalTile>

      {/* NIBP */}
      <VitalTile label="NIBP" color={bpColor} hidden={h} className="flex-[1.4]" editable isEditing={editing === 'bp'} onEdit={() => startEdit('bp', `${v.sbp}/${v.dbp}`)}>
        {editing === 'bp' ? (
          <VitalInput {...editorProps} width="w-24" text="text-2xl" mode="text" />
        ) : (
          <>
            <span className="text-2xl sm:text-3xl lg:text-4xl">{v.sbp}</span>
            <span className="text-lg sm:text-xl lg:text-2xl text-ecg-gray mx-0.5">/</span>
            <span className="text-xl sm:text-2xl lg:text-3xl">{v.dbp}</span>
            <span className="text-[10px] text-ecg-gray font-mono ml-1 whitespace-nowrap">
              ({map(v.sbp, v.dbp)}) mmHg
            </span>
          </>
        )}
      </VitalTile>

      {/* SpO2 */}
      <VitalTile label="SpO₂" color={spo2Color} hidden={h} className="flex-1" editable isEditing={editing === 'spo2'} onEdit={() => startEdit('spo2', v.spo2)}>
        {editing === 'spo2' ? (
          <VitalInput {...editorProps} width="w-16" />
        ) : (
          <>
            <span className="text-2xl sm:text-3xl lg:text-4xl">{v.spo2}</span>
            <span className="text-base ml-0.5">%</span>
          </>
        )}
      </VitalTile>

      {/* EtCO2 */}
      <VitalTile label="EtCO₂" color="text-ecg-amber" hidden={h} className="flex-1" editable isEditing={editing === 'etco2'} onEdit={() => startEdit('etco2', v.etco2)}>
        {editing === 'etco2' ? (
          <VitalInput {...editorProps} width="w-16" />
        ) : (
          <>
            <span className="text-2xl sm:text-3xl lg:text-4xl">{v.etco2}</span>
            <span className="text-[11px] text-ecg-gray font-mono ml-1">mmHg</span>
          </>
        )}
      </VitalTile>

      {/* Temp */}
      <VitalTile label="Temp" color="text-ecg-gray" hidden={h} className="flex-1" editable isEditing={editing === 'temp'} onEdit={() => startEdit('temp', v.temp.toFixed(1))}>
        {editing === 'temp' ? (
          <VitalInput {...editorProps} width="w-20" text="text-2xl" mode="decimal" />
        ) : (
          <>
            <span className="text-2xl sm:text-3xl lg:text-4xl">{v.temp.toFixed(1)}</span>
            <span className="text-base ml-0.5">°F</span>
          </>
        )}
      </VitalTile>

    </div>
  )
}
