import { useEffect, useRef, useState } from 'react';
import multimediaService from '../services/multimediaService';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_MB = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
const ALLOWED_PREFIXES = ['image/', 'audio/'];

function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function MediaUploader({
  entryId,
  fetchMedia = multimediaService.getEntryMedia,
  uploadMedia = multimediaService.uploadEntryMedia,
  disabled = false,
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchMedia(entryId)
      .then((data) => { if (active) setAssets(data || []); })
      .catch(() => { if (active) setError('Could not load media for this entry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entryId, fetchMedia]);

  async function handleFile(fileList) {
    setError(null);
    setNotice(null);

    const file = fileList && fileList[0];
    if (!file) return;

    if (!ALLOWED_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      setError('Only image or audio files can be uploaded.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`That file is ${formatBytes(file.size)}. The limit is ${MAX_MB} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const asset = await uploadMedia(entryId, file, setProgress);
      setAssets((prev) => [...prev, asset]);
      setNotice('Uploaded.');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.status === 413
            ? `That file is too large. The limit is ${MAX_MB} MB.`
            : 'Upload failed. Please try again.')
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">Media</span>
        <span className="text-[11px] text-gray-400">
          Images or audio · up to {MAX_MB} MB
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading media…</p>
      ) : assets.length === 0 ? (
        <p className="text-xs text-gray-400">No media attached yet.</p>
      ) : (
        <ul className="flex flex-wrap items-center gap-2 mb-3">
          {assets.map((asset) => (
            <li key={asset.id}>
              {asset.file_type === 'image' ? (
                <a href={asset.file_url} target="_blank" rel="noreferrer">
                  <img
                    src={asset.file_url}
                    alt="Entry media"
                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                  />
                </a>
              ) : (
                <audio controls src={asset.file_url} className="h-9 max-w-[240px]" />
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,audio/*"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files)}
            className="block text-xs text-gray-600 file:mr-2 file:px-2.5 file:py-1 file:rounded-md file:border-0 file:text-xs file:bg-blue-900 file:text-white hover:file:bg-blue-800 disabled:opacity-50"
          />
          {uploading && (
            <span className="text-xs text-gray-500">
              {progress > 0 ? `${progress}%` : 'Uploading…'}
            </span>
          )}
        </div>
      )}

      {notice && <p className="text-xs text-green-700 mt-2">{notice}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}