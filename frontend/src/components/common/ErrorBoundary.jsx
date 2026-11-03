import React, { Component } from 'react';
import { ShieldAlert, RefreshCw, LayoutDashboard, AlertCircle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="glass-panel max-w-xl w-full p-6 sm:p-8 rounded-2xl border border-red-500/30 bg-space-900/90 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-red-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {this.props.title || 'Component Telemetry Interrupted'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {this.props.description || 'An unexpected rendering error occurred in this view. FireSync isolated the failure to prevent application downtime.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800 text-left space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{this.state.error.name || 'Error'}: {this.state.error.message || 'Unknown error'}</span>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-500 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap pt-1 border-t border-slate-900">
                    {this.state.errorInfo.componentStack.trim()}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-fire-600 hover:bg-fire-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-fire-600/25 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry View</span>
              </button>

              {this.props.onNavigateDashboard && (
                <button
                  onClick={this.props.onNavigateDashboard}
                  className="px-4 py-2.5 rounded-xl bg-space-900 hover:bg-space-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
