import api from '../api/axios';

async function getUsers() {
  const res = await api.get('/api/admin/users');
  return res.data.users;
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

async function getCategories() {
  const res = await api.get('/api/admin/categories');
  return res.data.categories;
}

async function createCategory(data) {
  const res = await api.post('/api/admin/categories', data);
  return res.data.category;
}

async function getAuditLog({ limit, offset } = {}) {
  const res = await api.get('/api/admin/audit-log', { params: { limit, offset } });
  return res.data.entries;
}

const adminService = {
  getUsers,
  updateUserRole,
  getRegions,
  createRegion,
  getCategories,
  createCategory,
  getAuditLog
};

export default adminService;