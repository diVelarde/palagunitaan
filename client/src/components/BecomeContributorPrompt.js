import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BecomeContributorPrompt() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.role !== 'public' || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-rule bg-paper px-4 py-3 text-ink">
      <p className="text-sm">
        Know a story that belongs here? Request to become a contributor.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="#role-request-form"
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-paper hover:brightness-95"
        >
          Request contributor access
        </a>
        <button onClick={() => setDismissed(true)} className="text-sm text-accent hover:underline" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
