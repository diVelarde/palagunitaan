import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionDialog from '../components/ActionDialog';
import BlogComposer from '../components/BlogComposer';
import CommunityPostLabel from '../components/CommunityPostLabel';
import './BrowsePage.css';

const CONTRIBUTOR_ROLES = ['contributor', 'validator', 'admin'];
const DEBOUNCE_MS = 300;
const EMPTY_FETCH_POSTS = async () => [];

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
      <CommunityPostLabel />
      <p className="blog-post-card-excerpt">{post.content}</p>
      <span className="blog-post-card-link">Read story →</span>
    </Link>
  );
}

export default function BlogFeedPage({
  fetchPosts = EMPTY_FETCH_POSTS,
  createPost = async () => null,
}) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(() => searchParams.get('q') || '');
  const [author, setAuthor] = useState(() => searchParams.get('author') || '');
  const [from, setFrom] = useState(() => searchParams.get('from') || '');
  const [to, setTo] = useState(() => searchParams.get('to') || '');
  const [sort, setSort] = useState(() => searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest');
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [writePostOpen, setWritePostOpen] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const debounceRef = useRef(null);
  const searchImmediatelyRef = useRef(false);
  const canWritePost = Boolean(user && CONTRIBUTOR_ROLES.includes(user.role));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    clearTimeout(debounceRef.current);
    const delay = searchImmediatelyRef.current ? 0 : DEBOUNCE_MS;
    searchImmediatelyRef.current = false;
    debounceRef.current = setTimeout(() => {
      fetchPosts({
        q: keyword.trim() || undefined,
        author: author || undefined,
        from: from || undefined,
        to: to || undefined,
        sort,
      })
        .then((data) => {
          if (!active) return;
          const loadedPosts = data || [];
          setPosts(loadedPosts);
          setAuthors((currentAuthors) => {
            const options = new Map(currentAuthors.map((option) => [option.value, option]));
            loadedPosts.forEach((post) => {
              if (!post.author_name) return;
              const value = post.user_id == null ? post.author_name : String(post.user_id);
              options.set(value, { value, label: post.author_name });
            });
            return Array.from(options.values()).sort((first, second) => first.label.localeCompare(second.label));
          });
        })
        .catch((err) => {
          if (active) {
            setError(err.response?.data?.message || 'Could not load community posts. Please try again.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, delay);
    return () => {
      active = false;
      clearTimeout(debounceRef.current);
    };
  }, [author, fetchPosts, from, keyword, retryCount, sort, submitCount, to]);

  function submitSearch(event) {
    event.preventDefault();
    searchImmediatelyRef.current = true;
    setSubmitCount((count) => count + 1);
  }

  function clearFilters() {
    setKeyword('');
    setAuthor('');
    setFrom('');
    setTo('');
    setSort('newest');
  }

  function retrySearch() {
    searchImmediatelyRef.current = true;
    setRetryCount((count) => count + 1);
  }

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
              onClick={() => setWritePostOpen(true)}
              className="blog-write-button"
            >
              <span aria-hidden="true">✎</span> Write a Post
            </button>
          )}
        </div>

        <form className="browse-filter-bar blog-filter-bar" onSubmit={submitSearch}>
          <div className="blog-filter-field blog-search-field">
            <label htmlFor="blog-search">Search posts</label>
            <input
              id="blog-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search by title or content…"
              className="browse-filter-control"
            />
          </div>
          <div className="blog-filter-field">
            <label htmlFor="blog-author">Author</label>
            <select id="blog-author" value={author} onChange={(event) => setAuthor(event.target.value)} className="browse-filter-control">
              <option value="">Any author</option>
              {authors.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="blog-filter-field">
            <label htmlFor="blog-from">From date</label>
            <input id="blog-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="browse-filter-control" />
          </div>
          <div className="blog-filter-field">
            <label htmlFor="blog-to">To date</label>
            <input id="blog-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="browse-filter-control" />
          </div>
          <div className="blog-filter-field">
            <label htmlFor="blog-sort">Sort</label>
            <select id="blog-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="browse-filter-control">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          <div className="blog-filter-actions">
            <button type="submit" className="blog-filter-button">Search</button>
            <button type="button" onClick={clearFilters} className="blog-filter-button">Clear filters</button>
          </div>
        </form>

        {loading && <p className="blog-feed-state" role="status">Searching…</p>}
        {error && (
          <div className="blog-feed-message blog-feed-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={retrySearch} className="blog-feed-retry">Retry</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <p className="blog-feed-message blog-feed-empty">No posts match your search</p>
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="blog-post-grid">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>

      {writePostOpen && canWritePost && (
        <ActionDialog title="Write a Post" size="compact" onClose={() => setWritePostOpen(false)}>
          <BlogComposer onSubmit={createPost} />
        </ActionDialog>
      )}
    </main>
  );
}
