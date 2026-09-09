import { useEffect, useState } from 'react';

const EMPTY_FORM = { name: '', description: '', latitude: '', longitude: '', isHighlighted: false, highlightPeriod: '' };

function validate({ name, latitude, longitude }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (latitude === '' || isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Enter a latitude between -90 and 90.';
  if (longitude === '' || isNaN(lng) || lng < -180 || lng > 180) errors.longitude = 'Enter a longitude between -180 and 180.';
  return errors;
}

export default function AdminSiteMarkerForm({
  initialCoords = null,
  onSubmit = async (data) => console.log('create site', data),
  onCancel = () => {},
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCoords) {
      setForm((f) => ({ ...f, latitude: initialCoords.latitude, longitude: initialCoords.longitude }));
    }
  }, [initialCoords]);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        isHighlighted: form.isHighlighted,
        highlightPeriod: form.highlightPeriod.trim() || null,
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setErrors({ form: err.message || 'Could not save this site. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 w-80 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Add heritage site</h3>

      {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
        <input {...field('name')} type="text" className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea {...field('description')} rows={3} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
          <input {...field('latitude')} type="number" step="any" className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
          {errors.latitude && <p className="text-xs text-red-600 mt-1">{errors.latitude}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
          <input {...field('longitude')} type="number" step="any" className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm" />
          {errors.longitude && <p className="text-xs text-red-600 mt-1">{errors.longitude}</p>}
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-2">Tip: click the map with "Add site" active to fill these in.</p>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.isHighlighted}
          onChange={(e) => setForm((f) => ({ ...f, isHighlighted: e.target.checked }))}
          className="rounded border-gray-300 text-blue-900 focus:ring-blue-800"
        />
        Feature as a highlight
      </label>

      {form.isHighlighted && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Highlight period</label>
          <input
            {...field('highlightPeriod')}
            type="text"
            placeholder="e.g. Peñafrancia Festival week"
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save site'}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </button>
      </div>
    </form>
  );
}
