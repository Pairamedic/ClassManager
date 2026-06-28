import { useState } from 'react'
import { signIn, signUp, firebaseReady } from '../firebase'

// Animated ECG trace SVG — draws itself on mount via CSS animation
function EcgLogo({ size = 160 }) {
  return (
    <svg
      width={size}
      height={size * 0.42}
      viewBox="0 0 200 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="0,42 30,42 36,37 42,42 56,42 61,50 67,8 73,58 79,42 92,26 98,42 130,42 200,42"
        stroke="rgb(25 192 138)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="500"
        strokeDashoffset="500"
        style={{ animation: 'ecgDraw 1.6s cubic-bezier(.4,0,.2,1) forwards' }}
      />
    </svg>
  )
}

export default function LoginPage() {
  const [mode, setMode]         = useState('signin') // 'signin' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [err, setErr]           = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setErr('Email and password are required.'); return }
    if (mode === 'signup' && password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setBusy(true); setErr('')
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name.trim() || undefined)
      }
    } catch (e) {
      setErr(friendlyError(e.code))
    } finally { setBusy(false) }
  }

  function toggle() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setErr('')
  }

  return (
    <div className="min-h-screen bg-monitor-bg flex items-center justify-center p-4">
      <style>{`
        @keyframes ecgDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-card { animation: fadeUp .5s ease both; }
      `}</style>

      <div className="login-card w-full max-w-sm">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center mb-8">
          <EcgLogo size={180} />
          <h1 className="text-2xl font-black text-ink tracking-tight mt-3">
            CM <span className="text-ecg-green">Simulator</span>
          </h1>
          <p className="text-[11px] text-ecg-gray font-mono uppercase tracking-widest mt-1">
            Cardiac Monitor Simulator
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-ecg-border rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold text-ink uppercase tracking-widest mb-5">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>

          {!firebaseReady && (
            <div className="mb-4 p-3 rounded-lg bg-ecg-amber/10 border border-ecg-amber/40 text-[11px] text-ecg-amber">
              Firebase not configured — add <span className="font-mono">VITE_FIREBASE_*</span> keys to <span className="font-mono">.env</span> to enable login.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <Field label="Your name (optional)">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Smith"
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                className={inputCls}
              />
            </Field>

            {err && (
              <p className="text-[11px] text-ecg-red pt-1">{err}</p>
            )}

            <button
              type="submit"
              disabled={busy || !firebaseReady}
              className="w-full mt-2 py-3 rounded-xl border-2 border-ecg-green text-ecg-green font-bold text-sm uppercase tracking-widest bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-40 transition-all active:scale-95"
            >
              {busy ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-ecg-border text-center">
            <button
              onClick={toggle}
              className="text-[11px] text-ecg-gray hover:text-ink transition-colors"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-surface2 border border-ecg-border rounded-lg px-3 py-2.5 text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green transition-colors'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] text-ecg-green font-mono uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
