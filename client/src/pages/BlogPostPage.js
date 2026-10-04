import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './BlogPostPage.css';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPostPage({ fetchPost }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setPost(null);
    setLoading(true);
    setError('');
    fetchPost(id)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load this blog post. Please try again later.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchPost, id]);

  return (
    <main className="site-page-surface blog-post-page">
      <div className="blog-post-content">
      <Link to="/blog" className="blog-post-back-link">
        ← Back to the blog
      </Link>
      {loading && <p className="blog-post-state">Loading post…</p>}
      {error && <p className="blog-post-message blog-post-error" role="alert">{error}</p>}
      {!loading && !error && !post && (
        <p className="blog-post-message blog-post-empty">This blog post could not be found.</p>
      )}
      {post && !error && (
        <article>
          <p className="blog-post-eyebrow">Community story</p>
          <h1>{post.title}</h1>
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={`Cover for ${post.title}`}
              className="blog-post-cover"
            />
          )}
          <div className="blog-post-meta">
            <span className="blog-post-author">Written by {post.author_name || 'Community contributor'}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.view_count || 0} {post.view_count === 1 ? 'view' : 'views'}</span>
          </div>
          <div className="blog-post-body">{post.content}</div>
        </article>
      )}
      </div>
    </main>
  );
}
