import { useState } from 'react'
import { feedbackEnabled, setFeedbackEnabled } from '../utils/haptics'
import { feedbackTap } from '../utils/feedback'

// Mute/unmute button-press feedback (haptic buzz + quiet UI tick). Persists via
// localStorage. On iOS the buzz is unavailable, but the tick still plays.
export default function FeedbackToggle() {
  const [on, setOn] = useState(() => feedbackEnabled())

  function toggle() {
    const next = !on
    setFeedbackEnabled(next)
    setOn(next)
    if (next) feedbackTap() // confirm the newly-enabled state with a tap
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Button feedback on' : 'Button feedback off'}
      title={on ? 'Haptics / tap feedback: on' : 'Haptics / tap feedback: off'}
      className={`flex items-center justify-center w-8 min-h-[32px] text-[13px] leading-none rounded-lg border shrink-0 transition-colors ${
        on
          ? 'border-ecg-green/40 bg-ecg-green/15 text-ecg-green'
          : 'border-ecg-border bg-surface2 text-ecg-gray hover:text-ink'
      }`}
    >
      {on ? '📳' : '🔕'}
    </button>
  )
}
