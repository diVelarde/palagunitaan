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
      className="block rounded-xl border border-[#e9dfd2] bg-[#fffefa] p-6 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#c7a386] hover:shadow-sm"
    >
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt=""
          className="mb-5 aspect-[16/9] w-full rounded-lg object-cover"
        />
      )}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#82766c]">
        <span className="font-semibold text-[#493126]">By {post.author_name || 'Community contributor'}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.view_count || 0} views</span>
      </div>
      <h2 className="mb-2 font-serif text-xl font-bold text-[#35251f]">{post.title}</h2>
      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#766b63]">{post.content}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-[#a9472e]">Read story →</span>
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
            <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#a9472e]">Community voices</p>
            <h1 className="mb-2 font-serif text-4xl font-bold text-[#35251f]">From the Blog</h1>
            <p className="max-w-2xl text-sm leading-6 text-[#766b63]">
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
          <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            Your post was published.
          </p>
        )}
        {loading && <p className="text-sm text-[#82766c]">Loading posts…</p>}
        {error && <p className="rounded-lg border border-[#eccdc2] bg-[#fff1eb] p-4 text-sm text-[#8b3b2b]" role="alert">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="rounded-lg bg-[#f1ece4] p-5 text-sm text-[#786d64]">No community posts have been published yet.</p>
        )}
        {!error && posts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
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
