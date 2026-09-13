import api from '../api/axios';

async function getPendingEntries() {
  const res = await api.get('/api/review/pending');
  return res.data.entries;
}

async function submitReview(entryId, decision, comment) {
  const res = await api.post(`/api/review/${entryId}`, { decision, comment });
  return res.data; 
}

async function getEntryHistory(entryId) {
  const res = await api.get(`/api/review/${entryId}/history`);
  return res.data.history;
}

export default { getPendingEntries, submitReview, getEntryHistory };