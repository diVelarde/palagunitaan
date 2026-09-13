import api from '../api/axios';

async function getMyNotifications() {
  const res = await api.get('/api/notifications');
  return res.data.notifications;
}

async function getUnreadCount() {
  const res = await api.get('/api/notifications/unread-count');
  return res.data.count;
}

async function markRead(id) {
  await api.patch(`/api/notifications/${id}/read`);
}

export default { getMyNotifications, getUnreadCount, markRead };