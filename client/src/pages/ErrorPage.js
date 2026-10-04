import React from 'react';
import { Link } from 'react-router-dom';
import '../components/StatusPage.css';

export function ErrorPage({ onRetry }) {
  return (
    <div className="status-page">
      <p className="status-eyebrow">Something went wrong</p>
      <h1>
        We hit a snag loading this page
      </h1>
      <p className="status-description">
        Try refreshing the page. If the problem continues, please let us know.
      </p>
      <div className="status-actions">
        {onRetry && (
          <button
            onClick={onRetry}
            className="status-primary"
          >
            Try again
          </button>
        )}
        <Link to="/" className="status-link">
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
