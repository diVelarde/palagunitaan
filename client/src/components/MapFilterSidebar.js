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
    regions: [],
  };
}

export function applyFilters(markers, filters) {
  return markers.filter((m) => {
    if (!filters.types.includes(m.type)) return false;
    if (m.type === 'entry') {
      if (!filters.verificationStatuses.includes(m.verificationStatus)) return false;
      if (filters.categories.length && !filters.categories.includes(m.category)) return false;
    }
    if (filters.regions?.length && !filters.regions.includes(m.regionName)) return false;
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

export default function MapFilterSidebar({ markers, regions = [], onChange }) {
  const [filters, setFilters] = useState(defaultFilters());

  const availableCategories = useMemo(() => {
    const set = new Set(markers.filter((m) => m.type === 'entry' && m.category).map((m) => m.category));
    return [...set].sort();
  }, [markers]);

  const availableRegions = useMemo(() => {
    const regionNames = new Set(
      markers.map((marker) => marker.regionName).filter(Boolean)
    );
    regions.forEach((region) => regionNames.add(region.province || region.name));
    return [...regionNames].sort();
  }, [markers, regions]);

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
    <aside className="map-filter-sidebar">
      <h2 className="map-sidebar-title"><span aria-hidden="true">⌖</span> Heritage Map</h2>
      <p className="map-sidebar-label">Filters</p>
      <label className="map-filter-field">
        <span>Category</span>
        <select
          value={filters.categories.length === 1 ? filters.categories[0] : ''}
          onChange={(event) => update({ ...filters, categories: event.target.value ? [event.target.value] : [] })}
        >
          <option value="">All Categories</option>
          {availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="map-filter-field">
        <span>Region</span>
        <select
          value={filters.regions.length === 1 ? filters.regions[0] : ''}
          onChange={(event) => update({ ...filters, regions: event.target.value ? [event.target.value] : [] })}
        >
          <option value="">All Regions</option>
          {availableRegions.map((region) => <option key={region} value={region}>{region}</option>)}
        </select>
      </label>
      <details className="map-advanced-filters">
        <summary>More filters</summary>
        <CheckboxGroup label="Show" options={TYPE_OPTIONS} selected={filters.types} onToggle={(v) => toggleIn('types', v)} />
        <CheckboxGroup label="Verification" options={VERIFICATION_OPTIONS} selected={filters.verificationStatuses} onToggle={(v) => toggleIn('verificationStatuses', v)} />
      </details>
      <div className="map-filter-counts">
        <p>{markers.filter((marker) => marker.type === 'entry').length} heritage entries</p>
        <p>{markers.filter((marker) => marker.type === 'site').length} heritage sites</p>
      </div>
      {(filters.categories.length > 0 || filters.regions.length > 0 || filters.types.length < TYPE_OPTIONS.length || filters.verificationStatuses.length < VERIFICATION_OPTIONS.length) && (
        <button onClick={() => update(defaultFilters())} className="map-reset-filters">
          Reset filters
        </button>
      )}
    </aside>
  );
}
