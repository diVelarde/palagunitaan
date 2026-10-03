import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import RoleBadge from './RoleBadge';
import { useNotifications } from '../hooks/useNotifications';

const NAV_LINKS = [
  { to: '/browse', label: 'Browse' },
  { to: '/map', label: 'Map' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/blog', label: 'Blog' },
];

function linkClass({ isActive }) {
  return `text-[15px] font-medium transition ${
    isActive ? 'text-[#a9472e]' : 'text-[#625953] hover:text-[#a9472e]'
  }`;
}

export default function Navbar() {
  const { user, loading, login } = useAuth();
  const { notifications, unreadCount, onOpen, onMarkRead, notificationError } = useNotifications();
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Account';

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e0d6] bg-[#f8f5ef]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-5 px-6 py-3.5">
        <Link to="/" className="flex shrink-0 items-center gap-3 font-serif text-[21px] font-bold text-[#382920]">
          <img
            src="/Palagunitaan (1).png"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="relative block h-10 w-44 overflow-hidden">
            <img
              src="/Text1.png"
              alt="Palagunitaan"
              className="absolute left-0 top-1/2 w-full max-w-none -translate-y-1/2"
            />
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-7">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <RoleBadge role={user.role} />
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onOpen={onOpen}
                onMarkRead={onMarkRead}
                error={notificationError}
              />
              <Link
                to="/dashboard"
                aria-label={`Dashboard for ${user.name || firstName}`}
                className="flex items-center gap-2 rounded-full text-sm font-medium text-[#493126] hover:text-[#a9472e] focus:outline-none focus:ring-2 focus:ring-[#b97554] focus:ring-offset-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full border border-[#e9dfd2] object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#ad482d] font-semibold text-white"
                  >
                    {firstName[0].toUpperCase()}
                  </span>
                )}
                <span>{firstName}</span>
              </Link>
            </>
          ) : (
            <button
              onClick={login}
              className="rounded-xl border border-[#d9c7b7] px-5 py-2.5 text-sm font-semibold text-[#a9472e] transition hover:bg-[#f3e9df]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
