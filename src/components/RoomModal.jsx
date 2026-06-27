import { useState } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useRoom } from '../context/RoomContext'
import { firebaseReady, generateRoomCode, createRoom, roomExists } from '../firebase'

export default function RoomModal({ onClose }) {
  const { state } = useSimulator()
  const { roomCode, role, connected, setRoomCode, setRole, setConnected, leaveRoom } = useRoom()
  const [tab, setTab] = useState(role ? 'status' : 'create')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Already in a room — show status
  if (roomCode && role) {
    return (
      <Modal onClose={onClose}>
        <div className="space-y-5">
          <div className="text-center">
            <div className={`inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${
              role === 'instructor' ? 'bg-ecg-amber/20 text-ecg-amber border border-ecg-amber/40' : 'bg-ecg-green/20 text-ecg-green border border-ecg-green/40'
            }`}>
              {role === 'instructor' ? 'Instructor' : 'Student'}
            </div>

            <div className="text-5xl font-mono font-black text-ink tracking-[0.2em] mb-1">{roomCode}</div>
            <div className="text-[11px] text-ecg-gray">
              {role === 'instructor'
                ? 'Share this code with students to join your session'
                : connected ? 'Connected to instructor' : 'Connecting…'}
            </div>
          </div>

          {role === 'instructor' && (
            <div className="bg-surface2 border border-ecg-border rounded-lg p-3 text-[11px] text-ecg-gray space-y-1">
              <p>Your rhythm, vitals, and scenario changes push to students in real time.</p>
              <p>Students can operate the defib and pacer independently.</p>
            </div>
          )}

          {role === 'student' && (
            <div className="bg-surface2 border border-ecg-border rounded-lg p-3 text-[11px] text-ecg-gray space-y-1">
              <p>Rhythm and vitals are controlled by your instructor.</p>
              <p>You can operate the defib, pacer, and CPR timer.</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { leaveRoom(); onClose() }}
              className="flex-1 py-2.5 rounded-lg border border-ecg-red/50 text-ecg-red text-xs font-bold hover:bg-ecg-red/10 transition-colors"
            >
              Leave Room
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-ecg-border text-ecg-gray text-xs font-bold hover:border-ecg-gray transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  if (!firebaseReady) {
    return (
      <Modal onClose={onClose}>
        <div className="space-y-4 text-center">
          <div className="text-2xl">🔒</div>
          <p className="text-sm font-bold text-ink">Firebase not configured</p>
          <p className="text-[11px] text-ecg-gray leading-relaxed">
            Add your <span className="font-mono text-ink">VITE_FIREBASE_*</span> keys to <span className="font-mono text-ink">.env</span> to enable real-time instructor/student rooms.
          </p>
          <p className="text-[11px] text-ecg-gray">
            The simulator works standalone without Firebase.
          </p>
          <button onClick={onClose} className="w-full py-2.5 border border-ecg-border rounded-lg text-xs font-bold text-ecg-gray hover:border-ecg-gray">Close</button>
        </div>
      </Modal>
    )
  }

  async function handleCreate() {
    setBusy(true); setErr('')
    try {
      const code = generateRoomCode()
      await createRoom(code, state)
      setRoomCode(code)
      setRole('instructor')
      setConnected(true)
      onClose()
    } catch (e) {
      setErr('Could not create room: ' + e.message)
    } finally { setBusy(false) }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 4) { setErr('Enter the 4-character room code.'); return }
    setBusy(true); setErr('')
    try {
      const exists = await roomExists(code)
      if (!exists) { setErr('Room not found. Check the code and try again.'); setBusy(false); return }
      setRoomCode(code)
      setRole('student')
      onClose()
    } catch (e) {
      setErr('Could not join room: ' + e.message)
    } finally { setBusy(false) }
  }

  const tabCls = t => `flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-colors ${
    tab === t ? 'bg-surface2 text-ink border-ecg-green' : 'border-ecg-border text-ecg-gray hover:text-ink'
  }`

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-1.5">
          <button className={tabCls('create')} onClick={() => { setTab('create'); setErr('') }}>
            Instructor
          </button>
          <button className={tabCls('join')} onClick={() => { setTab('join'); setErr('') }}>
            Student
          </button>
        </div>

        {tab === 'create' ? (
          <div className="space-y-3">
            <p className="text-[11px] text-ecg-gray leading-relaxed">
              Create a room. Students join with the 4-letter code you share. Your rhythm, vitals, and scenario changes push to their screens in real time.
            </p>
            {err && <p className="text-[11px] text-ecg-red">{err}</p>}
            <button
              onClick={handleCreate}
              disabled={busy}
              className="w-full py-3 rounded-lg border-2 border-ecg-amber text-ecg-amber font-bold text-sm uppercase tracking-widest bg-surface2 hover:bg-ecg-amber hover:text-black disabled:opacity-40 transition-all active:scale-95"
            >
              {busy ? 'Creating…' : 'Create Room (Instructor)'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-ecg-gray leading-relaxed">
              Enter the room code your instructor shared. The monitor will sync to their controls.
            </p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ABCD"
              maxLength={4}
              className="w-full text-center text-3xl font-mono font-black tracking-[0.3em] bg-surface2 border border-ecg-border rounded-lg py-3 text-ink placeholder-ecg-border focus:outline-none focus:border-ecg-green uppercase"
            />
            {err && <p className="text-[11px] text-ecg-red">{err}</p>}
            <button
              onClick={handleJoin}
              disabled={busy || joinCode.length !== 4}
              className="w-full py-3 rounded-lg border-2 border-ecg-green text-ecg-green font-bold text-sm uppercase tracking-widest bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-40 transition-all active:scale-95"
            >
              {busy ? 'Joining…' : 'Join Room (Student)'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Room</h2>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-xl leading-none px-1">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
