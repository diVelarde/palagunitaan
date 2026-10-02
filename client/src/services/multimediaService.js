import api from '../api/axios';

async function getEntryMedia(entryId) {
  const res = await api.get(`/api/heritage-entries/${entryId}/media`);
  return res.data.assets;
}

async function uploadEntryMedia(entryId, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post(`/api/heritage-entries/${entryId}/media`, formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return res.data.asset;
}

const multimediaService = { getEntryMedia, uploadEntryMedia };

export default multimediaService;
