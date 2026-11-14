import { useEffect, useState } from 'react';
import ActionDialog from './ActionDialog';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function PendingBlogPost({ post, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(decision, rejectionReason) {
    setBusy(true);
    setError('');
    try {
      await onReview(post.id, decision, rejectionReason);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not review this blog post.');
      setBusy(false);
      return false;
    }
    setBusy(false);
    return true;
  }

  async function handleReject() {
    if (!reason.trim()) return;
    if (await decide('rejected', reason.trim())) setRejecting(false);
  }

  return (
    <article className="rounded-lg border border-[#e1d7ca] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#493126]">{post.title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            By {post.author_name || 'Community contributor'} · {formatDate(post.published_at || post.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="text-sm font-medium text-[#ad482d] hover:underline"
        >
          {expanded ? 'Hide post' : 'Read full post'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      <p className={`mt-3 whitespace-pre-wrap text-sm text-gray-700 ${expanded ? '' : 'line-clamp-3'}`}>
        {post.content}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide('approved')}
          className="rounded-md bg-[#315b45] px-3 py-1.5 text-sm text-white hover:bg-[#244535] disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setReason('');
            setRejecting(true);
          }}
          className="rounded-md border border-[#e1d7ca] px-3 py-1.5 text-sm text-[#493126] hover:bg-[#f4eee6] disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {rejecting && (
        <ActionDialog title="Reject Blog Post" size="compact" onClose={() => setRejecting(false)}>
          <label htmlFor={`blog-rejection-reason-${post.id}`} className="mb-1 block text-sm font-medium text-[#493126]">
            Reason for rejection (required)
          </label>
          <textarea
            id={`blog-rejection-reason-${post.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-[#e1d7ca] px-3 py-2 text-sm"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setRejecting(false)} className="rounded-md border border-[#e1d7ca] px-3 py-2 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={busy || !reason.trim()}
              className="rounded-md bg-[#ad482d] px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? 'Rejecting…' : 'Confirm rejection'}
            </button>
          </div>
        </ActionDialog>
      )}
    </article>
  );
}

export default function BlogModerationQueue({
  fetchPending = async () => [],
  reviewPost = async () => {},
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPending()
      .then((data) => { if (active) setPosts(data || []); })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load pending blog posts.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchPending]);

  async function handleReview(postId, decision, reason) {
    await reviewPost(postId, decision, reason);
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  return (
    <section aria-label="Blog posts awaiting review">
      {loading && <p className="text-sm text-gray-500">Loading blog posts…</p>}
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-gray-500">No blog posts are waiting for review.</p>
      )}
      <div className="space-y-3">
        {posts.map((post) => (
          <PendingBlogPost key={post.id} post={post} onReview={handleReview} />
        ))}
      </div>
    </section>
  );
}
