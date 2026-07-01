import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen bg-monitor-bg flex items-center justify-center p-6">
        <div className="max-w-lg w-full font-mono text-xs text-ecg-green">
          <div className="uppercase tracking-widest mb-2">Something went wrong</div>
          <pre className="whitespace-pre-wrap break-words opacity-80">
            {error.message || String(error)}
          </pre>
          <button
            className="mt-4 px-3 py-1 border border-ecg-green/50 uppercase tracking-widest hover:bg-ecg-green/10"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
