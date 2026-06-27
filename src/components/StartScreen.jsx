import { useState } from 'react'
import { realtimeReady } from '../firebase'
import { genRoom } from '../utils/remoteSession'

export default function StartScreen({ onChoose, initialRoom }) {
  const [view, setView] = useState(null) // null | 'remote'
  const [code, setCode] = useState(initialRoom || '')

  function startMonitor() {
    onChoose('monitor', realtimeReady ? (initialRoom || genRoom()) : null)
  }
  function startRemote() {
    const c = code.trim().toUpperCase()
    if (c.length < 3) return
    onChoose('remote', c)
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-monitor-bg text-ink">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-ecg-green text-3xl font-mono font-bold tracking-widest">ACLS</div>
          <div className="text-ecg-gray text-xs font-mono uppercase tracking-[0.3em] mt-1">Rhythm Simulator</div>
        </div>

        {view !== 'remote' ? (
          <div className="space-y-3">
            <button
              onClick={startMonitor}
              className="w-full min-h-[64px] rounded-2xl border-2 border-ecg-green bg-surface text-left px-5 hover:bg-ecg-green/10 active:scale-[0.99] transition-all"
            >
              <div className="text-base font-bold text-ecg-green">Monitor</div>
              <div className="text-[11px] text-ecg-gray">This device shows the patient monitor (the student screen)</div>
            </button>

            <button
              onClick={() => setView('remote')}
              disabled={!realtimeReady}
              className={`w-full min-h-[64px] rounded-2xl border-2 text-left px-5 transition-all active:scale-[0.99] ${
                realtimeReady
                  ? 'border-ecg-blue bg-surface text-ink hover:bg-ecg-blue/10'
                  : 'border-ecg-border bg-surface text-ecg-gray opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="text-base font-bold text-ecg-blue">Remote Control</div>
              <div className="text-[11px] text-ecg-gray">This device (your phone) controls the monitor</div>
            </button>

            {!realtimeReady && (
              <p className="text-[11px] text-ecg-amber text-center pt-2 leading-snug">
                Remote control needs Firebase Realtime Database configured
                (<span className="font-mono">VITE_FIREBASE_DATABASE_URL</span>).
                The monitor still works on its own.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-[11px] text-ecg-gray uppercase tracking-widest">
              Enter the code shown on the monitor
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && startRemote()}
              placeholder="ABCD"
              maxLength={6}
              autoFocus
              className="w-full min-h-[60px] text-center text-2xl font-mono font-bold tracking-[0.4em] rounded-2xl bg-surface border-2 border-ecg-blue text-ink focus:outline-none uppercase"
            />
            <button
              onClick={startRemote}
              disabled={code.trim().length < 3}
              className="w-full min-h-[52px] rounded-2xl border-2 border-ecg-blue bg-ecg-blue/10 text-ecg-blue font-bold uppercase tracking-widest disabled:opacity-40 active:scale-[0.99] transition-all"
            >
              Connect
            </button>
            <button
              onClick={() => setView(null)}
              className="w-full text-[11px] text-ecg-gray hover:text-ink py-2"
            >
              ‹ Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
