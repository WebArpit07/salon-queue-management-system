import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

/**
 * Luxury-styled React Error Boundary to prevent any uncaught runtime crash
 * from rendering a blank screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[65vh] flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-card border border-rose-500/30 bg-obsidian-900/98 shadow-2xl text-center space-y-6 select-none">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Display Recovered Safely
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                A temporary display hiccup was caught. You can refresh this view or safely return to the home screen.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-slate-800 text-left font-mono text-[11px] text-rose-300/80 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="min-h-[44px] px-4 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh View</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-950 text-xs font-bold shadow-glow-gold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
