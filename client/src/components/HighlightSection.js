import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HighlightCard({ label, highlight }) {
  if (!highlight) return null;

  return (
    <Link
      to={`/entries/${highlight.heritage_entry_id}`}
      className="block border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-shadow"
    >
      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">{label}</p>
      <h3 className="font-display text-xl text-gray-900 mb-2">{highlight.title}</h3>
      {highlight.category_auto && <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{highlight.category_auto}</p>}
      {highlight.euphemistic_content && <p className="text-sm text-gray-600 line-clamp-3">{highlight.euphemistic_content}</p>}
    </Link>
  );
}

export default function HighlightSection({ fetchCurrentHighlights = async () => ({ week: null, month: null }) }) {
  const [highlights, setHighlights] = useState({ week: null, month: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCurrentHighlights().then((data) => {
      if (active) { setHighlights(data || { week: null, month: null }); setLoaded(true); }
    });
    return () => { active = false; };
  }, [fetchCurrentHighlights]);

  // Nothing currently highlighted -> render nothing at all, not an empty state.
  if (loaded && !highlights.week && !highlights.month) return null;
  if (!loaded) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="font-display text-2xl text-gray-900 mb-6">Featured</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <HighlightCard label="This week" highlight={highlights.week} />
        <HighlightCard label="This month" highlight={highlights.month} />
      </div>
    </section>
  );
}