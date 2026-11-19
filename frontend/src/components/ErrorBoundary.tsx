// PATH: frontend/src/components/ErrorBoundary.tsx
/**
 * React Error Boundary
 *
 * Catches unhandled JavaScript runtime exceptions in child components.
 * Prevents the application from crashing to a blank black screen.
 * Provides clear diagnostic reporting and one-click recovery.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ViralStudio ErrorBoundary] Uncaught render exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage restrictions
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {this.props.fallbackTitle || 'Studio Interface Encountered an Error'}
            </h2>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              An unexpected client error occurred while rendering the interface. No data was lost on the server.
            </p>

            <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 text-left mb-6 overflow-hidden">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                Diagnostic Trace
              </div>
              <div className="text-xs font-mono text-rose-300 break-words line-clamp-3">
                {this.state.error?.message || 'Unknown runtime exception'}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Studio
              </button>
              <button
                onClick={this.handleResetState}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                title="Clears cached client store state and reloads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
