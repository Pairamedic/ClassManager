import { createContext, useContext, useState } from 'react'

const RoomCtx = createContext(null)

export function RoomProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null)
  const [role, setRole] = useState(null) // 'instructor' | 'student'
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  function leaveRoom() {
    setRoomCode(null)
    setRole(null)
    setConnected(false)
    setError(null)
  }

  return (
    <RoomCtx.Provider value={{ roomCode, setRoomCode, role, setRole, connected, setConnected, error, setError, leaveRoom }}>
      {children}
    </RoomCtx.Provider>
  )
}

export function useRoom() {
  const ctx = useContext(RoomCtx)
  if (!ctx) throw new Error('useRoom must be inside RoomProvider')
  return ctx
}
