import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldCheck, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  isRootBoundary?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [RAVINI ErrorBoundary Caught Runtime Exception]:', error);
    console.error('📍 Component Stack Trace:', errorInfo.componentStack);
    this.setState({ errorInfo });

    // Store diagnostic report in sessionStorage for admin inspection
    try {
      if (typeof window !== 'undefined') {
        const report = {
          timestamp: new Date().toISOString(),
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        sessionStorage.setItem('ravini_last_error_diagnostic', JSON.stringify(report));
      }
    } catch {
      // Ignore storage errors
    }
  }

  handleRetry = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.warn('onReset callback error:', err);
      }
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch {
      this.handleRetry();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        // Clear session keys only, preserve permanent users/posts
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          }).catch(() => {});
        }
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { isRootBoundary = true } = this.props;

      return (
        <div
          id="ravini-error-boundary-screen"
          className={`flex flex-col items-center justify-center p-4 sm:p-6 text-gray-900 bg-[#F8FAFC] ${
            isRootBoundary ? 'min-h-screen w-full' : 'w-full py-12 rounded-2xl border border-red-100 bg-white shadow-xs my-4'
          }`}
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            {/* RAVINI Header Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center shadow-lg border-2 border-yellow-400 relative">
                <AlertTriangle className="w-8 h-8 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Error Message in Swahili and English */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {this.props.fallbackTitle || 'RAVINI haikuweza kufungua ukurasa huu'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                {this.props.fallbackMessage ||
                  'Kuna hitilafu ya muda imetokea wakati wa kupakia sehemu hii. Akaunti yako, taarifa zako na data zote zipo salama 100%.'}
              </p>
            </div>

            {/* Safety Guarantee Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data & Akaunti Yako Zipo Salama (100% Protected)</span>
            </div>

            {/* Recovery Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="btn-error-retry"
                onClick={this.handleRetry}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>🔄 Jaribu Tena (Retry)</span>
              </button>

              <button
                type="button"
                id="btn-error-home"
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-gray-200"
              >
                <Home className="w-4 h-4 text-red-600" />
                <span>🏠 Rudi Mwanzo (Home)</span>
              </button>
            </div>

            {/* Secondary Cache Reset Option */}
            <div className="pt-2 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                id="btn-error-clear-cache"
                onClick={this.handleClearCacheAndReload}
                className="text-[11px] text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Safisha Kache & Anza Upya (Clear Cache & Reload)</span>
              </button>
            </div>

            {/* Collapsible Technical Diagnostics for Admin/Developer */}
            {this.state.error && (
              <div className="pt-2 text-left border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-[11px] text-gray-400 hover:text-gray-600 font-bold flex items-center justify-between w-full cursor-pointer py-1"
                >
                  <span>Taarifa za Kiufundi (Diagnostic Details)</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-gray-900 text-red-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-40 leading-relaxed border border-gray-800">
                    <p className="font-bold text-yellow-400 mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-gray-400 whitespace-pre-wrap">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
