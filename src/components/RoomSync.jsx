import { useEffect, useRef } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useRoom } from '../context/RoomContext'
import { pushInstructorState, subscribeRoom } from '../firebase'

// Invisible component — runs inside SimulatorProvider to sync room state
export default function RoomSync() {
  const { state, dispatch } = useSimulator()
  const { roomCode, role, setConnected } = useRoom()
  const debounceRef = useRef(null)
  const unsubRef = useRef(null)

  // Instructor: debounce-push state to Firestore on every state change
  useEffect(() => {
    if (role !== 'instructor' || !roomCode) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushInstructorState(roomCode, state).catch(() => {})
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [state, role, roomCode])

  // Student: subscribe to instructor state from Firestore
  useEffect(() => {
    if (role !== 'student' || !roomCode) return
    if (unsubRef.current) unsubRef.current()

    unsubRef.current = subscribeRoom(roomCode, instructorState => {
      setConnected(true)
      dispatch({ type: 'APPLY_INSTRUCTOR_STATE', payload: instructorState })
    })

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    }
  }, [role, roomCode])

  return null
}
