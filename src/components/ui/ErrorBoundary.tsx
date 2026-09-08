import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/States';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Last line of defence so a render failure never shows a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorState
          title="Something broke on this page"
          message={this.state.error.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
