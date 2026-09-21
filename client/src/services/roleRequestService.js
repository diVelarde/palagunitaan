import api from '../api/axios';

async function createRequest(requestedRole, message) {
  const res = await api.post('/api/auth/role-requests', { requestedRole, message });
  return res.data.request;
}

async function getPendingRequests() {
  const res = await api.get('/api/admin/role-requests');
  return res.data.requests;
}

async function reviewRequest(id, decision) {
  const res = await api.patch(`/api/admin/role-requests/${id}`, { decision });
  return res.data.request;
}

const roleRequestService = { 
    createRequest, 
    getPendingRequests, 
    reviewRequest 
};

export default roleRequestService;
