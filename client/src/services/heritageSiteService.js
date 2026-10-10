import api from '../api/axios';

async function getSites() {
  const res = await api.get('/api/heritage-sites');
  return res.data.sites;
}

async function createSite(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'photo' && value !== null && value !== undefined) formData.append(key, value);
  });
  if (data.photo) formData.append('photo', data.photo);
  const res = await api.post('/api/heritage-sites', formData);
  return res.data.site;
}

async function updateSite(id, data) {
  const res = await api.put(`/api/heritage-sites/${id}`, data);
  return res.data.site;
}

async function deleteSite(id) {
  await api.delete(`/api/heritage-sites/${id}`);
}

const heritageSiteService = { getSites, createSite, updateSite, deleteSite };

export default heritageSiteService;