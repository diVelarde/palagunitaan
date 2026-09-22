import { useEffect, useState } from 'react';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function PostCard({ post }) {
  return (
    <article className="border-b border-gray-100 py-6">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">{post.author_name}</span>
        <span>·</span>
        <span>{timeAgo(post.published_at)}</span>
      </div>
      <h3 className="font-display text-lg text-gray-900 mb-2">{post.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
    </article>
  );
}

export default function BlogFeedPage({ fetchPosts = async () => [] }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPosts().then((data) => { if (active) { setPosts(data || []); setLoading(false); } });
    return () => { active = false; };
  }, [fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Community blog</h1>
      <p className="text-sm text-gray-600 mb-8">Informal notes and commentary from contributors — not verified heritage content.</p>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && posts.length === 0 && <p className="text-sm text-gray-500">No posts yet. Be the first to write one.</p>}

      <div>
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}