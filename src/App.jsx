import { useState } from 'react'
import { SimulatorProvider } from './context/SimulatorContext'
import { RoomProvider } from './context/RoomContext'
import ACLSSimulator from './components/ACLSSimulator'
import RoomSync from './components/RoomSync'
import StartScreen from './components/StartScreen'
import RemoteControl from './components/RemoteControl'
import { useRemoteSync } from './hooks/useRemoteSync'
import { readInitial, persist, clearMode } from './utils/remoteSession'

function MonitorHost({ room, onExit }) {
  useRemoteSync(room)
  return (
    <RoomProvider>
      <RoomSync />
      <ACLSSimulator remoteRoom={room} onExitMode={onExit} />
    </RoomProvider>
  )
}

export default function App() {
  const [{ mode, room }, setSession] = useState(() => readInitial())

  function choose(nextMode, nextRoom) {
    persist(nextMode, nextRoom)
    setSession({ mode: nextMode, room: nextRoom || null })
  }
  function exit() {
    clearMode()
    setSession(s => ({ mode: null, room: s.room }))
  }

  if (!mode) return <StartScreen onChoose={choose} initialRoom={room} />

  if (mode === 'remote') return <RemoteControl room={room} onExit={exit} />

  return (
    <SimulatorProvider>
      <MonitorHost room={room} onExit={exit} />
    </SimulatorProvider>
  )
}
