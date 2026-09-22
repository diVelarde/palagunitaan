import api from '../api/axios';

async function getCurrentHighlights() {
  const res = await api.get('/api/highlights/current');
  return res.data; // { week, month }
}

async function createHighlight(data) {
  const res = await api.post('/api/highlights', data);
  return res.data.highlight;
}

const highlightService = { getCurrentHighlights, createHighlight };

export default highlightService;