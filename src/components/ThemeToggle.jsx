import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [light, setLight] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('acls_theme') === 'light'
  )

  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('theme-light', light)
    el.classList.toggle('theme-dark', !light)
    try { localStorage.setItem('acls_theme', light ? 'light' : 'dark') } catch {}
  }, [light])

  // Two discrete buttons instead of a sliding knob — nothing floats outside the
  // control, so it can't overlap the neighbouring header buttons when the bar
  // wraps on narrow phones.
  const base = 'flex items-center justify-center w-8 min-h-[32px] text-[13px] leading-none transition-colors'
  const on   = 'text-ecg-green bg-ecg-green/15'
  const off  = 'text-ecg-gray hover:text-ink'

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center shrink-0 rounded-lg border border-ecg-border bg-surface2 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setLight(true)}
        aria-pressed={light}
        aria-label="Light theme"
        className={`${base} ${light ? on : off}`}
      >
        ☀
      </button>
      <span className="w-px self-stretch bg-ecg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLight(false)}
        aria-pressed={!light}
        aria-label="Dark theme"
        className={`${base} ${!light ? on : off}`}
      >
        ☾
      </button>
    </div>
  )
}
