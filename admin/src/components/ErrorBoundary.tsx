import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time crashes (e.g. a malformed API date throwing in date-fns)
 * so one bad record cannot blank the whole admin application.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Admin UI crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-card">
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            This screen hit an unexpected error. Reloading usually clears it; if it keeps happening, note what you were doing and contact support.
          </p>
          <p className="mt-3 rounded-lg bg-gray-50 p-2 font-mono text-[11px] text-gray-500">{this.state.error.message}</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }
}
