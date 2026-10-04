import { Link } from 'react-router-dom';
import '../components/StatusPage.css';

export default function NotFoundPage() {
  return (
    <main className="status-page">
      <p className="status-eyebrow">404 · Archive record not found</p>
      <h1>Page not found</h1>
      <p className="status-description">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="status-primary">
        Return to Explore
      </Link>
    </main>
  );
}