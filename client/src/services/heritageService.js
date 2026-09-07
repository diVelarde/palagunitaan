import api from '../api/axios';

async function submitEntry(formData) {
  const res = await api.post('/api/heritage-entries', formData);
  return res.data;
}

async function getEntryById(id) {
  try {
    const res = await api.get(`/api/heritage-entries/${id}`);
    return res.data.entry;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

async function getPublishedEntries({ limit = 20, offset = 0 } = {}) {
  const res = await api.get('/api/heritage-entries', { params: { limit, offset } });
  return res.data.entries;
}

async function getMyEntries() {
  const res = await api.get('/api/heritage-entries/mine');
  return res.data.entries;
}

async function searchEntries({ keyword, verificationStatus, historicalPeriod, category, region, limit, offset } = {}) {
  const res = await api.get('/api/heritage-entries/search', {
    params: { keyword, verificationStatus, historicalPeriod, category, region, limit, offset },
  });
  return res.data.entries;
}

async function getTimeline() {
  const res = await api.get('/api/heritage-entries/timeline');
  return res.data.timeline;
}

async function translateEntry(entryId, targetLanguage) {
  const res = await api.post(`/api/heritage-entries/${entryId}/translate`, { targetLanguage });
  return res.data;
}

const heritageService = { submitEntry, getEntryById, getPublishedEntries, getMyEntries, searchEntries, getTimeline, translateEntry };

export default heritageService;