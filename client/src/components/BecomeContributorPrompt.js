import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BecomeContributorPrompt() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.role !== 'public' || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md">
      <p className="text-sm text-blue-900">
        Know a story that belongs here? Request to become a contributor.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="#role-request-form"
          className="px-3 py-1.5 bg-[#ad482d] text-white text-sm rounded-md hover:bg-[#873720]"
        >
          Request contributor access
        </a>
        <button onClick={() => setDismissed(true)} className="text-sm text-[#8f3e29] hover:text-[#6f2e1e]" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
