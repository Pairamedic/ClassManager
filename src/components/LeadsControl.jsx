import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { limbLeadsConnected, limbLeadFault, limbLeadsPlacedCount } from '../data/leads'
import { feedbackTap } from '../utils/feedback'
import LeadsModal from './LeadsModal'

// Status button (below PACE) that opens the limb-lead placement task.
export default function LeadsControl() {
  const { state } = useSimulator()
  const [open, setOpen] = useState(false)

  const connected = limbLeadsConnected(state.leads)
  const fault = limbLeadFault(state.leads)
  const placed = limbLeadsPlacedCount(state.leads)

  const cls = connected
    ? 'bg-ecg-green text-black border-ecg-green'
    : fault
      ? 'bg-surface2 text-ecg-red border-ecg-red animate-pulse'
      : 'bg-surface2 text-ecg-gray border-ecg-border hover:border-ecg-blue hover:text-ecg-blue'

  const label = connected ? '✔ LIMB LEADS'
    : fault ? '⚠ LEAD FAULT'
    : `CONNECT LEADS${placed ? ` (${placed}/4)` : ''}`

  return (
    <>
      <button
        onClick={() => { feedbackTap(); setOpen(true) }}
        className={`w-full min-h-[40px] rounded font-bold text-xs tracking-widest uppercase border-2 transition-all active:scale-95 ${cls}`}
      >
        {label}
      </button>
      {open && <LeadsModal onClose={() => setOpen(false)} />}
    </>
  )
}
