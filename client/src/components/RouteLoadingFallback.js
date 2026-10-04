import './StatusPage.css';

export default function RouteLoadingFallback() {
  return (
    <div className="status-loading" role="status" aria-label="Loading page">
      <div className="status-spinner" />
    </div>
  );
}