import api from '../api/axios';

async function createReport({ targetType, targetId, reason, message }) {
  const res = await api.post('/api/reports', { targetType, targetId, reason, message });
  return res.data.report;
}

async function getOpenReports() {
  const res = await api.get('/api/reports', { params: { status: 'open' } });
  return res.data.reports;
}

async function closeReport(id) {
  const res = await api.patch(`/api/reports/${id}/close`);
  return res.data.report;
}

const reportService = { createReport, getOpenReports, closeReport };

export default reportService;
