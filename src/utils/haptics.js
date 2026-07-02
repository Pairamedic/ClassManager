// Light tactile feedback via the Web Vibration API.
//
// NOTE: iOS Safari does NOT support navigator.vibrate — Apple blocks it — so
// iPhones/iPads will not buzz. Callers should pair these with a short UI tick
// sound (see feedback.js) so there is some feedback on every platform. A single
// user-facing "Feedback" toggle mutes both haptics and the tick.

let enabled = true
try { enabled = localStorage.getItem('cm_feedback') !== 'off' } catch { /* private mode */ }

export function feedbackEnabled() { return enabled }

export function setFeedbackEnabled(on) {
  enabled = !!on
  try { localStorage.setItem('cm_feedback', enabled ? 'on' : 'off') } catch { /* ignore */ }
}

function vibrate(pattern) {
  if (!enabled) return
  try { navigator.vibrate?.(pattern) } catch { /* unsupported */ }
}

export function tapHaptic()     { vibrate(10) }          // light control tap (steppers, toggles)
export function bumpHaptic()    { vibrate(20) }          // firmer confirm (pace, shock)
export function successHaptic() { vibrate([12, 40, 12]) } // task completed (leads connected)
export function errorHaptic()   { vibrate([40, 30, 40]) } // fault (wrong lead placement)
