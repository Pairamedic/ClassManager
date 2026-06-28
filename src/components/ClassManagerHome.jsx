import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../firebase'

export default function ClassManagerHome({ onLaunchSimulator, onLaunchRemote }) {
  const { user } = useAuth()
  const [showRemote, setShowRemote] = useState(false)
  const [code, setCode] = useState('')

  function handleRemote() {
    const c = code.trim().toUpperCase()
    if (c.length < 3) return
    onLaunchRemote(c)
  }

  return (
    <div className="min-h-screen flex flex-col bg-monitor-bg text-ink">

      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-ecg-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-ecg-green font-mono font-bold text-lg tracking-widest">CM</div>
          <div>
            <div className="text-sm font-bold text-ink leading-tight">Class Manager</div>
            <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest">ACLS Instructor Platform</div>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-ecg-gray font-mono hidden sm:inline">{user.displayName || user.email}</span>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-ecg-green/20 border border-ecg-green/40 text-ecg-green text-[11px] font-bold uppercase hover:bg-ecg-red/20 hover:border-ecg-red/40 hover:text-ecg-red transition-colors"
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 gap-6 max-w-lg mx-auto w-full">

        {/* Welcome */}
        <div className="text-center pt-4">
          <div className="text-ecg-green text-2xl font-mono font-bold tracking-widest">
            {user?.displayName ? `Welcome, ${user.displayName}` : 'Class Manager'}
          </div>
          <div className="text-ecg-gray text-xs font-mono uppercase tracking-[0.3em] mt-1">
            ACLS Instructor Platform
          </div>
        </div>

        {/* ── TOOLS ── */}
        <div className="w-full space-y-3">

          <div className="text-[10px] text-ecg-gray font-mono uppercase tracking-[0.25em] pb-1">Tools</div>

          {/* Cardiac Monitor Simulator */}
          <button
            onClick={onLaunchSimulator}
            className="w-full rounded-2xl border-2 border-ecg-green bg-surface text-left px-5 py-4 hover:bg-ecg-green/10 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-ecg-green text-2xl">♥</div>
              <div>
                <div className="text-base font-bold text-ecg-green">Cardiac Monitor Simulator</div>
                <div className="text-[11px] text-ecg-gray mt-0.5">
                  Full ACLS rhythm simulator with defibrillator, pacer, and debrief metrics
                </div>
              </div>
            </div>
          </button>

          {/* Remote / Phone control */}
          {!showRemote ? (
            <button
              onClick={() => setShowRemote(true)}
              className="w-full rounded-2xl border-2 border-ecg-blue bg-surface text-left px-5 py-4 hover:bg-ecg-blue/10 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-ecg-blue text-2xl">📱</div>
                <div>
                  <div className="text-base font-bold text-ecg-blue">Join as Remote</div>
                  <div className="text-[11px] text-ecg-gray mt-0.5">
                    Use this device as a phone controller for a monitor in the room
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className="w-full rounded-2xl border-2 border-ecg-blue bg-surface px-5 py-4 space-y-3">
              <div className="text-[11px] text-ecg-gray uppercase tracking-widest">Enter the room code shown on the monitor</div>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleRemote()}
                placeholder="ABCD"
                maxLength={6}
                autoFocus
                className="w-full min-h-[52px] text-center text-2xl font-mono font-bold tracking-[0.4em] rounded-xl bg-surface2 border border-ecg-blue text-ink focus:outline-none uppercase"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRemote(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-ecg-border text-ecg-gray text-sm hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemote}
                  disabled={code.trim().length < 3}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-ecg-blue bg-ecg-blue/10 text-ecg-blue font-bold uppercase tracking-widest disabled:opacity-40 active:scale-[0.99] transition-all"
                >
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
