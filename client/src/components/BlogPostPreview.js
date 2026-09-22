import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BlogPostPreview({ post }) {
  return (
    <Link to="/blog" className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <span>{post.author_name}</span>
        <span>·</span>
        <span>{timeAgo(post.published_at)}</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{post.title}</p>
    </Link>
  );
}