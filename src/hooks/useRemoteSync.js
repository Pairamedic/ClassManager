import { useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { realtimeReady, rtSubscribeCommands, rtPublishState } from '../firebase'

// Monitor-side bridge: apply commands coming from the phone remote, and
// publish a status snapshot the remote can mirror. No-op without a room.
export function useRemoteSync(room) {
  const { state, dispatch } = useSimulator()

  // Apply incoming commands (reducer actions) from the remote.
  useEffect(() => {
    if (!room || !realtimeReady) return
    let unsub
    try {
      unsub = rtSubscribeCommands(room, (action) => {
        if (action && typeof action.type === 'string') dispatch(action)
      })
    } catch { /* realtime not available */ }
    return () => { try { unsub && unsub() } catch {} }
  }, [room, dispatch])

  // Publish a status snapshot whenever relevant state changes.
  useEffect(() => {
    if (!room || !realtimeReady) return
    const snapshot = {
      currentRhythm: state.currentRhythm,
      vitals: state.vitals,
      vitalsHidden: state.vitalsHidden,
      labelHidden: state.labelHidden,
      isRunning: state.isRunning,
      scenarioName: state.scenarioName ?? null,
      rosc: state.rosc,
      reversibleCauses: state.reversibleCauses,
      captureThreshold: state.pacer.captureThreshold,
      shocks: state.defib.shocksDelivered,
      padsConnected: state.defib.padsConnected,
      pacerActive: state.pacer.active,
      cprActive: state.cpr.active,
      cprCycles: state.cpr.cycleCount,
      medCount: state.medications.length,
      lastMed: state.medications[0] ?? null,
      updatedAt: Date.now(),
    }
    try { rtPublishState(room, snapshot) } catch {}
  }, [
    room,
    state.currentRhythm, state.vitals, state.vitalsHidden, state.labelHidden,
    state.isRunning, state.scenarioName, state.rosc, state.reversibleCauses,
    state.pacer.captureThreshold, state.defib.shocksDelivered, state.defib.padsConnected,
    state.pacer.active, state.cpr.active, state.cpr.cycleCount, state.medications,
  ])
}
