import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, login } = useAuth();

  return (
    <div className="flex flex-col items-center text-center px-6 py-20 max-w-3xl mx-auto">
      <span className="text-sm uppercase tracking-wide text-amber-700 font-medium mb-3">
        Cultural Heritage Information System
      </span>
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
        Palagunitaan
      </h1>
      <p className="text-lg text-gray-600 mb-10">
        Documenting, validating, and preserving Philippine regional folklore and
        intangible cultural heritage — starting with Camarines Sur and the wider
        Bicol region.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/browse"
          className="px-6 py-3 rounded-md bg-blue-900 text-white font-medium hover:bg-blue-800 transition"
        >
          Explore Heritage Entries
        </Link>
        <Link
          to="/map"
          className="px-6 py-3 rounded-md border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 transition"
        >
          View the Heritage Map
        </Link>
        {!user && (
          <button
            onClick={login}
            className="px-6 py-3 rounded-md border border-amber-600 text-amber-700 font-medium hover:bg-amber-50 transition"
          >
            Become a Contributor
          </button>
        )}
      </div>
    </div>
  );
}
