import { useEffect, useRef, useState } from 'react';
import { validateImageFile, MAX_IMAGE_MB } from '../utils/mediaValidation';

export default function CoverImagePicker({
  file = null,
  currentUrl = null,
  onSelect,
  onError,
  error = null,
  disabled = false,
  busy = false,
  label = 'Entry photo',
  hint,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = previewUrl || currentUrl;

  function handleChange(e) {
    const picked = e.target.files && e.target.files[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!picked) return;

    const problem = validateImageFile(picked);
    if (problem) {
      onError?.(problem);
      return;
    }
    onError?.(null);
    onSelect?.(picked);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {shown ? (
            <img src={shown} alt="" className="w-full h-full object-cover" />
            ) : (
            <span className="text-[11px] text-gray-400 text-center px-1">No photo</span>
            )}
        </div>

        <div className="min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={disabled || busy}
            onChange={handleChange}
            className="block text-xs text-[#71655c] file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#ad482d] file:text-white hover:file:bg-[#873720] disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {busy ? 'Uploading…' : hint || `JPG, PNG, GIF or WebP · up to ${MAX_IMAGE_MB} MB`}
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
