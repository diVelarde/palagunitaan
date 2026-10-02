export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!file.type || !file.type.startsWith('image/')) {
    return 'Please choose an image file (JPG, PNG, GIF or WebP).';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `That image is ${mb} MB. The limit is ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}
