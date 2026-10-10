import api from '../api/axios';

async function getUsers() {
  const res = await api.get('/api/admin/users');
  return res.data.users;
}

async function getHeritageEntries({ limit = 50, offset = 0 } = {}) {
  const res = await api.get('/api/admin/entries', { params: { limit, offset } });
  return res.data.entries;
}

async function deleteHeritageEntry(id) {
  await api.delete(`/api/admin/entries/${id}`);
}

async function setEducationalAiExcluded(id, aiEducationalExcluded) {
  const res = await api.patch(`/api/admin/entries/${id}/educational-ai-exclusion`, { aiEducationalExcluded });
  return res.data.entry;
}

async function updateUserRole(userId, role) {
  const res = await api.patch(`/api/admin/users/${userId}/role`, { role });
  return res.data.user;
}

async function getRegions() {
  const res = await api.get('/api/admin/regions');
  return res.data.regions;
}

async function createRegion(data) {
  const res = await api.post('/api/admin/regions', data);
  return res.data.region;
}

async function deleteRegion(id) {
  await api.delete(`/api/admin/regions/${id}`);
}

async function getCategories() {
  const res = await api.get('/api/admin/categories');
  return res.data.categories;
}

async function createCategory(data) {
  const res = await api.post('/api/admin/categories', data);
  return res.data.category;
}

async function deleteCategory(id) {
  await api.delete(`/api/admin/categories/${id}`);
}

async function getAuditLog({ limit, offset } = {}) {
  const res = await api.get('/api/admin/audit-log', { params: { limit, offset } });
  return res.data.entries;
}

const adminService = {
  getHeritageEntries,
  deleteHeritageEntry,
  setEducationalAiExcluded,
  getUsers,
  updateUserRole,
  getRegions,
  createRegion,
  deleteRegion,
  getCategories,
  createCategory,
  deleteCategory,
  getAuditLog
};

export default adminService;