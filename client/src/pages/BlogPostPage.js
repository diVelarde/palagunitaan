import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link to="/blog" className="mb-8 inline-block text-sm font-semibold text-[#a9472e] hover:underline">
        ← Back to the blog
      </Link>
      {loading && <p className="text-sm text-[#82766c]">Loading post…</p>}
      {error && <p className="rounded-lg border border-[#eccdc2] bg-[#fff1eb] p-4 text-sm text-[#8b3b2b]" role="alert">{error}</p>}
      {!loading && !error && !post && (
        <p className="rounded-lg bg-[#f1ece4] p-5 text-sm text-[#786d64]">This blog post could not be found.</p>
      )}
      {post && !error && (
        <article>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#a9472e]">Community story</p>
          <h1 className="mb-5 font-serif text-4xl font-bold leading-tight text-[#35251f]">{post.title}</h1>
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={`Cover for ${post.title}`}
              className="mb-7 max-h-[440px] w-full rounded-xl object-cover"
            />
          )}
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-[#e9dfd2] py-4 text-sm text-[#766b63]">
            <span className="font-semibold text-[#493126]">Written by {post.author_name || 'Community contributor'}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.view_count || 0} {post.view_count === 1 ? 'view' : 'views'}</span>
          </div>
          <div className="whitespace-pre-wrap text-base leading-8 text-[#493f37]">{post.content}</div>
        </article>
      )}
      </div>
    </main>
  );
}
