import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getErrorRing, recordError } from './errorRing';

interface Props { children: ReactNode }
interface State { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    recordError('react', new Error(`${error.message}\n${info.componentStack ?? ''}`, { cause: error }));
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <main className="recovery">
      <p className="eyebrow">NANDI</p>
      <h1>Something paused.</h1>
      <p>Your saved work is still on this device. Open the app again to continue.</p>
      <div className="actions">
        <button onClick={() => window.location.reload()}>Reload app</button>
        <button className="secondary" onClick={() => void navigator.clipboard.writeText(JSON.stringify(getErrorRing(), null, 2))}>Copy error details</button>
      </div>
    </main>;
  }
}
