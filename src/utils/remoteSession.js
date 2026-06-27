// Mode (monitor/remote) + room-code resolution from URL params or localStorage.
const MODE_KEY = 'acls_mode'
const ROOM_KEY = 'acls_room'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I

export function genRoom(len = 4) {
  let s = ''
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return s
}

export function readInitial() {
  let mode = null, room = null
  try {
    const p = new URLSearchParams(window.location.search)
    if (p.get('remote') != null) mode = 'remote'
    else if (p.get('monitor') != null) mode = 'monitor'
    else mode = localStorage.getItem(MODE_KEY)
    room = (p.get('room') || localStorage.getItem(ROOM_KEY) || '').toUpperCase() || null
  } catch {}
  return { mode: mode || null, room }
}

export function persist(mode, room) {
  try {
    if (mode) localStorage.setItem(MODE_KEY, mode)
    if (room) localStorage.setItem(ROOM_KEY, room)
  } catch {}
}

export function clearMode() {
  try { localStorage.removeItem(MODE_KEY) } catch {}
}
