import { useEffect, useState } from 'react';
import ProfilePanel from '../components/ProfilePanel';
import BecomeContributorPrompt from '../components/BecomeContributorPrompt';
import CommunityTab from '../components/CommunityTab';
import RoleSwitcher from '../components/RoleSwitcher';
import blogService from '../services/blogService';
import heritageService from '../services/heritageService';
import { useAuth } from '../context/AuthContext';

const CONTRIBUTOR_ROLES = ['contributor', 'validator', 'admin'];

function getLoadError(error, contentName) {
  if (error.response?.status === 401) return 'Your session has expired. Sign in again to load your work.';
  if (error.response?.status === 403) return 'Your account does not have permission to view this information.';
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return `Could not connect to the server to load ${contentName}. Check your connection and try again.`;
  return `The server could not load ${contentName} (HTTP ${error.response.status}). Please try again later.`;
}

export default function DashboardPage({ fetchMyEntries = heritageService.getMyEntries }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [entriesError, setEntriesError] = useState('');
  const [entriesLoading, setEntriesLoading] = useState(false);
  const isContributor = Boolean(user && CONTRIBUTOR_ROLES.includes(user.role));

  useEffect(() => {
    if (!isContributor) return undefined;
    let active = true;
    setEntriesLoading(true);
    setEntriesError('');
    fetchMyEntries()
      .then((data) => {
        if (active) setEntries(data || []);
      })
      .catch((error) => {
        if (active) setEntriesError(getLoadError(error, 'your submissions'));
      })
      .finally(() => {
        if (active) setEntriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchMyEntries, isContributor]);

  const pendingCount = entries.filter((entry) => entry.status === 'pending').length;
  const publishedCount = entries.filter((entry) => entry.status === 'published').length;

  return (
    <div className="space-y-5">
      <section className="dashboard-section-card">
        <div className="dashboard-overview-section-heading">
          <div>
            <p className="dashboard-overview-eyebrow">Dashboard</p>
            <h1>Your account</h1>
          </div>
          <div className="dashboard-account-actions">
            <RoleSwitcher />
          </div>
        </div>
        <ProfilePanel />
      </section>

      {isContributor && (
        <section className="dashboard-section-card">
          <h2>Submission overview</h2>
          {entriesError && <div className="dashboard-error" role="alert">{entriesError}</div>}
          <div className="dashboard-stats" aria-label="Submission summary">
            <div className="dashboard-stat">
              <span>Total submissions</span>
              <strong>{entriesLoading ? '—' : entries.length}</strong>
            </div>
            <div className="dashboard-stat">
              <span>Published</span>
              <strong>{entriesLoading ? '—' : publishedCount}</strong>
            </div>
            <div className="dashboard-stat">
              <span>In review</span>
              <strong>{entriesLoading ? '—' : pendingCount}</strong>
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-section-card">
        <h2>Community posts</h2>
        <CommunityTab fetchMyPosts={blogService.getMyPosts} />
      </div>

      {!isContributor && (
        <div className="dashboard-section-card">
          <h2>Start contributing</h2>
          <p className="mb-4 text-sm leading-6 text-[#82766c]">
            Know a story, song, or tradition that should be preserved? Become a contributor and share it with the community.
          </p>
          <BecomeContributorPrompt />
        </div>
      )}
    </div>
  );
}
