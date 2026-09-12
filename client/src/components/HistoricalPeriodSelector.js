export const HISTORICAL_PERIODS = [
  'Pre-Colonial',
  'Spanish Colonial Period',
  'American Occupation',
  'Japanese Occupation',
  'Post-Independence',
  'Contemporary',
  'Unknown',
];

export default function HistoricalPeriodSelector({
  value, onChange, includeAllOption = false,
  className = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800',
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {includeAllOption && <option value="">All periods</option>}
      {HISTORICAL_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
    </select>
  );
}