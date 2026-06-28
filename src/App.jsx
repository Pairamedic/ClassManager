import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SimulatorProvider } from './context/SimulatorContext'
import { RoomProvider } from './context/RoomContext'
import ACLSSimulator from './components/ACLSSimulator'
import RoomSync from './components/RoomSync'
import ClassManagerHome from './components/ClassManagerHome'
import RemoteControl from './components/RemoteControl'
import LoginPage from './components/LoginPage'
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

function AppInner() {
  const { user, loading } = useAuth()
  const [{ mode, room }, setSession] = useState(() => readInitial())

  function choose(nextMode, nextRoom) {
    persist(nextMode, nextRoom)
    setSession({ mode: nextMode, room: nextRoom || null })
  }
  function exit() {
    clearMode()
    setSession(s => ({ mode: null, room: s.room }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-monitor-bg flex items-center justify-center">
        <div className="text-ecg-green font-mono text-xs uppercase tracking-widest animate-pulse">
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (!mode) return (
    <ClassManagerHome
      onLaunchSimulator={() => choose('monitor', null)}
      onLaunchRemote={(code) => choose('remote', code)}
    />
  )

  if (mode === 'remote') return <RemoteControl room={room} onExit={exit} />

  return (
    <SimulatorProvider>
      <MonitorHost room={room} onExit={exit} />
    </SimulatorProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
