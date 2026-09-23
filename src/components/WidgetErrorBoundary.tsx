/**
 * Part 03 — Widget Error Boundary
 * 
 * One failed widget must never blank the dashboard.
 * Each widget is wrapped in an error boundary that renders a small error
 * card in place, with Retry, while all sibling widgets continue to render.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Widget Error Boundary caught an error:', error, errorInfo);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--sapErrorBackground)',
            border: '1px solid var(--sapErrorBorderColor)',
          }}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              style={{ color: 'var(--sapNegativeElementColor)' }}
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--sapNegativeTextColor)' }}
              >
                Something went wrong
              </h3>
              <p
                className="text-xs mb-3"
                style={{ color: 'var(--sapNegativeTextColor)' }}
              >
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--sapButton_Reject_Background)',
                  color: 'var(--sapButton_Reject_TextColor)',
                  border: '1px solid var(--sapButton_Reject_BorderColor)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK WRAPPER (for functional components)
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function withErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryWrapperProps) {
  return (
    <WidgetErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </WidgetErrorBoundary>
  );
}
