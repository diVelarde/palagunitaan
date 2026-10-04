import { useEffect, useRef, useState } from 'react';
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

export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onOpen = () => {},
  onMarkRead = async () => {},
  error = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onOpen();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="navbar-notification-button relative p-2" aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="navbar-notification-popup absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border shadow-lg z-10">
          <div className="navbar-notification-heading border-b px-4 py-3"><h3 className="text-sm font-semibold">Notifications</h3></div>
          {error && <p className="px-4 py-3 text-xs text-red-700" role="alert">{error}</p>}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="navbar-notification-empty py-8 text-center text-sm">Nothing yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.heritage_entry_id ? `/entries/${n.heritage_entry_id}` : '#'}
                  onClick={() => !n.is_read && onMarkRead(n.id)}
                  className={`navbar-notification-item block border-b px-4 py-3 last:border-0 ${n.is_read ? '' : 'is-unread'}`}
                >
                  <p className="text-sm">{n.message}</p>
                  <p className="navbar-notification-time mt-1 text-xs">{timeAgo(n.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
