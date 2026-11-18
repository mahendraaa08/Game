import React from 'react';
import { GameShell } from './components/GameShell';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] w-screen flex-col items-center justify-center bg-[#040711] p-6 text-center text-slate-100">
          <h1 className="font-display text-2xl font-bold tracking-wider text-white">
            SYSTEM RECOVERY
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            An unexpected display error occurred. Your saved progress remains intact.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-sky-400 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-300"
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <GameShell />
    </AppErrorBoundary>
  );
}
