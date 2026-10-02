import { useEffect, useState } from 'react';
import BlogPostPreview from './BlogPostPreview';

export default function CommunityTab({ fetchMyPosts = async () => [] }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function reload() {
    setLoading(true);
    setError(null);
    return fetchMyPosts()
      .then((data) => setPosts(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your community posts.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMyPosts]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Your posts</h3>
        {error && <p className="dashboard-error" role="alert">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't posted anything yet.</p>
        ) : (
          posts.map((post) => <BlogPostPreview key={post.id} post={{ ...post, author_name: 'You' }} />)
        )}
      </div>
    </div>
  );
}