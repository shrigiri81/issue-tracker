import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Pulse Application Error Boundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-[Inter,sans-serif]">
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-[#e5eeff] p-8 shadow-2xl flex flex-col items-center text-center"
            style={{ boxShadow: '0 20px 60px rgba(11,28,48,0.08)' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[30px]">error</span>
            </div>

            <h1 className="text-[20px] font-bold text-[#0b1c30] tracking-tight font-[Geist,sans-serif]">
              Something went wrong
            </h1>
            <p className="text-[13px] text-[#565e74] mt-2 leading-relaxed max-w-md">
              An unexpected render issue occurred. The application has safely caught the error to protect your workspace.
            </p>

            {this.state.error && (
              <div className="w-full mt-4 p-3 bg-[#eff4ff] rounded-xl text-left border border-[#dce9ff] overflow-x-auto">
                <div className="text-[11px] font-semibold text-[#4450b7] uppercase tracking-wider mb-1 font-[Geist,sans-serif]">
                  Error Details
                </div>
                <code className="text-[12px] text-[#ba1a1a] font-mono break-all block">
                  {this.state.error.message || String(this.state.error)}
                </code>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6 w-full sm:w-auto">
              <button
                onClick={this.handleReload}
                className="flex-1 sm:flex-initial h-9 px-4 bg-[#4450b7] hover:bg-[#3540a0] text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] font-[Geist,sans-serif]"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 sm:flex-initial h-9 px-4 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[13px] font-medium rounded-xl flex items-center justify-center gap-1.5 border border-[#c6c5d5]/60 transition-all font-[Geist,sans-serif]"
              >
                <span className="material-symbols-outlined text-[16px]">home</span>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
