import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-amber-700 mb-2">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="text-blue-900 font-medium hover:underline">
        Back to home
      </Link>
    </div>
  );
}