import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import RoleBadge from './RoleBadge';
import { useNotifications } from '../hooks/useNotifications';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Explore', end: true },
  { to: '/map', label: 'Places' },
  { to: '/browse', label: 'Collections' },
  { to: '/about', label: 'About' },
];

function linkClass({ isActive }) {
  return `navbar-link ${isActive ? 'is-active' : ''}`;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isLandingPage = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 24);
  const { user, loading, login } = useAuth();
  const { notifications, unreadCount, onOpen, onMarkRead, notificationError } = useNotifications();
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Account';
  const navLinks = user
    ? [...NAV_LINKS, { to: '/dashboard', label: 'Contribute' }]
    : NAV_LINKS;

  useEffect(() => {
    if (!isLandingPage) {
      setIsScrolled(false);
      return undefined;
    }

    function updateScrollState() {
      setIsScrolled(window.scrollY > 24);
    }

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, [isLandingPage]);

  return (
    <header
      className={`site-navbar sticky top-0 z-50 border-b backdrop-blur ${
        isLandingPage ? `site-navbar-landing ${isScrolled ? 'site-navbar-scrolled' : ''}` : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3.5">
        <Link to="/" aria-label="Palagunitaan home" className="navbar-brand">
          <picture className="navbar-logo-picture">
            {!isLandingPage && (
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="/Palagunitaan - Logo/7.png"
              />
            )}
            <img
              src={isLandingPage ? '/Palagunitaan - Logo/7.png' : '/Palagunitaan - Logo/6.png'}
              alt="Palagunitaan"
              className="navbar-logo-image"
            />
          </picture>
        </Link>

        <nav className="navbar-desktop-nav hidden items-center justify-center gap-7 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden sm:inline-flex">
                <RoleBadge role={user.role} />
              </span>
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
                className="navbar-account flex items-center gap-2 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FBD116] focus:ring-offset-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="navbar-avatar-image h-9 w-9 rounded-full border object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="navbar-avatar grid h-9 w-9 place-items-center rounded-full font-semibold"
                  >
                    {firstName[0].toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline">{firstName}</span>
              </Link>
            </>
          ) : (
            <button onClick={login} className="navbar-sign-in hidden rounded-xl border px-3 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5 md:inline-flex">
              Sign In
            </button>
          )}
          <Link
            to="/browse"
            aria-label="Search collections"
            className="navbar-search-button inline-flex h-10 w-10 items-center justify-center rounded-full"
          >
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </Link>
          <button
            type="button"
            className="navbar-menu-button inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className={`navbar-mobile-panel px-4 pb-3 md:hidden ${menuOpen ? '' : 'hidden'}`}
        aria-label="Mobile navigation"
      >
        {!loading && !user && (
          <button type="button" className="navbar-mobile-sign-in" onClick={() => {
            setMenuOpen(false);
            login();
          }}>
            Sign in
          </button>
        )}
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={linkClass}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
