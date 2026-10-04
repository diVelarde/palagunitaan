import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionDialog from '../components/ActionDialog';
import BlogComposer from '../components/BlogComposer';
import './BrowsePage.css';

const CONTRIBUTOR_ROLES = ['contributor', 'validator', 'admin'];

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="blog-post-card"
    >
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt=""
          className="blog-post-card-image"
        />
      )}
      <div className="blog-post-card-meta">
        <span className="blog-post-card-author">By {post.author_name || 'Community contributor'}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.view_count || 0} views</span>
      </div>
      <h2>{post.title}</h2>
      <p className="blog-post-card-excerpt">{post.content}</p>
      <span className="blog-post-card-link">Read story →</span>
    </Link>
  );
}

export default function BlogFeedPage({
  fetchPosts = async () => [],
  createPost = async () => null,
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writePostOpen, setWritePostOpen] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const canWritePost = Boolean(user && CONTRIBUTOR_ROLES.includes(user.role));

  function handlePosted(post) {
    if (post) setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
    setWritePostOpen(false);
    setPostSuccess(true);
  }

  useEffect(() => {
    let active = true;
    fetchPosts()
      .then((data) => {
        if (active) setPosts(data || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Could not load community posts. Please try again later.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchPosts]);

  return (
    <main className="site-page-surface blog-feed-page">
      <div className="blog-feed-content">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="blog-feed-eyebrow">Community voices</p>
            <h1>From the Blog</h1>
            <p className="blog-feed-intro">
              Notes, reflections, and stories from the people documenting and preserving Bicol’s living heritage.
            </p>
          </div>
          {canWritePost && (
            <button
              type="button"
              onClick={() => {
                setPostSuccess(false);
                setWritePostOpen(true);
              }}
              className="blog-write-button"
            >
              <span aria-hidden="true">✎</span> Write a Post
            </button>
          )}
        </div>

        {postSuccess && (
          <p className="blog-feed-message blog-feed-success" role="status">
            Your post was published.
          </p>
        )}
        {loading && <p className="blog-feed-state">Loading posts…</p>}
        {error && <p className="blog-feed-message blog-feed-error" role="alert">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="blog-feed-message blog-feed-empty">No community posts have been published yet.</p>
        )}
        {!error && posts.length > 0 && (
          <div className="blog-post-grid">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>

      {writePostOpen && canWritePost && (
        <ActionDialog title="Write a Post" size="compact" onClose={() => setWritePostOpen(false)}>
          <BlogComposer onSubmit={createPost} onPosted={handlePosted} />
        </ActionDialog>
      )}
    </main>
  );
}
