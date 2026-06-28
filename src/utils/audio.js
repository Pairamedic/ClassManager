let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function beep(freq, duration, type = 'sine', gainVal = 0.3) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime)
    gain.gain.setValueAtTime(gainVal, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch {}
}

export function playQRSBeep() {
  beep(880, 0.08, 'sine', 0.15)
}

export function playChargeSound() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ac.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ac.currentTime + 1.5)
    gain.gain.setValueAtTime(0.2, ac.currentTime)
    gain.gain.setValueAtTime(0.2, ac.currentTime + 1.4)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.55)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 1.55)
  } catch {}
}

export function playShockSound() {
  try {
    const ac = getCtx()
    const bufSize = ac.sampleRate * 0.3
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.12))
    }
    const src = ac.createBufferSource()
    const gain = ac.createGain()
    src.buffer = buf
    src.connect(gain)
    gain.connect(ac.destination)
    gain.gain.setValueAtTime(0.8, ac.currentTime)
    src.start(ac.currentTime)
  } catch {}
}

export function playAlertBeep() {
  beep(440, 0.15, 'square', 0.2)
}

export function playPacingClick() {
  beep(1200, 0.03, 'square', 0.12)
}

// CPR metronome tick. accent=true marks the downbeat of a cycle.
export function playMetronomeClick(accent = false) {
  beep(accent ? 1500 : 1000, 0.035, 'square', accent ? 0.22 : 0.16)
}

export function resumeAudio() {
  try { getCtx().resume() } catch {}
}

export function speak(text, { rate = 0.88, pitch = 0.9 } = {}) {
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate  = rate
    u.pitch = pitch
    window.speechSynthesis.speak(u)
  } catch {}
}
