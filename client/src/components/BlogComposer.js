import { useState } from 'react';

function validate({ title, content }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required.';
  else if (title.length > 255) errors.title = 'Title must be 255 characters or fewer.';
  if (!content.trim()) errors.content = 'Write something before posting.';
  return errors;
}

export default function BlogComposer({ onSubmit = async (data) => console.log('post', data), onPosted = () => {} }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    try {
      const post = await onSubmit(form);
      setForm({ title: '', content: '' });
      onPosted(post);
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Could not publish this post. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Write a post</h3>

      {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}

      <div>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Share a note, a follow-up, or something you noticed…"
          rows={5}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
      </div>

      <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50">
        {submitting ? 'Posting…' : 'Post'}
      </button>
    </form>
  );
}