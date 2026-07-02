// Unified button feedback: a haptic buzz (Android) paired with a quiet UI tick
// (works everywhere, incl. iOS where vibration is blocked). One "Feedback"
// setting gates both; see haptics.js. Call these from button handlers.
import {
  feedbackEnabled,
  tapHaptic, bumpHaptic, successHaptic, errorHaptic,
} from './haptics'
import { playUITick, resumeAudio } from './audio'

export function feedbackTap() {
  if (!feedbackEnabled()) return
  resumeAudio()
  playUITick()
  tapHaptic()
}

export function feedbackBump() {
  if (!feedbackEnabled()) return
  resumeAudio()
  playUITick()
  bumpHaptic()
}

// Outcome cues — haptic only (paired sounds are handled by the caller, e.g. the
// charge/shock/capture tones), so these don't double up on audio.
export function feedbackSuccess() { if (feedbackEnabled()) successHaptic() }
export function feedbackFault()   { if (feedbackEnabled()) errorHaptic() }
