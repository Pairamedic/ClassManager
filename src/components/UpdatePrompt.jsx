import { useRegisterSW } from 'virtual:pwa-register/react'

// Toast shown when a newer deploy is available. With registerType: 'prompt'
// the new service worker waits until the user taps "Update", so an in-progress
// code is never reloaded out from under them.
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh:  [needRefresh,  setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // While the app stays open, poll hourly so a fresh deploy is noticed
      // without the user having to fully relaunch.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  if (!offlineReady && !needRefresh) return null

  function close() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 max-w-sm w-full bg-surface border border-ecg-border rounded-xl shadow-2xl px-4 py-3">
        <span className="text-ecg-green text-lg leading-none">↻</span>
        <span className="flex-1 text-[12px] text-ink">
          {needRefresh
            ? 'A new version of CM Simulator is available.'
            : 'CM Simulator is ready to work offline.'}
        </span>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 rounded-lg border border-ecg-green text-ecg-green text-[11px] font-bold uppercase tracking-widest hover:bg-ecg-green hover:text-black active:scale-95 transition-all"
          >
            Update
          </button>
        )}
        <button
          onClick={close}
          className="px-2 py-1.5 text-ecg-gray hover:text-ink text-[11px] font-bold uppercase tracking-widest"
        >
          {needRefresh ? 'Later' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}
