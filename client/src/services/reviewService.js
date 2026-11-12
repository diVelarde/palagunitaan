import api from '../api/axios';

async function getPendingEntries() {
  const res = await api.get('/api/review/pending');
  return res.data.entries;
}

async function submitReview(entryId, decision, comment, assessments) {
  const body = { decision, comment };
  if (assessments !== undefined) body.assessments = assessments;
  const res = await api.post(`/api/review/${entryId}`, body);
  return res.data; 
}

async function getEntryHistory(entryId) {
  const res = await api.get(`/api/review/${entryId}/history`);
  return res.data;
}

const reviewService = {
  getPendingEntries,
  submitReview,
  getEntryHistory
};

export default reviewService;