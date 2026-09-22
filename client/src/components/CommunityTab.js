import { useEffect, useState } from 'react';
import BlogComposer from './BlogComposer';
import BlogPostPreview from './BlogPostPreview';

export default function CommunityTab({ fetchMyPosts = async () => [], createPost = async () => {} }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    return fetchMyPosts().then((data) => { setPosts(data || []); setLoading(false); });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMyPosts]);

  function handlePosted(newPost) {
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <div className="space-y-6">
      <BlogComposer onSubmit={createPost} onPosted={handlePosted} />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Your posts</h3>
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