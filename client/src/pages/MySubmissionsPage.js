import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import heritageService from '../services/heritageService';
import MediaUploader from '../components/MediaUploader';
import CoverImagePicker from '../components/CoverImagePicker';
import ActionDialog from '../components/ActionDialog';

const SubmitEntryPage = lazy(() => import('./SubmitEntryPage'));

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-700',
};

const VERIFICATION_LABELS = {
  verified: 'Verified',
  disputed: 'Disputed',
  unverified: 'Unverified',
};

const CONTRIBUTOR_ROLES = ['contributor', 'validator', 'admin'];

function getLoadErrorMessage(err) {
  if (err.response?.status === 401) return 'Your session has expired. Sign in again to view your submissions.';
  if (err.response?.status === 403) return 'Your account does not have permission to view these submissions.';
  if (err.response?.data?.message) return err.response.data.message;
  if (!err.response) return 'Could not connect to the server to load your submissions. Check your connection and try again.';
  return `The server could not load your submissions (HTTP ${err.response.status}). Please try again later.`;
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {status || 'unknown'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MySubmissionsPage({
  fetchMyEntries = heritageService.getMyEntries,
  setEntryPhoto = heritageService.updateCoverImage,
  fetchCategories = heritageService.getCategories,
  regenerateAi = heritageService.enrichEntry,
  saveCategory = heritageService.setCategory,
}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [actionError, setActionError] = useState(null);
  const [busyEntryId, setBusyEntryId] = useState(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchMyEntries()
      .then((data) => { if (active) setEntries(data || []); })
      .catch((err) => {
        if (active) setError(getLoadErrorMessage(err));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchMyEntries, reloadVersion]);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((list) => { if (active) setCategories(list || []); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, [fetchCategories]);

  const isContributor = Boolean(user) && CONTRIBUTOR_ROLES.includes(user.role);

  const canEdit = (entry) =>
    Boolean(user) && (entry.user_id === user.id || user.role === 'admin');

  const replaceEntry = (updated) =>
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));

  async function handlePhotoSelect(entryId, file) {
    setActionError(null);
    setBusyEntryId(entryId);
    try {
      replaceEntry(await setEntryPhoto(entryId, file));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update the entry photo.');
    } finally {
      setBusyEntryId(null);
    }
  }

  async function handleRegenerate(entryId) {
    setActionError(null);
    setBusyEntryId(entryId);
    try {
      const { entry, ai } = await regenerateAi(entryId);
      replaceEntry(entry);
      if (ai && ai.errors && ai.errors.length) {
        setActionError('The AI could not finish for that entry. Please try again in a moment.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not run AI enrichment.');
    } finally {
      setBusyEntryId(null);
    }
  }

  async function handleCategoryChange(entryId, category) {
    setActionError(null);
    setBusyEntryId(entryId);
    try {
      replaceEntry(await saveCategory(entryId, category));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not save the category.');
    } finally {
      setBusyEntryId(null);
    }
  }

  if (loading) {
    return <p className="dashboard-page-loading text-sm text-gray-500">Loading your submissions…</p>;
  }

  return (
    <div className="dashboard-page dashboard-submissions-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-page-eyebrow">Your archive</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Submissions</h1>
          <p className="text-sm text-gray-600">
            Entries you have submitted, and where each one is in review.
          </p>
        </div>
        {isContributor && (
          <button
            type="button"
            onClick={() => setIsSubmitDialogOpen(true)}
            className="dashboard-action-link dashboard-action-primary"
          >
            Submit an entry
          </button>
        )}
      </div>

      {error && (
        <div className="dashboard-error flex flex-wrap items-center justify-between gap-3" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            className="font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center">
          {isContributor ? (
            <p className="text-sm text-gray-600">You haven't submitted any entries yet. Use “Submit an entry” above to get started.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                You need the contributor role to submit heritage entries.
              </p>
              <Link to="/dashboard" className="text-sm text-blue-800 hover:underline">
                Go to your dashboard to request it →
              </Link>
            </>
          )}
        </div>
      )}

      {!error && entries.length > 0 && (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const busy = busyEntryId === entry.id;
            const needsCategory = !entry.category_auto;
            const needsPlainVersion = !entry.euphemistic_content;

            return (
              <li key={entry.id} className="dashboard-submission-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {entry.cover_image_url ? (
                      <img
                        src={entry.cover_image_url}
                        alt=""
                        className="w-20 h-20 rounded-md object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 text-center px-1 shrink-0">
                        No photo
                      </div>
                    )}

                    <div className="min-w-0">
                      <Link
                        to={`/entries/${entry.id}`}
                        className="text-base font-semibold text-gray-900 hover:underline"
                      >
                        {entry.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {entry.category_auto ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f7ece3] text-[#8f3e29] uppercase tracking-wide font-medium">
                            {entry.category_auto}
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            No category
                          </span>
                        )}
                        {entry.euphemistic_content ? (
                          <span className="text-[11px] text-gray-500">Plain version ready</span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            No plain version
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        {entry.historical_period && <span>{entry.historical_period}</span>}
                        {(entry.submitted_at || entry.created_at) && (
                          <span>Submitted {formatDate(entry.submitted_at || entry.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={entry.status} />
                    {entry.verification_status && (
                      <span className="text-[11px] text-gray-500">
                        {VERIFICATION_LABELS[entry.verification_status] || entry.verification_status}
                      </span>
                    )}
                  </div>
                </div>

                {entry.status === 'rejected' && (
                  <p className="text-xs text-gray-500 mt-3">
                    This entry was not published. The validator's notes explain why.
                  </p>
                )}
                {entry.status === 'pending' && (
                  <p className="text-xs text-gray-500 mt-3">
                    Waiting for a validator to review this entry.
                  </p>
                )}

                {canEdit(entry) && (needsCategory || needsPlainVersion) && (
                  <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-900 mb-2">
                      This entry is missing AI enrichment. Generate it now, or pick a category yourself.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRegenerate(entry.id)}
                        className="dashboard-action-link dashboard-action-primary text-xs disabled:opacity-50"
                      >
                        {busy ? 'Working…' : 'Generate with AI'}
                      </button>
                      <select
                        value={entry.category_auto || ''}
                        disabled={busy}
                        onChange={(e) => handleCategoryChange(entry.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1.5 text-xs disabled:opacity-50"
                      >
                        <option value="">Set category…</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {canEdit(entry) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <CoverImagePicker
                      currentUrl={entry.cover_image_url}
                      busy={busy}
                      onSelect={(file) => handlePhotoSelect(entry.id, file)}
                      onError={setActionError}
                      label={entry.cover_image_url ? 'Replace entry photo' : 'Add entry photo'}
                    />
                  </div>
                )}

                <MediaUploader entryId={entry.id} disabled={!canEdit(entry)} />
              </li>
            );
          })}
        </ul>
      )}

      {isSubmitDialogOpen && (
        <ActionDialog title="Submit a heritage entry" onClose={() => setIsSubmitDialogOpen(false)}>
          <Suspense fallback={<p className="text-sm text-[#82766c]">Loading submission form…</p>}>
            <SubmitEntryPage
              embedded
              onSubmit={heritageService.submitEntry}
              uploadCoverImage={heritageService.updateCoverImage}
              onSubmitted={() => setReloadVersion((version) => version + 1)}
            />
          </Suspense>
        </ActionDialog>
      )}
    </div>
  );
}