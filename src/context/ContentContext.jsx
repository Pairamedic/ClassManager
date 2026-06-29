import { createContext, useContext, useEffect, useState } from 'react'
import { fbLoadContent } from '../firebase'

// Serves the medical content catalog (scenarios, algorithms, reversible causes)
// fetched from Firestore at runtime. The data no longer ships in the bundle, so
// this provider gates the app until the catalog has loaded — by the time any
// consumer renders, the content is guaranteed present and can be read
// synchronously, exactly like the old static imports.
const ContentCtx = createContext(null)

function Screen({ children, pulse }) {
  return (
    <div className="min-h-screen bg-monitor-bg flex items-center justify-center">
      <div className={`text-ecg-green font-mono text-xs uppercase tracking-widest text-center px-6${pulse ? ' animate-pulse' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let alive = true
    fbLoadContent()
      .then(data => { if (alive) setContent(data) })
      .catch(e => { if (alive) setError(e) })
    return () => { alive = false }
  }, [])

  if (error) {
    return <Screen>Content unavailable — {error.message}</Screen>
  }
  if (!content) {
    return <Screen pulse>Loading content…</Screen>
  }

  const reversibleCauses = content.reversibleCauses?.items || []
  const value = {
    scenarios:        content.scenarios?.items  || [],
    scenarioGroups:   content.scenarios?.groups || [],
    algorithms:       content.algorithms?.items || [],
    reversibleCauses,
    causeLabel: (id) => reversibleCauses.find(c => c.id === id)?.label || id,
  }

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>
}

export function useContent() {
  const ctx = useContext(ContentCtx)
  if (!ctx) throw new Error('useContent must be inside ContentProvider')
  return ctx
}
