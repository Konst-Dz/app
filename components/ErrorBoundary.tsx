import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '@/lib/logger';

import { StatusView } from './StatusView';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const FALLBACK_MESSAGE = 'Не удалось загрузить данные';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ErrorBoundary', 'Render error caught', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  resetError = (): void => {
    logger.debug('ErrorBoundary', 'Error reset requested');
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;

    if (error) {
      return (
        <StatusView
          label={FALLBACK_MESSAGE}
          detail={__DEV__ ? error.message : undefined}
          onRetry={this.resetError}
        />
      );
    }
    return this.props.children;
  }
}
