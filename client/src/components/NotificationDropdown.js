import { useState, useRef, useEffect } from 'react';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <BellIcon />
        {/* VAL-005/VAL-008 will add a count badge here once triggers exist. */}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-20">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-800">
            Notifications
          </div>
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            You're all caught up.
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
