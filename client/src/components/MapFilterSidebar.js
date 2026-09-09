import { useMemo, useState } from 'react';

const VERIFICATION_OPTIONS = ['verified', 'disputed', 'unverified'];
const TYPE_OPTIONS = [
  { value: 'entry', label: 'Heritage entries' },
  { value: 'site', label: 'Heritage sites' },
];

export function defaultFilters() {
  return {
    types: TYPE_OPTIONS.map((t) => t.value),
    verificationStatuses: [...VERIFICATION_OPTIONS],
    categories: [], // empty = "all categories"
  };
}

export function applyFilters(markers, filters) {
  return markers.filter((m) => {
    if (!filters.types.includes(m.type)) return false;
    if (m.type === 'entry') {
      if (!filters.verificationStatuses.includes(m.verificationStatus)) return false;
      if (filters.categories.length && !filters.categories.includes(m.category)) return false;
    }
    return true;
  });
}

function CheckboxGroup({ label, options, selected, onToggle }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</h3>
      <div className="space-y-1.5">
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return (
            <label key={value} className="flex items-center gap-2 text-sm text-gray-700 capitalize cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
                className="rounded border-gray-300 text-blue-900 focus:ring-blue-800"
              />
              {optLabel}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function MapFilterSidebar({ markers, onChange }) {
  const [filters, setFilters] = useState(defaultFilters());

  const availableCategories = useMemo(() => {
    const set = new Set(markers.filter((m) => m.type === 'entry' && m.category).map((m) => m.category));
    return [...set].sort();
  }, [markers]);

  function update(next) {
    setFilters(next);
    onChange(next);
  }

  function toggleIn(key, value) {
    const current = filters[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ ...filters, [key]: next });
  }

  return (
    <aside className="w-56 shrink-0 pr-6">
      <CheckboxGroup label="Show" options={TYPE_OPTIONS} selected={filters.types} onToggle={(v) => toggleIn('types', v)} />
      <CheckboxGroup label="Verification" options={VERIFICATION_OPTIONS} selected={filters.verificationStatuses} onToggle={(v) => toggleIn('verificationStatuses', v)} />
      {availableCategories.length > 0 && (
        <CheckboxGroup
          label="Category"
          options={availableCategories}
          selected={filters.categories.length ? filters.categories : availableCategories}
          onToggle={(v) => {
            const base = filters.categories.length ? filters.categories : availableCategories;
            const next = base.includes(v) ? base.filter((c) => c !== v) : [...base, v];
            update({ ...filters, categories: next.length === availableCategories.length ? [] : next });
          }}
        />
      )}
      {(filters.categories.length > 0 || filters.types.length < TYPE_OPTIONS.length || filters.verificationStatuses.length < VERIFICATION_OPTIONS.length) && (
        <button onClick={() => update(defaultFilters())} className="text-xs text-blue-800 hover:underline">
          Reset filters
        </button>
      )}
    </aside>
  );
}
