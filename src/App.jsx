import { AuthProvider, useAuth } from './context/AuthContext'
import { SimulatorProvider } from './context/SimulatorContext'
import { ContentProvider } from './context/ContentContext'
import ACLSSimulator from './components/ACLSSimulator'
import LoginPage from './components/LoginPage'
import UpdatePrompt from './components/UpdatePrompt'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-monitor-bg flex items-center justify-center">
        <div className="text-ecg-green font-mono text-xs uppercase tracking-widest animate-pulse">
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <SimulatorProvider>
      <ContentProvider>
        <ACLSSimulator />
      </ContentProvider>
    </SimulatorProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <UpdatePrompt />
    </AuthProvider>
  )
}
