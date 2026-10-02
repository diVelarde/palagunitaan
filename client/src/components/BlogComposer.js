import { useState } from 'react';
import CoverImagePicker from './CoverImagePicker';

function validate({ title, content }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required.';
  else if (title.length > 255) errors.title = 'Title must be 255 characters or fewer.';
  if (!content.trim()) errors.content = 'Write something before posting.';
  return errors;
}

export default function BlogComposer({ onSubmit = async (data) => console.log('post', data), onPosted = () => {} }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [coverImage, setCoverImage] = useState(null);
  const [coverError, setCoverError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    try {
      const post = await onSubmit({ ...form, coverImage });
      setForm({ title: '', content: '' });
      setCoverImage(null);
      setCoverError('');
      onPosted(post);
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Could not publish this post. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-700" role="alert">{errors.form}</p>}

      <div>
        <label htmlFor="blog-post-title" className="mb-1 block text-sm font-medium text-[#493126]">Title</label>
        <input
          id="blog-post-title"
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-md border border-[#e1d7ca] px-3 py-2 text-sm"
        />
        {errors.title && <p className="mt-1 text-xs text-red-700" role="alert">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="blog-post-content" className="mb-1 block text-sm font-medium text-[#493126]">Your post</label>
        <textarea
          id="blog-post-content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Share a note, a follow-up, or something you noticed…"
          rows={5}
          className="w-full rounded-md border border-[#e1d7ca] px-3 py-2 text-sm"
        />
        {errors.content && <p className="mt-1 text-xs text-red-700" role="alert">{errors.content}</p>}
      </div>

      <div className="border-y border-[#eee6dc] py-4">
        <CoverImagePicker
          file={coverImage}
          error={coverError}
          onSelect={setCoverImage}
          onError={(message) => setCoverError(message || '')}
          label="Cover image"
          hint="Optional image shown on your blog post."
          disabled={submitting}
        />
      </div>

      <button type="submit" disabled={submitting} className="rounded-lg bg-[#ad482d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#873720] disabled:opacity-50">
        {submitting ? 'Posting…' : 'Post'}
      </button>
    </form>
  );
}