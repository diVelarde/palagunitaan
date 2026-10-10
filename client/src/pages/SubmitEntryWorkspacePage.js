import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubmitEntryPage from './SubmitEntryPage';
import heritageService from '../services/heritageService';

const CONTRIBUTOR_ROLES = ['contributor', 'validator', 'admin'];

export default function SubmitEntryWorkspacePage() {
  const { user } = useAuth();
  const canSubmit = Boolean(user && CONTRIBUTOR_ROLES.includes(user.role));

  if (!canSubmit) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-page-eyebrow">Contribute to the archive</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Submit an Entry</h1>
        <p className="text-sm text-gray-600">
          You need the contributor role to submit a heritage entry.{' '}
          <Link to="/dashboard" className="text-blue-800 hover:underline">
            Request contributor access from your dashboard.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <p className="dashboard-page-eyebrow">Contribute to the archive</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Submit an Entry</h1>
      <p className="mb-5 text-sm text-gray-600">
        Share a piece of cultural heritage. Your submission will be processed and reviewed before publication.
      </p>
      <SubmitEntryPage
        embedded
        onSubmit={heritageService.submitEntry}
        uploadCoverImage={heritageService.updateCoverImage}
      />
    </div>
  );
}
