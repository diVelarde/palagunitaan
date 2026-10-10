import api from '../api/axios';

async function getCurrentHighlights() {
  const res = await api.get('/api/highlights/current');
  return res.data; // { week, month }
}

async function getHighlightHistory({ limit = 100, offset = 0 } = {}) {
  const res = await api.get('/api/highlights/history', { params: { limit, offset } });
  return res.data.highlights;
}

async function createHighlight(data) {
  const res = await api.post('/api/highlights', data);
  return res.data.highlight;
}

const highlightService = { getCurrentHighlights, getHighlightHistory, createHighlight };

export default highlightService;