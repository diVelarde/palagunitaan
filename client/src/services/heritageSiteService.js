import api from '../api/axios';

async function createSite(data) {
  const res = await api.post('/api/heritage-sites', data);
  return res.data.site;
}

async function updateSite(id, data) {
  const res = await api.put(`/api/heritage-sites/${id}`, data);
  return res.data.site;
}

async function deleteSite(id) {
  await api.delete(`/api/heritage-sites/${id}`);
}

const heritageSiteService = { createSite, updateSite, deleteSite };

export default heritageSiteService;