import { useState } from 'react';

const SOURCE_TYPES = ['Oral interview', 'Personal account', 'Archival text', 'Other'];

function validate({ title, rawContent }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required.';
  else if (title.length > 255) errors.title = 'Title must be 255 characters or fewer.';

  if (!rawContent.trim()) errors.rawContent = 'This field is required.';
  else if (rawContent.trim().length < 20) errors.rawContent = 'Please write at least 20 characters.';

  return errors;
}

export default function SubmitEntryPage({ onSubmit = async (data) => console.log('submit', data) }) {
  const [form, setForm] = useState({
    title: '', rawContent: '', sourceType: SOURCE_TYPES[0], sourceDescription: '', historicalPeriod: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { entry, possibleDuplicates } from HTG-010's onSubmit

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
      const res = await onSubmit(form);
      setResult(res || null);
      setForm({ title: '', rawContent: '', sourceType: SOURCE_TYPES[0], sourceDescription: '', historicalPeriod: '' });
    } catch (err) {
      setErrors({ form: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Submit a heritage entry</h1>
      <p className="text-sm text-gray-600 mb-8">
        Write in your own words. A validator will review it before it's published.
      </p>

      {result?.possibleDuplicates?.length > 0 && (
        <div className="mb-6 p-4 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Your entry was submitted, but it looks similar to {result.possibleDuplicates.length} existing{' '}
          {result.possibleDuplicates.length === 1 ? 'entry' : 'entries'}. A validator will check for overlap.
        </div>
      )}
      {result && !result.possibleDuplicates?.length && (
        <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
          Submitted — thank you. You can track its status from your dashboard.
        </div>
      )}
      {errors.form && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            {...field('title')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            placeholder="e.g. The Aswang of Barangay San Isidro"
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tell the story</label>
          <textarea
            rows={8}
            {...field('rawContent')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            placeholder="Write it as it was told to you, or as you remember it."
          />
          {errors.rawContent && <p className="text-xs text-red-600 mt-1">{errors.rawContent}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              {...field('sourceType')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Historical period</label>
            <input
              type="text"
              {...field('historicalPeriod')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
              placeholder="e.g. Pre-colonial, Spanish era, Contemporary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            {...field('sourceDescription')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            placeholder="Who told you this, or where you found it"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit entry'}
        </button>
      </form>
    </div>
  );
}
