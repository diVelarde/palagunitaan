import React from 'react';
import { Link } from 'react-router-dom';

export function ErrorPage({ onRetry }) {
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-red-700 mb-2">Something went wrong</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">
        We hit a snag loading this page
      </h1>
      <p className="text-gray-500 mb-8">
        Try refreshing the page. If the problem continues, please let us know.
      </p>
      <div className="flex items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md bg-blue-900 text-white text-sm font-medium hover:bg-blue-800"
          >
            Try again
          </button>
        )}
        <Link to="/" className="text-blue-900 font-medium hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
